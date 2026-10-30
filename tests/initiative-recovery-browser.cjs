const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const make=(id,level,subclassId)=>{
   const c=warrior();c.id='initiative-'+id;c.name='Iniciativa sintética '+id;c.hpCurrent=c.hpMax=100;c.abilities.dex.score=14;c.abilities.cha.score=18;
   c.classes=[{classId:id,level,subclassId,subclass:'',hitDie:id==='guerreiro'?10:8,hitDiceUsed:0}];
   c.rules={raceId:'humano',history:[]};c.ruleState={version:1,used:{},pools:{},active:{},targets:{}};return c;
  };
  const f=make('guerreiro',15,'mestreBatalha');f.rules.raceId='halflingLeve';f.ruleState.used={'guerreiro:superiority':6,'feat:superiority':1};
  f.classes.push({classId:'monge',level:5,subclassId:'sombras',subclass:'Caminho da Sombra',hitDie:8,hitDiceUsed:0});f.ruleState.pools['monge:ki']=3;
  f.rules.history=[{classId:'guerreiro',level:3,answers:{maneuvers:['Aparar','Derrubar','Ataque de Precisão']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Inspirar','Golpe Distrativo']}},{classId:'guerreiro',level:6,answers:{feat:'Sortudo'}}];
  const b=make('bardo',20,'conhecimento');b.ruleState.used['bardo:inspiration']=4;
  const m=make('monge',20,'sombras');m.ruleState.pools['monge:ki']=0;
  await page.addInitScript(chars=>{if(localStorage.getItem('initiativeSeeded'))return;localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:chars}));localStorage.setItem('initiativeSeeded','1');},[f,b,m]);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.locator('[data-initiative-roll]').waitFor();
  const init=page.locator('[data-initiative-roll]'),{dialog,accept,cancel}=confirmationActions(page);
  const stub=faces=>page.evaluate(faces=>{window.initCalls=0;window.initFaces=[...faces];Math.random=()=>{window.initCalls++;if(!window.initFaces.length)throw Error('RNG extra proibido');return (window.initFaces.shift()-.5)/20;};},faces);
  const settled=()=>page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));
  const state=()=>page.evaluate(()=>JSON.stringify(getChar().ruleState));
  const empty=async()=>{await page.evaluate(()=>{getChar().ruleState.used['guerreiro:superiority']=6;getChar().ruleState.used['feat:superiority']=1;recordStepAndSave('Reserva sintética vazia');});};
  const physical=async()=>{await init.click();await dialog.waitFor({state:'visible'});};
  await page.evaluate(()=>{setTab('lore');savePrivateNotes('Nota privada sintética de iniciativa.');setTab('main');setDiceMode('auto');setRollMode('adv');getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;recordStepAndSave('Preparou inspiração sintética');});
  const stable=await page.evaluate(()=>JSON.stringify([getChar().weapons,getChar().rules.history,getChar().hpCurrent,getChar().hpMax,readPrivateNotes(getChar().id)]));
  // Iniciativa real: dado/recuperação/inspiração em um passo e controles preservados.
  await init.evaluate(e=>window.initNode=e);await page.locator('[data-resource-balance="guerreiro:superiority"]').evaluate(e=>window.initBalance=e);
  await page.locator('[data-rule-pool="monge:ki"]').evaluate(e=>{e.value='2';window.otherKi=e;});
  await stub([1,12]);await init.click();await settled();assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),1);
  assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);assert.equal(await page.locator('#diceDockValue').innerText(),'14');assert.equal(await page.evaluate(()=>window.initCalls),2);
  assert.equal(await page.locator('[data-inspiration-control] [data-health-action="inspirationReceive"]').count(),1);assert.equal(await page.locator('[data-inspiration-control] [data-health-action="inspirationUse"]').count(),0);
  assert.equal(await init.evaluate(e=>e===window.initNode),true);assert.equal(await page.locator('[data-resource-balance="guerreiro:superiority"]').evaluate(e=>e===window.initBalance&&e.textContent==='1'),true);
  assert.equal(await page.locator('[data-rule-pool="monge:ki"]').evaluate(e=>e===window.otherKi&&e.value==='2'),true);assert.equal(await page.evaluate(()=>getChar().ruleState.pools['monge:ki']),3);
  await page.evaluate(()=>undoStep());assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),6);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
  await page.evaluate(()=>redoStep());assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);
  // Outra iniciativa com saldo não acumula; Sortudo racial/talento só mudam o d20.
  await page.evaluate(()=>setRollMode('normal'));await stub([1]);await init.click();await settled();assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);
  if(!await page.locator('#diceTrayBody').isVisible())await page.locator('#diceDock').click();await stub([12]);await page.locator('[data-dice-halfling-luck]').click();await settled();assert.equal(await page.locator('#diceDockValue').innerText(),'14');
  await page.locator('[data-dice-lucky-feat]').click();await cancel();assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);
  await page.locator('[data-dice-lucky-feat]').click();await stub([20]);await accept();await settled();await page.locator('[data-dice-lucky-choice="1"]').click();assert.equal(await page.locator('#diceDockValue').innerText(),'22');assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:lucky']),1);
  // Rótulo, pool, d20 livre e outros testes não são nova iniciativa da ficha.
  await empty();const noRollChange=await state();await stub([10,10,10]);
  await page.evaluate(()=>{triggerSheetRoll('1d20+2','Iniciativa',true,{type:'check'});rollQuickD20();clearDicePool();addDieToPool(20);rollCurrentPool('Iniciativa');});await settled();assert.equal(await state(),noRollChange);
  await page.evaluate(()=>{Math.random=()=>{throw Error('RNG sintético indisponível');};});assert.equal(await page.evaluate(()=>{try{rollInitiative();return false;}catch{return true;}}),true);assert.equal(await state(),noRollChange);
  // OFF: confirmação física, cancelamento, requisito e duplo clique, sem RNG.
  await page.evaluate(()=>setDiceMode('off'));await stub([]);const beforePhysical=await state(),shown=await page.locator('#diceDockValue').innerText();await physical();assert.doesNotMatch(await dialog.innerText(),/recuperou/);await accept();assert.equal(await dialog.evaluate(e=>e.open),true);await cancel();assert.equal(await state(),beforePhysical);
  await page.evaluate(()=>{rollInitiative();rollInitiative();});await dialog.waitFor({state:'visible'});await dialog.locator('[data-initiative-physical-confirm]').check();await accept();assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);assert.equal(await page.evaluate(()=>window.initCalls),0);assert.equal(await page.locator('#diceDockValue').innerText(),shown);
  // Todas as origens contam: com o dado do Adepto ainda disponível não recupera.
  await empty();await page.evaluate(()=>getChar().ruleState.used['feat:superiority']=0);await init.click();assert.equal(await dialog.evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),6);
  // Confirmação antiga não atravessa alteração de documento, fonte, modo, permissão ou ficha.
  for(const action of ['document','resource','mode','permission','character']){
   await page.evaluate(()=>setDiceMode('off'));await empty();await physical();await dialog.locator('[data-initiative-physical-confirm]').check();
   await page.evaluate(action=>{if(action==='document')getChar().hpCurrent--;if(action==='resource')getChar().ruleState.used['feat:superiority']=0;if(action==='mode')setDiceMode('auto');if(action==='permission')CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));if(action==='character')switchCharacter(1);},action);
   const changed=await state();await accept();assert.equal(await state(),changed);assert.equal(await page.evaluate(()=>window.initCalls),0);
   await page.evaluate(action=>{if(action==='permission')CritCallSheetAccess.setProvider(()=>({kind:'personal'}));if(action==='character')switchCharacter(0);if(action==='document')getChar().hpCurrent++;},action);
  }
  await page.evaluate(()=>setDiceMode('off'));await empty();await physical();await dialog.locator('[data-initiative-physical-confirm]').check();const workspaceBefore=await state();
  await page.evaluate(()=>activateAccountWorkspace({project:'critcall-initiative-test',userId:'conta-sintetica'}));await dialog.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>characters.length),0);await page.evaluate(()=>activateAccountWorkspace(null));assert.equal(await state(),workspaceBefore);
  // Bardo: um uso, sem substituir a inspiração heroica nem remontar o saldo.
  await page.evaluate(()=>{switchCharacter(1);setDiceMode('auto');});await page.locator('[data-resource-balance="bardo:inspiration"]').evaluate(e=>window.bardBalance=e);await stub([10]);await init.click();await settled();
  assert.equal(await page.evaluate(()=>getChar().ruleState.used['bardo:inspiration']),3);assert.equal(await page.locator('[data-resource-balance="bardo:inspiration"]').evaluate(e=>e===window.bardBalance&&e.textContent==='1'),true);
  assert.equal(await page.locator('[data-rule-action="use"][data-resource="bardo:inspiration"]').isDisabled(),false);await page.evaluate(()=>undoStep());assert.equal(await page.evaluate(()=>getChar().ruleState.used['bardo:inspiration']),4);await page.evaluate(()=>redoStep());
  // Monge: quatro Chi, mesmo input/foco; Só Pool confirma a iniciativa física.
  await page.evaluate(()=>switchCharacter(2));await page.locator('[data-rule-pool="monge:ki"]').evaluate(e=>window.kiNode=e);await stub([10]);await init.click();await settled();
  assert.equal(await page.evaluate(()=>getChar().ruleState.pools['monge:ki']),4);assert.equal(await page.locator('[data-rule-pool="monge:ki"]').evaluate(e=>e===window.kiNode&&e.value==='4'),true);
  assert.equal(await page.locator('[data-rule-action="use"][data-resource="monge:flurry"]').isDisabled(),false);assert.equal(await page.locator('[data-rule-action="use"][data-resource="monge:astral"]').isDisabled(),true);
  await page.evaluate(()=>{getChar().ruleState.pools['monge:ki']=0;recordStepAndSave('Chi sintético vazio');setDiceMode('manual');});await stub([]);await physical();await dialog.locator('[data-initiative-physical-confirm]').check();await accept();assert.equal(await page.evaluate(()=>getChar().ruleState.pools['monge:ki']),4);assert.equal(await page.evaluate(()=>window.initCalls),0);
  // Permissão negada impede recuperação e RNG também na iniciativa automática.
  await page.evaluate(()=>{switchCharacter(0);setDiceMode('auto');CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));});await stub([]);await init.click();assert.equal(await page.evaluate(()=>window.initCalls),0);await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'personal'})));
  assert.equal(await page.evaluate(()=>JSON.stringify([getChar().weapons,getChar().rules.history,getChar().hpCurrent,getChar().hpMax,readPrivateNotes(getChar().id)])),stable);
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);setDiceMode('off');},{layout,theme});await empty();await physical();
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await dialog.locator('[data-initiative-physical-confirm]').focus();await dialog.locator('[data-initiative-physical-confirm]').evaluate(e=>window.initCheck=e);await dialog.locator('[data-initiative-physical-confirm]').check();assert.equal(await dialog.locator('[data-initiative-physical-confirm]').evaluate(e=>e===window.initCheck&&e===document.activeElement),true);
   const y=await page.evaluate(()=>scrollY);await dialog.hover();await page.mouse.wheel(0,500);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>scrollY),y);
   if(layout==='classic_2014'&&theme==='pergaminho_claro')await dialog.screenshot({path:'/tmp/critcall-iniciativa-mobile.png'});await cancel();
  }
  // Build offline /D-D/: declaração física, saldo e nota sobrevivem à recarga.
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await init.waitFor();await stub([]);await physical();await dialog.locator('[data-initiative-physical-confirm]').check();await accept();
  assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);assert.equal(await page.evaluate(()=>window.initCalls),0);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota privada sintética de iniciativa.');
  assert.ok((await page.locator('#historyCountBadge').innerText()).split('/').map(Number).every(n=>n<=24));assert.deepEqual(errors,[]);
  console.log('PASS iniciativa: Implacável/todas as origens, Inspiração Superior/Chi, vazio/sem acúmulo, inspiração e desfazer juntos, Sortudo/halfling sem nova recuperação, pool/rótulo/RNG/permissão, físico/OFF/Só Pool/cancelar/concorrência/conta, nós/foco/scroll, 320px/GG/temas/layouts, notas e offline /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
