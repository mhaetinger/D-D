// SDK e duas instalações de navegador reais; somente o HTTP do Supabase é simulado.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
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
  let confirmation;
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
        if(url.pathname.endsWith('/signup')) { confirmation=body; return reply(user('a')); }
        if(url.pathname.endsWith('/token') && url.searchParams.get('grant_type')==='pkce') {
          assert.equal(body.auth_code,'confirmation-test');
          assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'),confirmation.code_challenge);
          return reply(session('a'));
        }
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
        await page.evaluate(()=>openAuthAccountModal('profile'));
        await page.locator('#accountEmail').fill(`${key}@example.test`); await page.locator('#accountPassword').fill('Senha de teste 123!');
        await page.locator('#accountSubmit').click();
        await page.waitForFunction(()=>document.querySelector('#accountSignedIn').hidden===false);
        assert.equal(await page.locator('#accessScreen').isVisible(),false);
        await page.evaluate(()=>openAuthAccountModal('profile'));
      }
      async function sync() {
        await page.evaluate(()=>openAuthAccountModal('profile')); await page.locator('#syncNow').click();
        await page.waitForFunction(()=>document.querySelector('#syncStatus').textContent.startsWith('Salvo no Supabase')||document.querySelector('#syncStatus').textContent.startsWith('Sincronizado.'),{},{timeout:15000});
      }
      return {context,page,login,sync,releaseImages,downloads:()=>downloads};
    }
    const a=await computer();
    const guest=warrior();guest.name='Ficha local de teste';
    await a.page.evaluate(c=>{
      localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));
      localStorage.setItem('dnd_player_private_notes_v1',JSON.stringify({[c.id]:'Nota pessoal preservada'}));
    },guest);
    await a.page.reload({waitUntil:'networkidle'});
    await a.page.locator('#accessContinueLocal').click();
    await a.page.evaluate(()=>openAuthAccountModal('profile'));
    const image=Buffer.from(await a.page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').fillRect(0,0,256,256);return c.toDataURL('image/png').split(',')[1];}),'base64');
    for (const selector of ['[data-avatar-edit=""]',`[data-avatar-edit="${guest.id}"]`]) {
      if(selector.includes(guest.id)) await a.page.evaluate(()=>closeAuthAccountModal());
      await a.page.locator(selector+':visible').click();
      await a.page.locator('#avatarFile').setInputFiles({name:'foto.png',mimeType:'image/png',buffer:image});
      await a.page.waitForFunction(()=>document.querySelector('#avatarStatus').textContent.includes('reduzida'));
      await a.page.locator('#avatarClose').click();
    }
    const guestAvatar=await a.page.evaluate(()=>getChar().avatar.id);
    await a.page.evaluate(()=>openNewCharacterModal());
    await a.page.locator('[data-text="name"]').fill('Rascunho que vai junto');
    await a.page.locator('[data-action="close"]').click();
    await a.page.locator('#accessReturnHome').click();
    await a.page.locator('[data-auth-mode="signup"]').click();
    await a.page.locator('#accountEmail').fill('a@example.test');
    await a.page.locator('#accountPassword').fill('Senha de teste 123!');
    await a.page.locator('#accountPasswordConfirm').fill('Senha de teste 123!');
    await a.page.locator('#accountSubmit').click();
    await a.page.waitForFunction(()=>document.querySelector('#accountAccess').getAttribute('aria-busy')==='false');
    assert.equal(await a.page.locator('#accessScreen').isVisible(),true,'aguarda confirmação sem abandonar o espaço local');
    await a.page.goto(server.url+'?code=confirmation-test',{waitUntil:'networkidle'});
    await a.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('vinculada'));
    const copied=await a.page.evaluate(()=>getChar().id);
    assert.notEqual(copied,guest.id);
    assert.notEqual(await a.page.evaluate(()=>getChar().avatar.id),guestAvatar,'imagem copiada ganha arquivo próprio');
    assert.equal(await a.page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota pessoal preservada');
    assert.equal(await a.page.evaluate(()=>JSON.parse(localStorage.getItem('critcall_characters_v1')).characters[0].id),guest.id);
    await a.sync();
    await a.page.waitForFunction(()=>document.querySelector('#avatarSyncStatus').textContent.includes('enviadas'));
    assert.equal(images.size,2,'perfil e personagem enviados em arquivos privados novos');
    await a.page.reload({waitUntil:'networkidle'});await a.sync();
    assert.equal(await a.page.evaluate(()=>characters.length),1,'recarga não duplica');
    await a.page.evaluate(()=>{closeAuthAccountModal();openNewCharacterModal();});
    assert.equal(await a.page.locator('[data-text="name"]').inputValue(),'Rascunho que vai junto');
    await a.page.locator('[data-action="close"]').click();
    const b=await computer();
    await b.page.evaluate(c=>{localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('dnd_player_private_notes_v1',JSON.stringify({[c.id]:'Segunda nota'}));},guest);
    await b.page.reload({waitUntil:'networkidle'});await b.login();
    await b.page.locator('#confirmationDialog').waitFor({state:'visible'});
    assert.ok((await b.page.locator('#confirmationMessage').textContent()).includes('já tem fichas'));
    await b.page.locator('#confirmationAccept').click();
    await b.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('vinculada'));
    await b.sync();
    await b.page.waitForFunction(()=>characters.length===2);
    assert.equal(await b.page.evaluate(()=>new Set(characters.map(c=>c.id)).size),2);
    await b.page.reload({waitUntil:'networkidle'});await b.sync();assert.equal(await b.page.evaluate(()=>characters.length),2);
    const c=await computer();
    await c.page.evaluate(c=>localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]})),guest);
    await c.page.reload({waitUntil:'networkidle'});await c.login();
    await c.page.locator('#confirmationDialog').waitFor({state:'visible'});
    assert.equal(await c.page.locator('#confirmationDialog button[value="cancel"]').innerText(),'Não quero');
    await c.page.locator('#confirmationDialog button[value="cancel"]').click();
    await c.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('continuam neste navegador'));
    // A recusa vale para a conta/navegador, mesmo com novo conteúdo local.
    const localBytes=await c.page.evaluate(()=>localStorage.getItem('critcall_characters_v1'));
    for(let reload=0;reload<2;reload++){
      await c.page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('critcall_characters_v1'));data.characters[0].name+=' editada';localStorage.setItem('critcall_characters_v1',JSON.stringify(data));localStorage.setItem('dnd_player_private_notes_v1',JSON.stringify({[data.characters[0].id]:'Nota depois da recusa'}));});
      await c.page.reload({waitUntil:'networkidle'});await c.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('optou por manter'));
      assert.equal(await c.page.locator('#confirmationDialog').isVisible(),false);assert.equal(await c.page.locator('#toast').isVisible(),false,'não repete a recusa como toast');
    }
    await c.page.evaluate(()=>openAuthAccountModal('profile'));await c.page.getByRole('button',{name:'Retomar fichas sem conta',exact:true}).click();
    await c.page.locator('#confirmationDialog').waitFor({state:'visible'});await c.page.locator('#confirmationDialog button[value="cancel"]').click();
    await c.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('continuam neste navegador'));
    const preserved=await c.page.evaluate(()=>({sheets:localStorage.getItem('critcall_characters_v1'),notes:localStorage.getItem('dnd_player_private_notes_v1')}));
    assert.notEqual(preserved.sheets,localBytes);assert.match(preserved.notes,/Nota depois da recusa/);
    await c.page.evaluate(()=>openAuthAccountModal('profile'));await c.page.locator('#accountSignOut').click();await c.page.waitForFunction(()=>!document.querySelector('#accessScreen').hidden);await c.login();
    await c.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('optou por manter'));assert.equal(await c.page.locator('#confirmationDialog').isVisible(),false);
    assert.deepEqual(await c.page.evaluate(()=>({sheets:localStorage.getItem('critcall_characters_v1'),notes:localStorage.getItem('dnd_player_private_notes_v1')})),preserved);
    await c.sync(); assert.equal(await c.page.evaluate(()=>characters.length),2,'cancelar mantém só fichas existentes');
    assert.equal(await c.page.evaluate(()=>JSON.parse(localStorage.getItem('critcall_characters_v1')).characters[0].id),guest.id);
    // Uma falha de quota no destino não modifica a origem nem duplica a tentativa seguinte.
    const d=await computer();
    await d.page.evaluate(c=>localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]})),guest);
    await d.page.reload({waitUntil:'networkidle'});
    await d.page.evaluate(()=>{const original=Storage.prototype.setItem;window.restoreStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(k,v){if(k.startsWith('dnd_account_v1:')&&k.endsWith('critcall_characters_v1'))throw new DOMException('Quota de teste','QuotaExceededError');return original.call(this,k,v);};});
    await d.login('b');
    await d.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.length>0);
    assert.equal(await d.page.evaluate(()=>JSON.parse(localStorage.getItem('critcall_characters_v1')).characters[0].id),guest.id);
    await d.page.evaluate(()=>restoreStorage());
    await d.page.getByRole('button',{name:'Retomar fichas sem conta',exact:true}).click();
    await d.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('vinculada'));
    await d.sync();assert.equal(await d.page.evaluate(()=>characters.length),1);
    await d.page.reload({waitUntil:'networkidle'});await d.sync();assert.equal(await d.page.evaluate(()=>characters.length),1);
    const e=await computer();
    const kael=warrior();kael.name='Kael';
    const other=warrior();other.name='Outra ficha local';
    await e.page.evaluate(([first,second])=>localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[first,second]})),[kael,other]);
    await e.page.reload({waitUntil:'networkidle'});await e.login();
    await e.page.locator('#confirmationDialog').waitFor({state:'visible'});
    assert.equal(await e.page.locator('[data-guest-character]').count(),2);
    assert.equal(await e.page.locator('[data-guest-character="'+kael.id+'"]').isChecked(),true);
    assert.equal(await e.page.locator('[data-guest-character="'+other.id+'"]').isChecked(),false);
    await e.page.locator('#confirmationAccept').click();
    await e.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('vinculada'));
    await e.sync();
    assert.equal(await e.page.evaluate(()=>characters.filter(character=>character.name==='Kael').length),1);
    assert.equal(await e.page.evaluate(()=>characters.some(character=>character.name==='Outra ficha local')),false);
    assert.equal(await e.page.evaluate(()=>JSON.parse(localStorage.getItem('critcall_characters_v1')).characters.some(character=>character.name==='Kael')),true);
    // Outra conta no mesmo navegador ainda decide por si; o botão genérico
    // também volta a se chamar Cancelar na próxima confirmação.
    await c.page.evaluate(()=>openAuthAccountModal('profile'));await c.page.locator('#accountSignOut').click();await c.page.waitForFunction(()=>!document.querySelector('#accessScreen').hidden);await c.login('b');
    await c.page.locator('#confirmationDialog').waitFor({state:'visible'});assert.equal(await c.page.locator('#confirmationDialog button[value="cancel"]').innerText(),'Não quero');await c.page.locator('#confirmationDialog button[value="cancel"]').click();
    await c.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('continuam neste navegador'));
    await c.page.evaluate(()=>{window.genericConfirmation=confirmDestructiveAction('Ação de teste','Confirmar?','Confirmar');});
    await c.page.locator('#confirmationDialog').waitFor({state:'visible'});assert.equal(await c.page.locator('#confirmationDialog button[value="cancel"]').innerText(),'Cancelar');await c.page.locator('#confirmationDialog button[value="cancel"]').click();
    // Uma confirmação que abre durante o hash adia a cópia; não representa
    // uma recusa e não pode registrar Não quero em nome do usuário.
    const f=await computer();await f.page.evaluate(c=>localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]})),guest);await f.page.reload({waitUntil:'networkidle'});
    await f.page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);crypto.subtle.digest=async(...args)=>{const result=await digest(...args);if(!window.guestDigestHeld){window.guestDigestHeld=true;await new Promise(resolve=>window.releaseGuestDigest=resolve);}return result;};});
    await f.login();await f.page.waitForFunction(()=>window.guestDigestHeld);await f.page.evaluate(()=>{window.busyGuestConfirmation=confirmDestructiveAction('Outra confirmação','Ação de teste','Confirmar');window.releaseGuestDigest();});
    await f.page.waitForFunction(()=>document.querySelector('#guestImportStatus').textContent.includes('edição aberta'));assert.equal(await f.page.evaluate(()=>Object.keys(localStorage).some(k=>k.endsWith('critcall_guest_import_declined_v1'))),false);
    await f.page.locator('#confirmationDialog button[value="cancel"]').click();await f.page.getByRole('button',{name:'Retomar fichas sem conta',exact:true}).click();await f.page.locator('#confirmationDialog').waitFor({state:'visible'});assert.match(await f.page.locator('#confirmationMessage').innerText(),/já tem fichas/);await f.page.locator('#confirmationDialog button[value="cancel"]').click();
    assert.deepEqual(errors,[]);
    console.log('PASS continuidade: cadastro com confirmação PKCE/cópia/nota/rascunho/imagens, origem preservada, conta existente pergunta e acrescenta, seleção do Kael, cancelamento preserva, recarga e falha de quota sem duplicação.');
  } finally {if(browser)await browser.close();if(server)await server.close();fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
