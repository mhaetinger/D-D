const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs'),E=require('../public/rules/character-engine');
(async()=>{
  const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
  try{
    const c=warrior();c.id='adept-fixture';c.name='Adepto sintético';c.armorEquipped=null;c.shieldEquipped=false;
    c.classes=[{classId:'feiticeiro',level:12,subclassId:'draconica',subclass:'Linhagem Dracônica',hitDie:6,hitDiceUsed:0}];
    c.abilities.cha.score=16;c.hpMax=80;c.hpCurrent=51;c.hpTemp=7;c.sorceryPoints={current:12,max:12};
    c.standardSlots=Object.fromEntries([1,2,3,4,5].map(n=>[n,{total:4,used:0}]));
    c.rules={raceId:'humano',history:[{classId:'feiticeiro',level:1,answers:{dragon:'Vermelho — fogo'}},
      {classId:'feiticeiro',level:3,answers:{metamagic:['Magia Duplicada','Magia Sutil']}},
      {classId:'feiticeiro',level:4,answers:{feat:'Adepto Elemental',featElement:'Fogo'}},
      {classId:'feiticeiro',level:8,answers:{feat:'Adepto Elemental',featElement:'Frio'}}]};
    c.ruleState={version:1,used:{},active:{},pools:{},targets:{},portent:[],inspirationReady:true};c.heroicInspiration=true;
    c.spells=['raio-de-fogo','raio-ardente','bola-de-fogo','tempestade-de-gelo','coluna-de-chamas',
      'misseis-magicos','curar-ferimentos','orbe-cromatica'].map(id=>E.toSheetSpell(E.spell(id),'feiticeiro',{prepared:true}));
    c.spells.push(E.toSheetSpell(E.spell('raio-de-fogo'),'feiticeiro',{customRoll:'2d4+2',notes:'Fórmula própria preservada.'}));
    c.spells.push(E.toSheetSpell(E.spell('maos-flamejantes'),'feiticeiro',{limitedUse:1,usesUsed:0,extraSource:'Habilidade sintética'}));
    const other=structuredClone(c);other.id='adept-other';other.name='Outra ficha sintética';other.rules.history=[];
    const context=await browser.newContext({viewport:{width:1440,height:1050},hasTouch:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    await page.addInitScript(({c,other})=>{if(localStorage.getItem('adeptSeeded'))return;
      localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c,other]}));
      localStorage.setItem('critcall_active_character_v1',c.id);localStorage.setItem('adeptSeeded','1');
    },{c,other});
    await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
    await page.evaluate(()=>{setTab('lore');savePrivateNotes('Nota privada sintética de Adepto.');setTab('spells');setDiceMode('auto');setRollMode('dis');clearDicePool();addDieToPool(12);window.adeptCalls=0;window.adeptRandom=Math.random;Math.random=()=>{window.adeptCalls++;return 0;};});
    const {dialog,accept,cancel}=confirmationActions(page),badge=i=>page.locator(`[data-spell-effect="${i}"]`),cast=i=>page.locator(`[data-cast-spell="${i}"]`);
    const done=()=>page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));
    const total=()=>page.locator('#diceDockValue').innerText(),text=()=>page.locator('#dice3dResultText').innerText();
    const stable=await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().hpTemp,getChar().rules.history,characters[1],readPrivateNotes(getChar().id)]));
    const resetCalls=()=>page.evaluate(()=>{window.adeptCalls=0;});
    // Prévia e consulta não rolam; o livro explica resistência/imunidade e OFF.
    assert.match(await badge(0).innerText(),/Adepto: 1→2/);
    await page.getByRole('button',{name:'Consultar descrição de Raio de Fogo',exact:true}).first().click();
    const pop=page.locator('#featureConsultation');assert.match(await pop.innerText(),/ignora resistência.*sem ignorar imunidade/);assert.match(await pop.innerText(),/OFF/);
    await pop.getByRole('button',{name:'Fechar consulta'}).click();assert.equal(await page.evaluate(()=>window.adeptCalls),0);
    // Dano nunca usa vantagem/inspiração: três d10 originais 1 + CAR 3 + mínimo 3 = 9.
    await cast(0).click();await done();assert.equal(await total(),'9');assert.equal(await page.evaluate(()=>window.adeptCalls),3);
    assert.match(await text(),/3d10\[1\+1\+1\]/);assert.match(await text(),/3 dado\(s\).*\(\+3\)/);assert.match(await text(),/sem ignorar imunidade/);
    assert.equal(await page.evaluate(()=>getChar().heroicInspiration && getChar().ruleState.inspirationReady),true);
    assert.equal(await page.locator('#rollMode-dis').getAttribute('aria-pressed'),'true');
    // Gêmea aumenta dados, não reaplica o mínimo por alvo ou por talento.
    await page.evaluate(()=>toggleSpellTwinnedByIndex(0));await resetCalls();await cast(0).click();await done();
    assert.equal(await total(),'15');assert.equal(await page.evaluate(()=>window.adeptCalls),6);assert.equal(await page.evaluate(()=>getChar().sorceryPoints.current),11);
    await page.evaluate(()=>toggleSpellTwinnedByIndex(0));
    // Raio posterior mantém o mínimo, sem nova Afinidade ou espaço.
    await resetCalls();await cast(1).click();await done();assert.equal(await total(),'7');
    const afterFirstRay=await page.evaluate(()=>JSON.stringify(getChar()));await page.locator('[data-spell-ray="1"]').click();await done();
    assert.equal(await total(),'4');assert.equal(await page.evaluate(()=>window.adeptCalls),4);assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),afterFirstRay);
    // Espaço escolhido e composição de tipos usam os mesmos dados da prévia.
    await page.locator('[data-spell-slot="2"]').selectOption('5');await resetCalls();await cast(2).click();await done();
    assert.equal(await total(),'23');assert.equal(await page.evaluate(()=>window.adeptCalls),10);assert.equal(await page.evaluate(()=>getChar().standardSlots[5].used),1);
    await resetCalls();await cast(3).click();await done();assert.equal(await total(),'12');assert.equal(await page.evaluate(()=>window.adeptCalls),6);
    assert.match(await text(),/Concussão: 2d8 = 4/);assert.match(await text(),/Frio: 4d6 = 8/);assert.match(await text(),/ignora resistência a Frio/);
    // Manual, cura, elemento sem escolha e pool livre conservam seus contratos.
    await resetCalls();await cast(8).click();await done();assert.equal(await total(),'4');assert.equal(await page.evaluate(()=>window.adeptCalls),2);assert.doesNotMatch(await text(),/Adepto Elemental/);
    await cast(6).click();await done();assert.doesNotMatch(await text(),/Adepto Elemental/);
    assert.match(await badge(7).innerText(),/conferir na mesa/);await cast(7).click();await done();assert.doesNotMatch(await text(),/Adepto Elemental/);
    await page.evaluate(()=>{clearDicePool();addDieToPool(6);});await resetCalls();await page.evaluate(()=>rollCurrentPool('Pool livre sintético'));await done();assert.equal(await total(),'1');assert.doesNotMatch(await text(),/Adepto Elemental/);
    // OFF: gasto único e orientação para dados físicos; nenhuma face virtual.
    await page.evaluate(()=>setDiceMode('off'));await resetCalls();await cast(9).click();
    assert.equal(await page.evaluate(()=>window.adeptCalls),0);assert.equal(await page.evaluate(()=>getChar().spells[9].usesUsed),1);
    assert.match(await page.locator('#toast').innerText(),/OFF: resolva os dados físicos/);
    // Só Pool bloqueia conjuração/raio sem gasto, estado, histórico ou RNG.
    await page.evaluate(()=>{setDiceMode('manual');clearDicePool();addDieToPool(12);});
    const poolState=await page.evaluate(()=>JSON.stringify([getChar(),document.getElementById('historyCountBadge').textContent,document.getElementById('dicePoolDisplay').textContent]));
    await page.evaluate(()=>{castSpellByIndex(0);rollSpellRay(1);});assert.equal(await page.evaluate(()=>JSON.stringify([getChar(),document.getElementById('historyCountBadge').textContent,document.getElementById('dicePoolDisplay').textContent])),poolState);assert.equal(await page.evaluate(()=>window.adeptCalls),0);
    // Cancelar uma troca de concentração não cobra espaço nem rola.
    await page.evaluate(()=>{setDiceMode('auto');getChar().spells.push(CharacterEngine.toSheetSpell(CharacterEngine.spell('esfera-flamejante'),'feiticeiro'));getChar().ruleState.concentration={version:1,id:'prior',name:'Efeito anterior',duration:'1 hora',spellKey:'synthetic',school:'',checks:[]};renderAll();});
    const beforeCancel=await page.evaluate(()=>JSON.stringify(getChar()));await cast(10).click();await dialog.waitFor({state:'visible'});await cancel();
    assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),beforeCancel);assert.equal(await page.evaluate(()=>window.adeptCalls),0);
    assert.equal(await page.evaluate(()=>JSON.stringify([getChar().hpCurrent,getChar().hpTemp,getChar().rules.history,characters[1],readPrivateNotes(getChar().id)])),stable);
    // Outra ficha não recebe o talento; restaurar a origem não duplica nada.
    await page.locator('#charSelect').selectOption('1');await page.evaluate(()=>setTab('spells'));assert.doesNotMatch(await badge(0).innerText(),/Adepto/);
    await page.locator('#charSelect').selectOption('0');await page.evaluate(()=>setTab('spells'));
    for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
      await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.equal(await page.locator('[data-spell-card="0"]').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
      await page.getByRole('button',{name:'Consultar descrição de Raio de Fogo',exact:true}).first().tap();assert.equal(await pop.evaluate(e=>e.scrollWidth<=e.clientWidth),true);
      await pop.getByRole('button',{name:'Fechar consulta'}).click();
    }
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'2. Grimório & Feitiçaria',exact:true}).click();assert.match(await badge(0).innerText(),/Adepto: 1→2/);
    await page.evaluate(()=>{window.adeptCalls=0;Math.random=()=>{window.adeptCalls++;return 0;};setDiceMode('auto');});await cast(0).click();await done();assert.equal(await total(),'9');
    assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota privada sintética de Adepto.');assert.equal(await page.evaluate(()=>getChar().spells[8].customRoll),'2d4+2');assert.deepEqual(errors,[]);
    console.log('PASS Adepto Elemental: prévia/livro, faces originais e mínimo sem RNG extra, Gêmea/nível/raios, Afinidade uma vez, composição/resistência por tipo, manual/cura/pool/OFF/Só Pool, cancelamento/gastos, fichas/notas, 320px/GG/temas/layouts e offline /D-D/.');
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
