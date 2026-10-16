// SDK e duas instalações de navegador reais; somente o HTTP do Supabase é simulado.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { chromium } = require(process.env.DND_PLAYWRIGHT_MODULE || 'playwright');
const { serve } = require('./serve.cjs');
const { warrior } = require('./fixture.cjs');
const root = path.resolve(__dirname,'..');
const endpoint = 'https://critcall-sync-test.supabase.co';
const ids = {a:'11111111-1111-4111-8111-111111111111',b:'22222222-2222-4222-8222-222222222222'};
const user = key => ({id:ids[key],email:`${key}@example.test`,aud:'authenticated',role:'authenticated',email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()});
const token = key => { const enc = v=>Buffer.from(JSON.stringify(v)).toString('base64url'); return `${enc({alg:'HS256',typ:'JWT'})}.${enc({sub:ids[key],email:user(key).email,exp:Math.floor(Date.now()/1000)+3600})}.teste`; };
const session = key => ({access_token:token(key),refresh_token:`refresh_${key}`,token_type:'bearer',expires_in:3600,user:user(key)});
(async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'critcall-sync-browser-'));
  let server,browser;
  const errors=[], rows=new Map(), versions=[], operations=new Map(), images=new Map();
  try {
    const vite=path.join(path.dirname(require.resolve('vite/package.json')),'bin/vite.js');
    for (const args of [[vite,'build','--outDir',directory,'--emptyOutDir'],[path.join(root,'scripts/build-offline.mjs'),directory]]) {
      const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',env:{...process.env,VITE_SUPABASE_URL:endpoint,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',VITE_AUTH_ENABLED:'true'}});
      assert.equal(result.status,0,result.stderr||result.stdout);
    }
    server=await serve(directory); browser=await chromium.launch({headless:true});
    async function computer({holdImages=false}={}) {
      let releaseImages,downloads=0; const imageGate=new Promise(resolve=>{releaseImages=resolve;});
      const context=await browser.newContext({viewport:{width:1440,height:1000}});
      await context.route(`${endpoint}/**`,async route=>{
        const req=route.request(),url=new URL(req.url()),body=req.postData()&&req.headers()['content-type']?.includes('application/json')?req.postDataJSON():{};
        const headers={'x-supabase-api-version':'2024-01-01','access-control-allow-origin':'*','access-control-allow-headers':'*'};
        const reply=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
        if(req.method()==='OPTIONS') return route.fulfill({status:204,headers});
        if(url.pathname.endsWith('/token')) return reply(session(body.email==='b@example.test'?'b':'a'));
        const jwt=req.headers().authorization?.replace('Bearer ','');
        let owner;try { owner=JSON.parse(Buffer.from(jwt.split('.')[1],'base64url').toString()).sub; }catch{}
        if(url.pathname.endsWith('/user')) return owner ? reply(user(owner===ids.b?'b':'a')) : reply({code:'bad_jwt'},401);
        if(url.pathname.endsWith('/logout')) return route.fulfill({status:204,headers});
        if(!owner) return reply({code:'42501'},403);
        const object=url.pathname.match(/\/storage\/v1\/object\/(?:authenticated\/)?critcall-avatars\/(.+)/)?.[1];
        if(object) {
          if(!object.startsWith(owner+'/')) return reply({message:'Denied'},403);
          if(req.method()==='GET'&&holdImages) { downloads++; await imageGate; }
          if(req.method()==='GET') return images.has(object)?route.fulfill({status:200,headers,contentType:'image/webp',body:images.get(object)}):reply({message:'Missing'},404);
          const raw=req.postDataBuffer();
          const marker=Buffer.from('Content-Type: image/webp','utf8');
          const part=raw.indexOf(marker),start=raw.indexOf(Buffer.from('\r\n\r\n'),part)+4,end=raw.indexOf(Buffer.from('\r\n--'),start);
          assert.ok(part>=0&&start>3&&end>start,'imagem enviada como WebP');
          const bytes=raw.subarray(start,end); assert.ok(bytes.length<=32768);
          images.set(object,bytes); return reply({Key:'critcall-avatars/'+object,Id:randomUUID()});
        }
        if(url.pathname.endsWith('/rpc/critcall_sync_clock')) return body.p_owner_id===owner ? reply(new Date().toISOString()) : reply({code:'42501'},403);
        if(url.pathname.endsWith('/rpc/critcall_save_document')) {
          assert.equal(body.p_owner_id,owner,'o dono capturado precisa corresponder à sessão');
          if(operations.has(body.p_operation_id)) return reply(operations.get(body.p_operation_id));
          const key=`${owner}:${body.p_key}`,old=rows.get(key),conflict=(old?.revision||0)!==body.p_base_revision;
          const accepted=!conflict||!old||body.p_edited_at>old.edited_at;
          const doc={key:body.p_key,kind:body.p_kind,id:body.p_id,value:body.p_value,revision:(old?.revision||0)+1,edited_at:body.p_edited_at,updated_at:new Date().toISOString(),operation_id:body.p_operation_id};
          versions.unshift({version_id:randomUUID(),owner_id:owner,kind:doc.kind,document_id:doc.id,id:doc.id,value:doc.value,name:doc.kind==='character'?doc.value?.name:null,edited_at:doc.edited_at,received_at:doc.updated_at,conflict});
          if(accepted)rows.set(key,doc);
          const result={document:rows.get(key),conflict,server_time:new Date().toISOString()}; operations.set(body.p_operation_id,result);
          return reply(result);
        }
        if(url.pathname.endsWith('/critcall_documents')) return reply([...rows].filter(([key])=>key.startsWith(owner+':')).map(([,value])=>value));
        if(url.pathname.endsWith('/critcall_versions')) {
          const found=versions.filter(v=>v.owner_id===owner);
          const id=url.searchParams.get('version_id')?.replace('eq.','');
          return reply(id?found.find(v=>v.version_id===id):found);
        }
        return reply({code:'PGRST205'},404);
      });
      const page=await context.newPage(); page.on('pageerror',error=>errors.push(error.message));
      await page.goto(server.url,{waitUntil:'networkidle'});
      await page.waitForFunction(()=>typeof getChar==='function');
      async function login(key='a') {
        await page.evaluate(()=>openAuthAccountModal());
        await page.locator('#accountEmail').fill(`${key}@example.test`); await page.locator('#accountPassword').fill('Senha de teste 123!');
        await page.locator('#accountSubmit').click();
        await page.waitForFunction(()=>document.querySelector('#accountSignedIn').hidden===false);
        assert.equal(await page.locator('#accessScreen').isVisible(),false);
        await page.evaluate(()=>openAuthAccountModal());
      }
      async function sync() {
        await page.evaluate(()=>openAuthAccountModal()); await page.locator('#syncNow').click();
        await page.waitForFunction(()=>document.querySelector('#syncStatus').textContent.startsWith('Salvo no Supabase')||document.querySelector('#syncStatus').textContent.startsWith('Sincronizado.'),{},{timeout:15000});
      }
      return {context,page,login,sync,releaseImages,downloads:()=>downloads};
    }
    const a=await computer(); await a.login();
    await a.page.locator('#accPlayerName').fill('Nome salvo automaticamente');
    await a.sync();
    await a.page.reload({waitUntil:'networkidle'});
    assert.equal(await a.page.locator('#currentUserBadge').textContent(),'Nome salvo automaticamente');
    await a.page.evaluate(()=>openAuthAccountModal());
    // O perfil fica no cache local mesmo se o IndexedDB recusar a fila. A
    // tentativa seguinte precisa enviá-lo antes de projetar a cópia da nuvem.
    await a.page.evaluate(()=>{
      const transaction=IDBDatabase.prototype.transaction;
      window.__restoreSyncTransactions=()=>{IDBDatabase.prototype.transaction=transaction;};
      IDBDatabase.prototype.transaction=function(...args){
        if(this.name==='critcall-sync-v1')throw new DOMException('Quota de teste','QuotaExceededError');
        return transaction.apply(this,args);
      };
    });
    await a.page.locator('#accPlayerName').fill('Nome preservado após falha da fila');
    await a.page.waitForFunction(()=>document.querySelector('#syncStatus').textContent.includes('fila offline não pôde ser salva'));
    await a.page.evaluate(()=>{window.__restoreSyncTransactions();delete window.__restoreSyncTransactions;});
    await a.sync();
    assert.equal(await a.page.locator('#currentUserBadge').textContent(),'Nome preservado após falha da fila');
    assert.equal(rows.get(`${ids.a}:preference:dnd_public_player_name`).value,'Nome preservado após falha da fila');
    await a.page.locator('#accPlayerName').fill('Nome salvo automaticamente'); await a.sync();
    const char=warrior();
    const backup={format:'orbyt.character-backup',version:1,exportedAt:new Date().toISOString(),characters:[char],privateNotes:{[char.id]:'Nota particular sincronizada'}};
    await a.page.locator('#backupFile').setInputFiles({name:'teste.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await a.page.waitForFunction(()=>characters.length===1); await a.sync();
    const id=await a.page.evaluate(()=>getChar().id);
    await a.page.evaluate(()=>{closeAuthAccountModal();});
    await a.page.locator('#btnModern').click();
    await a.page.locator('#themeBtn-pergaminho_escuro').click();
    await a.page.locator('#backdropBtn-textured').click();
    await a.page.locator('#fontBtn-112').click();
    await a.sync();
    // Arquivo fictício grande em pixels: o upload precisa conter só a miniatura.
    const image=Buffer.from(await a.page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=640;const ctx=c.getContext('2d');ctx.fillStyle='#b57936';ctx.fillRect(0,0,640,640);ctx.fillStyle='#223344';ctx.fillRect(0,0,320,640);return c.toDataURL('image/png').split(',')[1];}),'base64');
    async function uploadPhoto(page,selector,remote=true) {
      await page.locator(selector+':visible').click();
      await page.locator('#avatarFile').setInputFiles({name:'retrato.png',mimeType:'image/png',buffer:image});
      await page.waitForFunction(()=>document.querySelector('#avatarStatus').textContent.includes('reduzida'));
      await page.locator('#avatarClose').click();
      if(remote) await page.waitForFunction(()=>document.querySelector('#avatarSyncStatus').textContent.includes('enviadas'));
    }
    await uploadPhoto(a.page,'[data-avatar-edit=""]');
    await a.page.evaluate(()=>closeAuthAccountModal());
    await uploadPhoto(a.page,`[data-avatar-edit="${id}"]`);
    await a.sync();
    assert.equal(images.size,2,'um arquivo do perfil e um da ficha');
    await a.page.evaluate(()=>openAuthAccountModal());
    const previousImage=await a.page.locator('[data-avatar-profile] img').first().getAttribute('src');
    await a.page.locator('[data-avatar-edit=""]').click();
    await a.page.locator('#avatarFile').setInputFiles({name:'ativo.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg onload="alert(1)"/>')});
    await a.page.waitForFunction(()=>document.querySelector('#avatarStatus').textContent.includes('não são aceitos'));
    assert.equal(await a.page.locator('[data-avatar-profile] img').first().getAttribute('src'),previousImage,'arquivo recusado preserva imagem anterior');
    await a.page.locator('#avatarClose').click();
    const avatar=await a.page.evaluate(()=>getChar().avatar);
    assert.equal(typeof avatar.id,'string');
    assert.ok(!JSON.stringify(rows.get(`${ids.a}:character:${id}`)).includes('data:image'),'documento não recebe pixels/base64');
    const b=await computer(); await b.login();
    await b.page.waitForFunction(id=>getChar()?.id===id,id);
    assert.equal(await b.page.locator('#currentUserBadge').textContent(),'Nome salvo automaticamente');
    await b.page.waitForFunction(()=>document.body.dataset.theme==='pergaminho_escuro'&&document.body.dataset.backdrop==='textured');
    assert.equal(await b.page.locator('#btnModern').getAttribute('aria-pressed'),'true');
    assert.equal(await b.page.evaluate(()=>document.documentElement.style.fontSize),'17.92px');
    assert.equal(await b.page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota particular sincronizada');
    await b.page.waitForFunction(()=>!!document.querySelector('[data-avatar-profile] img'));
    await b.page.evaluate(()=>closeAuthAccountModal());
    await b.page.waitForFunction(()=>!!document.querySelector('#headerSection .portrait img'));
    await b.page.evaluate(()=>openAuthAccountModal());
    const nobody=await computer(); await nobody.login('b'); await nobody.sync();
    assert.equal(await nobody.page.locator('[data-avatar-profile] img').count(),0,'conta B não herda imagem da conta A');
    assert.equal(await nobody.page.evaluate(()=>characters.length),0);
    assert.equal(await nobody.page.locator('#currentUserBadge').textContent(),'Jogador');
    await nobody.page.evaluate(()=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){if(key.endsWith('dnd_public_player_name'))throw new DOMException('Quota de teste','QuotaExceededError');return original.call(this,key,value);};
    });
    await nobody.page.locator('#accPlayerName').fill('Nome que precisa ser preservado');
    assert.equal(await nobody.page.locator('#accPlayerName').inputValue(),'Nome que precisa ser preservado');
    assert.equal(await nobody.page.locator('#currentUserBadge').textContent(),'Jogador');
    assert.ok((await nobody.page.locator('#toast').textContent()).includes('não pôde ser salvo'));
    assert.ok((await nobody.page.locator('#syncStatus').textContent()).includes('não foram salvas'),'um envio anterior não pode esconder falha local de perfil');
    await b.page.evaluate(async()=>{await navigator.serviceWorker.ready;});
    await b.page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await b.context.setOffline(true);
    await uploadPhoto(b.page,'[data-avatar-edit=""]',false);
    assert.ok((await b.page.locator('#avatarSyncStatus').textContent()).includes('aguardando envio'));

    await a.page.evaluate(()=>{getChar().coins.po=123;recordStepAndSave('Alteração no computador A');}); await a.sync();
    await b.page.evaluate(()=>{getChar().name='Edição offline mais recente';getChar().hpCurrent=7;recordStepAndSave('Alteração offline no B',true);setTab('lore');savePrivateNotes('Nota alterada offline');});
    await b.page.locator('#accPlayerName').fill('Nome também offline');
    await b.page.locator('#syncNow').click();
    await b.page.waitForTimeout(800);
    await b.page.reload({waitUntil:'networkidle'});
    await b.page.waitForFunction(()=>getChar()?.name==='Edição offline mais recente');
    assert.equal(await b.page.locator('#currentUserBadge').textContent(),'Nome também offline');
    assert.equal(await b.page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota alterada offline');
    await b.context.setOffline(false); await b.sync();
    await b.page.waitForFunction(()=>document.querySelector('#avatarSyncStatus').textContent.includes('enviadas'));
    assert.ok(versions.some(v=>v.owner_id===ids.a&&v.conflict),'edições simultâneas são registradas');
    await a.sync();
    await a.page.waitForFunction(()=>getChar()?.name==='Edição offline mais recente');
    assert.equal(await a.page.evaluate(()=>getChar().hpCurrent),7);
    assert.equal(await a.page.locator('#currentUserBadge').textContent(),'Nome também offline');
    assert.equal(await a.page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota alterada offline');
    const previous=versions.find(v=>v.kind==='character'&&v.value?.coins?.po===123);
    assert.ok(previous,'a versão anterior permanece disponível para recuperação');
    previous.name='<img src=x onerror=window.__versionPwned=1>'+('X'.repeat(300));
    await a.page.locator('#syncVersions').click();
    await a.page.locator(`[data-version-id="${previous.version_id}"]`).waitFor();
    assert.equal(await a.page.evaluate(()=>window.__versionPwned),undefined);
    assert.equal(await a.page.locator('#syncVersionsList img').count(),0);
    for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']) {
      await a.page.setViewportSize({width:320,height:800});
      await a.page.evaluate(theme=>{setTheme(theme);setFontScale(125);},theme);
      const dialog=a.page.locator('#syncVersionsDialog');
      assert.equal(await a.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));
      await dialog.evaluate(el=>{el.scrollTop=el.scrollHeight;});
      const before=await a.page.evaluate(()=>scrollY),box=await dialog.boundingBox();
      await a.page.mouse.move(box.x+box.width/2,box.y+8);await a.page.mouse.wheel(0,700);await a.page.waitForTimeout(80);
      assert.equal(await a.page.evaluate(()=>scrollY),before,'rodinha no limite das versões não move a ficha de trás');
    }
    await a.page.setViewportSize({width:1440,height:1000});
    await a.page.locator(`[data-version-id="${previous.version_id}"] button`).click();
    await a.page.locator('#confirmationAccept').click();
    await a.page.waitForFunction(()=>getChar()?.coins.po===123);
    await a.sync();
    assert.equal(await a.page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota alterada offline','restaurar ficha não restaura anotações');
    await a.page.reload({waitUntil:'networkidle'});
    assert.equal(await a.page.evaluate(()=>getChar()?.coins.po),123);
    assert.ok(await a.page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.endsWith('dnd_history_v1')))).stack.length>1),'histórico/checkpoints sobrevivem à recarga');
    // Alterar o retrato de uma cópia não sobrescreve o arquivo da ficha original.
    const source=await a.page.evaluate(()=>JSON.parse(JSON.stringify(getChar())));
    const copied={format:'orbyt.character-backup',version:1,exportedAt:new Date().toISOString(),characters:[source]};
    await a.page.evaluate(()=>openAuthAccountModal());
    await a.page.locator('#backupFile').setInputFiles({name:'copia.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(copied))});
    await a.page.waitForFunction(()=>characters.length===2);
    const copyId=await a.page.evaluate(id=>characters.find(char=>char.id!==id).id,source.id);
    await uploadPhoto(a.page,`#accountCharactersList [data-avatar-edit="${copyId}"]`);
    assert.equal(await a.page.evaluate(id=>characters.find(char=>char.id===id).avatar.id,source.id),source.avatar.id);
    assert.notEqual(await a.page.evaluate(id=>characters.find(char=>char.id===id).avatar.id,copyId),source.avatar.id);
    await a.sync();
    // Um download atrasado da conta A não pode preencher imagem/cache da conta B.
    const delayed=await computer({holdImages:true}); await delayed.login();
    for(let n=0;n<100&&!delayed.downloads();n++)await delayed.page.waitForTimeout(20);
    assert.ok(delayed.downloads()>0);
    await delayed.page.locator('#accountSignOut').click(); await delayed.login('b');
    delayed.releaseImages(); await delayed.page.waitForTimeout(200);
    assert.equal(await delayed.page.locator('[data-avatar-profile] img').count(),0);
    assert.equal(await delayed.page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('critcall-avatars-v1');r.onsuccess=()=>{const q=r.result.transaction('assets').objectStore('assets').getAll();q.onsuccess=()=>resolve(q.result.length);q.onerror=reject;};r.onerror=reject;})),0,'download antigo não é guardado na conta nova');
    await delayed.context.close();
    assert.deepEqual(errors,[]);
    console.log('PASS imagens privadas/reduzidas em dois navegadores, conta B isolada, SVG recusado, fila de imagem offline; sync Chromium: perfil automático/recarga, recuperação após falha da fila IndexedDB, duas instalações A, conta B isolada, fichas/notas, edição offline/recarga/reconexão, versão mais recente, histórico de conflitos e restauração sem alterar notas; sem erros JS.');
  } finally { if(browser)await browser.close();if(server)await server.close();fs.rmSync(directory,{recursive:true,force:true}); }
})().catch(error=>{console.error(error);process.exitCode=1;});
