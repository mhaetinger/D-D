const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{create,choose}=require('./character-choices.cjs'),{confirmationActions}=require('./confirmation.cjs');
const E=require('../public/rules/character-engine');
const advance=(c,answers={})=>{const d=E.context({},{},c,'bruxo');choose(d,'corruptor',answers);return E.levelUp(c,'bruxo',d.answers);};
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try{
  let c=create('bruxo','corruptor');for(let n=2;n<=7;n++)c=advance(c,n===2?{invocations:['Armadura de Sombras','Vigor Abissal']}:n===5?{invocations:['Sinal de Mau Agouro']}:n===7?{invocations:['Escultor de Carne']}:{});
  c.spells=[E.toSheetSpell(E.spell('vitalidade-falsa'),'bruxo',{dmgType:'cura',effectSummary:'Cura · 1 hora',notes:'Texto próprio preservado.'}),E.toSheetSpell(E.spell('rogar-maldicao'),'bruxo',{dmgType:'necrotico',effectSummary:'1d8 Necrótico'}),E.toSheetSpell(E.spell('rogar-maldicao'),'bruxo',{customRoll:'1d8+2',dmgType:'necrotico',notes:'Fórmula própria.'})];
  c.standardSlots={1:{total:1,used:0},3:{total:1,used:0},4:{total:1,used:0},5:{total:1,used:0}};c.hpMax=60;c.hpCurrent=40;c.hpTemp=12;
  c.ruleState={version:1,used:{},pools:{},active:{},portent:[],targets:{},concentration:{version:1,id:'initial',name:'Concentração anterior',duration:'1 hora',spellKey:'synthetic',school:'',checks:[]}};
  const swapped=advance(c,{invocationsReplace:'Sinal de Mau Agouro',invocationsReplacement:'Visão Diabólica'});swapped.id='invocations-swapped';
  const relearned=advance(swapped,{invocations:['Sinal de Mau Agouro']});relearned.id='invocations-relearned';
  const context=await browser.newContext({viewport:{width:1440,height:1050},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  await page.addInitScript(({c,swapped,relearned})=>{if(localStorage.getItem('invocationSeeded'))return;localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c,swapped,relearned]}));localStorage.setItem('critcall_active_character_v1',c.id);localStorage.setItem('dnd_player_private_notes_v1',JSON.stringify({[c.id]:'Nota privada sintética de invocações.'}));localStorage.setItem('invocationSeeded','1');},{c,swapped,relearned});
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.evaluate(()=>{setTab('main');setDiceMode('auto');clearDicePool();addDieToPool(12);});
  const {dialog,accept,cancel}=confirmationActions(page),consult=name=>page.getByRole('button',{name:'Consultar '+name,exact:true}),pop=page.locator('#featureConsultation');
  const counter=name=>page.locator(`[data-rule-control="bruxo:invocation-${name}"]`),use=name=>counter(name).locator('[data-rule-action="use"]');
  const otherBefore=await page.evaluate(()=>JSON.stringify(characters[1]));
  // As quatro descrições têm suas próprias exceções/páginas, sem gerar contador à vontade.
  for(const [name,pattern,book]of [['Armadura de Sombras',/sem precisar gastar/,60],['Vigor Abissal',/1° nível/,61],['Escultor de Carne',/7° nível/,60],['Sinal de Mau Agouro',/5° nível/,61]]){
   await consult(name).tap();await pop.waitFor({state:'visible'});assert.match(await pop.innerText(),pattern);assert.ok((await pop.locator('a').getAttribute('href')).endsWith('page='+book));await pop.getByRole('button',{name:'Fechar consulta'}).click();
  }
  assert.equal(await counter('armadura-de-sombras').count(),0);assert.equal(await counter('vigor-abissal').count(),0);
  assert.equal(await counter('sinal-de-mau-agouro').count(),1);assert.match(await counter('sinal-de-mau-agouro').textContent(),/Magia e custos na mesa/);assert.equal(await use('sinal-de-mau-agouro').textContent(),'Registrar uso');
  // O registro diário pode acontecer depois do espaço físico já gasto: não cobra duas vezes.
  await page.evaluate(()=>{getChar().pactMagic.used=getChar().pactMagic.total;window.invocationCalls=0;window.invocationRandom=Math.random;Math.random=()=>{window.invocationCalls++;return .5;};});
  const pact=await page.evaluate(()=>JSON.stringify(getChar().pactMagic));await counter('sinal-de-mau-agouro').getByText('Já resolvi na mesa',{exact:true}).click();await use('sinal-de-mau-agouro').click();assert.equal(await use('sinal-de-mau-agouro').isDisabled(),true);assert.equal(await page.evaluate(()=>JSON.stringify(getChar().pactMagic)),pact);assert.equal(await page.evaluate(()=>window.invocationCalls),0);
  await page.evaluate(()=>shortRest());assert.equal(await use('sinal-de-mau-agouro').isDisabled(),true);await page.evaluate(()=>{longRest();});await accept();assert.equal(await use('sinal-de-mau-agouro').isDisabled(),false);
  await page.evaluate(()=>{getChar().ruleState.concentration={version:1,id:'prior',name:'Concentração anterior',duration:'1 hora',spellKey:'synthetic',school:'',checks:[]};setTab('spells');setSpellCastLevelByIndex(0,1);});
  const badge=i=>page.locator(`[data-spell-effect="${i}"]`),cast=i=>page.locator(`[data-cast-spell="${i}"]`);
  assert.equal(await badge(0).getAttribute('title'),'Defesa/Proteção');assert.match(await badge(0).innerText(),/1d4\+4 PV temporários/);assert.equal(await badge(1).getAttribute('title'),'Utilidade');assert.equal(await badge(2).getAttribute('title'),'Necrótico');assert.match(await badge(2).innerText(),/1d8\+2/);
  const hp=await page.evaluate(()=>[getChar().hpCurrent,getChar().hpTemp]),pool=await page.locator('#dicePoolDisplay').innerText();await cast(0).click();assert.deepEqual(await page.evaluate(()=>[getChar().hpCurrent,getChar().hpTemp]),hp);assert.equal(await page.evaluate(()=>window.invocationCalls),0);assert.equal(await page.locator('#dicePoolDisplay').innerText(),pool);
  // Círculo 3 exige troca; cancelar conserva espaço e concentração. Círculo 5 não exige.
  await page.evaluate(()=>setSpellCastLevelByIndex(1,3));await cast(1).click();await dialog.waitFor({state:'visible'});await cancel();assert.equal(await page.evaluate(()=>getChar().standardSlots[3].used),0);
  await page.evaluate(()=>setSpellCastLevelByIndex(1,5));assert.match(await badge(1).innerText(),/8 horas/);await page.getByRole('button',{name:'Consultar descrição de Rogar Maldição',exact:true}).first().click();assert.match(await pop.innerText(),/Duração: 8 horas/);await pop.getByRole('button',{name:'Fechar consulta'}).click();await cast(1).click();assert.equal(await dialog.evaluate(e=>e.open),false);assert.equal(await page.evaluate(()=>getChar().ruleState.concentration.id),'prior');assert.equal(await page.evaluate(()=>getChar().standardSlots[5].used),1);assert.equal(await page.evaluate(()=>window.invocationCalls),0);
  await page.evaluate(()=>setSpellCastLevelByIndex(1,4));await cast(1).click();await accept();assert.equal(await page.evaluate(()=>getChar().ruleState.concentration.duration),'Concentração, até 10 minutos');assert.equal(await page.evaluate(()=>window.invocationCalls),0);
  assert.deepEqual(await page.evaluate(()=>getChar().spells.slice(0,2).map(s=>s.dmgType)),['cura','necrotico']);assert.equal(await page.evaluate(()=>getChar().spells[0].notes),'Texto próprio preservado.');assert.equal(await page.evaluate(()=>JSON.stringify(characters[1])),otherBefore);
  // Troca e reaprendizado: não há característica/controle antigo ou duplicação.
  await page.evaluate(()=>{switchCharacter(1);setTab('main');});assert.equal(await consult('Sinal de Mau Agouro').count(),0);assert.equal(await counter('sinal-de-mau-agouro').count(),0);assert.equal(await consult('Visão Diabólica').count(),1);
  await page.evaluate(()=>switchCharacter(2));assert.equal(await consult('Sinal de Mau Agouro').count(),1);assert.equal(await counter('sinal-de-mau-agouro').count(),1);
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await consult('Vigor Abissal').tap();assert.equal(await pop.evaluate(e=>e.scrollWidth<=e.clientWidth),true);const y=await page.evaluate(()=>scrollY);await pop.hover();await page.mouse.wheel(0,500);assert.equal(await page.evaluate(()=>scrollY),y);await pop.getByRole('button',{name:'Fechar consulta'}).click();
  }
  await page.evaluate(()=>{switchCharacter(0);setTab('spells');});
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  // DOMContentLoaded não aguarda a inicialização assíncrona da ficha. Esperar a
  // aba com seu nome renderizado comprova que ela está pronta, sem pausa fixa.
  // CPU reduzida reproduz a condição de corrida observada na CI e em aparelhos lentos.
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'2. Grimório & Feitiçaria',exact:true}).click();
  assert.equal(await page.evaluate(()=>navigator.onLine),false);
  assert.equal(await badge(0).getAttribute('title'),'Defesa/Proteção');assert.equal(await badge(1).getAttribute('title'),'Utilidade');
  assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota privada sintética de invocações.');assert.equal(await page.evaluate(()=>getChar().spells[2].customRoll),'1d8+2');assert.deepEqual(errors,[]);
  await cdp.detach();
  console.log('PASS invocações: quatro referências, registro diário/Pacto/descansos, troca/reaprendizado sem duplicação, PV temporários e maldição sem dano imediato, duração/concentração por círculo, compatibilidade/fórmula própria/notas/outra ficha, mobile/GG/temas/layouts e offline.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
