const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.id='initiative-mode-synthetic';c.name='Iniciativa contextual sintética';c.classes=[{classId:'barbaro',level:7,subclassId:'berserker',subclass:'Furioso',hitDie:12,hitDiceUsed:0}];
  c.rules={raceId:'halflingLeve',history:[{classId:'barbaro',level:4,answers:{feat:'Sortudo'}}]};c.armorEquipped='';c.shieldEquipped=false;delete c.armorProficiencies;c.abilities.dex.score=14;
  c.ruleState={version:1,active:{},used:{},pools:{},conditions:{},targets:{}};
  await page.addInitScript(c=>{if(localStorage.getItem('initiativeModeSeed'))return;localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('initiativeModeSeed','1');},c);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.locator('[data-initiative-roll]').waitFor();
  const init=page.locator('[data-initiative-roll]'),{dialog,accept,cancel}=confirmationActions(page);
  const stub=faces=>page.evaluate(faces=>{window.initCalls=0;window.initFaces=[...faces];Math.random=()=>{window.initCalls++;if(!window.initFaces.length)throw Error('RNG extra proibido');return (window.initFaces.shift()-.5)/20;};},faces);
  const settled=()=>page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));
  const roll=async(faces,total)=>{await stub(faces);if(page.viewportSize().width<600 && await page.locator("#diceTrayBody").isVisible())await page.locator("#diceTrayMinimizeButton").click();await init.evaluate(e=>e.scrollIntoView({block:"center"}));await init.click();await settled();assert.equal(await page.locator('#diceDockValue').innerText(),String(total));assert.equal(await page.evaluate(()=>window.initCalls),faces.length);};
  await page.evaluate(()=>{setTab('lore');savePrivateNotes('Nota sintética do modo da iniciativa.');setTab('main');setDiceMode('auto');setRollMode('normal');});
  const original=await page.evaluate(()=>JSON.stringify([getChar().weapons,getChar().hpCurrent,getChar().hpMax,getChar().rules.history,readPrivateNotes(getChar().id)]));
  await init.evaluate(e=>window.initiativeNode=e);await roll([3,17],19);
  if(!await page.locator('#diceTrayBody').isVisible())await page.locator('#diceDock').click();
  assert.match(await page.locator('[data-initiative-mode]').innerText(),/Instinto Selvagem/);assert.equal(await page.evaluate(()=>ruleDiceSettings().mode),'normal');assert.equal(await init.evaluate(e=>e===window.initiativeNode),true);
  assert.equal(await page.evaluate(()=>!!getChar().ruleState.active['barbaro:rage']),false);
  // Inspiração não reintroduz vantagem depois do cancelamento com o modo informado.
  await page.evaluate(()=>{setRollMode('dis');getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;recordStepAndSave('Preparou inspiração sintética',true,false);});
  await roll([8],10);assert.match(await page.locator('[data-initiative-mode]').innerText(),/se anulam: 1d20.*Instinto Selvagem.*Inspiração preparada.*Desvantagem informada/);
  assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);assert.equal(await page.evaluate(()=>ruleDiceSettings().mode),'dis');
  await page.evaluate(()=>undoStep());assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);await page.evaluate(()=>redoStep());assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);
  // Exaustão/veneno anulam várias fontes; seleção normal não remove a condição.
  await page.evaluate(()=>{setRollMode('adv');getChar().exhaustion=1;getChar().ruleState.conditions.envenenado=true;});await roll([9],11);
  assert.match(await page.locator('[data-initiative-mode]').innerText(),/Exaustão.*Envenenado/);
  await page.evaluate(()=>{getChar().exhaustion=0;getChar().ruleState.conditions={amedrontado:true,impedido:true,caido:true,cego:true};setRollMode('normal');});await roll([5,13],15);
  // Patrulheiro Revisado de nível próprio 1 também funciona no segundo layout.
  await page.evaluate(()=>{getChar().classes=[{classId:'patrulheiro',level:1,subclassId:'',subclass:'',hitDie:10,hitDiceUsed:0}];getChar().ruleState.conditions={};setLayout('modern_2024');});await roll([6,16],18);
  assert.match(await page.locator('[data-initiative-mode]').innerText(),/Explorador Natural.*Patrulheiro Revisado/);
  // Sem benefício, armadura/escudo sem treino impõem um único par de d20.
  await page.evaluate(()=>{getChar().classes=[{classId:'mago',level:1,subclassId:'',subclass:'',hitDie:6,hitDiceUsed:0}];getChar().armorEquipped='Cota de malha';getChar().shieldEquipped=true;getChar().armorProficiencies=[];});await roll([4,18],6);
  assert.match(await page.locator('[data-initiative-mode]').innerText(),/use o menor.*Armadura sem proficiência.*Escudo sem proficiência/);
  // Contexto capturado permanece ao repetir um 1 ou usar Sortudo, mesmo mudando o seletor.
  await page.evaluate(()=>{getChar().classes=[{classId:'barbaro',level:7,subclassId:'berserker',subclass:'Furioso',hitDie:12,hitDiceUsed:0}];getChar().armorEquipped='';getChar().shieldEquipped=false;getChar().ruleState.used['feat:lucky']=0;setRollMode('normal');});await roll([1,12],14);
  const explanation=await page.locator('[data-initiative-mode]').innerText();await page.evaluate(()=>setRollMode('dis'));await stub([15]);await page.locator('[data-dice-halfling-luck]').click();await settled();assert.equal(await page.locator('#diceDockValue').innerText(),'17');assert.equal(await page.locator('[data-initiative-mode]').innerText(),explanation);
  await page.locator('[data-dice-lucky-feat]').click();await stub([20]);await accept();await settled();await page.locator('[data-dice-lucky-choice="2"]').click();assert.equal(await page.locator('#diceDockValue').innerText(),'22');assert.equal(await page.locator('[data-initiative-mode]').innerText(),explanation);assert.equal(await page.evaluate(()=>ruleDiceSettings().mode),'dis');
  // Pool livre e rótulo não herdam benefício da iniciativa; atalho mantém modo escolhido.
  await stub([10]);await page.evaluate(()=>{setRollMode('normal');triggerSheetRoll('1d20+2','Iniciativa',false,{type:'check'});});await settled();assert.equal(await page.locator('[data-initiative-mode]').count(),0);
  await stub([7]);await page.evaluate(()=>rollQuickD20());await settled();assert.equal(await page.locator('#diceDockValue').innerText(),'7');assert.equal(await page.locator('[data-initiative-mode]').count(),0);
  // RNG falho não gasta inspiração nem altera estado; permissão negada não rola.
  await page.evaluate(()=>{getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;Math.random=()=>{throw Error('RNG sintético indisponível');};});
  const before=await page.evaluate(()=>JSON.stringify(getChar()));assert.equal(await page.evaluate(()=>{try{rollInitiative();return false;}catch{return true;}}),true);assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);
  await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false})));await stub([]);await init.click();assert.equal(await page.evaluate(()=>window.initCalls),0);await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'personal'})));
  // OFF/Só Pool orientam, não gastam inspiração nem mudam último resultado.
  const last=await page.locator('#diceDockValue').innerText();for(const mode of ['off','manual']){
   await page.evaluate(mode=>setDiceMode(mode),mode);await stub([]);await init.click();assert.match(await page.locator('#toast').innerText(),/2d20, use o maior.*Inspiração preparada não foi gasta/);assert.equal(await page.evaluate(()=>window.initCalls),0);assert.equal(await page.locator('#diceDockValue').innerText(),last);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
  }
  // Orientação física também se integra à recuperação existente, sem marcar surpresa/Fúria.
  await page.evaluate(()=>{getChar().classes=[{classId:'patrulheiro',level:1,subclassId:'',subclass:'',hitDie:10,hitDiceUsed:0}];getChar().classes.push({classId:'guerreiro',level:15,subclassId:'mestreBatalha',subclass:'Mestre de Batalha',hitDie:10,hitDiceUsed:0});getChar().ruleState.used['guerreiro:superiority']=6;setTab('main');});await init.click();await dialog.waitFor({state:'visible'});assert.match(await dialog.innerText(),/Patrulheiro Revisado.*Implacável/s);await cancel();
  // Texto legível e sem estouro em 320px/GG, três temas e dois layouts.
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);setDiceMode('auto');setRollMode('dis');},{layout,theme});await roll([9],11);
   if(!await page.locator('#diceTrayBody').isVisible())await page.locator('#diceDock').click();
   assert.equal(await page.locator('[data-initiative-mode]').evaluate(e=>e.scrollWidth<=e.clientWidth),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(layout==='classic_2014'&&theme==='pergaminho_claro')await page.screenshot({path:'/tmp/critcall-iniciativa-modo-mobile.png'});
  }
  assert.equal(await page.evaluate(()=>JSON.stringify([getChar().weapons,getChar().hpCurrent,getChar().hpMax,getChar().rules.history,readPrivateNotes(getChar().id)])),original);
  // Nenhum perfil transitório de iniciativa é gravado; o build real continua offline.
  await page.evaluate(()=>{recordStepAndSave('Iniciativa sintética conferida');});assert.doesNotMatch(await page.evaluate(()=>JSON.stringify(getChar())),/initiativeRoll|initiativeMode/);
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await init.waitFor();await page.evaluate(()=>{setDiceMode('auto');setRollMode('normal');getChar().heroicInspiration=false;});await roll([3,17],19);
  assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética do modo da iniciativa.');assert.ok((await page.locator('#historyCountBadge').innerText()).split('/').map(Number).every(n=>n<=24));assert.deepEqual(errors,[]);
  console.log('PASS modo da iniciativa: Instinto/Patrulheiro Revisado, cancelamento único com inspiração/modo/condições/armadura, fontes capturadas em Sortudo, bônus e modo global, pool/d20 livre, RNG/permissão, OFF/Só Pool/recuperação, 320px/GG/temas/layouts, notas e offline /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
