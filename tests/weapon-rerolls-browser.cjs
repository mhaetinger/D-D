const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error('pageerror:',e.message);});
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.id='reroll-fixture';c.shieldEquipped=false;c.classes=[{classId:'paladino',level:11,subclassId:'devocao',subclass:'Devoção',hitDie:10,hitDiceUsed:0},{classId:'guerreiro',level:4,subclassId:'campeao',subclass:'Campeão',hitDie:10,hitDiceUsed:0}];
  c.rules.history=[{classId:'paladino',level:2,answers:{fighting:'Combate com Armas Grandes'}},{classId:'guerreiro',level:4,answers:{feat:'Atacante Bestial'}}];
  c.abilities.str.score=18;c.hpMax=100;c.hpCurrent=91;c.standardSlots={1:{total:2,used:0}};
  c.ruleState={version:1,used:{},active:{},pools:{},targets:{},portent:[]};
  c.weapons=[{name:'Espada Grande'},{name:'Rapieira'},{name:'Arco Longo'},{name:'Rapieira',calculationMode:'manual',bonus:'+5',damage:'1d8+4'}].map(w=>({bonus:'+0',damage:'0',notes:'',...w}));
  const other=structuredClone(c);other.id='reroll-other';other.name='Outra ficha sintética';other.hpCurrent=75;
  await page.addInitScript(({c,other})=>{if(!localStorage.getItem('rerollSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c,other]}));localStorage.setItem('rerollSeeded','1');}},{c,other});
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
  await page.evaluate(()=>setTab('main'));await page.locator('[data-weapon-damage-label="0"]').waitFor();
  await page.evaluate(()=>{setDiceMode('auto');clearDicePool();addDieToPool(12);setRollMode('dis');getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;setTab('lore');savePrivateNotes('Nota privada sintética de rerrolagens.');setTab('main');window.rerollOriginalRandom=Math.random;});
  const {dialog,accept,cancel}=confirmationActions(page),damage=i=>page.locator(`[data-weapon-damage-label="${i}"]`).click(),extra=i=>page.locator(`[data-rule-weapon-damage="${i}"]`).click();
  const random=value=>page.evaluate(value=>{window.rerollCalls=0;Math.random=()=>{window.rerollCalls++;return value;};},value);
  const choose=i=>dialog.locator(`[data-weapon-set-choice="${i}"]`),repeat=(set,n)=>dialog.locator(`[data-weapon-repeat-die="${set}:${n}"]`),total=()=>dialog.locator('[data-weapon-reroll-total]').innerText();
  const waitRoll=()=>dialog.locator('[data-weapon-reroll-total]').waitFor(),finish=()=>accept(),later=()=>dialog.getByRole('button',{name:'Retomar depois',exact:true}).click();
  const base=await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().weapons,characters[1],readPrivateNotes(getChar().id)])),pool=await page.locator('#dicePoolDisplay').innerText();
  // Um acerto crítico com Destruição: prévia/cancelamento não rolam nem gastam.
  await page.locator('[data-weapon-critical-toggle="0"]').check();await random(0);await extra(0);await dialog.locator('[data-weapon-smite]').selectOption('slot:1');await cancel();assert.equal(await page.evaluate(()=>window.rerollCalls),0);assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),0);
  await extra(0);await dialog.locator('[data-weapon-smite]').selectOption('slot:1');await accept();await waitRoll();assert.match(await total(),/14/);assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1);assert.equal(await page.evaluate(()=>window.rerollCalls),10);
  // Cada dado do estilo aceita uma repetição; nova face 2 é mantida.
  await random(.2);await repeat(0,0).click();assert.match(await total(),/15/);assert.equal(await repeat(0,0).isDisabled(),true);assert.equal(await repeat(0,1).isDisabled(),false);assert.equal(await page.evaluate(()=>window.rerollCalls),1);
  await later();await page.waitForFunction(()=>!document.getElementById('confirmationDialog').open);await damage(0);await waitRoll();assert.match(await total(),/15/);assert.equal(await page.evaluate(()=>window.rerollCalls),1);assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1);
  // Bestial lança quatro d6 do crítico; os seis d8 de adicionais não mudam.
  assert.equal(await dialog.locator('[data-weapon-savage-reroll]').isDisabled(),true);await dialog.locator('[data-weapon-savage-available]').check();await random(.999);await dialog.locator('[data-weapon-savage-reroll]').click();assert.equal(await page.evaluate(()=>window.rerollCalls),4);assert.match(await total(),/34/);
  assert.equal(await dialog.locator('[data-weapon-savage-reroll]').isDisabled(),true);await choose(0).evaluate(e=>window.rerollChoice=e);await choose(0).check();assert.match(await total(),/15/);assert.equal(await choose(0).evaluate(e=>e===window.rerollChoice && e===document.activeElement),true);await choose(1).check();assert.match(await total(),/34/);assert.equal(await page.evaluate(()=>window.rerollCalls),4);
  assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1);await finish();assert.equal(await page.locator('[data-weapon-critical-toggle="0"]').isChecked(),false);assert.equal(await page.locator('#dicePoolDisplay').innerText(),pool);assert.equal(await page.evaluate(()=>getChar().ruleState.inspirationReady),true);
  assert.equal(await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().weapons,characters[1],readPrivateNotes(getChar().id)])),base);
  // Rapieira só oferece Bestial. Dois conjuntos [1] e [8], sem estilo nem RNG ao escolher.
  await random(0);await damage(1);await waitRoll();assert.equal(await repeat(0,0).isVisible(),false);await dialog.locator('[data-weapon-savage-available]').check();await random(.999);await dialog.locator('[data-weapon-savage-reroll]').click();assert.equal(await page.evaluate(()=>window.rerollCalls),1);await choose(0).check();assert.equal(await page.evaluate(()=>window.rerollCalls),1);await finish();
  // Nenhuma mudança no fluxo de arma à distância ou fórmula manual.
  await random(0);await damage(2);assert.equal(await dialog.evaluate(e=>e.open),false);await damage(3);assert.equal(await dialog.evaluate(e=>e.open),false);
  // Só o estilo, sem dados baixos: não abre um diálogo sem escolhas úteis.
  await page.evaluate(()=>{window.rerollHistory=getChar().rules.history;getChar().rules.history=getChar().rules.history.filter(h=>h.answers.feat!=='Atacante Bestial');});await random(.999);await damage(0);assert.equal(await dialog.evaluate(e=>e.open),false);await page.evaluate(()=>{getChar().rules.history=window.rerollHistory;});
  // OFF/Só Pool: total físico final, sem novas faces nem uso virtual do talento.
  for(const mode of ['off','manual']){await page.evaluate(mode=>setDiceMode(mode),mode);await random(0);await damage(0);assert.equal(await dialog.locator('[data-weapon-reroll-total]').count(),0);await dialog.locator('[data-weapon-total]').fill('27');await accept();assert.equal(await page.evaluate(()=>window.rerollCalls),0);assert.match(await page.locator('#toast').innerText(),/27/);}
  await page.evaluate(()=>setDiceMode('auto'));
  // Uma jogada nova invalida a repetição anterior antes do RNG.
  await random(0);await damage(0);await waitRoll();await page.evaluate(()=>rollQuickD20());const calls=await page.evaluate(()=>window.rerollCalls);await repeat(0,0).click();assert.equal(await page.evaluate(()=>window.rerollCalls),calls);assert.match(await dialog.locator('[data-window-notice]').innerText(),/jogada mudou/);await later();await page.waitForFunction(()=>!document.getElementById('confirmationDialog').open);
  // Alteração de ficha e bloqueio de permissão também invalidam o dano antigo.
  for(const action of ['document','permission','character']){
   await random(0);await damage(0);await waitRoll();
   await page.evaluate(action=>{if(action==='document')getChar().hpCurrent--;else if(action==='permission')CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));else switchCharacter(1);},action);
   const calls=await page.evaluate(()=>window.rerollCalls);await repeat(0,0).click();assert.equal(await page.evaluate(()=>window.rerollCalls),calls);await later();await page.waitForFunction(()=>!document.getElementById('confirmationDialog').open);
   await page.evaluate(action=>{if(action==='permission')CritCallSheetAccess.setProvider(()=>({kind:'personal'}));if(action==='character')switchCharacter(0);},action);
  }
  // Celular/GG/temas/layouts: nós/foco e rolagem contida no diálogo.
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});await random(0);await damage(0);await waitRoll();
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await dialog.locator('[data-weapon-savage-available]').check();await dialog.locator('[data-weapon-savage-reroll]').click();await choose(0).evaluate(e=>window.rerollChoice=e);await choose(0).check();assert.equal(await choose(0).evaluate(e=>e===window.rerollChoice && e===document.activeElement),true);
   const y=await page.evaluate(()=>scrollY);await dialog.hover();await page.mouse.wheel(0,650);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>scrollY),y);
   if(layout==='classic_2014' && theme==='pergaminho_claro')await dialog.screenshot({path:'/tmp/critcall-rerrolagens-mobile.png'});await finish();
  }
  // Offline conserva custos/notas/25 registros; a sessão transitória não concede restauração de espaços.
  assert.ok((await page.locator('#historyCountBadge').innerText()).split('/').map(Number).every(n=>n<=24),'histórico permanece limitado a 25 registros');
  await extra(0);await dialog.locator('[data-weapon-smite]').selectOption('slot:1');await accept();await waitRoll();await later();await page.waitForFunction(()=>!document.getElementById('confirmationDialog').open);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-weapon-damage-label="0"]').waitFor();assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),2);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota privada sintética de rerrolagens.');assert.equal(await page.evaluate(()=>characters[1].hpCurrent),75);
  await page.evaluate(()=>{setDiceMode('off');Math.random=()=>{throw Error('RNG proibido em OFF');};});await damage(0);await dialog.locator('[data-weapon-total]').fill('12');await accept();assert.match(await page.locator('#toast').innerText(),/12/);
  assert.deepEqual(errors,[]);console.log('PASS rerrolagens: estilo por dado/face obrigatória, Bestial por conjunto/turno declarado, crítico/adicionais, gasto único, retomar/concorrência/permissão, físico/OFF/Só Pool, pool/inspiração/notas/outra ficha, mobile/GG/temas/layouts e offline.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
