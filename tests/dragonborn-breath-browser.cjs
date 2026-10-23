const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs'),{unlockSheet}=require('./sheet-lock-actions.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.race='Draconato';c.rules.raceId='draconato';c.rules.history[0].answers.raceDragon='Ouro — fogo';c.rules.history[0].answers.dragon='Azul — elétrico';c.classes[0].level=6;c.abilities.con.score=16;c.hpMax=40;c.hpCurrent=31;
  await page.addInitScript(c=>{if(!localStorage.getItem('breathSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('breathSeeded','1');}},c);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
  await page.evaluate(()=>{setDiceMode('off');clearDicePool();addDieToPool(12);setTab('lore');savePrivateNotes('Nota sintética do sopro.');setTab('main');});
  const control=page.locator('[data-rule-control="race:breath"]'),button=control.locator('[data-breath-action="use"]'),ancestry=()=>page.locator('[data-breath-ancestry]');
  const {dialog,accept,cancel}=confirmationActions(page),used=()=>page.evaluate(()=>getChar().ruleState?.used?.['race:breath']||0),snapshot=()=>page.evaluate(()=>JSON.stringify(getChar()));
  const face=n=>dialog.locator('[data-health-face]').fill(String(n));
  const random=value=>page.evaluate(value=>{window.breathRandomCalls=0;Math.random=()=>{window.breathRandomCalls++;return value;};},value);
  assert.equal(await control.count(),1);assert.equal(await ancestry().count(),0);assert.match(await control.innerText(),/Ouro.*3d6.*cone de 4,5 m.*DES CD 14/s);
  // O modo OFF registra o total físico, cancela sem alterações e conserva o pool.
  const before=await snapshot();await button.click();assert.equal(await dialog.locator('[data-health-source]').inputValue(),'physical');assert.equal(await dialog.locator('[value="virtual"]').evaluate(e=>e.disabled),true);
  assert.match(await dialog.innerText(),/Total dos 3d6 físicos/);await page.evaluate(()=>document.querySelector('[data-breath-action="use"]').click());assert.equal(await page.locator('#confirmationDialog[open]').count(),1);await random(.5);await cancel();assert.equal(await snapshot(),before);assert.equal(await page.evaluate(()=>window.breathRandomCalls),0);
  await button.click();await face(2);await accept();assert.equal(await dialog.isVisible(),true);assert.equal(await used(),0);await face(13);await accept();
  assert.equal(await used(),1);assert.equal(await button.isDisabled(),true);await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false})));assert.equal(await control.locator('[data-rule-action="refund"]').isDisabled(),true);await page.evaluate(()=>{const b=document.querySelector('[data-resource="race:breath"][data-rule-action="refund"]');b.disabled=false;b.click();});assert.equal(await used(),1);await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'personal'})));assert.match(await control.locator('[data-breath-result]').innerText(),/13 Fogo.*metade 6/);assert.equal(await page.evaluate(()=>window.breathRandomCalls),0);assert.equal(await page.locator('#dicePoolDisplay').innerText(),'1d12');
  assert.equal(await page.evaluate(()=>getChar().hpCurrent),31);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética do sopro.');
  // Desfazer/refazer e recarregar preservam resultado, gasto e notas.
  await page.evaluate(()=>undoStep());assert.equal(await used(),0);await page.evaluate(()=>redoStep());assert.equal(await used(),1);
  await page.reload({waitUntil:'networkidle'});assert.equal(await used(),1);assert.match(await control.locator('[data-breath-result]').innerText(),/metade 6/);
  // Editar a escolha mantém o próprio select/foco e não concede outro uso.
  await unlockSheet(page);assert.equal(await ancestry().locator('option').count(),11);await ancestry().evaluate(e=>window.breathAncestryNode=e);
  await ancestry().selectOption('Branco — frio');assert.equal(await ancestry().evaluate(e=>e===window.breathAncestryNode&&e===document.activeElement),true);assert.equal(await used(),1);assert.match(await control.innerText(),/Branco.*CON CD 14/s);
  assert.deepEqual(await page.evaluate(()=>CharacterEngine.selections(getChar(),null,'dragon')),['Azul — elétrico']);
  await ancestry().selectOption('');assert.equal(await button.isDisabled(),true);await ancestry().selectOption('Verde — veneno');assert.equal(await used(),1);
  // Dez opções atualizam tipo/área/resistência; nada toca no ancestral de feiticeiro.
  for(const [name,shape,save] of [['Azul — elétrico','linha','DES'],['Branco — frio','cone','CON'],['Bronze — elétrico','linha','DES'],['Cobre — ácido','linha','DES'],['Latão — fogo','linha','DES'],['Negro — ácido','linha','DES'],['Ouro — fogo','cone','DES'],['Prata — frio','cone','CON'],['Verde — veneno','cone','CON'],['Vermelho — fogo','cone','DES']]){
   await ancestry().selectOption(name);assert.match(await control.locator('[data-breath-profile]').innerText(),new RegExp(shape+'.*'+save+' CD 14'));
  }
  await control.locator('[data-rule-action="refund"]').click();assert.equal(await used(),0);await button.click();await face(13);await accept();assert.equal(await used(),1);await page.evaluate(()=>shortRest());assert.equal(await used(),0);
  // Virtual usa apenas os d6 raciais, apesar de vantagem/inspiração, sem consumir o pool.
  await page.evaluate(()=>{setDiceMode('auto');clearDicePool();addDieToPool(12);setRollMode('adv');getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;});
  await button.click();assert.equal(await dialog.locator('[data-health-source]').inputValue(),'virtual');await random(0);await accept();
  assert.equal(await used(),1);assert.equal(await page.evaluate(()=>getChar().ruleState.lastBreath.total),3);assert.equal(await page.evaluate(()=>window.breathRandomCalls),3);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);assert.equal(await page.locator('#dicePoolDisplay').innerText(),'1d12');
  await page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));
  // Uma ficha modificada durante o diálogo não recebe o custo nem rolagem antigos.
  await page.evaluate(()=>shortRest());await button.click();await page.evaluate(()=>getChar().hpCurrent--);await random(.5);await accept();assert.equal(await used(),0);assert.equal(await page.evaluate(()=>window.breathRandomCalls),0);
  // Revogar a autorização externa durante a confirmação impede o uso antigo.
  await button.click();await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'room',role:'player',playerCanEdit:false})));await random(.5);await accept();assert.equal(await used(),0);assert.equal(await page.evaluate(()=>window.breathRandomCalls),0);assert.equal(await button.isDisabled(),true);await page.evaluate(()=>CritCallSheetAccess.setProvider(()=>({kind:'personal'})));
  // Forma Selvagem exige CON da besta e confirmação de capacidade física.
  await page.evaluate(()=>{setDiceMode('off');const c=getChar();c.ruleState.active['druida:wildShape']=true;c.ruleState.pools['druida:wildShape']=12;c.ruleState.beastMax=20;recordStepAndSave('Forma sintética');});
  await button.click();await face(13);await accept();assert.equal(await dialog.isVisible(),true);assert.equal(await used(),0);
  await dialog.locator('[data-breath-shape-con]').fill('5');await accept();assert.equal(await dialog.isVisible(),true);await dialog.locator('[data-breath-shape-capable]').check();assert.equal(await dialog.locator('[data-breath-dc]').innerText(),'CD 16');await accept();assert.equal(await used(),1);assert.equal(await page.evaluate(()=>getChar().abilities.con.score),16);assert.equal(await page.evaluate(()=>getChar().ruleState.pools['druida:wildShape']),12);
  await page.evaluate(()=>{getChar().ruleState.active['druida:wildShape']=false;shortRest();});
  // Mobile: fonte GG, temas e layouts; modal mantém a rolagem dentro dele.
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width:320,height:900});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});
   assert.equal(await control.count(),1);await control.scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,layout+' '+theme);
   await button.click();assert.equal(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth),true,'diálogo sem transbordo horizontal');const scroll=await page.evaluate(()=>scrollY);await dialog.hover();await page.mouse.wheel(0,700);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>scrollY),scroll);await cancel();
  }
  await page.setViewportSize({width:390,height:900});await control.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/critcall-dragonborn-mobile.png'});
  // Offline usa os controles do build e mantém os dados já gravados.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await button.waitFor();await button.click();await face(13);await accept();assert.equal(await used(),1);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética do sopro.');
  assert.deepEqual(errors,[]);console.log('PASS sopro de draconato: dez ancestrais, físico/OFF/virtual, cancelamento, usos/descanso, edição/foco, forma, persistência, mobile e offline.');
 }finally{await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
