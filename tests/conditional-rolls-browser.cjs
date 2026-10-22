const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.id='r2-ladino';c.name='R2 Ladino';c.classes=[{classId:'ladino',level:11,subclass:'',subclassId:'',hitDie:8,hitDiceUsed:0}];c.rules={raceId:'halflingLeve',history:[]};
  c.skillsProf=['acrobacia'];c.customSkillBonuses={acrobacia:0};c.abilities.str.score=10;c.hpCurrent=60;c.hpMax=60;c.shieldEquipped=false;c.armorEquipped=null;
  c.weapons=[{name:'Adaga',ruleWeapon:'Adaga',calculationMode:'auto',damage:'1d4+2',bonus:'+6',notes:''}];
  const other=warrior();other.id='r2-humano';other.name='R2 Humano';other.rules.history.push({classId:'guerreiro',level:4,answers:{feat:'Sortudo'}});
  const barbarian=structuredClone(c);barbarian.id='r2-barbaro';barbarian.name='R2 Bárbaro';barbarian.classes=[{classId:'barbaro',level:11,subclass:'',subclassId:'',hitDie:12,hitDiceUsed:0}];barbarian.rules.raceId='halflingRobusto';barbarian.hpCurrent=5;barbarian.ruleState={active:{'barbaro:rage':true},used:{},pools:{},targets:{}};
  await page.addInitScript(chars=>{if(!localStorage.getItem('r2Seeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:chars}));localStorage.setItem('r2Seeded','1');}},[c,other,barbarian]);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
  await page.evaluate(()=>{setDiceMode('auto');setRollMode('normal');});
  const stub=faces=>page.evaluate(faces=>{window.r2Faces=[...faces];window.r2Calls=0;Math.random=()=>{window.r2Calls++;return ((window.r2Faces.shift()??20)-.5)/20;};},faces);
  const settled=()=>page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));
  const luck=page.locator('[data-dice-halfling-luck]'),result=page.locator('#dice3dResultText');
  const skill=()=>page.getByRole('button',{name:'Rolar Acrobacia',exact:true});
  const {dialog,accept,cancel}=confirmationActions(page);
  // Os dois layouts passam a identidade da perícia; ajuste zero continua zero.
  for(const layout of ['classic_2014','modern_2024']) {
   await page.evaluate(layout=>setLayout(layout),layout);await stub([1]);await skill().click();await settled();
   assert.match(await result.textContent(),/Talento Confiável.*tratado como 10/);assert.equal(await page.locator('#diceDockValue').textContent(),'10');
   assert.doesNotMatch(await result.textContent(),/1 NATURAL/);assert.equal(await luck.count(),1);
  }
  await page.locator('#diceDock').click();await page.screenshot({path:'/tmp/critcall-r2-desktop.png'});await stub([20]);await luck.click();await settled();
  assert.equal(await page.locator('#diceDockValue').textContent(),'20');assert.match(await result.textContent(),/Sortudo racial: 1 → 20/);assert.equal(await luck.count(),0);
  // Sem proficiência, o nome/perícia e o ajuste escrito não ativam o mínimo.
  await page.evaluate(()=>{getChar().skillsProf=[];renderAll();});await stub([1]);await skill().click();await settled();
  assert.equal(await page.locator('#diceDockValue').textContent(),'1');assert.doesNotMatch(await result.textContent(),/Talento Confiável/);
  await page.evaluate(()=>{getChar().skillsProf=['acrobacia'];setLayout('classic_2014');});
  // A repetição corrige o crítico da arma, preservando modo e sem gastar inspiração duas vezes.
  await page.evaluate(()=>{getChar().heroicInspiration=true;getChar().ruleState||={};getChar().ruleState.inspirationReady=true;});
  await stub([1,13]);await page.evaluate(()=>rollWeapon(0,'attack'));await settled();
  assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);assert.equal(await page.locator('[data-weapon-critical-toggle="0"]').isChecked(),false);
  await page.evaluate(()=>setRollMode('dis'));await stub([20]);await luck.click();await settled();
  assert.match(await result.textContent(),/Vantagem/);assert.equal(await page.locator('[data-weapon-critical-toggle="0"]').isChecked(),true);
  assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);assert.equal(await page.locator('#rollMode-dis').getAttribute('aria-pressed'),'true');
  // Dois 1: muda só um dado e aceita o resultado obrigatório, sem uma cadeia.
  await stub([1,1]);await page.getByRole('button',{name:'Rolar salvaguarda de Força'}).click();await settled();
  await stub([20]);await luck.click();await settled();assert.match(await result.textContent(),/d20 \[20, 1\] → menor: 1/);assert.equal(await luck.count(),0);
  // Trocar ficha, editar dados, mudar modo de dados ou rolar outra coisa invalida a opção anterior.
  const pending=async()=>{await page.evaluate(()=>setRollMode('normal'));await stub([1]);await skill().click();await settled();assert.equal(await luck.count(),1);};
  await pending();await page.evaluate(()=>{switchCharacter(1);switchCharacter(0);rerollHalflingD20();});assert.equal(await luck.count(),0);
  await pending();await page.evaluate(()=>getChar().hpCurrent--);await stub([20]);await luck.click();assert.equal(await page.evaluate(()=>window.r2Calls),0);assert.equal(await luck.count(),0);
  await pending();await page.evaluate(()=>setDiceMode('off'));await stub([20]);await page.evaluate(()=>rerollHalflingD20());assert.equal(await page.evaluate(()=>window.r2Calls),0);await page.evaluate(()=>setDiceMode('auto'));
  await pending();await stub([1]);await page.evaluate(()=>rollQuickD20());await settled();assert.equal(await page.locator('#diceDockValue').textContent(),'1');assert.equal(await luck.count(),0);assert.doesNotMatch(await result.textContent(),/Talento Confiável|Sortudo racial/);
  await stub([1]);await page.evaluate(()=>{clearDicePool();addDieToPool(20);rollCurrentPool();});await settled();assert.equal(await luck.count(),0);assert.equal(await page.locator('#diceDockValue').textContent(),'1');
  // Só Pool não dispara a rolagem da ficha nem consome um recurso preparado.
  await page.evaluate(()=>{setDiceMode('manual');getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;});await stub([1]);await skill().click();
  assert.equal(await page.evaluate(()=>window.r2Calls),0);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
  await page.evaluate(()=>{setDiceMode('auto');getChar().heroicInspiration=false;getChar().ruleState.inspirationReady=false;});
  // Testes que já aplicam consequências pedem a escolha antes de rolar/aplicar.
  await page.evaluate(()=>{CritCallRules.startConcentration(getChar(),{name:'Efeito sintético'});renderAll();});
  const panel=page.locator('[data-concentration-control]');await panel.locator('summary').click();
  await page.locator('[data-concentration-action="environment"]').click();assert.equal(await dialog.locator('[data-health-luck]').isChecked(),false);
  await dialog.locator('[data-health-luck]').check();await stub([1,20]);await cancel();assert.equal(await page.evaluate(()=>window.r2Calls),0);
  await page.locator('[data-concentration-action="environment"]').click();await dialog.locator('[data-health-luck]').check();await stub([1,20]);await accept();await settled();
  assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).name),'Efeito sintético');assert.match(await result.textContent(),/Sortudo racial: 1 → 20/);assert.equal(await luck.count(),0);
  await page.evaluate(()=>{CritCallRules.endConcentration(getChar());getChar().hpCurrent=0;renderAll();});
  await page.locator('[data-health-action="deathSave"]').click();await dialog.locator('[data-health-luck]').check();await stub([1,20]);await accept();await settled();
  assert.equal(await page.evaluate(()=>getChar().hpCurrent),1,'Novo 20 na resistência de morte recupera 1 PV');
  await page.evaluate(()=>{getChar().hpCurrent=0;renderAll();});await page.locator('[data-health-action="deathSave"]').click();await stub([1]);await accept();await settled();
  assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),2,'Sem optar por Sortudo, aceita o 1; Talento Confiável não afeta resistências');
  await page.locator('[data-health-action="deathSave"]').click();await dialog.locator('[data-health-source]').selectOption('physical');
  assert.equal(await dialog.locator('[data-health-luck-label]').isVisible(),false);await dialog.locator('[data-health-face]').fill('20');await stub([]);await accept();
  assert.equal(await page.evaluate(()=>window.r2Calls),0);assert.equal(await page.evaluate(()=>getChar().hpCurrent),1);
  // O talento homônimo não ativa a característica racial.
  await page.evaluate(()=>switchCharacter(1));await stub([1]);await page.evaluate(()=>rollWeapon(0,'attack'));await settled();assert.equal(await luck.count(),0);
  // Fúria Implacável usa o mesmo contrato antes de aplicar o dano que derrubaria.
  await page.evaluate(()=>switchCharacter(2));const damage=page.locator('[data-rule-disclosure="healthDamage"]');await damage.locator(':scope > summary').click();
  await damage.locator('[data-health-damage]').fill('5');await damage.locator('[data-damage-survival]').selectOption('rage');
  await damage.locator('[data-health-action="damage"]').click();await dialog.locator('[data-health-luck]').check();await stub([1,20]);await accept();await settled();
  assert.equal(await page.evaluate(()=>getChar().hpCurrent),1);assert.equal(await page.evaluate(()=>getChar().ruleState.used['barbaro:relentless']),1);assert.equal(await page.evaluate(()=>getChar().ruleState.active['barbaro:rage']),true);
  assert.equal(await page.evaluate(()=>window.r2Calls),2);assert.equal(await luck.count(),0);
  await page.evaluate(()=>{switchCharacter(0);setTab('lore');savePrivateNotes('Nota sintética R2');setTab('main');});
  // Opção cabe em celular/GG/temas e funciona por toque; SVG/gestos não são alterados.
  for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']) {
   await page.setViewportSize({width:320,height:950});await page.evaluate(theme=>{setTheme(theme);setFontScale(125);},theme);
   await pending();assert.equal(await luck.isVisible(),true);assert.ok(await luck.evaluate(e=>e.getBoundingClientRect().width<=e.parentElement.getBoundingClientRect().width));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await luck.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/critcall-r2-mobile.png'});
  await stub([11]);await luck.tap();await settled();assert.equal(await page.locator('#diceDockValue').textContent(),'11');
  // A regra é derivada das escolhas existentes e permanece disponível offline.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
  await page.unroute('**/*');await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof getChar==='function' && !document.getElementById('sheetApp').hidden);
  await stub([9]);await skill().click();await settled();assert.equal(await page.locator('#diceDockValue').textContent(),'10');assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética R2');
  assert.deepEqual(errors,[]);console.log('PASS R2 inicial: Talento Confiável contextual, Sortudo racial opcional/único, vantagem/desvantagem/crítico, inspiração uma vez, invalidação, físico/OFF/Só Pool, concentração/morte/Fúria Implacável, dois layouts/temas/320px/GG/toque e offline.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
