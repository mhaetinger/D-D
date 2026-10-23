const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.DND_PLAYWRIGHT_MODULE||'playwright');
const {serve}=require('./serve.cjs');
const {warrior}=require('./fixture.cjs');
const {unlockSheet}=require('./sheet-lock-actions.cjs');
(async()=>{
 const server=await serve(process.env.DND_TEST_ROOT||path.join(__dirname,'../dist'));
 const browser=await chromium.launch({headless:true});
 try{
  const c=warrior(),other=warrior(),key='dnd_character_history_v2:'+c.id,notes=JSON.stringify({[c.id]:'Nota preservada'});
  const stack=Array.from({length:80},(_,i)=>({timestamp:'2026-10-23T12:00:00Z',action:'Moedas '+i,isCheckpoint:i%3===0,stateJson:JSON.stringify([{...c,coins:{...c.coins,po:i}}])}));
  const history=JSON.stringify({version:2,characterId:c.id,stack,pointer:40});
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({c,other,key,history,notes})=>{
   if(localStorage.getItem('historySeeded'))return;
   c.coins.po=40;
   localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c,other]}));
   localStorage.setItem('critcall_active_character_v1',c.id);
   localStorage.setItem(key,history);localStorage.setItem('dnd_player_private_notes_v1',notes);
   localStorage.setItem('dnd_account_v1:outra:conta:'+key,history);
   localStorage.setItem('historySeeded','1');
  },{c,other,key,history,notes});
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await unlockSheet(page);
  const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  let h=await saved();assert.equal(h.stack.length,25,'histórico antigo já fica limitado ao abrir, sem nova edição');
  assert.equal(JSON.parse(h.stack[h.pointer].stateJson)[0].coins.po,40);
  await page.locator('#btnUndo').click();assert.equal(await page.evaluate(()=>getChar().coins.po),39);
  await page.locator('#btnRedo').click();assert.equal(await page.evaluate(()=>getChar().coins.po),40);
  await page.evaluate(()=>{for(let i=100;i<150;i++){getChar().coins.po=i;recordStepAndSave('Moedas '+i,i%3===0,false);}});
  h=await saved();assert.equal(h.stack.length,25);assert.equal(h.pointer,24);assert.equal(h.stack[0].action,'Moedas 125');
  assert.equal(await page.locator('#historyTimelineList > div').count(),25);assert.match(await page.locator('#historyCharacterName').textContent(),/até 25/);
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>getChar().coins.po),149);
  assert.equal((await saved()).stack.length,25);await unlockSheet(page);
  // Sem quota para histórico, a ficha ainda salva e a linha do tempo em memória tem teto.
  const before=await page.evaluate(key=>localStorage.getItem(key),key);
  await page.evaluate(key=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('quota','QuotaExceededError');return set.call(this,k,v);};for(let i=200;i<250;i++){getChar().coins.po=i;recordStepAndSave('Moedas '+i,false,false);}},key);
  assert.equal(await page.locator('#historyTimelineList > div').count(),25);assert.equal(await page.locator('#historyCountBadge').textContent(),'24/24');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('critcall_characters_v1')).characters[0].coins.po),249);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('critcall_characters_v1')).characters[1].name),other.name);
  assert.equal(await page.evaluate(()=>localStorage.getItem('dnd_player_private_notes_v1')),notes);
  assert.equal(await page.evaluate(key=>localStorage.getItem('dnd_account_v1:outra:conta:'+key),key),history);
  // Um arquivo ilegível continua intacto; novos passos da aba também têm limite.
  await page.evaluate(key=>{const remove=Storage.prototype.removeItem;remove.call(localStorage,key);},key);
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(key=>localStorage.setItem(key,'{ilegível'),key);await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>{for(let i=300;i<350;i++){getChar().coins.po=i;recordStepAndSave('Moedas '+i,true,false);}});
  assert.equal(await page.locator('#historyTimelineList > div').count(),25);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{ilegível');assert.deepEqual(errors,[]);
  console.log('PASS histórico local: até 25 registros na carga, edição, checkpoints e memória sem quota; desfazer/refazer/recarga, ficha/notas/outra conta e original ilegível preservados em mobile sob /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
