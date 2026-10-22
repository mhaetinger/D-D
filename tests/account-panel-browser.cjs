const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs'),{confirmationActions}=require('./confirmation.cjs');
(async()=>{
  const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
  try {
    const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    const characters=['Aventureira Alba','Borin Escudo de Pedra','Personagem com nome extenso e várias palavras para preservar a leitura'].map((name,i)=>({...warrior(),id:'account-test-'+i,name}));
    await page.addInitScript(characters=>{if(!localStorage.getItem('accountTestSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters}));localStorage.setItem('accountTestSeeded','1');}},characters);
    await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
    await page.evaluate(()=>{setDiceMode('off');setTheme('pergaminho_claro');setFontScale(100);});await page.locator('#currentUserBadge').click();
    const modal=page.locator('#authAccountModal'),tab=id=>modal.locator(`[data-account-tab="${id}"]`),panel=id=>modal.locator(`[data-account-panel="${id}"]`),view=id=>modal.locator(`[data-account-view="${id}"]`),card=id=>modal.locator(`[data-account-character="account-test-${id}"]`),{dialog,accept,cancel}=confirmationActions(page);
    assert.deepEqual(await modal.locator('[data-account-tab]').evaluateAll(tabs=>tabs.map(t=>t.dataset.accountTab)),['characters','profile']);
    assert.equal(await panel('characters').isVisible(),true);assert.equal(await panel('profile').isVisible(),false);
    await tab('characters').focus();await page.keyboard.press('End');assert.equal(await panel('profile').isVisible(),true);assert.equal(await tab('profile').evaluate(e=>document.activeElement===e),true);
    await page.keyboard.press('Home');assert.equal(await panel('characters').isVisible(),true);assert.equal(await tab('characters').evaluate(e=>document.activeElement===e),true);
    await page.keyboard.press('ArrowRight');assert.equal(await panel('profile').isVisible(),true);
    const typeSizes=await modal.evaluate(e=>Object.fromEntries(['#workspaceDescription','#syncStatus','#offlineStatus','[data-avatar-edit=""]','#exportBackup','h2'].map(q=>[q,parseFloat(getComputedStyle(e.querySelector(q)).fontSize)])));
    assert.ok(typeSizes['#workspaceDescription']>=16);assert.ok(typeSizes['#syncStatus']>=14);assert.ok(typeSizes['#offlineStatus']>=14);assert.ok(typeSizes['[data-avatar-edit=""]']>=15);assert.ok(typeSizes['#exportBackup']>=15);assert.ok(typeSizes.h2>=18);
    await modal.locator('> section').screenshot({path:'/tmp/critcall-profile-type-desktop.png'});
    const characterTools=['exportBackup','importBackup','reviewImportedCharacter','backupIncludeNotes'];
    for(const id of characterTools)assert.equal(await page.locator('#'+id).isVisible(),false);
    const name=page.locator('#accPlayerName');await name.fill('Jogadora de teste');await name.evaluate(e=>window.accountNameNode=e);
    await tab('profile').focus();await page.keyboard.press('ArrowRight');assert.equal(await panel('characters').isVisible(),true);assert.equal(await tab('characters').evaluate(e=>document.activeElement===e),true);
    assert.equal(await card(0).count(),1);assert.equal(await page.locator('#accountCharactersList').getAttribute('data-character-view'),'list');
    for(const id of characterTools)assert.equal(await page.locator('#'+id).isVisible(),true);
    await page.locator('#backupIncludeNotes').check();await page.locator('#backupIncludeNotes').evaluate(e=>window.backupNotesNode=e);
    await tab('profile').click();assert.equal(await name.evaluate(e=>window.accountNameNode===e),true);assert.equal(await name.inputValue(),'Jogadora de teste');
    await tab('characters').click();assert.equal(await page.locator('#backupIncludeNotes').evaluate(e=>e===window.backupNotesNode&&e.checked),true);await page.locator('#backupIncludeNotes').uncheck();
    // O mesmo retrato privado e os próprios nós sobrevivem à troca de visual.
    await tab('characters').click();await card(1).locator('[data-avatar-edit]').click();
    const avatar=page.locator('#avatarDialog');await avatar.waitFor({state:'visible'});
    const image=Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#932c24';x.fillRect(0,0,128,128);x.fillStyle='#e2bd73';x.fillRect(32,32,64,64);return c.toDataURL('image/png').split(',')[1];}),'base64');
    await page.locator('#avatarFile').setInputFiles({name:'retrato-teste.png',mimeType:'image/png',buffer:image});await page.waitForFunction(()=>document.getElementById('avatarStatus').textContent.includes('reduzida'));await page.locator('#avatarClose').click();
    await tab('profile').click();await page.evaluate(()=>{closeAuthAccountModal();openAuthAccountModal();});assert.equal(await panel('characters').isVisible(),true);
    await card(1).locator('img').waitFor();await card(1).evaluate(e=>{window.accountCard=e;window.accountImage=e.querySelector('img');});
    const snapshot=await page.evaluate(()=>JSON.stringify(characters));
    for(const style of ['cards','list','cards']){await view(style).click();assert.equal(await card(1).evaluate(e=>e===window.accountCard&&e.querySelector('img')===window.accountImage),true);assert.equal(await page.evaluate(()=>JSON.stringify(characters)),snapshot);assert.equal(await view(style).getAttribute('aria-pressed'),'true');}
    for(const id of [0,1])assert.equal(await card(id).evaluate(e=>{const r=e.getBoundingClientRect();return Math.abs(r.width-r.height)<2;}),true,'cartões cabem no formato quadrado em M');
    await modal.locator('> section').screenshot({path:'/tmp/critcall-account-cards-desktop.png'});
    // Ações mantêm o personagem correto após trocar visual e remover outro.
    await card(1).locator('.account-character-open').click();assert.equal(await page.evaluate(()=>getChar().id),'account-test-1');await modal.waitFor({state:'hidden'});
    await page.evaluate(()=>openAuthAccountModal());assert.equal(await panel('characters').isVisible(),true);assert.equal(await card(1).locator('.account-character-active').count(),1);
    const beforeDelete=await page.evaluate(()=>JSON.stringify(characters));await card(0).getByRole('button',{name:'Excluir Aventureira Alba',exact:true}).click();await cancel();assert.equal(await page.evaluate(()=>JSON.stringify(characters)),beforeDelete);
    await card(0).getByRole('button',{name:'Excluir Aventureira Alba',exact:true}).click();await accept();assert.equal(await card(0).count(),0);assert.equal(await page.evaluate(()=>getChar().id),'account-test-1');
    await card(2).locator('.account-character-open').click();assert.equal(await page.evaluate(()=>getChar().id),'account-test-2');await page.evaluate(()=>openAuthAccountModal());await tab('characters').click();
    for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana'])for(const style of ['list','cards']){
      await page.setViewportSize({width:320,height:900});await page.evaluate(t=>{setTheme(t);setFontScale(125);},theme);await view(style).click();
      assert.equal(await modal.locator('> section').evaluate(e=>e.scrollWidth>e.clientWidth),false);
      for(const entry of await modal.locator('[data-account-character]').all())assert.equal(await entry.evaluate(e=>e.scrollWidth>e.clientWidth||e.scrollHeight>e.clientHeight),false);
      for(const id of characterTools)assert.equal(await page.locator('#'+id).isVisible(),true);await tab('profile').click();for(const id of characterTools)assert.equal(await page.locator('#'+id).isVisible(),false);assert.equal(await name.inputValue(),'Jogadora de teste');assert.equal(await modal.locator('> section').evaluate(e=>e.scrollWidth>e.clientWidth),false);await tab('characters').click();
    }
    await modal.locator('> section').screenshot({path:'/tmp/critcall-account-cards-mobile.png'});
    await page.setViewportSize({width:1280,height:1000});await page.evaluate(()=>{setTheme('pergaminho_claro');setFontScale(100);});await view('list').click();await modal.locator('> section').screenshot({path:'/tmp/critcall-account-list-desktop.png'});await view('cards').click();
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof openAuthAccountModal==='function'&&getChar());await page.evaluate(()=>openAuthAccountModal());assert.equal(await panel('characters').isVisible(),true);
    assert.equal(await page.locator('#accountCharactersList').getAttribute('data-character-view'),'cards');await card(1).locator('img').waitFor();assert.equal(await card(0).count(),0);assert.equal(await page.locator('#accPlayerName').inputValue(),'Jogadora de teste');assert.deepEqual(errors,[]);
    console.log('PASS personagens/perfil: Personagens primeiro e ao reabrir/offline, Home/End/setas, campos preservados, lista/cartões quadrados, mesmos nós/retrato/dados, abrir/excluir/cancelar após reordenação, backup/importação/revisão só em Personagens, 320px/GG/três temas e preferência/retrato offline.');
  } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
