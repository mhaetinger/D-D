const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {unlockSheet}=require('./sheet-lock-actions.cjs'),{confirmationActions}=require('./confirmation.cjs');
const E=require('../public/rules/character-engine');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const make=(id,n,sub='')=>{const c=warrior();c.id='r1-'+id;c.name='R1 '+id;c.classes=[{classId:id,level:n,subclassId:sub,subclass:'',hitDie:E.data.classes[id].die,hitDiceUsed:0}];c.rules={raceId:'humano',history:[]};c.armorEquipped=null;c.shieldEquipped=false;c.abilities.cha.score=16;return c;};
  const fighter=make('guerreiro',12);fighter.rules.history=[{classId:'guerreiro',level:4,answers:{feat:'Ambidestro'}},{classId:'guerreiro',level:8,answers:{feat:'Observador'}}];fighter.abilities.wis.score=16;fighter.skillsProf=['percepcao'];fighter.customSkillBonuses={investigacao:0};
  const warlock=make('bruxo',12);warlock.rules.history=[{classId:'bruxo',level:3,answers:{pact:'lamina'}},{classId:'bruxo',level:12,answers:{invocations:['Sorvedor de Vida']}}];warlock.weapons=[{name:'Espada longa',ruleWeapon:'Espada longa',calculationMode:'auto',bonus:'+0',damage:'1d8+0',notes:'',dmgTypeLabel:'Cortante'},{name:'Adaga',ruleWeapon:'Adaga',calculationMode:'auto',bonus:'+0',damage:'1d4+0',notes:'',dmgTypeLabel:'Perfurante'}];
  const sorcerer=make('feiticeiro',6,'draconica');sorcerer.rules.history=[{classId:'feiticeiro',level:1,answers:{dragon:'Vermelho — fogo'}}];sorcerer.standardSlots={2:{total:3,used:0},3:{total:3,used:0}};sorcerer.sorceryPoints={max:6,current:6};sorcerer.spells=['Raio de Fogo','Raio Ardente','Bola de Fogo'].map(name=>E.toSheetSpell(E.spell(name),'feiticeiro',{prepared:true}));
  await page.addInitScript(chars=>{if(!localStorage.getItem('r1Seeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:chars}));localStorage.setItem('r1Seeded','1');}},[fighter,warlock,sorcerer]);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.locator('[data-skill-passive="percepcao"]').waitFor();
  assert.equal(await page.locator('[data-skill-passive="percepcao"]').textContent(),'Passiva 22');assert.equal(await page.locator('[data-skill-passive="investigacao"]').textContent(),'Passiva 15');
  const trained=await page.evaluate(()=>JSON.stringify(getChar().skillsProf));await page.locator('[data-skill-passive="percepcao"]').click();assert.equal(await page.evaluate(()=>JSON.stringify(getChar().skillsProf)),trained);
  const bonus=await page.evaluate(()=>getSkillBonus(getChar(),{id:'percepcao',ability:'wis'}));assert.equal(bonus,7);
  await page.locator('[data-rule-disclosure="defense"] > summary').click();const dual=page.locator('[data-rule-effect="feat:dualWielder"]');await dual.check();assert.equal(await page.evaluate(()=>getCalculatedAC(getChar())),13);
  assert.equal(await dual.evaluate(e=>e===document.activeElement),true);assert.equal(await page.locator('[data-rule-disclosure="defense"]').evaluate(e=>e.open),true);
  await page.evaluate(()=>{setTab('lore');savePrivateNotes('Nota sintética R1');setTab('main');});
  await page.locator('[data-skill-passive="percepcao"]').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/critcall-r1-passives-desktop.png'});
  // A mesma informação permanece nos dois layouts, sem alterar o bônus ativo.
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});
   assert.equal(await page.locator('[data-skill-passive="percepcao"]').textContent(),'Passiva 22');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.locator('[data-skill-passive="percepcao"]').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/critcall-r1-passives-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{setFontScale(100);setLayout('classic_2014');setTheme('pergaminho_claro');switchCharacter(1);});await unlockSheet(page);
  const {dialog,cancel}=confirmationActions(page);
  const edit=async i=>{await page.evaluate(i=>openHomebrewModal('weapon',i),i);await page.locator('#hbWepName').waitFor();await page.locator('.weapon-editor-adjustments > summary').click();};
  await edit(0);await page.locator('#hbWepPact').check();await page.evaluate(()=>window.r1Checkbox=document.getElementById('hbWepPact'));await page.locator('#hbWepDamageAdjust').fill('1');assert.equal(await page.evaluate(()=>window.r1Checkbox===document.getElementById('hbWepPact')),true);
  // Cancelar uma edição não transfere o vínculo.
  await page.locator('#homebrewModal').getByRole('button',{name:'Cancelar',exact:true}).click();await dialog.waitFor({state:'visible'});await cancel();assert.equal(await page.locator('#hbWepPact').isChecked(),true);assert.equal(await page.evaluate(()=>!!getChar().weapons[0].pactWeapon),false);
  await page.locator('#hbSaveBtn').click();assert.equal(await page.evaluate(()=>getChar().weapons[0].pactWeapon),true);assert.equal(await page.evaluate(()=>CharacterEngine.weaponStats(getChar(),getChar().weapons[0]).lifedrinker),3);
  await edit(1);await page.locator('#hbWepPact').check();await page.locator('#hbSaveBtn').click();assert.deepEqual(await page.evaluate(()=>getChar().weapons.map(w=>!!w.pactWeapon)),[false,true]);
  const parts=await page.evaluate(()=>CritCallRules.previewWeaponDamage(getChar(),getChar().weapons[1],{critical:true},CharacterEngine).parts);assert.deepEqual(parts.find(p=>p.name==='Sorvedor de Vida'),{name:'Sorvedor de Vida',formula:'3',type:'necrótico'});
  await page.evaluate(()=>{switchCharacter(2);setTab('spells');setDiceMode('auto');setRollMode('normal');Math.random=()=>0;});
  assert.match(await page.locator('[data-spell-effect="1"]').textContent(),/Afinidade \+3/);
  await page.evaluate(()=>castSpellByIndex(1));await page.waitForFunction(()=>document.getElementById('diceDockValue').textContent==='5');assert.equal(await page.evaluate(()=>getChar().standardSlots[2].used),1);
  await page.evaluate(()=>rollSpellRay(1));await page.waitForFunction(()=>document.getElementById('diceDockValue').textContent==='2');assert.equal(await page.evaluate(()=>getChar().standardSlots[2].used),1);assert.equal(await page.evaluate(()=>getChar().sorceryPoints.current),6);
  const before=await page.evaluate(()=>JSON.stringify(getChar()));await page.evaluate(()=>{setDiceMode('manual');castSpellByIndex(2);rollSpellRay(1);});assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);
  // CAR negativo é conservado na fórmula, mas dano nunca se torna cura.
  await page.evaluate(()=>{setDiceMode('auto');getChar().abilities.cha.score=1;castSpellByIndex(0);});await page.waitForFunction(()=>document.getElementById('diceDockValue').textContent==='0');
  // Persistência e fórmulas permanecem funcionais sem conexão sob /D-D/.
  await page.evaluate(()=>{switchCharacter(0);});await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
  await page.unroute('**/*');await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof getChar==='function' && !document.getElementById('sheetApp').hidden);
  assert.equal(await page.evaluate(()=>getCalculatedAC(getChar())),13);assert.equal(await page.locator('[data-skill-passive="percepcao"]').textContent(),'Passiva 22');assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética R1');
  await page.evaluate(()=>switchCharacter(1));assert.deepEqual(await page.evaluate(()=>getChar().weapons.map(w=>!!w.pactWeapon)),[false,true]);assert.equal(await page.evaluate(()=>CharacterEngine.weaponStats(getChar(),getChar().weapons[1]).lifedrinker),3);
  assert.deepEqual(errors,[]);console.log('PASS R1: CA condicional/passivos, bônus ativo preservado, vínculo único/cancelamento, necrótico no crítico, Afinidade uma vez, Só Pool, offline/notas, dois layouts/três temas/320px/GG.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
