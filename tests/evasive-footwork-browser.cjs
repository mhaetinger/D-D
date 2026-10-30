const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
const {unlockSheet}=require('./sheet-lock-actions.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.id='evasive-synthetic';c.name='Passo Evasivo sintético';c.classes=[{classId:'guerreiro',level:5,subclassId:'mestreBatalha',subclass:'Mestre de Batalha',hitDie:10,hitDiceUsed:0}];
  c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Passo Evasivo','Aparar','Ataque de Precisão']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Passo Evasivo','Inspirar']}}]};
  c.hpCurrent=c.hpMax=80;c.hpTemp=0;c.acAdjustment=2;c.heroicInspiration=true;c.speed=9;
  c.ruleState={version:1,used:{},pools:{},active:{'spell:shieldOfFaith':true},targets:{},conditions:{},inspirationReady:true};
  const other=structuredClone(c);other.id='evasive-other';other.name='Outro personagem sintético';
  await page.addInitScript(chars=>{if(localStorage.getItem('evasiveSeed'))return;localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:chars}));localStorage.setItem('evasiveSeed','1');},[c,other]);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
  const start=(id='guerreiro:superiority')=>page.locator(`[data-rule-action="evasiveStart"][data-resource="${id}"]`).first(),end=page.locator('[data-rule-action="evasiveEnd"]'),status=page.locator('[data-evasive-control]');
  const {dialog,accept,cancel}=confirmationActions(page),ac=()=>page.evaluate(()=>getCalculatedAC(getChar())),used=()=>page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']||0);
  await start().waitFor();await page.evaluate(()=>{setDiceMode('off');setTab('lore');savePrivateNotes('Nota privada sintética de Passo Evasivo.');setTab('main');clearDicePool();addDieToPool(20);addDieToPool(6);setRollMode('dis');Math.random=()=>{throw Error('RNG não autorizado');};window.evasiveBase=structuredClone(getChar());});
  const baseAC=await ac(),pool=await page.locator('#dicePoolDisplay').innerText();
  const stable=await page.evaluate(()=>JSON.stringify([getChar().weapons,getChar().rules.history,getChar().hpCurrent,getChar().hpMax,getChar().heroicInspiration,getChar().ruleState.inspirationReady,characters[1],readPrivateNotes(getChar().id)]));
  const open=async(id)=>{await start(id).evaluate(e=>e.scrollIntoView({block:'center'}));await start(id).click();await dialog.waitFor({state:'visible'});};
  const ready=async(face=4)=>{await dialog.locator('[data-evasive-moving]').check();await dialog.locator('[data-health-source]').selectOption('physical');await dialog.locator('[data-health-face]').fill(String(face));};
  const stop=async()=>{await end.evaluate(e=>e.scrollIntoView({block:'center'}));await end.click();};
  const reset=async(mode='off')=>page.evaluate(mode=>{Object.assign(getChar(),structuredClone(window.evasiveBase));setDiceMode(mode);recordStepAndSave('Contexto sintético de Passo Evasivo');window.evasiveCalls=0;Math.random=()=>{window.evasiveCalls++;throw Error('RNG proibido neste contexto');};},mode);
  // Abrir/cancelar e campos inválidos não gastam nem mudam CA/histórico.
  const before=await page.evaluate(()=>JSON.stringify(getChar())),history=await page.locator('#historyCountBadge').innerText();
  await open();assert.match(await dialog.innerText(),/até parar de se mover.*Não exige ação bônus nem reação/s);await cancel();assert.equal(await ac(),baseAC);assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);assert.equal(await page.locator('#historyCountBadge').innerText(),history);
  await open();await accept();assert.equal(await dialog.evaluate(e=>e.open),true);await ready(9);await accept();assert.equal(await dialog.evaluate(e=>e.open),true);await cancel();
  // Um dado soma à CA uma vez; encerrar não devolve. Desfazer/redo conservam efeito e custo juntos.
  await open();await ready();await accept();assert.equal(await ac(),baseAC+4);assert.match(await status.innerText(),/\+4 CA.*Até parar/s);assert.equal(await used(),1);assert.equal(await start().isDisabled(),true);assert.equal(await start('feat:superiority').isDisabled(),true);
  assert.match(await page.locator('[data-sheet-value="armorTotal"]').innerText(),new RegExp(String(baseAC+4)));
  await stop();assert.equal(await ac(),baseAC);assert.equal(await used(),1);await page.evaluate(()=>undoStep());assert.equal(await ac(),baseAC+4);await page.evaluate(()=>undoStep());assert.equal(await ac(),baseAC);assert.equal(await used(),0);await page.evaluate(()=>redoStep());assert.equal(await ac(),baseAC+4);await page.evaluate(()=>redoStep());assert.equal(await ac(),baseAC);
  await reset();await page.evaluate(()=>{const b=document.querySelector('[data-rule-action="evasiveStart"][data-resource="feat:superiority"]');b.click();b.click();});await dialog.waitFor({state:'visible'});assert.match(await dialog.innerText(),/Adepto Marcial · gasta 1d6/);await ready(6);await accept();assert.equal(await ac(),baseAC+6);assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),1);assert.equal(await used(),0);await stop();
  // Auto/Só Pool rolam só um dado normal; pool, modo e inspiração continuam independentes.
  for(const mode of ['auto','manual']){await reset(mode);await page.evaluate(()=>{Math.random=()=>{window.evasiveCalls++;return (3-.5)/8;};});await open();await dialog.locator('[data-evasive-moving]').check();await dialog.locator('[data-health-source]').selectOption('virtual');await accept();assert.equal(await page.evaluate(()=>window.evasiveCalls),1);assert.equal(await ac(),baseAC+3);assert.equal(await page.locator('#dicePoolDisplay').innerText(),pool);assert.equal(await page.evaluate(()=>ruleDiceSettings().mode),'dis');assert.equal(await page.evaluate(()=>getChar().heroicInspiration&&getChar().ruleState.inspirationReady),true);await stop();}
  // Contexto é revalidado antes de qualquer RNG: documento, recurso, condição, modo, conta e permissão.
  for(const change of ['hp','speed','condition','knowledge','counter','effect','permission','render','character','dice','source']){
   await reset('auto');await open();await dialog.locator('[data-evasive-moving]').check();
   await page.evaluate(change=>{const c=getChar();if(change==='hp')c.hpCurrent=79;if(change==='speed')c.speed=0;if(change==='condition')c.ruleState.conditions.agarrado=true;if(change==='knowledge')c.rules.history=[];if(change==='counter')c.ruleState.used['guerreiro:superiority']=4;if(change==='effect')c.ruleState.evasiveFootwork={version:1,source:'feat:superiority',die:6,face:2};if(change==='permission')CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));if(change==='render')setTab('main');if(change==='character')switchCharacter(1);if(change==='dice')setDiceMode('off');if(change==='source')document.querySelector('[data-rule-action="evasiveStart"][data-resource="guerreiro:superiority"]').dataset.resource='feat:superiority';},change);
   const changed=await page.evaluate(()=>JSON.stringify(characters));await accept();assert.equal(await page.evaluate(()=>JSON.stringify(characters)),changed);assert.equal(await page.evaluate(()=>window.evasiveCalls),0);
   if(change==='permission')await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'personal'})));if(change==='character')await page.evaluate(()=>switchCharacter(0));
  }
  await reset('auto');await open();await dialog.locator('[data-evasive-moving]').check();await cancel();assert.equal(await page.evaluate(()=>window.evasiveCalls),0);
  await reset();const accountBefore=await page.evaluate(()=>JSON.stringify(getChar()));await open();await ready();await page.evaluate(()=>activateAccountWorkspace({project:'critcall-evasive-test',userId:'conta-sintetica'}));await dialog.waitFor({state:'hidden'});await page.evaluate(()=>activateAccountWorkspace(null));assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),accountBefore);
  // Condições retêm nós; agarrar/soltar encerra de vez. Incapacitação isolada não retira movimento.
  await reset();const grabbed=page.locator('[data-rule-condition="agarrado"]');await grabbed.evaluate(e=>window.evasiveGrab=e);await open();await ready();await accept();assert.equal(await grabbed.evaluate(e=>e===window.evasiveGrab),true);
  await page.locator('[data-rule-disclosure="conditions"]').evaluate(e=>e.open=true);await page.locator('[data-rule-condition="incapacitado"]').check();assert.equal(await ac(),baseAC+4);await grabbed.check();assert.equal(await end.count(),0);assert.equal(await ac(),baseAC);await grabbed.uncheck();assert.equal(await ac(),baseAC);assert.equal(await used(),1);
  await reset();await open();await ready();await accept();await page.locator('[data-rule-exhaustion]').selectOption('5');assert.equal(await end.count(),0);await page.locator('[data-rule-exhaustion]').selectOption('0');assert.equal(await ac(),baseAC);assert.equal(await used(),1);
  await reset();await page.evaluate(()=>{getChar().hpCurrent=1;recordStepAndSave('Vida sintética antes da queda');});await open();await ready();await accept();await page.evaluate(()=>changeHp(-1));assert.equal(await end.count(),0);await page.evaluate(()=>changeHp(1));assert.equal(await ac(),baseAC);
  // CA editada é o total já exibido; não cristaliza o bônus. Deslocamento zero não retoma ao corrigir.
  await reset();await unlockSheet(page);await open();await ready();await accept();const armor=page.locator('[data-sheet-field="armorTotal"]');await armor.fill('30');await armor.dispatchEvent('change');assert.equal(await ac(),30);await stop();assert.equal(await ac(),26);
  await reset();await open();await ready();await accept();const speed=page.locator('[data-sheet-field="speed"]');await speed.fill('0');await speed.dispatchEvent('change');assert.equal(await end.count(),0);await speed.fill('9');await speed.dispatchEvent('change');assert.equal(await ac(),baseAC);
  // 320px/GG nos temas/layouts, campos estáveis e rodinha contida no diálogo nativo.
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await reset();await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});await open();await ready();
   await dialog.locator('[data-evasive-moving]').focus();await dialog.locator('[data-evasive-moving]').evaluate(e=>window.evasiveCheck=e);await dialog.locator('[data-health-source]').selectOption('physical');assert.equal(await dialog.locator('[data-evasive-moving]').evaluate(e=>e===window.evasiveCheck),true);
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);const y=await page.evaluate(()=>scrollY);await dialog.hover();await page.mouse.wheel(0,400);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>scrollY),y);
   if(layout==='classic_2014'&&theme==='pergaminho_claro')await dialog.screenshot({path:'/tmp/critcall-passo-mobile.png'});await accept();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await stop();
  }
  // O estado permanece por recarga offline até declarar a parada; custo não é devolvido. Descanso encerra.
  await reset();await open();await ready();await accept();await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await end.waitFor();assert.equal(await ac(),baseAC+4);assert.equal(await used(),1);await stop();assert.equal(await ac(),baseAC);assert.equal(await used(),1);
  await open();await ready();await accept();await page.evaluate(()=>shortRest());assert.equal(await end.count(),0);assert.equal(await used(),0);
  assert.equal(await page.evaluate(()=>JSON.stringify([getChar().weapons,getChar().rules.history,getChar().hpCurrent,getChar().hpMax,getChar().heroicInspiration,getChar().ruleState.inspirationReady,characters[1],readPrivateNotes(getChar().id)])),stable);
  assert.ok((await page.locator('#historyCountBadge').innerText()).split('/').map(Number).every(n=>n<=24));assert.deepEqual(errors,[]);
  console.log('PASS Passo Evasivo: conhecimento/origens/dados, físico/virtual/OFF/Só Pool/Auto, cancelar/concorrência/contexto antes do RNG, conta/permissão, CA/gasto/desfazer/encerrar sem reembolso, condições/queda/exaustão/descanso sem retomada, edição de CA/deslocamento, pool/inspiração, nós/scroll, 320px/GG/temas/layouts, notas/histórico e offline /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
