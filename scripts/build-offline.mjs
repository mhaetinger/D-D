import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const directory = path.resolve(process.argv[2] || "dist");
const walk = (folder) => fs.readdirSync(folder, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(folder, entry.name)) : [path.join(folder, entry.name)]);
const all = walk(directory).map((file) => path.relative(directory, file).split(path.sep).join("/"));
// PDFs são consultas online/downloads explícitos, não uma transferência automática
// de quase 40 MB. O aplicativo e o leitor ficam disponíveis sem a rede.
const core = all.filter((file) => file === "index.html" || file === "book.html" || file === "manifest.webmanifest" || file.startsWith("assets/") || file.startsWith("icons/") || file.startsWith("licenses/") || /^rules\/[^/]+\.(?:js|mjs|css)$/.test(file) || /^vendor\/pdfjs\/(?:pdf\.min\.mjs|pdf\.worker\.min\.mjs|text-layer\.css|LICENSE)$/.test(file)).sort();
const pdfs = all.filter((name) => name.toLowerCase().endsWith(".pdf")).sort();
if (JSON.stringify(pdfs) !== JSON.stringify(["books/livro-jogador-2014.pdf", "books/livro-mestre-2014.pdf"])) throw new Error("A saída deve conter somente os dois livros autorizados.");
if (all.some((name) => /(?:^|\/)(?:\.env(?:\.|$)|node_modules|tests|src|AGENTS\.md)/.test(name))) throw new Error("Arquivo de desenvolvimento na saída pública.");
const hash = crypto.createHash("sha256");
for (const file of core) hash.update(file).update(fs.readFileSync(path.join(directory, file)));
const version = hash.digest("hex").slice(0, 16);
const source = `/* Gerado pelo build. Atualizações aguardam as abas anteriores fecharem.
   O cache guarda arquivos do aplicativo; nunca lê ou apaga fichas/anotações. */
const PREFIX = 'orbyt-offline:' + new URL(self.registration.scope).pathname + ':';
const CACHE = PREFIX + '${version}';
const CORE = ${JSON.stringify(core)}.map(file => new URL(file, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).catch(async error => { await caches.delete(CACHE); throw error; }));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (url.href === self.registration.scope) url.pathname += 'index.html';
  if (!CORE.includes(url.href)) return;
  // A versão ativa entrega HTML, regras e assets do mesmo build, inclusive online.
  // Um worker novo só assume após fechar as abas; não recarrega uma edição em curso.
  event.respondWith(caches.open(CACHE).then(cache => cache.match(url.href)).then(cached => cached || fetch(event.request)));
});
`;
fs.writeFileSync(path.join(directory, "sw.js"), source);
fs.writeFileSync(path.join(directory, "offline-manifest.json"), JSON.stringify({ version, files: core }, null, 2));
console.log(`Offline: ${core.length} arquivos do aplicativo; PDFs fora do cache automático.`);
