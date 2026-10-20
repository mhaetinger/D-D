const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const E=require('../public/rules/character-engine');
(async()=>{
  const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    const c=warrior();c.name='Concentração sintética';c.hpMax=500;c.hpCurrent=500;c.hpTemp=0;c.exhaustion=0;c.armorEquipped=null;c.shieldEquipped=false;c.armorProficiencies=[];c.abilities.con.score=14;c.abilities.con.saveProf=false;c.rules={history:[],raceId:'humano',legacy:false};
    c.classes=[{classId:'mago',level:5,subclassId:'abjuracao',subclass:'Escola de Abjuração',hitDie:6,hitDiceUsed:0}];c.standardSlots={1:{total:4,used:0},2:{total:3,used:0},3:{total:2,used:0}};
    c.spells=['detectar-magia','teia','invisibilidade','raio-de-fogo','convocar-familiar'].map(id=>E.toSheetSpell(E.spell(id),'mago',{prepared:true}));
    await page.addInitScript(c=>{window.concentrationFixture=c;if(!localStorage.getItem('concentrationSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('concentrationSeeded','1');}},c);
    await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
    await page.evaluate(()=>{setDiceMode('off');setTab('lore');savePrivateNotes('Nota sintética de concentração.');setTab('main');});
    const dialog=page.locator('#confirmationDialog');
    // O diálogo já fica oculto antes de disparar `close`. Aguarde também a
    // continuação da confirmação, sem usar um atraso fixo ou ler o estado cedo.
    const chooseConfirmation=async button=>{
      await page.evaluate(()=>{window.concentrationDialogClosed=new Promise(resolve=>document.getElementById('confirmationDialog').addEventListener('close',()=>queueMicrotask(resolve),{once:true}));});
      await button.click();
      if(!await dialog.evaluate(el=>el.open))await page.evaluate(()=>window.concentrationDialogClosed);
    };
    const accept=()=>chooseConfirmation(page.locator('#confirmationAccept')),cancel=()=>chooseConfirmation(dialog.getByRole('button',{name:'Cancelar',exact:true}));
    const panel=page.locator('[data-concentration-control]'),action=id=>page.locator(`[data-concentration-action="${id}"]`);
    const main=()=>page.evaluate(()=>setTab('main'));
    const cast=async i=>{await page.evaluate(()=>setTab('spells'));await page.locator(`[data-cast-spell="${i}"]`).click();};
    const open=async()=>{if(!await panel.evaluate(el=>el.open))await panel.locator('summary').click();};
    const reset=()=>page.evaluate(()=>{characters.splice(0,characters.length,structuredClone(window.concentrationFixture));switchCharacter(0);recordStepAndSave('Reiniciou fixture de concentração');setDiceMode('off');setRollMode('normal');setTab('main');});
    const damage=async n=>{await main();const box=page.locator('[data-rule-disclosure="healthDamage"]');if(!await box.evaluate(el=>el.open))await box.locator('summary').click();await box.locator('[data-health-damage]').fill(String(n));await page.locator('[data-health-action="damage"]').click();};
    const physical=async face=>{await action('check').click();await dialog.locator('[data-health-source]').selectOption('physical');await dialog.locator('[data-health-face]').fill(String(face));await accept();await dialog.waitFor({state:'hidden'});};
    // Ficha antiga a zero não exige uma migração que regrave seus dados.
    await page.evaluate(()=>{getChar().hpCurrent=0;recordStepAndSave('Legado sintético a zero');});
    assert.equal(await page.locator('[data-rule-condition="caido"]').isChecked(),true);assert.equal(await page.locator('[data-rule-condition="caido"]').isDisabled(),true);
    await page.evaluate(()=>changeHp(1));assert.equal(await page.locator('[data-rule-condition="caido"]').isChecked(),true);await reset();
    await cast(0);assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1);const first=await page.evaluate(()=>CritCallRules.concentration(getChar()).id);
    assert.equal(await panel.count(),1);await cast(3);assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).id),first);
    await cast(1);await dialog.waitFor();assert.equal(await page.evaluate(()=>getChar().standardSlots[2].used),0);await cancel();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).id),first);
    // A confirmação revalida o recurso, mesmo se outro evento o consumiu.
    await cast(1);await page.evaluate(()=>{getChar().standardSlots[2].used=3;});await accept();await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).id),first);
    await page.evaluate(()=>{getChar().standardSlots[2].used=0;});await cast(1);await accept();await page.waitForFunction(()=>CritCallRules.concentration(getChar()).name==='Teia');
    await cast(1);assert.equal(await dialog.isVisible(),false);assert.equal(await page.evaluate(()=>getChar().standardSlots[2].used),2);
    await page.evaluate(()=>{getChar().ruleState.pools['mago:ward']=10;getChar().hpTemp=20;recordStepAndSave('Reservas sintéticas');});
    await damage(4);assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).checks.length),0);
    await damage(28);assert.equal(await panel.evaluate(el=>el.open),true);assert.deepEqual(await page.evaluate(()=>CritCallRules.concentration(getChar()).checks.map(t=>[t.damage,t.dc])),[[22,11]]);
    await damage(1);await action('check').click();const before=await page.evaluate(()=>JSON.stringify(getChar()));await cancel();assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);
    await physical(9);assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).checks.length),1);await physical(10);
    await damage(50);await damage(1);await physical(20);assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar())),null,'20 natural +2 não alcança CD 25');
    // Conjurações prolongadas/rituais pedem substituir, sem consumir espaços.
    await reset();await cast(0);await page.evaluate(()=>castRitualByIndex(4));await cancel();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).name),'Detectar Magia');
    await page.evaluate(()=>castRitualByIndex(4));await accept();await page.waitForFunction(()=>!CritCallRules.concentration(getChar()));assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1);
    await page.evaluate(()=>castRitualByIndex(0));assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).name),'Detectar Magia');await cast(0);assert.equal(await dialog.isVisible(),false);
    // Lista conserva seus nós/foco; incapacitação derivada não é uma segunda marca.
    await main();await page.locator('[data-rule-disclosure="conditions"] > summary').click();
    await page.evaluate(()=>{window.conditionInput=document.querySelector('[data-rule-condition="paralisado"]');clearDicePool();addDieToPool(12);getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;});
    await page.locator('[data-rule-condition="paralisado"]').check();assert.equal(await page.evaluate(()=>window.conditionInput===document.querySelector('[data-rule-condition="paralisado"]')),true);assert.equal(await page.evaluate(()=>document.activeElement.dataset.ruleCondition),'paralisado');
    assert.equal(await page.locator('[data-rule-condition="incapacitado"]').isChecked(),true);assert.equal(await page.locator('[data-rule-condition="incapacitado"]').isDisabled(),true);assert.equal(await page.evaluate(()=>CharacterEngine.movementSpeed(getChar())),0);assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar())),null);
    await page.evaluate(()=>{setDiceMode('auto');});const pool=await page.locator('#dicePoolDisplay').innerText();await page.locator('button[onclick*="Salvaguarda de Força"]').click();await page.evaluate(()=>rollWeapon(0,'attack'));assert.equal(await page.locator('#dicePoolDisplay').innerText(),pool);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
    await page.locator('[data-rule-condition="paralisado"]').uncheck();await cast(0);await main();await page.locator('[data-rule-disclosure="conditions"] > summary').click();await page.locator('[data-rule-condition="agarrado"]').check();assert.ok(await page.evaluate(()=>CritCallRules.concentration(getChar())));assert.equal(await page.evaluate(()=>CharacterEngine.movementSpeed(getChar())),0);
    // Fúria cancela concentração após confirmar; paralisia não encerra Fúria, sono sim.
    await reset();await page.evaluate(()=>{getChar().classes.push({classId:'barbaro',level:3,subclassId:'berserker',subclass:'Caminho do Furioso',hitDie:12,hitDiceUsed:0});recordStepAndSave('Multiclasse sintética');});await cast(0);await main();
    const rage=page.locator('[data-rule-action="toggle"][data-resource="barbaro:rage"]');await page.locator('.feature-entry').filter({has:rage}).locator('summary').click();await rage.click();await cancel();assert.ok(await page.evaluate(()=>CritCallRules.concentration(getChar())));assert.equal(await page.evaluate(()=>getChar().ruleState.used['barbaro:rage'] || 0),0);
    await rage.click();await accept();await page.waitForFunction(()=>getChar().ruleState.active['barbaro:rage']);assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar())),null);
    const frenzy=page.locator('[data-resource="barbaro:frenzy"]');await page.locator('.feature-entry').filter({has:frenzy}).locator('summary').click();await frenzy.click();
    await page.locator('[data-rule-disclosure="conditions"] > summary').click();await page.locator('[data-rule-condition="paralisado"]').check();assert.equal(await page.evaluate(()=>getChar().ruleState.active['barbaro:rage']),true);await page.locator('[data-rule-condition="inconsciente"]').check();assert.equal(await page.evaluate(()=>getChar().ruleState.active['barbaro:rage']),false);assert.equal(await page.evaluate(()=>getChar().exhaustion),1);
    assert.equal(await page.locator('[data-rule-condition="caido"]').isDisabled(),true);
    // Forma mantém efeito; dano/excesso retém a origem para informar o bônus correto.
    await reset();await page.evaluate(()=>{const c=getChar();c.classes=[{classId:'druida',level:8,subclassId:'lua',subclass:'Círculo da Lua',hitDie:8,hitDiceUsed:0}];c.spells[0].classId='druida';recordStepAndSave('Druida sintético');});await cast(0);await main();
    await page.locator('[data-rule-beast-hp]').fill('5');await page.locator('[data-rule-beast-hp]').dispatchEvent('change');await page.locator('[data-rule-beast-max]').fill('10');await page.locator('[data-rule-beast-max]').dispatchEvent('change');await page.locator('[data-rule-action="use"][data-resource="druida:wildShape"]').click();assert.ok(await page.evaluate(()=>CritCallRules.concentration(getChar())));
    await damage(8);assert.equal(await page.evaluate(()=>getChar().ruleState.active['druida:wildShape']),false);await action('check').click();await dialog.locator('[data-health-face]').fill('12');await accept();assert.equal(await dialog.isVisible(),true);await dialog.locator('[data-concentration-shape]').fill('7');await dialog.locator('[data-concentration-extra]').fill('1');assert.ok((await dialog.locator('[data-concentration-preview]').innerText()).includes('CON +8'));await accept();assert.ok(await page.evaluate(()=>CritCallRules.concentration(getChar())));
    // Conjurador de Guerra/inspiração não sobrepõem uma única desvantagem.
    await reset();await cast(0);await page.evaluate(()=>{const c=getChar();c.rules.history=[{classId:'mago',level:4,answers:{feat:'Conjurador de Guerra'}}];c.exhaustion=3;c.heroicInspiration=true;c.ruleState.inspirationReady=true;recordStepAndSave('Fontes sintéticas');setDiceMode('auto');clearDicePool();addDieToPool(12);});await damage(1);await action('check').click();assert.ok((await dialog.locator('[data-concentration-preview]').innerText()).includes('normal'));await page.evaluate(()=>{window.concRolls=0;Math.random=()=>{window.concRolls++;return .45;};});await accept();await page.waitForFunction(()=>!getChar().heroicInspiration);assert.equal(await page.evaluate(()=>window.concRolls),1);assert.equal(await page.locator('#dicePoolDisplay').innerText(),'1d12');
    // Conjuração Focada protege de dano, mas não de risco ambiental ou atordoamento.
    await reset();await page.evaluate(()=>{getChar().classes[0].level=10;getChar().classes[0].subclassId='conjuracao';recordStepAndSave('Conjurador sintético');});await cast(1);await damage(50);assert.equal(await action('check').count(),0);await open();await action('environment').click();await dialog.locator('[data-health-face]').fill('10');await accept();assert.ok(await page.evaluate(()=>CritCallRules.concentration(getChar())));
    await page.locator('[data-rule-disclosure="conditions"] > summary').click();await page.locator('[data-rule-condition="atordoado"]').check();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar())),null);
    // Manual, duração da mesa e descanso consciente/sono não usam cronômetro real.
    await reset();await open();await action('manual').click();await dialog.locator('[data-concentration-name]').fill('Efeito sintético de longa duração');await dialog.locator('[data-concentration-duration]').fill('24 horas da mesa');await accept();await page.waitForFunction(()=>!!CritCallRules.concentration(getChar()));
    await page.evaluate(()=>{longRest();});await dialog.locator('[data-rest-sleep]').uncheck();await accept();await page.waitForFunction(()=>getChar().ruleState.prepareReminder);assert.ok(await page.evaluate(()=>CritCallRules.concentration(getChar())));
    await page.evaluate(()=>{longRest();});await accept();await page.waitForFunction(()=>!CritCallRules.concentration(getChar()));
    // Callback antigo não resolve o efeito novo e não gasta inspiração preparada.
    await reset();await cast(0);await damage(1);await action('check').click();await dialog.locator('[data-health-face]').fill('10');await page.evaluate(()=>{CritCallRules.startConcentration(getChar(),{name:'Outro efeito sintético'});getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;});await accept();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).name),'Outro efeito sintético');assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
    // Histórico/nota, outra ficha e offline conservam fila e condições próprias.
    await reset();await cast(0);await damage(1);await page.evaluate(()=>undoStep());assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).checks.length),0);await page.evaluate(()=>redoStep());assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética de concentração.');
    await action('check').click();await dialog.locator('[data-health-face]').fill('10');await page.evaluate(()=>{const other=structuredClone(getChar());other.id='other-concentration';other.name='Outra ficha sintética';delete other.ruleState;characters.push(other);switchCharacter(1);recordStepAndSave('Outra ficha');});await accept();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar())),null);await page.evaluate(()=>switchCharacter(0));assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).checks.length),1);
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await action('check').waitFor();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).checks.length),1);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética de concentração.');await page.context().setOffline(false);
    for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
      await page.setViewportSize({width:320,height:800});await page.evaluate(({layout,theme})=>{getChar().preferredLayout=layout;setTheme(theme);setFontScale(125);setTab('main');},{layout,theme});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await panel.count(),1);await action('check').click();assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false);
      const scroll=await page.evaluate(()=>scrollY);await dialog.locator('h2').hover();await page.mouse.wheel(0,1200);await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>scrollY),scroll);await cancel();
      await page.evaluate(()=>setTab('spells'));assert.equal(await panel.count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    await page.setViewportSize({width:1440,height:1050});await page.evaluate(()=>{setTheme('pergaminho_escuro');setFontScale(100);setTab('main');});await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/critcall-concentration-desktop.png'});
    await page.setViewportSize({width:320,height:800});await page.evaluate(()=>setFontScale(125));await action('check').click();await page.screenshot({path:'/tmp/critcall-concentration-mobile.png'});await cancel();
    assert.deepEqual(errors,[]);console.log('PASS concentração: trocas/cancelamento/recursos, ritual, fontes/CD/fila, ward/temporários/forma, CON físico/virtual/OFF/feat/inspiração, condições/queda/Fúria, nós/foco, sono, callback obsoleto, fichas/notas/histórico/offline e três temas/320px/GG.');
  }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
