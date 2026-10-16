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
  const errors=[], rows=new Map(), versions=[], operations=new Map();
  try {
    const vite=path.join(path.dirname(require.resolve('vite/package.json')),'bin/vite.js');
    for (const args of [[vite,'build','--outDir',directory,'--emptyOutDir'],[path.join(root,'scripts/build-offline.mjs'),directory]]) {
      const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',env:{...process.env,VITE_SUPABASE_URL:endpoint,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',VITE_AUTH_ENABLED:'true'}});
      assert.equal(result.status,0,result.stderr||result.stdout);
    }
    server=await serve(directory); browser=await chromium.launch({headless:true});
    async function computer() {
      const context=await browser.newContext({viewport:{width:1440,height:1000}});
      await context.route(`${endpoint}/**`,async route=>{
        const req=route.request(),url=new URL(req.url()),body=req.postData()?req.postDataJSON():{};
        const headers={'x-supabase-api-version':'2024-01-01','access-control-allow-origin':'*','access-control-allow-headers':'*'};
        const reply=(data,status=200)=>route.fulfill({status,headers,contentType:'application/json',body:JSON.stringify(data)});
        if(req.method()==='OPTIONS') return route.fulfill({status:204,headers});
        if(url.pathname.endsWith('/token')) return reply(session(body.email==='b@example.test'?'b':'a'));
        const jwt=req.headers().authorization?.replace('Bearer ','');
        let owner;try { owner=JSON.parse(Buffer.from(jwt.split('.')[1],'base64url').toString()).sub; }catch{}
        if(url.pathname.endsWith('/user')) return owner ? reply(user(owner===ids.b?'b':'a')) : reply({code:'bad_jwt'},401);
        if(url.pathname.endsWith('/logout')) return route.fulfill({status:204,headers});
        if(!owner) return reply({code:'42501'},403);
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
      }
      async function sync() {
        await page.evaluate(()=>openAuthAccountModal()); await page.locator('#syncNow').click();
        await page.waitForFunction(()=>document.querySelector('#syncStatus').textContent.startsWith('Salvo no Supabase')||document.querySelector('#syncStatus').textContent.startsWith('Sincronizado.'),{},{timeout:15000});
      }
      return {context,page,login,sync};
    }
    const a=await computer(); await a.login();
    await a.page.locator('#accPlayerName').fill('Nome salvo automaticamente');
    await a.sync();
    await a.page.reload({waitUntil:'networkidle'});
    assert.equal(await a.page.locator('#currentUserBadge').textContent(),'Nome salvo automaticamente');
    await a.page.evaluate(()=>openAuthAccountModal());
    const char=warrior();
    const backup={format:'orbyt.character-backup',version:1,exportedAt:new Date().toISOString(),characters:[char],privateNotes:{[char.id]:'Nota particular sincronizada'}};
    await a.page.locator('#backupFile').setInputFiles({name:'teste.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await a.page.waitForFunction(()=>characters.length===1); await a.sync();
    const id=await a.page.evaluate(()=>getChar().id);
    const b=await computer(); await b.login();
    await b.page.waitForFunction(id=>getChar()?.id===id,id);
    assert.equal(await b.page.locator('#currentUserBadge').textContent(),'Nome salvo automaticamente');
    assert.equal(await b.page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota particular sincronizada');
    const nobody=await computer(); await nobody.login('b'); await nobody.sync();
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
    assert.deepEqual(errors,[]);
    console.log('PASS sync Chromium: perfil automático/recarga, duas instalações A, conta B isolada, fichas/notas, edição offline/recarga/reconexão, versão mais recente, histórico de conflitos e restauração sem alterar notas; sem erros JS.');
  } finally { if(browser)await browser.close();if(server)await server.close();fs.rmSync(directory,{recursive:true,force:true}); }
})().catch(error=>{console.error(error);process.exitCode=1;});
