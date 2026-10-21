const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const E=require('../public/rules/character-engine'),{confirmationActions}=require('./confirmation.cjs');
(async()=>{
  const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    const c=warrior();c.name='Magias sintéticas';c.armorEquipped=null;c.shieldEquipped=false;c.hpCurrent=c.hpMax=100;
    c.classes=[{classId:'feiticeiro',level:3,subclassId:'selvagem',subclass:'Magia Selvagem',hitDie:6,hitDiceUsed:0},{classId:'mago',level:3,subclassId:'abjuracao',subclass:'Escola de Abjuração',hitDie:6,hitDiceUsed:0},{classId:'bruxo',level:1,subclassId:'corruptor',subclass:'O Corruptor',hitDie:8,hitDiceUsed:0}];
    c.abilities.cha.score=18;c.abilities.int.score=16;c.abilities.wis.score=12;c.standardSlots={1:{total:4,used:0},2:{total:3,used:0},3:{total:2,used:0}};c.pactMagic={level:1,total:1,used:0};c.sorceryPoints={max:3,current:3};
    c.rules={raceId:'humano',legacy:false,history:[{classId:'feiticeiro',level:3,answers:{metamagic:['Magia Duplicada','Magia Acelerada']}}]};c.ruleState={version:1,active:{},used:{},pools:{},targets:{},portent:[],inspirationReady:true};c.heroicInspiration=true;
    c.spells=[['raio-de-fogo','feiticeiro'],['toque-arrepiante','mago'],['maos-flamejantes','mago'],['misseis-magicos','mago'],['raio-ardente','mago'],['rajada-mistica','bruxo'],['detectar-magia','mago'],['armadura-arcana','mago'],['repreensao-infernal','feiticeiro'],['orbe-cromatica','feiticeiro']].map(([id,cls])=>E.toSheetSpell(E.spell(id),cls,{prepared:true}));
    Object.assign(c.spells[8],{limitedUse:1,usesUsed:0,extraSource:'Habilidade sintética'});
    c.spells.push({...c.spells[0],name:'Ataque personalizado',bookId:undefined,castingAbility:'wis',customRoll:'1d6',defType:'atq_magico',dmgType:'energia'});
    await page.addInitScript(c=>{if(!localStorage.getItem('spellAttackSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('spellAttackSeeded','1');}},c);
    await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
    await page.evaluate(()=>{setDiceMode('off');setTab('lore');savePrivateNotes('Nota sintética de magias.');setTab('spells');castSpellByIndex(6);toggleSpellTwinnedByIndex(0);clearDicePool();addDieToPool(12);setRollMode('adv');setDiceMode('manual');window.spellRandomCalls=0;window.spellFaces=[];Math.random=()=>{window.spellRandomCalls++;return ((window.spellFaces.shift() ?? 10)-.5)/20;};});
    const {dialog,accept}=confirmationActions(page);
    const snapshot=()=>page.evaluate(()=>JSON.stringify({char:getChar(),history:document.getElementById('historyCountBadge').textContent,pool:document.getElementById('dicePoolDisplay').textContent,result:document.getElementById('dice3dResultText').textContent}));
    // Só Pool bloqueia antes de espaços, usos, Gêmea, concentração, passivos e
    // histórico. Também vale para chamadas antigas/diretas da ponte global.
    const manualBefore=await snapshot(),rolls=await page.evaluate(()=>window.spellRandomCalls);
    assert.equal(await page.locator('[data-cast-spell="0"]').isDisabled(),true);assert.equal(await page.locator('[data-cast-ritual="6"]').isDisabled(),true);assert.equal(await page.locator('[data-spell-attack="0"]').isDisabled(),true);
    await page.evaluate(()=>{getChar().spells.forEach((s,i)=>{castSpellByIndex(i);castSpellWithUpcast(s.name,s.circle,s.classId,i);rollSpellAttack(i);});castRitualByIndex(6);rollSpellRay(4);});
    assert.equal(await snapshot(),manualBefore);assert.equal(await page.evaluate(()=>window.spellRandomCalls),rolls);assert.equal(await dialog.evaluate(e=>e.open),false);
    // Só ataques mágicos, com a habilidade da origem correta e sem repetir o
    // antigo selo estático. Salvaguardas e acerto automático não ganham d20.
    await page.evaluate(()=>{setDiceMode('auto');getChar().heroicInspiration=false;getChar().ruleState.inspirationReady=false;toggleSpellTwinnedByIndex(0);recordStepAndSave('Ataques sintéticos sem inspiração');});
    for(const i of [0,1,4,5,9,10])assert.equal(await page.locator(`[data-spell-attack="${i}"]`).count(),1);
    for(const i of [2,3,6,7,8])assert.equal(await page.locator(`[data-spell-attack="${i}"]`).count(),0);
    assert.equal(await page.locator('[data-spell-attack="0"]').textContent(),'Atq +7');assert.equal(await page.locator('[data-spell-attack="1"]').textContent(),'Atq +6');assert.equal(await page.locator('[data-spell-attack="10"]').textContent(),'Atq +4');
    assert.equal(await page.locator('[data-spell-card="0"]').getByText('Ataque +7 contra CA',{exact:true}).count(),0);
    const beforeAttack=await page.evaluate(()=>JSON.stringify(getChar()));await page.evaluate(()=>{window.spellFaces=[1,20];});await page.locator('[data-spell-attack="0"]').click();await page.waitForFunction(()=>document.getElementById('dice3dResultText').textContent.includes('Ataque: Raio de Fogo'));
    assert.equal(await page.locator('#diceDockValue').textContent(),'27');assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),beforeAttack);
    const roll=async(i,faces,mode='normal')=>page.evaluate(({i,faces,mode})=>{window.spellFaces=faces;setRollMode(mode);return rollSpellAttack(i);},{i,faces,mode});
    assert.equal((await roll(1,[20,1],'dis')).total,7);assert.equal((await roll(10,[10])).total,14);
    const noAttack=await page.evaluate(()=>window.spellRandomCalls);assert.equal(await roll(2,[20]),undefined);assert.equal(await roll(3,[20]),undefined);assert.equal(await page.evaluate(()=>window.spellRandomCalls),noAttack);
    // Repetir ataques dos raios não lança de novo nem gasta espaços/pontos.
    await page.evaluate(()=>castSpellByIndex(4));assert.equal(await page.evaluate(()=>getChar().standardSlots[2].used),1);const rayState=await page.evaluate(()=>JSON.stringify(getChar()));await roll(4,[12]);await roll(4,[11]);assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),rayState);
    // Filtrar a classe preserva o índice original e o bônus correspondente.
    await page.evaluate(()=>setSpellClassFilter('mago'));assert.equal(await page.locator('[data-spell-attack="0"]').count(),0);assert.equal(await page.locator('[data-spell-attack="1"]').textContent(),'Atq +6');await page.evaluate(()=>{window.spellFaces=[10];});await page.locator('[data-spell-attack="1"]').click();await page.waitForFunction(()=>document.getElementById('dice3dResultText').textContent.includes('Ataque: Toque Arrepiante'));assert.equal(await page.locator('#diceDockValue').textContent(),'16');await page.evaluate(()=>setSpellClassFilter('all'));
    // Inspiração só é consumida no d20, inclusive após renderizar a ficha.
    await page.evaluate(()=>{getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;});const inspired=await roll(0,[20],'dis');assert.equal(inspired.appliedMode,'normal');assert.equal(inspired.total,27);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);
    // Uma troca de concentração pendente não pode conjurar depois de mudar
    // para Só Pool. A guarda também precisa existir na continuação assíncrona.
    await page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));await page.evaluate(()=>{getChar().spells.push({...getChar().spells[6],name:'Invisibilidade',bookId:'invisibilidade',circle:2,ritualAvailable:false});recordStepAndSave('Concentração sintética');castSpellByIndex(11);});await dialog.waitFor({state:'visible'});await page.evaluate(()=>setDiceMode('manual'));const pending=await snapshot();await accept();assert.equal(await snapshot(),pending);
    // OFF conserva o lançamento físico explícito, sem d20 virtual.
    await page.evaluate(()=>setDiceMode('off'));const offRolls=await page.evaluate(()=>window.spellRandomCalls);await page.evaluate(()=>{rollSpellAttack(0);castSpellByIndex(7);});assert.equal(await page.evaluate(()=>getChar().mageArmorActive),true);assert.equal(await page.evaluate(()=>window.spellRandomCalls),offRolls);
    // Os mesmos controles cabem nos dois layouts, três temas e fonte GG.
    for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
      await page.setViewportSize({width:320,height:900});await page.evaluate(({layout,theme})=>{setDiceMode('auto');setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});await page.locator('[data-spell-attack="0"]').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('[data-spell-card="0"]').evaluate(e=>e.scrollWidth>e.clientWidth),false);
    }
    await page.locator('[data-spell-card="0"]').evaluate(e=>e.scrollIntoView({block:'center'}));await page.locator('[data-spell-card="0"]').screenshot({path:'/tmp/critcall-spell-attack-mobile.png'});await page.setViewportSize({width:1440,height:1050});await page.evaluate(()=>{setFontScale(100);setTheme('pergaminho_claro');setLayout('classic_2014');});await page.locator('[data-spell-card="0"]').screenshot({path:'/tmp/critcall-spell-attack-desktop.png'});
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof rollSpellAttack==='function' && !document.getElementById('sheetApp').hidden);await page.evaluate(()=>{setTab('spells');setDiceMode('manual');});const offlineBefore=await snapshot();await page.evaluate(()=>{castSpellByIndex(0);castRitualByIndex(6);rollSpellAttack(0);});assert.equal(await snapshot(),offlineBefore);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética de magias.');
    assert.deepEqual(errors,[]);console.log('PASS magias: Só Pool sem efeitos/gastos/histórico, guarda após confirmação, ataque por magia/classe/habilidade, salvaguarda/automático sem d20, vantagem/inspiração, repetições/filtro, OFF físico e offline/layouts/temas/320px/GG.');
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
