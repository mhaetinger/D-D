const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright');
const {serve}=require('./serve.cjs');
const {warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
  const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    const c=warrior();c.name='PV sintéticos';c.hpMax=40;c.hpCurrent=10;c.hpTemp=0;c.exhaustion=0;c.abilities.con.score=16;
    c.classes=[{classId:'guerreiro',level:3,hitDie:10,hitDiceUsed:0,subclassId:'campeao',subclass:'Campeão'},{classId:'mago',level:2,hitDie:6,hitDiceUsed:0,subclassId:'abjuracao',subclass:'Escola de Abjuração'}];
    await page.addInitScript(c=>{if(!localStorage.getItem('healthSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('healthSeeded','1');}},c);
    await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
    await page.evaluate(()=>{setDiceMode('off');clearDicePool();addDieToPool(12);setTab('lore');savePrivateNotes('Nota pessoal sintética preservada.');setTab('main');});
    const button=id=>page.locator(`[data-health-action="${id}"]`),{dialog,accept,cancel}=confirmationActions(page);
    const spend=cls=>page.locator(`[data-health-action="hitDieSpend"][data-class="${cls}"]`).click();
    const face=n=>dialog.locator('[data-health-face]').fill(String(n));
    const physicalDeath=async n=>{await button('deathSave').click();await dialog.locator('[data-health-source]').selectOption('physical');await face(n);await accept();await dialog.waitFor({state:'hidden'});};
    const damage=async(n,critical=false)=>{
      const details=page.locator('[data-rule-disclosure="healthDamage"]');if(!await details.evaluate(el=>el.open))await details.locator(':scope > summary').click();
      await details.locator('[data-health-damage]').fill(String(n));await details.locator('[data-health-critical]').setChecked(critical);await button('damage').click();
    };
    // Cancelar/erro/rolagem física não gastam por acidente nem usam o pool montado.
    const before=await page.evaluate(()=>JSON.stringify(getChar()));
    await spend('guerreiro');assert.equal(await dialog.locator('[data-health-source]').inputValue(),'physical');
    assert.equal(await dialog.locator('[value="virtual"]').evaluate(el=>el.disabled),true);await cancel();assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);
    await spend('guerreiro');await face(0);await accept();await page.waitForTimeout(30);
    assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),before);
    assert.equal(await dialog.isVisible(),true);await cancel();
    await spend('guerreiro');await face(4);await dialog.locator('[data-health-song]').selectOption('6');await dialog.locator('[data-health-song-face]').fill('3');await accept();
    await page.waitForFunction(()=>getChar().hpCurrent===20);
    assert.deepEqual(await page.evaluate(()=>getChar().classes.map(c=>c.hitDiceUsed)),[1,0]);
    assert.equal(await page.locator('#dicePoolDisplay').innerText(),'1d12');
    assert.deepEqual(await page.evaluate(()=>({action:document.activeElement.dataset.healthAction,cls:document.activeElement.dataset.class})),{action:'hitDieSpend',cls:'guerreiro'});
    await page.evaluate(()=>undoStep());assert.equal(await page.evaluate(()=>getChar().hpCurrent),10);assert.equal(await page.evaluate(()=>getChar().classes[0].hitDiceUsed),0);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota pessoal sintética preservada.');
    await page.evaluate(()=>redoStep());assert.equal(await page.evaluate(()=>getChar().hpCurrent),20);
    await spend('guerreiro');assert.equal(await dialog.locator('[data-health-song]').isDisabled(),true);await face(1);await accept();await page.waitForFunction(()=>getChar().hpCurrent===24);
    await spend('mago');await face(6);await accept();await page.waitForFunction(()=>getChar().hpCurrent===33);
    // Virtual aplica o mesmo resultado que apresenta e conserva o pool manual.
    await page.evaluate(()=>{Math.random=()=>.5;setDiceMode('auto');});await spend('mago');assert.equal(await dialog.locator('[data-health-source]').inputValue(),'virtual');await accept();
    await page.waitForFunction(()=>getChar().hpCurrent===40);assert.deepEqual(await page.evaluate(()=>getChar().classes.map(c=>c.hitDiceUsed)),[2,2]);assert.equal(await page.locator('#dicePoolDisplay').innerText(),'1d12');
    await page.evaluate(()=>{longRest();});await accept();await page.waitForFunction(()=>getChar().ruleState.hitDiceRecovery===2);
    await page.locator('[data-rule-action="hitDie"][data-class="mago"]').click();await page.locator('[data-rule-action="hitDie"][data-class="mago"]').click();
    assert.deepEqual(await page.evaluate(()=>getChar().classes.map(c=>c.hitDiceUsed)),[2,0]);assert.equal(await page.locator('[data-rule-action="hitDie"]').count(),0);
    // A forma usa os dados da classe, a Constituição da besta e seus próprios PV.
    await page.evaluate(()=>{const d=structuredClone(getChar());d.id='health-shape';d.name='Forma sintética';d.classes=[{classId:'druida',level:8,hitDie:8,hitDiceUsed:0,subclassId:'lua',subclass:'Círculo da Lua'}];d.hpCurrent=0;d.ruleState={active:{'druida:wildShape':true},pools:{'druida:wildShape':10},beastMax:20};characters.push(d);switchCharacter(1);recordStepAndSave('Forma sintética');setDiceMode('off');});
    await spend('druida');await face(3);await accept();assert.equal(await dialog.isVisible(),true);assert.equal(await page.evaluate(()=>getChar().classes[0].hitDiceUsed),0);
    await dialog.locator('[data-health-shape-con]').fill('2');await accept();await page.waitForFunction(()=>getChar().ruleState.pools['druida:wildShape']===15);
    assert.equal(await page.evaluate(()=>getChar().hpCurrent),0);assert.equal(await page.locator('[data-health-status]').count(),0);
    await page.evaluate(()=>shortRest());assert.equal(await page.evaluate(()=>getChar().ruleState.active['druida:wildShape']),true);
    await page.evaluate(()=>{characters.splice(1,1);switchCharacter(0);});
    // 1/20 naturais, estabilidade, temporários a zero e dano maciço.
    await page.evaluate(()=>{const c=getChar();c.hpCurrent=8;c.ruleState.pools['mago:ward']=0;recordStepAndSave('PV sintéticos para morte');setDiceMode('off');});
    await damage(8,true);assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),0);
    await physicalDeath(1);assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),2);
    await physicalDeath(20);assert.equal(await page.evaluate(()=>getChar().hpCurrent),1);assert.equal(await page.locator('[data-health-status]').count(),0);
    await damage(1);for(let i=0;i<3;i++)await physicalDeath(10);
    assert.equal(await button('deathSave').count(),0);assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).stable),true);
    await page.evaluate(()=>{getChar().hpTemp=5;recordStepAndSave('Temporários sintéticos');});await damage(1,true);
    assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).stable),false);assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),2);
    await page.evaluate(()=>changeHp(1));assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),0);
    await page.evaluate(()=>{getChar().hpTemp=0;recordStepAndSave('Sem temporários sintéticos');});await damage(41);
    assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).dead),true);
    await page.evaluate(()=>{changeHp(5);shortRest();longRest();});assert.equal(await dialog.isVisible(),false);assert.equal(await page.evaluate(()=>getChar().hpCurrent),0);
    await button('revive').click();await cancel();assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).dead),true);
    await button('revive').click();await dialog.locator('[data-health-return-hp]').fill('2');await accept();await page.waitForFunction(()=>getChar().hpCurrent===2);
    // Estabilização é registro explícito; cancelar preserva o estado.
    await damage(2);await physicalDeath(7);await button('stabilize').click();await cancel();assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),1);
    await button('stabilize').click();await accept();await page.waitForFunction(()=>CritCallRules.deathStatus(getChar()).stable);await page.evaluate(()=>changeHp(2));
    await damage(2);await button('stabilize').click();await accept();await spend('mago');await face(1);await accept();await page.waitForFunction(()=>getChar().hpCurrent===4);
    await page.evaluate(()=>undoStep());
    assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).stable),true);await page.evaluate(()=>redoStep());
    await page.evaluate(()=>{getChar().hpCurrent=2;recordStepAndSave('PV sintéticos para inspiração');});
    // Inspiração só é consumida num teste/ataque ou pool escolhido, antes da jogada.
    await page.evaluate(()=>setDiceMode('auto'));await button('inspirationReceive').click();await button('inspirationUse').click();
    await page.evaluate(()=>{rollQuickD20();triggerSheetRoll('1d20','Dano personalizado sintético');});assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
    await page.evaluate(()=>setRollMode('dis'));await page.locator('button[onclick*="Teste de Força"]').click();await page.waitForTimeout(450);
    assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);assert.ok((await page.locator('#dice3dResultText').innerText()).includes('Normal'));
    assert.ok((await page.evaluate(()=>document.activeElement.getAttribute('onclick') || '')).includes('Teste de Força'),'usar inspiração mantém foco no teste escolhido');
    await button('inspirationReceive').click();await button('inspirationUse').click();await button('inspirationUse').click();assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);assert.equal(await page.evaluate(()=>getChar().ruleState.inspirationReady),false);
    await button('inspirationPhysical').click();await cancel();assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
    await button('inspirationPhysical').click();await accept();await page.waitForFunction(()=>!getChar().heroicInspiration);
    // Inspiração pode ajudar a resistência contra a morte, sem usar atributo.
    await damage(2);await button('inspirationReceive').click();await button('inspirationUse').click();await page.evaluate(()=>{Math.random=()=>.5;setRollMode('normal');});
    await button('deathSave').click();await accept();await page.waitForFunction(()=>CritCallRules.deathStatus(getChar()).successes===1);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);await page.waitForTimeout(450);assert.ok((await page.locator('#dice3dResultText').innerText()).includes('Vantagem'));
    // Recarga/offline e outro personagem não misturam reservas, estado e histórico.
    await button('inspirationReceive').click();await page.evaluate(()=>{const other=structuredClone(getChar());other.id='health-other';other.name='Outra ficha sintética';other.hpCurrent=40;other.heroicInspiration=false;delete other.ruleState.death;characters.push(other);switchCharacter(1);recordStepAndSave('Segunda ficha sintética');});
    assert.equal(await page.locator('[data-health-status]').count(),0);await page.evaluate(()=>switchCharacter(0));assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).successes),1);
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
    await page.context().setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await button('deathSave').waitFor();
    assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).successes),1);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);assert.deepEqual(await page.evaluate(()=>getChar().classes.map(c=>c.hitDiceUsed)),[2,1]);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota pessoal sintética preservada.');
    await page.context().setOffline(false);
    for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
      await page.setViewportSize({width:320,height:800});await page.evaluate(({layout,theme})=>{getChar().preferredLayout=layout;setTheme(theme);setFontScale(125);setTab('main');}, {layout,theme});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await button('deathSave').click();assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth),false);await cancel();
      const damageBox=page.locator('[data-rule-disclosure="healthDamage"]');if(!await damageBox.evaluate(el=>el.open))await damageBox.locator(':scope > summary').click();
      assert.ok(await damageBox.locator('.rule-check:has([data-health-critical])').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el.lastChild);return range.getBoundingClientRect().left-el.querySelector('input').getBoundingClientRect().right>=6;}),'texto do crítico separado da caixa');
      assert.equal(await page.locator('[data-health-action="inspirationUse"]').count(),1);
    }
    await page.setViewportSize({width:1440,height:1100});await page.evaluate(()=>{setTheme('obsidiana');setFontScale(100);setTab('main');});
    await page.locator('[data-health-status]').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/critcall-health-desktop.png'});
    await page.setViewportSize({width:320,height:800});await page.evaluate(()=>setFontScale(125));await button('deathSave').click();await page.screenshot({path:'/tmp/critcall-health-dialog-mobile.png'});await cancel();
    assert.deepEqual(errors,[]);
    console.log('PASS PV: Dados de Vida por classe/físico/virtual, Canção uma vez, limite/recuperação, morte/1/20/estabilidade/dano/temporários, cura sem reviver, retorno explícito, inspiração 2014, pool preservado, fichas/histórico/recarga/offline e três temas/320px/GG.');
  } finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
