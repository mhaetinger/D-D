const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs');
const {makeAuditCharacter:make}=require('../scripts/audit-book-consistency.cjs');
const E=require('../public/rules/character-engine');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  const life=make('clerigo',20,'vida'),sorcerer=make('feiticeiro',18,'draconica');
  sorcerer.rules.history.find(h=>h.level===3).answers.metamagic=['Magia Duplicada','Magia Sutil'];
  life.spells=['cura-completa','cura-completa-em-massa'].map(id=>E.toSheetSpell(E.spell(id),'clerigo',{prepared:true,dmgType:'utilidade',effectSummary:'Instantânea'}));
  life.spells.push(E.toSheetSpell(E.spell('cura-completa'),'clerigo',{prepared:true,dmgType:'utilidade',customRoll:'80',notes:'Fórmula própria preservada.'}));
  sorcerer.spells=['bom-fruto','curar-ferimentos','cura-completa'].map(id=>E.toSheetSpell(E.spell(id),'feiticeiro',{prepared:true,canTwin:true}));
  const notes=JSON.stringify({[life.id]:'Nota da cura, somente local.',[sorcerer.id]:'Nota da outra ficha.'});
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(server.url).origin?route.continue():route.abort());
  await page.addInitScript(({life,sorcerer,notes})=>{
   if(localStorage.getItem('healingSeeded'))return;
   localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[life,sorcerer]}));
   localStorage.setItem('critcall_active_character_v1',life.id);localStorage.setItem('dnd_player_private_notes_v1',notes);localStorage.setItem('healingSeeded','1');
  },{life,sorcerer,notes});
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.evaluate(()=>{setDiceMode('auto');setTab('spells');});
  const badge=i=>page.locator(`[data-spell-effect="${i}"]`);
  for(const i of [0,1])assert.equal(await badge(i).getAttribute('title'),'Cura','a cópia antiga deve usar o tipo atual somente na apresentação');
  assert.equal(await badge(2).getAttribute('title'),'Utilidade','a fórmula própria mantém o tipo salvo');assert.equal((await badge(2).innerText()).trim(),'80');
  assert.deepEqual(await page.evaluate(()=>getChar().spells.slice(0,2).map(s=>s.dmgType)),['utilidade','utilidade']);
  await page.evaluate(()=>setSpellCastLevelByIndex(0,7));assert.match(await badge(0).innerText(),/80 PV \+9 Discípulo/);
  assert.match(await badge(1).innerText(),/Até 700 PV.*11 por criatura/s);
  await page.getByRole('button',{name:'Consultar descrição de Cura Completa',exact:true}).first().click();assert.match(await page.locator('#featureConsultation').innerText(),/Efeito atual: 80 PV \+9/);await page.getByRole('button',{name:'Fechar consulta',exact:true}).click();
  // Cura fixa registra o lançamento, preserva pool/PV e não chama RNG.
  const before=await page.evaluate(()=>{clearDicePool();addDieToPool(12);window.healRandom=Math.random;window.healCalls=0;Math.random=()=>{healCalls++;return .5;};return {hp:getChar().hpCurrent,slot:getChar().standardSlots[7].used,pool:document.getElementById('dicePoolDisplay').textContent,other:JSON.stringify(characters[1])};});
  await page.locator('[data-cast-spell="0"]').click();
  const after=await page.evaluate(()=>({hp:getChar().hpCurrent,slot:getChar().standardSlots[7].used,pool:document.getElementById('dicePoolDisplay').textContent,other:JSON.stringify(characters[1]),calls:healCalls}));
  assert.equal(after.slot,before.slot+1);assert.equal(after.hp,before.hp);assert.equal(after.pool,before.pool);assert.equal(after.other,before.other);assert.equal(after.calls,0);await page.evaluate(()=>{Math.random=healRandom;});
  assert.equal(await page.evaluate(()=>localStorage.getItem('dnd_player_private_notes_v1')),notes);
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:900});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);}, {layout,theme});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,layout+'/'+theme);
   assert.equal(await badge(0).getAttribute('title'),'Cura');
  }
  await page.locator('#charSelect').selectOption('1');await page.evaluate(()=>{setTab('spells');setDiceMode('auto');});
  const twin=i=>page.locator(`[onclick="toggleSpellTwinnedByIndex(${i})"]`);
  assert.equal(await twin(0).count(),0,'Bom Fruto antigo com canTwin salvo não oferece Gêmea');assert.equal(await twin(1).count(),1);assert.equal(await twin(2).count(),1);
  const points=await page.evaluate(()=>getChar().sorceryPoints.current);
  await page.evaluate(()=>toggleSpellTwinnedByIndex(0));await page.locator('[data-cast-spell="0"]').click();assert.equal(await page.evaluate(()=>getChar().sorceryPoints.current),points,'conjurar Bom Fruto não desconta Gêmea indevida');
  // O tipo antigo permanece salvo; recarregar offline conserva a leitura corrigida.
  await page.locator('#charSelect').selectOption('0');await page.evaluate(()=>setTab('spells'));
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>setTab('spells'));
  assert.equal(await badge(0).getAttribute('title'),'Cura');assert.equal(await badge(1).getAttribute('title'),'Cura');
  assert.deepEqual(await page.evaluate(()=>getChar().spells.slice(0,2).map(s=>s.dmgType)),['utilidade','utilidade']);assert.equal(await page.evaluate(()=>localStorage.getItem('dnd_player_private_notes_v1')),notes);assert.deepEqual(errors,[]);
  console.log('PASS curas auditadas: cópias antigas e fórmula própria preservadas, valores fixos/círculo/Vida sem RNG ou PV remoto, consulta, Bom Fruto sem Gêmea/gasto indevido, curas elegíveis, 320px/GG/temas/layouts e recarga offline /D-D/.');
 }finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
