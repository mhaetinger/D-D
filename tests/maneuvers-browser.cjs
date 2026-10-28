const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.id='maneuvers-fixture';c.name='Manobras sintéticas';c.abilities.str.score=18;c.abilities.dex.score=16;c.hpCurrent=c.hpMax=100;
  c.classes=[{...c.classes[0],level:4,subclassId:'mestreBatalha',subclass:'Mestre de Batalha'},{classId:'paladino',level:2,subclassId:'devocao',subclass:'Devoção',hitDie:10,hitDiceUsed:0}];
  c.rules.history=[{classId:'guerreiro',level:3,answers:{maneuvers:['Ataque Desarmante','Derrubar','Ataque de Precisão']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Derrubar','Inspirar']}}];
  c.ruleState={version:1,used:{'guerreiro:superiority':1},active:{},pools:{},targets:{},portent:[]};c.standardSlots={1:{total:2,used:0}};
  c.weapons=[{name:'Rapieira'},{name:'Arco Longo'},{name:'Rapieira',calculationMode:'manual',damage:'1d8+4',bonus:'+5'}].map(w=>({bonus:'+0',damage:'0',notes:'Registro sintético preservado',...w}));
  const other=structuredClone(c);other.id='maneuvers-other';other.name='Outra ficha sintética';other.rules.history=[];
  const effects=structuredClone(c);effects.id='maneuvers-effects';effects.name='Efeitos sintéticos';effects.classes[0].level=10;effects.ruleState.used={};
  effects.rules.history=[
   {classId:'guerreiro',level:3,answers:{maneuvers:['Ataque Ameaçador','Ataque de Encontrão','Ataque Provocante']}},
   {classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Ataque de Precisão','Inspirar']}},
   {classId:'guerreiro',level:7,answers:{maneuvers:['Ataque de Manobra','Golpe Distrativo']}},
   {classId:'guerreiro',level:10,answers:{maneuvers:['Ataque Desarmante','Derrubar']}},
  ];
  await page.addInitScript(({c,other,effects})=>{if(localStorage.getItem('maneuverSeeded'))return;localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c,other,effects]}));localStorage.setItem('maneuverSeeded','1');},{c,other,effects});
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.locator('[data-rule-weapon-damage="0"]').waitFor().catch(async e=>{console.error(await page.locator('body').innerText());throw e;});
  await page.evaluate(()=>{setTab('lore');savePrivateNotes('Nota privada sintética de manobras.');setTab('main');setDiceMode('auto');clearDicePool();addDieToPool(12);setRollMode('adv');getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;window.manRandom=Math.random;Math.random=()=>{window.manCalls++;return 0;};window.manCalls=0;});
  const {dialog,accept,cancel}=confirmationActions(page),open=async(i=0)=>{await page.locator(`[data-rule-weapon-damage="${i}"]`).click();await dialog.waitFor({state:'visible'});};
  const choose=async(id='disarm',source='guerreiro:superiority')=>{await dialog.locator('[data-weapon-maneuver]').selectOption(id);await dialog.locator('[data-weapon-superiority]').selectOption(source);await dialog.locator('[data-weapon-no-other-maneuver]').check();};
  const state=()=>page.evaluate(()=>JSON.stringify([getChar().ruleState.used,getChar().standardSlots]));
  const original=await state(),stable=await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().weapons,getChar().rules.history,characters[1],readPrivateNotes(getChar().id)])),pool=await page.locator('#dicePoolDisplay').innerText();
  // Prévia, confirmação da única manobra e cancelamento: sem gasto/RNG; nós e foco estáveis.
  await open();await dialog.locator('[data-weapon-maneuver]').selectOption('disarm');await accept();assert.equal(await dialog.evaluate(e=>e.open),true);assert.match(await dialog.locator('[data-window-notice]').innerText(),/nenhuma outra manobra/);
  await dialog.locator('[data-weapon-maneuver-ability]').focus();await dialog.locator('[data-weapon-maneuver-ability]').evaluate(e=>window.manSelect=e);await dialog.locator('[data-weapon-maneuver-ability]').selectOption('dex');assert.equal(await dialog.locator('[data-weapon-maneuver-ability]').evaluate(e=>e===window.manSelect&&e===document.activeElement),true);
  await cancel();assert.equal(await state(),original);assert.equal(await page.evaluate(()=>window.manCalls),0);
  // Um acerto crítico com Destruição paga uma única vez cada origem; dado da manobra dobra.
  await page.locator('[data-weapon-critical-toggle="0"]').check();await open();await choose();await dialog.locator('[data-weapon-smite]').selectOption('slot:1');assert.match(await dialog.locator('[data-weapon-preview]').innerText(),/Ataque Desarmante: 2d8/);await accept();
  await page.waitForFunction(()=>getChar().ruleState.used['guerreiro:superiority']===2);assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1);assert.equal(await page.evaluate(()=>window.manCalls),8);
  await page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));assert.equal(await page.locator('#diceDockValue').innerText(),'12');assert.equal(await page.locator('#dicePoolDisplay').innerText(),pool);assert.equal(await page.evaluate(()=>getChar().heroicInspiration&&getChar().ruleState.inspirationReady),true);
  await page.evaluate(()=>undoStep());assert.equal(await state(),original);await page.evaluate(()=>redoStep());assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),2);
  // Dado do talento serve para manobra da classe e não gasta a reserva da classe. Arco também serve.
  await page.evaluate(()=>{setDiceMode('off');window.manCalls=0;});await open(1);assert.equal(await dialog.locator('[data-weapon-source]').count(),0);await choose('trip','feat:superiority');assert.match(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/Grande ou menor/);await dialog.locator('[data-weapon-total]').fill('17');await accept();assert.equal(await page.evaluate(()=>window.manCalls),0);assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),1);assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),2);
  await open();assert.equal(await dialog.locator('[data-weapon-superiority] option[value="feat:superiority"]').evaluate(e=>e.disabled),true);await cancel();
  await page.evaluate(()=>{setDiceMode('manual');window.manCalls=0;});await open();await choose();await dialog.locator('[data-weapon-total]').fill('13');await accept();assert.equal(await page.evaluate(()=>window.manCalls),0);assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),3);
  // Uso físico da característica usa o mesmo contador; descanso recupera ambas as origens.
  const control=page.locator('[data-rule-control="guerreiro:superiority"]');await control.getByRole('button',{name:'Usar na mesa',exact:true}).click();assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),4);
  await open();await dialog.locator('[data-weapon-maneuver]').selectOption('trip');await dialog.locator('[data-weapon-no-other-maneuver]').check();assert.match(await dialog.locator('[data-weapon-preview]').innerText(),/esgotada/);await dialog.locator('[data-weapon-total]').fill('10');const exhausted=await state();await accept();assert.equal(await dialog.evaluate(e=>e.open),true);assert.equal(await state(),exhausted);assert.equal(await page.evaluate(()=>window.manCalls),0);await cancel();
  await page.evaluate(()=>{CritCallRules.resetResources(getChar(),'short',CharacterEngine);recordStepAndSave('Descanso sintético');setDiceMode('auto');});
  assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),0);assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),0);
  await page.getByRole('button',{name:'Consultar Adepto Marcial',exact:true}).click();assert.match(await page.locator('#featureConsultation').innerText(),/errata oficial/);await page.locator('#featureConsultation').getByRole('button',{name:'Fechar consulta'}).click();
  // Alterar documento, arma, permissão, ficha ou modo invalida a confirmação antes do RNG/custo.
  for(const action of ['document','weapon','permission','character','mode']){
   await page.evaluate(()=>{setDiceMode('auto');window.manCalls=0;});await open();await choose();await dialog.locator('[data-weapon-smite]').selectOption('slot:1');
   await page.evaluate(action=>{if(action==='document')getChar().hpCurrent--;if(action==='weapon')getChar().weapons[0]={...getChar().weapons[0]};if(action==='permission')CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));if(action==='character')switchCharacter(1);if(action==='mode')setDiceMode('manual');},action);
   const before=await state();await accept();assert.equal(await page.evaluate(()=>window.manCalls),0);assert.equal(await state(),before);if(await dialog.evaluate(e=>e.open))await cancel();
   await page.evaluate(action=>{if(action==='permission')CritCallSheetAccess.setProvider(()=>({kind:'personal'}));if(action==='character')switchCharacter(0);if(action==='document')getChar().hpCurrent++;},action);
  }
  // Personalizado e outra ficha sem aquisição não recebem manobras.
  await open(2);assert.equal(await dialog.locator('[data-weapon-maneuver]').count(),0);await cancel();
  await page.evaluate(()=>switchCharacter(1));await open();assert.equal(await dialog.locator('[data-weapon-maneuver]').count(),0);await cancel();await page.evaluate(()=>switchCharacter(0));
  // Cinco efeitos no mesmo fluxo: a CD só existe para resistências, sem recriar controles.
  await page.evaluate(()=>{switchCharacter(2);setDiceMode('auto');window.manCalls=0;});const effectsBefore=await state();await open();
  await choose('menace');await dialog.locator('[data-weapon-maneuver-ability]').selectOption('dex');
  assert.match(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/Resistência de SAB · CD 15 \(DES\).*amedrontado/);
  await dialog.locator('[data-weapon-maneuver]').focus();await dialog.evaluate(e=>{window.effectRefs=[e.querySelector('[data-weapon-maneuver]'),e.querySelector('[data-weapon-maneuver-ability]'),e.querySelector('[data-weapon-superiority]')];});
  for(const id of ['maneuvering','distract']){
   await dialog.locator('[data-weapon-maneuver]').selectOption(id);assert.equal(await dialog.locator('[data-weapon-maneuver-ability-label]').isVisible(),false);assert.equal(await dialog.locator('[data-weapon-maneuver-ability]').isDisabled(),true);
   assert.match(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/Sem teste de resistência/);assert.doesNotMatch(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/\bCD\b/);
   assert.equal(await dialog.evaluate(e=>window.effectRefs.every((node,i)=>node===e.querySelector(['[data-weapon-maneuver]','[data-weapon-maneuver-ability]','[data-weapon-superiority]'][i]))&&document.activeElement===window.effectRefs[0]),true);
  }
  await dialog.locator('[data-weapon-maneuver]').selectOption('goad');assert.equal(await dialog.locator('[data-weapon-maneuver-ability-label]').isVisible(),true);assert.equal(await dialog.locator('[data-weapon-maneuver-ability]').inputValue(),'dex');
  assert.match(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/Resistência de SAB · CD 15.*criaturas diferentes de você/);await cancel();assert.equal(await state(),effectsBefore);assert.equal(await page.evaluate(()=>window.manCalls),0);
  // Um dado por acerto, incluindo origem do talento, crítico/Destruição e efeitos sem CD.
  await page.locator('[data-weapon-critical-toggle="0"]').check();
  for(const [i,id] of ['menace','push','goad','maneuvering','distract'].entries()){
   await open(i===0?0:1);await choose(id,i===0?'feat:superiority':'guerreiro:superiority');
   if(i===0){await dialog.locator('[data-weapon-smite]').selectOption('slot:1');assert.match(await dialog.locator('[data-weapon-preview]').innerText(),/Ataque Ameaçador: 2d10/);}
   if(id==='push')assert.match(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/Grande ou menor.*4,5 m.*maiores recebem o dano adicional/);
   if(id==='maneuvering')assert.match(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/própria reação.*metade do deslocamento.*do alvo atingido/);
   if(id==='distract')assert.match(await dialog.locator('[data-weapon-maneuver-effect]').innerText(),/outra criatura.*antes do começo do seu próximo turno/);
   await accept();assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),1);
   assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']||0),i);assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1);
   assert.equal(await page.evaluate(()=>window.manCalls),8+2*i);
  }
  await page.evaluate(()=>{setDiceMode('off');window.manCalls=0;});await open(1);await choose('maneuvering');await dialog.locator('[data-weapon-total]').fill('19');await accept();
  assert.equal(await page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']),5);assert.equal(await page.evaluate(()=>window.manCalls),0);
  await page.evaluate(()=>{CritCallRules.resetResources(getChar(),'short',CharacterEngine);setDiceMode('auto');setRollMode('normal');getChar().heroicInspiration=false;getChar().ruleState.inspirationReady=false;rollWeapon(1,'attack');});
  await page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));await page.evaluate(()=>{usePrecisionD20();});await dialog.waitFor({state:'visible'});
  await dialog.locator('[data-health-source]').selectOption('physical');await dialog.locator('[data-health-face]').fill('1');await dialog.locator('[data-precision-unresolved]').check();await accept();
  const precisionState=await state(),precisionCalls=await page.evaluate(()=>window.manCalls);await open(1);assert.equal(await dialog.locator('[data-weapon-maneuver]').isDisabled(),true);
  for(const id of ['menace','push','goad','maneuvering','distract']){
   await dialog.locator('[data-weapon-maneuver]').evaluate((e,id)=>{e.value=id;e.dispatchEvent(new Event('change',{bubbles:true}));},id);await dialog.locator('[data-weapon-no-other-maneuver]').check();await accept();
   assert.equal(await dialog.evaluate(e=>e.open),true);assert.match(await dialog.locator('[data-window-notice]').innerText(),/Precisão já foi usada/);assert.equal(await state(),precisionState);assert.equal(await page.evaluate(()=>window.manCalls),precisionCalls);
  }
  await cancel();await page.evaluate(()=>setDiceMode('off'));
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);setDiceMode('auto');},{layout,theme});await open();await choose(layout==='classic_2014'?'maneuvering':'goad');
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const y=await page.evaluate(()=>scrollY);await dialog.hover();await page.mouse.wheel(0,550);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>scrollY),y);
   if(layout==='classic_2014'&&theme==='pergaminho_claro')await dialog.screenshot({path:'/tmp/critcall-manobras-mobile.png'});await cancel();
  }
  await page.evaluate(()=>switchCharacter(0));
  assert.equal(await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().weapons,getChar().rules.history,characters[1],readPrivateNotes(getChar().id)])),stable);
  assert.ok((await page.locator('#historyCountBadge').innerText()).split('/').map(Number).every(n=>n<=24));
  // Offline de build sob /D-D/: usos/notas mantidos e registro físico funcional.
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-rule-weapon-damage="0"]').waitFor();
  await page.evaluate(()=>{setDiceMode('off');Math.random=()=>{throw Error('RNG proibido em OFF');};});await open();await choose('trip','feat:superiority');await dialog.locator('[data-weapon-total]').fill('14');await accept();assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),1);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota privada sintética de manobras.');
  assert.deepEqual(errors,[]);console.log('PASS manobras: sete efeitos no acerto, FOR/SAB/sem CD, limites/duração/reação, origens/descanso, crítico/Destruição, cancelamento/concorrência, físico/virtual/OFF/Só Pool, desfazer, notas/fichas, foco/scroll/320px/GG/temas/layouts e offline /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
