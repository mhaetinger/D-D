const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.id='survivor-synthetic';c.name='Campeão sintético';c.classes=[{classId:'guerreiro',level:18,subclassId:'campeao',subclass:'Campeão',hitDie:10,hitDiceUsed:3}];
  c.hpCurrent=40;c.hpMax=80;c.hpTemp=12;c.hpTempSource='Fonte sintética';c.exhaustion=0;c.abilities.con.score=16;c.heroicInspiration=true;
  c.ruleState={version:1,used:{'guerreiro:secondWind':1},active:{},pools:{},targets:{},conditions:{},inspirationReady:true};
  await page.addInitScript(c=>{if(localStorage.getItem('survivorSeed'))return;localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('survivorSeed','1');},c);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
  const use=page.locator('[data-health-action="survivor"]'),{dialog,accept,cancel}=confirmationActions(page);
  await use.waitFor();await page.evaluate(()=>{setDiceMode('off');setTab('lore');savePrivateNotes('Nota privada sintética de Sobrevivente.');setTab('main');clearDicePool();addDieToPool(12);Math.random=()=>{throw Error('Sobrevivente não rola dados');};});
  const stable=await page.evaluate(()=>JSON.stringify([getChar().hpMax,getChar().hpTemp,getChar().hpTempSource,getChar().classes,getChar().weapons,getChar().heroicInspiration,getChar().ruleState.inspirationReady,getChar().ruleState.used,readPrivateNotes(getChar().id)]));
  const open=async()=>{await use.evaluate(e=>e.scrollIntoView({block:'center'}));await use.click();await dialog.waitFor({state:'visible'});};
  const confirm=async()=>{await dialog.locator('[data-survivor-start]').check();await accept();};
  const reset=async()=>{await page.evaluate(()=>{getChar().hpCurrent=40;recordStepAndSave('PV sintéticos até metade');});};
  // Cancelar e confirmação sem o requisito não curam nem gravam histórico.
  const before=await page.evaluate(()=>JSON.stringify(getChar())),history=await page.locator('#historyCountBadge').innerText();
  await open();assert.match(await dialog.innerText(),/5 \+ CON \(\+3\) = 8 PV.*40 → 48\/80.*ultrapassar a metade/s);assert.equal(await dialog.locator('[data-health-source]').count(),0);await cancel();
  assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);assert.equal(await page.locator('#historyCountBadge').innerText(),history);
  await open();await accept();assert.equal(await dialog.evaluate(e=>e.open),true);assert.equal(await page.evaluate(()=>getChar().hpCurrent),40);
  await confirm();assert.equal(await page.evaluate(()=>getChar().hpCurrent),48);assert.equal(await use.isDisabled(),true);assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-survivor-control')),true);assert.match(await page.locator('[data-sheet-value="hpCurrent"]').innerText(),/48/);
  assert.equal(await page.locator('#dicePoolDisplay').innerText(),'1d12');await page.evaluate(()=>undoStep());assert.equal(await page.evaluate(()=>getChar().hpCurrent),40);await page.evaluate(()=>redoStep());assert.equal(await page.evaluate(()=>getChar().hpCurrent),48);
  // Um diálogo por ficha; uma confirmação recupera somente uma vez.
  await reset();await page.evaluate(()=>{const button=document.querySelector('[data-health-action="survivor"]');button.click();button.click();});await dialog.waitFor({state:'visible'});assert.equal(await dialog.locator('[data-survivor-start]').count(),1);await confirm();assert.equal(await page.evaluate(()=>getChar().hpCurrent),48);
  // Revalida documento, nível/subclasse, máximo, CON, condição, modo de exibição e autoridade.
  for(const change of ['hp','maximum','constitution','subclass','level','death','shape','permission','render','character']){
   await reset();await open();await dialog.locator('[data-survivor-start]').check();
   await page.evaluate(change=>{const c=getChar();if(change==='hp')c.hpCurrent=39;if(change==='maximum')c.hpMax=100;if(change==='constitution')c.abilities.con.score=18;if(change==='subclass')c.classes[0].subclassId='mestreBatalha';if(change==='level')c.classes[0].level=17;if(change==='death')c.ruleState.death={dead:true};if(change==='shape')c.ruleState.active['druida:wildShape']=true;if(change==='permission')CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));if(change==='render')setTab('main');if(change==='character'){const other=structuredClone(c);other.id='survivor-other';other.name='Outro Campeão sintético';other.hpCurrent=30;characters.push(other);switchCharacter(1);}},change);
   const changed=await page.evaluate(()=>JSON.stringify(characters));await accept();assert.equal(await page.evaluate(()=>JSON.stringify(characters)),changed);
   await page.evaluate(change=>{if(change==='permission')CritCallSheetAccess.setProvider(()=>({kind:'personal'}));if(change==='character'){switchCharacter(0);characters.pop();}const c=getChar();c.hpMax=80;c.abilities.con.score=16;c.classes[0].subclassId='campeao';c.classes[0].level=18;c.ruleState.death={successes:0,failures:0,dead:false,stable:false};c.ruleState.active['druida:wildShape']=false;},change);
  }
  await reset();await open();await dialog.locator('[data-survivor-start]').check();const accountBefore=await page.evaluate(()=>JSON.stringify(getChar()));await page.evaluate(()=>activateAccountWorkspace({project:'critcall-survivor-test',userId:'conta-sintetica'}));await dialog.waitFor({state:'hidden'});await page.evaluate(()=>activateAccountWorkspace(null));assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),accountBefore);
  // Não aparece em outro arquétipo/nível; indisponível em 0 PV ou acima da metade.
  for(const setup of ['zero','above','dead','shape','constitution','exhaustion']){
   await page.evaluate(setup=>{const c=getChar();c.hpCurrent=40;c.abilities.con.score=16;c.exhaustion=0;c.ruleState.active['druida:wildShape']=false;c.ruleState.death={};if(setup==='zero'){c.hpCurrent=0;c.ruleState.death.stable=true;}if(setup==='above')c.hpCurrent=41;if(setup==='dead')c.ruleState.death.dead=true;if(setup==='shape')c.ruleState.active['druida:wildShape']=true;if(setup==='constitution')c.abilities.con.score=1;if(setup==='exhaustion')c.exhaustion=4;setTab('main');},setup);assert.equal(await use.isDisabled(),true);
  }
  for(const setup of ['level','subclass']){await page.evaluate(setup=>{const c=getChar();c.classes[0].level=setup==='level'?17:18;c.classes[0].subclassId=setup==='subclass'?'mestreBatalha':'campeao';setTab('main');},setup);assert.equal(await use.count(),0);}
  // Passivo funciona em sono/incapacitação com PV positivos e com dados em qualquer modo.
  for(const mode of ['off','manual','auto']){
   await page.evaluate(mode=>{const c=getChar();c.classes[0].subclassId='campeao';c.classes[0].level=18;c.hpCurrent=40;c.exhaustion=0;c.abilities.con.score=16;c.ruleState.death={};c.ruleState.conditions={inconsciente:true,atordoado:true};c.conscious=false;setDiceMode(mode);recordStepAndSave('Sono sintético com PV positivos');},mode);await open();await confirm();assert.equal(await page.evaluate(()=>getChar().hpCurrent),48);assert.equal(await page.evaluate(()=>getChar().ruleState.conditions.inconsciente),true);assert.equal(await page.evaluate(()=>getChar().conscious),false);
  }
  // Máximo reduzido por exaustão; um passo de desfazer restaura somente os PV.
  await page.evaluate(()=>{const c=getChar();c.hpCurrent=20;c.exhaustion=4;c.conscious=true;c.ruleState.conditions={};recordStepAndSave('Exaustão sintética');});await open();assert.match(await dialog.innerText(),/20 → 28\/40/);await confirm();assert.equal(await page.evaluate(()=>getChar().hpCurrent),28);assert.equal(await page.evaluate(()=>getChar().hpMax),80);await page.evaluate(()=>undoStep());assert.equal(await page.evaluate(()=>getChar().hpCurrent),20);
  await page.evaluate(()=>{getChar().exhaustion=0;});await reset();
  // A lista de condições retém seus nós/foco; o diálogo contém a rodinha.
  const condition=page.locator('[data-rule-condition="envenenado"]');await condition.evaluate(e=>window.survivorCondition=e);await open();const y=await page.evaluate(()=>scrollY);await dialog.hover();await page.mouse.wheel(0,400);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>scrollY),y);await confirm();assert.equal(await condition.evaluate(e=>e===window.survivorCondition),true);
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});await reset();await open();assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await dialog.locator('[data-survivor-start]').focus();await dialog.locator('[data-survivor-start]').evaluate(e=>window.survivorCheck=e);await dialog.locator('[data-survivor-start]').check();assert.equal(await dialog.locator('[data-survivor-start]').evaluate(e=>e===window.survivorCheck&&e===document.activeElement),true);if(layout==='classic_2014'&&theme==='pergaminho_claro')await dialog.screenshot({path:'/tmp/critcall-sobrevivente-mobile.png'});await cancel();
  }
  assert.equal(await page.evaluate(()=>JSON.stringify([getChar().hpMax,getChar().hpTemp,getChar().hpTempSource,getChar().classes,getChar().weapons,getChar().heroicInspiration,getChar().ruleState.inspirationReady,getChar().ruleState.used,readPrivateNotes(getChar().id)])),stable);
  // Iniciativa, descanso, recarga e d20 não simulam início de turno.
  await page.evaluate(()=>{setDiceMode('off');rollInitiative();shortRest();});assert.equal(await page.evaluate(()=>getChar().hpCurrent),40);assert.equal(await dialog.evaluate(e=>e.open),false);
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await use.waitFor();assert.equal(await page.evaluate(()=>getChar().hpCurrent),40);await open();await confirm();assert.equal(await page.evaluate(()=>getChar().hpCurrent),48);
  assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota privada sintética de Sobrevivente.');assert.ok((await page.locator('#historyCountBadge').innerText()).split('/').map(Number).every(n=>n<=24));assert.deepEqual(errors,[]);
  console.log('PASS Sobrevivente: Campeão18/nível próprio, metade/ultrapassar/máximo de exaustão, zero/estável/morto/forma/CON, passivo em sono/incapacitação, declaração/cancelar/concorrência/documento/ficha/conta/permissão, desfazer, condições/nós/foco/scroll, OFF/Só Pool/Auto, 320px/GG/temas/layouts, notas e offline /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
