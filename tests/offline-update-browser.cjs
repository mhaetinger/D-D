const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {unlockSheet}=require('./sheet-lock-actions.cjs');
const build=path.join(__dirname,'../dist'),builder=path.join(__dirname,'../scripts/build-offline.mjs');
function release(root,name){
 const dir=path.join(root,name);fs.cpSync(build,dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'index.html'),fs.readFileSync(path.join(dir,'index.html'),'utf8').replace('<title>CritCall</title>',`<title>CritCall ${name}</title>`));
 const rules=path.join(dir,'rules/character-engine.js');fs.writeFileSync(rules,`window.__ruleRelease=${JSON.stringify(name)};\n`+fs.readFileSync(rules,'utf8'));
 execFileSync(process.execPath,[builder,dir],{stdio:'pipe'});return {dir,...JSON.parse(fs.readFileSync(path.join(dir,'offline-manifest.json'),'utf8'))};
}
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'critcall-update-')),browser=await chromium.launch();
 try{
  const a=release(root,'A'),b=release(root,'B'),c=release(root,'C'),d=release(root,'D');assert.notEqual(a.version,b.version);
  for(const [prefix,legacy] of [['/D-D/',false],['/',true]]){
   const live=path.join(root,legacy?'legacy-live':'live');fs.cpSync(a.dir,live,{recursive:true});
   if(legacy){
    // Contrato da versão publicada anteriormente: cache único e espera por abas.
    fs.writeFileSync(path.join(live,'sw.js'),`const CACHE='critcall-offline:'+new URL(self.registration.scope).pathname+':${a.version}';const CORE=${JSON.stringify(a.files)}.map(f=>new URL(f,self.registration.scope).href);self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);u.search='';if(u.href===self.registration.scope)u.pathname+='index.html';if(!CORE.includes(u.href))return;e.respondWith(caches.open(CACHE).then(c=>c.match(u.href)).then(r=>r||fetch(e.request)));});`);
   }
   let releaseFont,fontRequested=false;
   const font=c.files.find(f=>f.endsWith('.woff2'));
   const server=await serve(live,prefix,{cacheControl:'public, max-age=600',beforeRead:async relative=>{if(releaseFont&&relative===font){fontRequested=true;await releaseFont.wait;}}}),context=await browser.newContext({viewport:{width:1280,height:950}}),errors=[];
   try{
    await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    const char=warrior();await context.addInitScript(c=>{if(!localStorage.getItem('critcall_characters_v1'))localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));},char);
    const first=await context.newPage(),second=await context.newPage();for(const p of [first,second])p.on('pageerror',e=>errors.push(e.message));
    await first.goto(server.url,{waitUntil:'networkidle'});await first.locator('#accessContinueLocal').click();await first.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await second.goto(server.url,{waitUntil:'networkidle'});await second.locator('#accessContinueLocal').click();
    for(const p of [first,second]){assert.equal(await p.evaluate(()=>window.__ruleRelease),'A');await p.evaluate(()=>{window.__documentToken='preservado';});}
    await first.evaluate(()=>{setTab('lore');savePrivateNotes('Nota sintética que deve atravessar a atualização.');setTab('main');});
    await unlockSheet(first);await first.evaluate(()=>openHomebrewModal('weapon'));
    const previous=await first.locator('#hbWepName').inputValue();await first.locator('#hbWepName').fill('Rascunho não salvo');
    fs.cpSync(b.dir,live,{recursive:true});
    await first.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
    await first.locator('#appUpdate').waitFor({state:'visible'});
    assert.equal(await first.locator('#hbWepName').evaluate(e=>e===document.activeElement),true,'aviso não tira o foco do rascunho');
    for(const p of [first,second]){
     assert.equal(await p.evaluate(()=>window.__documentToken),'preservado','ativar não recarrega aba aberta');
     assert.ok((await p.evaluate(()=>fetch('rules/character-engine.js').then(r=>r.text()))).startsWith('window.__ruleRelease="A";'),'aba antiga conserva sua geração');
    }
    // Reiniciar o worker não pode perder a versão de uma aba em edição.
    const session=await context.newCDPSession(first);await session.send('ServiceWorker.enable');await session.send('ServiceWorker.stopAllWorkers');
    assert.ok((await first.evaluate(()=>fetch('rules/character-engine.js').then(r=>r.text()))).startsWith('window.__ruleRelease="A";'));
    await first.locator('#appUpdate button').evaluate(e=>e.click());assert.match(await first.locator('#appUpdate').innerText(),/Conclua ou cancele/);assert.equal(await first.locator('#hbWepName').inputValue(),'Rascunho não salvo');assert.equal(await first.evaluate(()=>window.__documentToken),'preservado');
    // F5 comum recebe B, mesmo com a outra aba ainda editando A.
    await second.reload({waitUntil:'networkidle'});assert.equal(await second.title(),'CritCall B');assert.equal(await second.evaluate(()=>window.__ruleRelease),'B');assert.equal(await second.locator('#appUpdate').isVisible(),false);
    assert.equal(await first.locator('#hbWepName').inputValue(),'Rascunho não salvo');assert.equal(await first.evaluate(()=>window.__ruleRelease),'A');
    await first.locator('#hbWepName').fill(previous);await first.evaluate(()=>closeHomebrewModal());
    await first.setViewportSize({width:320,height:760});await first.evaluate(()=>setFontScale(125));
    assert.equal(await first.locator('#appUpdate').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().right<=innerWidth),true,'aviso cabe no celular em GG');
    await first.screenshot({path:`/tmp/critcall-update-${legacy?'legacy':'project'}-mobile.png`});
    await first.locator('#appUpdate button').click();await first.waitForFunction(()=>document.title==='CritCall B'&&typeof getChar==='function');assert.equal(await first.evaluate(()=>window.__ruleRelease),'B');
    assert.equal(await first.evaluate(()=>getChar().id),char.id);assert.match(await first.evaluate(()=>readPrivateNotes(getChar().id)),/Nota sintética/);
    await first.waitForFunction(async version=>!(await caches.keys()).some(name=>name.endsWith(':'+version)),a.version);
    // Uma mensagem ao worker B não pode apagar o cache de C ainda em instalação.
    fs.cpSync(c.dir,live,{recursive:true});let unblock;releaseFont={wait:new Promise(resolve=>{unblock=resolve;})};releaseFont.release=unblock;
    await first.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration()).update();});
    const deadline=Date.now()+15000;while(!fontRequested&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,20));assert.ok(fontRequested);
    await first.evaluate(()=>new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=()=>{channel.port1.close();resolve();};navigator.serviceWorker.controller.postMessage({type:'CRITCALL_BUILD',version:document.querySelector('meta[name="critcall-build"]').content},[channel.port2]);}));
    await first.waitForTimeout(100);assert.ok(await first.evaluate(async version=>(await caches.keys()).some(name=>name.endsWith(':'+version)),c.version),'a limpeza conserva a instalação concorrente');
    assert.ok((await first.evaluate(()=>fetch('rules/character-engine.js').then(r=>r.text()))).startsWith('window.__ruleRelease="B";'));
    unblock();releaseFont=null;await first.locator('#appUpdate').waitFor({state:'visible'});
    await second.reload({waitUntil:'networkidle'});assert.equal(await second.evaluate(()=>window.__ruleRelease),'C');
    await first.locator('#appUpdate button').click();await first.waitForFunction(()=>document.title==='CritCall C'&&typeof getChar==='function');assert.equal(await first.evaluate(()=>window.__ruleRelease),'C');
    // Instalação incompleta não substitui o aplicativo que já funciona.
    fs.cpSync(d.dir,live,{recursive:true});fs.unlinkSync(path.join(live,font));
    await first.evaluate(async()=>{
     const r=await navigator.serviceWorker.getRegistration();window.__failedInstall=false;r.addEventListener('updatefound',()=>{const w=r.installing;w?.addEventListener('statechange',()=>{if(w.state==='redundant')window.__failedInstall=true;});});await r.update();
    });
    await first.waitForFunction(()=>window.__failedInstall);assert.equal(await first.evaluate(()=>window.__ruleRelease),'C');
    await context.setOffline(true);await first.reload({waitUntil:'domcontentloaded'});await first.waitForFunction(()=>typeof getChar==='function');assert.equal(await first.title(),'CritCall C');assert.equal(await first.evaluate(()=>window.__ruleRelease),'C');assert.match(await first.evaluate(()=>readPrivateNotes(getChar().id)),/Nota sintética/);
    const metadata=await first.evaluate(async()=>{const out=[];for(const name of await caches.keys())if(name.startsWith('critcall-offline-meta:')){const cache=await caches.open(name);for(const key of await cache.keys())out.push(await(await cache.match(key)).text());}return out;});assert.ok(metadata.length);assert.ok(metadata.every(value=>/^[a-f0-9]{16}$/.test(value)),'metadados guardam só hashes, sem fichas ou notas');
    assert.deepEqual(errors,[]);console.log(`PASS atualização ${prefix}${legacy?' desde worker antigo':''}: duas abas, rascunho/foco preservados, gerações sem mistura e após reinício do worker, F5 normal, botão protegido, notas/fichas/offline e falha de instalação segura.`);
   }finally{releaseFont?.release();releaseFont=null;await context.close();await server.close();}
  }
 }finally{await browser.close();fs.rmSync(root,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
