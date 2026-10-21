/* VERSION, FILES e INTEGRITY são inseridos pelo build. Só há arquivos públicos neste cache.
 * Cada aba conserva a geração que carregou; uma navegação normal usa a nova.
 * Os metadados contêm apenas IDs opacos das abas e hashes do aplicativo. */
const PREFIX = 'critcall-offline:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + VERSION;
const META = 'critcall-offline-meta:' + new URL(self.registration.scope).pathname;
const CORE = FILES.map(file => new URL(file, self.registration.scope).href);
const key = id => new URL('__critcall_build__/' + encodeURIComponent(id), self.registration.scope).href;
const valid = version => /^[a-f0-9]{16}$/.test(version || '');
const appClients = async () => (await self.clients.matchAll({type:'window', includeUncontrolled:true})).filter(client => client.url.startsWith(self.registration.scope));
async function readBuild(id) {
  const response = await (await caches.open(META)).match(key(id));
  return response ? response.text() : null;
}
async function writeBuild(id, version) {
  if (!id) return;
  const meta = await caches.open(META);
  await meta.put(key(id), new Response(version));
}
async function sweep() {
  const used = new Set([VERSION]);
  const meta = await caches.open(META);
  for (const request of await meta.keys()) {
    const id = decodeURIComponent(new URL(request.url).pathname.split('/').pop());
    if (id === 'active') continue;
    // get() também aguarda um documento reservado durante a navegação.
    const client = await self.clients.get(id);
    if (!client || !client.url.startsWith(self.registration.scope)) await meta.delete(request);
    else { const version = await readBuild(id); if (valid(version)) used.add(version); }
  }
  const generations = (await caches.keys()).filter(name => name.startsWith(PREFIX));
  // Uma instalação concorrente cria seu cache depois do ativo. A limpeza do
  // worker anterior só pode retirar gerações anteriores à sua própria.
  for (const name of generations.slice(0, generations.indexOf(CACHE))) {
    if (!used.has(name.slice(PREFIX.length))) await caches.delete(name);
  }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      // Um 200 com HTML/regras antigos também é uma instalação incompleta.
      const requests = FILES.map(file => new Request(new URL(file, self.registration.scope), {cache:'reload', integrity:INTEGRITY[file]}));
      // / e /index.html são entradas HTTP distintas. Renovar ambas evita voltar
      // ao HTML anterior quando uma recarga do navegador ignora o worker.
      requests.push(new Request(self.registration.scope, {cache:'reload', integrity:INTEGRITY['index.html']}));
      await (await caches.open(CACHE)).addAll(requests);
      // Ativar não recarrega abas. Suas versões continuam disponíveis abaixo.
      await self.skipWaiting();
    } catch (error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    let previous = await readBuild('active');
    // Transição do worker antigo, que mantinha uma única geração ativa.
    if (!valid(previous)) previous = (await caches.keys()).find(name => name.startsWith(PREFIX) && name !== CACHE)?.slice(PREFIX.length);
    for (const client of await appClients()) {
      if (!valid(await readBuild(client.id))) await writeBuild(client.id, valid(previous) ? previous : VERSION);
    }
    await writeBuild('active', VERSION);
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CRITCALL_BUILD' || !event.source?.id || !event.source.url.startsWith(self.registration.scope)) return;
  event.waitUntil((async () => {
    const version = event.data.version;
    if (valid(version) && await caches.has(PREFIX + version)) await writeBuild(event.source.id, version);
    event.ports[0]?.postMessage({version:VERSION});
    await sweep();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== new URL(self.registration.scope).origin) return;
  url.search = ''; url.hash = '';
  if (url.href === self.registration.scope) url.pathname += 'index.html';
  if (url.href === new URL('book', self.registration.scope).href) url.pathname += '.html';
  event.respondWith((async () => {
    const navigation = event.request.mode === 'navigate' && CORE.includes(url.href);
    if (navigation) {
      // O novo documento e seus recursos passam a usar a mesma geração.
      await writeBuild(event.resultingClientId || event.clientId, VERSION);
    }
    const selected = navigation ? VERSION : await readBuild(event.clientId);
    const version = valid(selected) ? selected : VERSION;
    const cached = await (await caches.open(PREFIX + version)).match(url.href);
    if (!cached) return fetch(event.request);
    return cached.redirected ? new Response(cached.body, {status:cached.status, statusText:cached.statusText, headers:cached.headers}) : cached;
  })());
});
