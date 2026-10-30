const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions,settleSheetAppearance}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.id='rally-synthetic';c.name='Mestre de Batalha sintético';c.classes=[{classId:'guerreiro',level:5,subclassId:'mestreBatalha',subclass:'Mestre de Batalha',hitDie:10,hitDiceUsed:0}];
  c.rules={raceId:'humano',history:[{classId:'guerreiro',level:3,answers:{maneuvers:['Inspirar','Aparar','Ataque de Precisão']}},{classId:'guerreiro',level:4,answers:{feat:'Adepto Marcial',featManeuvers:['Inspirar','Derrubar']}}]};
  c.abilities.cha.score=16;c.hpCurrent=20;c.hpMax=80;c.hpTemp=12;c.hpTempSource='Fonte sintética';c.heroicInspiration=true;
  c.ruleState={version:1,used:{},pools:{},active:{},targets:{},conditions:{},inspirationReady:true};
  const other=structuredClone(c);other.id='rally-other';other.name='Aliado sintético';other.hpCurrent=30;
  await page.addInitScript(chars=>{if(localStorage.getItem('rallySeed'))return;localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:chars}));localStorage.setItem('rallySeed','1');},[c,other]);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
  const button=(id='guerreiro:superiority')=>page.locator(`[data-rule-action="rally"][data-resource="${id}"]`).first();
  const output=(id='guerreiro:superiority')=>page.locator(`[data-rally-result="${id}"]`).first();
  const {dialog,accept,cancel}=confirmationActions(page);
  await button().waitFor();await page.evaluate(()=>{setDiceMode('off');setTab('lore');savePrivateNotes('Nota privada sintética de Inspirar.');setTab('main');clearDicePool();addDieToPool(20);addDieToPool(6);setRollMode('adv');Math.random=()=>{throw Error('RNG não autorizado');};});
  const stable=await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().hpMax,getChar().hpTemp,getChar().hpTempSource,getChar().classes,getChar().weapons,getChar().heroicInspiration,getChar().ruleState.inspirationReady,getChar().rules.history,characters[1],readPrivateNotes(getChar().id)]));
  const pool=await page.locator('#dicePoolDisplay').innerText();
  const open=async(id)=>{await button(id).evaluate(e=>e.scrollIntoView({block:'center'}));await button(id).click();await dialog.waitFor({state:'visible'});};
  const ready=async(name='Aliado da mesa')=>{await dialog.locator('[data-rally-ally]').fill(name);await dialog.locator('[data-rally-declared]').check();};
  const physical=async(face=4)=>{await ready();await dialog.locator('[data-health-source]').selectOption('physical');await dialog.locator('[data-health-face]').fill(String(face));};
  const used=async()=>page.evaluate(()=>getChar().ruleState.used['guerreiro:superiority']||0);
  // Sem gasto/aleatoriedade/histórico ao abrir/cancelar ou faltar campo obrigatório.
  const before=await page.evaluate(()=>JSON.stringify(getChar())),history=await page.locator('#historyCountBadge').innerText();
  await open();assert.match(await dialog.innerText(),/Mestre de Batalha · 1d8 \+ CAR.*não se somam.*descanso longo/s);await cancel();
  assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);assert.equal(await page.locator('#historyCountBadge').innerText(),history);
  await open();await accept();assert.equal(await dialog.evaluate(e=>e.open),true);await physical(9);await accept();assert.equal(await dialog.evaluate(e=>e.open),true);assert.equal(await used(),0);await cancel();
  // Face física usa CAR, não modifica a própria vida nem outra ficha. Desfazer só devolve o dado.
  await open();await physical();await accept();assert.equal(await used(),1);assert.match(await output().innerText(),/Aliado da mesa: 7 PV temporários \(4 \+ CAR \+3\).*não somam/);
  assert.equal(await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().hpMax,getChar().hpTemp,getChar().hpTempSource,getChar().classes,getChar().weapons,getChar().heroicInspiration,getChar().ruleState.inspirationReady,getChar().rules.history,characters[1],readPrivateNotes(getChar().id)])),stable);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.ruleAction),'rally');
  await page.evaluate(()=>undoStep());assert.equal(await used(),0);await page.evaluate(()=>redoStep());assert.equal(await used(),1);
  // Talento tem seu d6 e contador; apenas um diálogo/gasto para cliques concorrentes.
  await page.evaluate(()=>{const e=document.querySelector('[data-rule-action="rally"][data-resource="feat:superiority"]');e.click();e.click();});await dialog.waitFor({state:'visible'});assert.match(await dialog.innerText(),/Adepto Marcial · 1d6/);await physical(6);await accept();
  assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),1);assert.equal(await button('feat:superiority').isDisabled(),true);assert.match(await output('feat:superiority').innerText(),/9 PV temporários/);
  // Auto e Só Pool podem rolar um único dado normal, sem consumir inspiração ou alterar pool/modo.
  for(const mode of ['auto','manual']){
   await page.evaluate(mode=>{setDiceMode(mode);window.rallyCalls=0;Math.random=()=>{window.rallyCalls++;return (3-.5)/8;};},mode);
   await open();await ready();await dialog.locator('[data-health-source]').selectOption('virtual');await accept();assert.equal(await page.evaluate(()=>window.rallyCalls),1);assert.match(await output().innerText(),/6 PV temporários/);
   assert.equal(await page.locator('#dicePoolDisplay').innerText(),pool);assert.equal(await page.evaluate(()=>ruleDiceSettings().mode),'adv');assert.equal(await page.evaluate(()=>getChar().heroicInspiration&&getChar().ruleState.inspirationReady),true);
  }
  // A lista de condições conserva os próprios nós mesmo após gastar; o recurso esgota sem exceder máximo.
  const condition=page.locator('[data-rule-condition="envenenado"]');await condition.evaluate(e=>window.rallyCondition=e);
  await page.evaluate(()=>setDiceMode('off'));await condition.evaluate(e=>window.rallyCondition=e);await open();await physical();await accept();assert.equal(await used(),4);assert.equal(await button().isDisabled(),true);assert.equal(await condition.evaluate(e=>e===window.rallyCondition),true);
  await page.evaluate(()=>{getChar().ruleState.used={};recordStepAndSave('Reserva sintética restaurada');window.rallyBaseline=structuredClone(getChar());});
  const reset=async()=>page.evaluate(()=>{Object.assign(getChar(),structuredClone(window.rallyBaseline));setDiceMode('auto');recordStepAndSave('Contexto sintético de Inspirar');window.rallyCalls=0;Math.random=()=>{window.rallyCalls++;throw Error('RNG proibido em escolha inválida');};});
  // Contexto e permissão são revalidados antes do RNG/gasto; nenhum alvo recebe alterações.
  for(const change of ['hp','charisma','subclass','level','knowledge','counter','source','condition','permission','render','character','dice']){
   await reset();await open();await ready();
   await page.evaluate(change=>{const c=getChar();if(change==='hp')c.hpCurrent=19;if(change==='charisma')c.abilities.cha.score=18;if(change==='subclass')c.classes[0].subclassId='campeao';if(change==='level')c.classes[0].level=2;if(change==='knowledge')c.rules.history=[];if(change==='counter')c.ruleState.used['guerreiro:superiority']=4;if(change==='source')document.querySelector('[data-rule-action="rally"][data-resource="guerreiro:superiority"]').dataset.resource='feat:superiority';if(change==='condition')c.ruleState.conditions.incapacitado=true;if(change==='permission')CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false}));if(change==='render')setTab('main');if(change==='character')switchCharacter(1);if(change==='dice')setDiceMode('off');},change);
   const altered=await page.evaluate(()=>JSON.stringify(characters));await accept();assert.equal(await page.evaluate(()=>JSON.stringify(characters)),altered);assert.equal(await page.evaluate(()=>window.rallyCalls),0);
   if(change==='permission')await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'personal'})));if(change==='character')await page.evaluate(()=>switchCharacter(0));
  }
  await reset();await open();await ready('   ');await accept();assert.equal(await page.evaluate(()=>window.rallyCalls),0);assert.equal(await used(),0);
  await reset();await open();await ready();await cancel();assert.equal(await page.evaluate(()=>window.rallyCalls),0);
  await reset();const accountBefore=await page.evaluate(()=>JSON.stringify(getChar()));await open();await ready();await page.evaluate(()=>activateAccountWorkspace({project:'critcall-rally-test',userId:'conta-sintetica'}));await dialog.waitFor({state:'hidden'});await page.evaluate(()=>activateAccountWorkspace(null));assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),accountBefore);
  // Formulário compacto em 320px/GG, seis apresentações, nós/foco, scroll contido e texto não confiável.
  await page.evaluate(()=>{setDiceMode('off');});
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});await settleSheetAppearance(page);await open();
   await dialog.locator('[data-rally-ally]').fill('<img src=x onerror=alert(1)>');await dialog.locator('[data-rally-ally]').evaluate(e=>window.rallyName=e);await dialog.locator('[data-health-source]').selectOption('physical');
   await dialog.locator('[data-rally-ally]').focus();assert.equal(await dialog.locator('[data-rally-ally]').evaluate(e=>e===window.rallyName&&e===document.activeElement),true);
   assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   // Mudanças de altura atrás do diálogo (fonte GG, renderização de outro painel)
   // também não podem reposicionar a página pela ancoragem automática do navegador.
   await page.evaluate(()=>{const probe=document.createElement('div');probe.id='rallyScrollProbe';document.getElementById('sheetApp').prepend(probe);});
   const anchored=await page.evaluate(()=>scrollY);
   await page.evaluate(async()=>{document.getElementById('rallyScrollProbe').style.height='97px';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   assert.equal(await page.evaluate(()=>scrollY),anchored,'altura da página atrás do diálogo não muda sua posição');
   const y=await page.evaluate(()=>scrollY);await dialog.hover();await page.mouse.wheel(0,400);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>scrollY),y);
   if(layout==='classic_2014'&&theme==='pergaminho_claro')await dialog.screenshot({path:'/tmp/critcall-inspirar-mobile.png'});await cancel();
   await page.evaluate(()=>document.getElementById('rallyScrollProbe').remove());
  }
  await open();await physical(4);await dialog.locator('[data-rally-ally]').fill('<img src=x onerror=alert(1)>');await accept();assert.equal(await output().locator('img').count(),0);assert.match(await output().innerText(),/<img src=x onerror=alert\(1\)>: 7/);
  await open();await physical(4);await dialog.locator('[data-rally-ally]').fill('A'.repeat(80));await accept();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.evaluate(()=>undoStep());
  // Recarga offline conserva gasto/notas; somente o talento permanece depois de trocar a subclasse.
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await button().waitFor();assert.equal(await used(),1);
  await page.evaluate(()=>{getChar().classes[0].subclassId='campeao';recordStepAndSave('Subclasse sintética alterada');});assert.equal(await button().count(),0);await open('feat:superiority');await physical(5);await accept();assert.equal(await page.evaluate(()=>getChar().ruleState.used['feat:superiority']),1);
  assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota privada sintética de Inspirar.');assert.ok((await page.locator('#historyCountBadge').innerText()).split('/').map(Number).every(n=>n<=24));assert.deepEqual(errors,[]);
  console.log('PASS Inspirar: conhecimento/origens/dados/CAR, ação/aliado na mesa, físico/virtual/OFF/Só Pool/Auto, cancelamento/validação/concorrência antes do RNG, ficha/conta/permissão, gasto/desfazer/sem alterar PV próprios ou aliados, pool/inspiração, nós/foco/scroll, 320px/GG/temas/layouts, texto não confiável, notas/histórico e offline /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
