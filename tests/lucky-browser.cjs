const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const make=(id,cls,level,race='humano')=>{const c=warrior();c.id='lucky-'+id;c.name='Sortudo '+id;c.race=race==='humano'?'Humano':'Halfling';c.classes=[{classId:cls,level,subclass:'',subclassId:'',hitDie:cls==='barbaro'?12:8,hitDiceUsed:0}];c.rules={raceId:race,history:[{classId:cls,level:4,answers:{feat:'Sortudo'}}]};c.ruleState={version:1,used:{},active:{},pools:{},targets:{},portent:[]};c.hpCurrent=60;c.hpMax=60;c.hpTemp=0;c.armorEquipped=null;c.shieldEquipped=false;c.weapons=[{name:'Adaga',ruleWeapon:'Adaga',calculationMode:'auto',bonus:'+4',damage:'1d4+2',notes:''}];return c;};
  const fighter=make('humano','guerreiro',4),rogue=make('halfling','ladino',11,'halflingLeve'),barbarian=make('barbaro','barbaro',11,'halflingRobusto');
  rogue.skillsProf=['acrobacia'];rogue.customSkillBonuses={acrobacia:0};barbarian.hpCurrent=5;barbarian.ruleState.active['barbaro:rage']=true;
  await page.addInitScript(chars=>{if(!localStorage.getItem('luckySeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:chars}));localStorage.setItem('luckySeeded','1');}},[fighter,rogue,barbarian]);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.evaluate(()=>{setDiceMode('auto');setRollMode('normal');});
  const {dialog,accept,cancel}=confirmationActions(page),balance=()=>page.evaluate(()=>CritCallRules.luckRemaining(getChar(),CharacterEngine));
  const stub=faces=>page.evaluate(faces=>{window.luckyFacesQueue=[...faces];window.luckyCalls=0;Math.random=()=>{window.luckyCalls++;return ((window.luckyFacesQueue.shift()??20)-.5)/20;};},faces);
  const settled=()=>page.waitForFunction(()=>!document.getElementById('dice3dCube').classList.contains('dice-3d-rolling'));
  const button=page.locator('[data-dice-lucky-feat]'),choice=i=>page.locator(`[data-dice-lucky-choice="${i}"]`),result=page.locator('#dice3dResultText');
  const roll=async(faces,mode='normal')=>{await page.evaluate(mode=>setRollMode(mode),mode);await stub(faces);await page.evaluate(()=>rollWeapon(0,'attack'));await settled();};
  const reset=()=>page.evaluate(()=>{getChar().ruleState.used['feat:lucky']=0;getChar().heroicInspiration=false;getChar().ruleState.inspirationReady=false;recordStepAndSave('Reiniciou pontos sintéticos');});
  const openDie=async()=>{if(!await page.locator('#diceTrayBody').isVisible()){await page.locator('#diceDock').click();await page.waitForFunction(()=>document.getElementById('dice3dTray').getAnimations().length===0);}};
  const use=async(extra,opposed=false)=>{await openDie();await button.click();await page.evaluate(()=>useLuckyD20());if(opposed)await dialog.locator('[data-lucky-opposed]').check();await stub(extra);await accept();await settled();};
  const faceDialog=()=>page.waitForFunction(()=>document.getElementById('confirmationDialog').open && document.getElementById('confirmationTitle').textContent==='Sortudo · escolher d20');
  const lateDialog=()=>page.waitForFunction(()=>document.getElementById('confirmationDialog').open && document.getElementById('confirmationTitle').textContent==='Sortudo · depois do d20');
  assert.equal(await balance(),3);assert.equal(await page.locator('[data-rule-control="feat:lucky"]').count(),1);
  // Cancelar antes do dado preserva tudo. O custo é lançado uma vez, mesmo com cliques rápidos.
  await roll([1]);await openDie();await button.click();await stub([]);await cancel();assert.equal(await balance(),3);assert.equal(await page.evaluate(()=>window.luckyCalls),0);
  const node=await page.locator('[data-rule-control="feat:lucky"]').evaluate(e=>{window.luckyControl=e;return true;});assert.equal(node,true);
  await use([20]);assert.equal(await balance(),2);assert.equal(await page.evaluate(()=>window.luckyCalls),1);
  assert.equal(await page.locator('[data-rule-control="feat:lucky"]').evaluate(e=>e===window.luckyControl),true,'pagar não recria a característica');
  assert.equal(await page.locator('[data-rule-action="refund"][data-resource="feat:lucky"]').isEnabled(),true);
  assert.equal(await choice(0).getAttribute('aria-pressed'),'true');await choice(1).evaluate(e=>window.luckyFaceNode=e);await choice(1).click();assert.equal(await choice(1).evaluate(e=>e===window.luckyFaceNode),true);assert.equal(await page.locator('[data-weapon-critical-toggle="0"]').isChecked(),true);
  assert.equal(await choice(1).evaluate(e=>e===document.activeElement),true);assert.equal(await page.evaluate(()=>window.luckyCalls),1);
  await choice(0).click();assert.equal(await page.locator('[data-weapon-critical-toggle="0"]').isChecked(),false,'pode manter o original sem devolver o ponto');
  // Desvantagem continua existindo, mas o talento permite inclusive o dado original descartado.
  await roll([4,18],'dis');await use([2]);assert.equal(await page.locator('[data-dice-lucky-choice]').count(),3);
  await page.evaluate(()=>setRollMode('adv'));await choice(1).click();assert.match(await result.textContent(),/Desvantagem/);assert.match(await result.textContent(),/face escolhida 18/);assert.equal(await balance(),1);
  await roll([7]);await use([],true);assert.equal(await page.evaluate(()=>window.luckyCalls),0);assert.equal(await balance(),0);assert.equal(await page.locator('[data-dice-lucky-choice]').count(),0);assert.match(await result.textContent(),/se cancelaram/);
  await roll([1]);assert.equal(await button.count(),0);assert.equal(await page.locator('[data-lucky-action="incoming"]').isDisabled(),true);
  // Curto não recupera; longo recupera os três. OFF/Só Pool/d20 livre não gastam por inferência.
  await page.evaluate(()=>{CritCallRules.takeRest(getChar(),'short',CharacterEngine);renderAll();});assert.equal(await balance(),0);
  await page.evaluate(()=>{CritCallRules.takeRest(getChar(),'long',CharacterEngine);recordStepAndSave('Descanso sintético');});assert.equal(await balance(),3);
  await stub([1]);await page.evaluate(()=>rollQuickD20());await settled();assert.equal(await button.count(),0);assert.equal(await balance(),3);
  await page.evaluate(()=>setDiceMode('manual'));await stub([]);await page.evaluate(()=>rollWeapon(0,'attack'));assert.equal(await page.evaluate(()=>window.luckyCalls),0);assert.equal(await balance(),3);
  await page.evaluate(()=>setDiceMode('off'));await page.locator('[data-lucky-action="table"]').click();await stub([]);await cancel();assert.equal(await balance(),3);
  await page.locator('[data-lucky-action="table"]').click();await accept();assert.equal(await balance(),2);assert.equal(await page.evaluate(()=>window.luckyCalls),0);
  await page.locator('[data-rule-action="refund"][data-resource="feat:lucky"]').click();assert.equal(await balance(),3);
  // Ficha editada após abrir a confirmação não recebe um custo/rolagem antigo.
  await page.evaluate(()=>setDiceMode('auto'));await roll([5]);await openDie();await button.click();await page.evaluate(()=>getChar().hpCurrent--);await stub([20]);await accept();assert.equal(await balance(),3);assert.equal(await page.evaluate(()=>window.luckyCalls),0);
  // Ataque recebido usa a face do atacante, nunca seus bônus/arma nem seu Sortudo racial.
  await page.locator('[data-lucky-action="incoming"]').click();await dialog.locator('[data-lucky-attacker]').fill('20');await stub([1]);await accept();await faceDialog();
  assert.equal(await balance(),2);await dialog.locator('[data-lucky-face][value="1"]').check();await accept();assert.match(await result.textContent(),/face escolhida 1/);assert.equal(await page.evaluate(()=>getChar().hpCurrent),59);
  await page.evaluate(()=>setDiceMode('off'));await page.locator('[data-lucky-action="incoming"]').click();await dialog.locator('[data-lucky-attacker]').fill('18');await dialog.locator('[data-health-face]').fill('2');await stub([]);await accept();await faceDialog();await dialog.locator('[data-lucky-face][value="0"]').check();await accept();assert.equal(await page.evaluate(()=>window.luckyCalls),0);assert.equal(await balance(),1);
  await page.locator('[data-lucky-action="incoming"]').click();await dialog.locator('[data-lucky-attacker]').fill('18');await dialog.locator('[data-lucky-opposed]').check();await stub([]);await accept();assert.equal(await balance(),0);assert.equal(await page.evaluate(()=>window.luckyCalls),0);
  // Inspiração é consumida na jogada inicial, não novamente ao escolher a face de Sortudo.
  await reset();await page.evaluate(()=>{setDiceMode('auto');setRollMode('normal');getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;});await stub([1,13]);await page.evaluate(()=>rollWeapon(0,'attack'));await settled();assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);
  await use([20]);await choice(2).click();assert.equal(await balance(),2);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);assert.match(await result.textContent(),/Vantagem/);
  // Homônimos são independentes: mínimo do ladino, escolha paga e repetição racial no mesmo conjunto.
  await page.evaluate(()=>{switchCharacter(1);setRollMode('normal');});assert.equal(await page.locator('[data-rule-control="feat:lucky"]').count(),1);
  await stub([1]);await page.getByRole('button',{name:'Rolar Acrobacia',exact:true}).click();await settled();assert.equal(await page.locator('#diceDockValue').textContent(),'10');
  await use([9]);await choice(1).click();assert.equal(await page.locator('#diceDockValue').textContent(),'10');assert.equal(await balance(),2);
  await stub([20]);await page.locator('[data-dice-halfling-luck]').click();await settled();await choice(0).click();assert.equal(await page.locator('#diceDockValue').textContent(),'20');assert.equal(await balance(),2);assert.equal(await page.locator('[data-dice-halfling-luck]').count(),0);
  await roll([13]);await use([1]);assert.equal(await page.locator('[data-dice-halfling-luck]').count(),1);await stub([20]);await page.locator('[data-dice-halfling-luck]').click();await settled();await choice(1).click();assert.equal(await balance(),1);
  // Pode decidir gastar só depois de ver o d20, antes de aplicar falhas/PV.
  await reset();await page.evaluate(()=>{getChar().hpCurrent=0;recordStepAndSave('Decisão tardia sintética');});
  await page.locator('[data-health-action="deathSave"]').click();assert.equal(await dialog.locator('[data-health-lucky-feat]').inputValue(),'ask');await stub([1]);await accept();await lateDialog();assert.equal(await balance(),3);assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),0);await cancel();
  await page.locator('[data-health-action="deathSave"]').click();await stub([]);await accept();await lateDialog();assert.equal(await page.evaluate(()=>window.luckyCalls),0);await dialog.locator('[data-lucky-decision]').selectOption('use');await stub([20]);await accept();await faceDialog();await dialog.locator('[data-lucky-face][value="1"]').check();await accept();assert.equal(await page.evaluate(()=>getChar().hpCurrent),1);assert.equal(await balance(),2);
  await page.evaluate(()=>{getChar().hpCurrent=0;recordStepAndSave('Mantém d20 sintético');});await page.locator('[data-health-action="deathSave"]').click();await stub([1]);await accept();await lateDialog();await accept();assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),2);assert.equal(await balance(),2);await page.evaluate(()=>CritCallRules.healHitPoints(getChar(),1));
  // Resistência de morte aguarda a escolha. Cancelar após rolar preserva custo/inspiração e retoma os mesmos dados.
  await reset();await page.evaluate(()=>{getChar().hpCurrent=0;getChar().heroicInspiration=true;getChar().ruleState.inspirationReady=true;recordStepAndSave('Preparou morte sintética');});
  await page.locator('[data-health-action="deathSave"]').click();await dialog.locator('[data-health-lucky-feat]').selectOption('before');await stub([]);await cancel();assert.equal(await balance(),3);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),true);
  await page.locator('[data-health-action="deathSave"]').click();await dialog.locator('[data-health-lucky-feat]').selectOption('before');await stub([1,3,20]);await accept();await faceDialog();assert.equal(await balance(),2);assert.equal(await page.evaluate(()=>getChar().hpCurrent),0);assert.equal(await page.evaluate(()=>getChar().heroicInspiration),false);
  await cancel();assert.equal(await page.evaluate(()=>CritCallRules.deathStatus(getChar()).failures),0);
  await page.locator('[data-health-action="deathSave"]').click();assert.equal(await dialog.locator('[data-lucky-pending]').isVisible(),true);await stub([]);await accept();await faceDialog();assert.equal(await page.evaluate(()=>window.luckyCalls),0);assert.equal(await dialog.locator('[data-lucky-face]').count(),3);await dialog.locator('[data-lucky-face][value="2"]').check();await accept();assert.equal(await page.evaluate(()=>getChar().hpCurrent),1);assert.equal(await balance(),2);
  // Concentração não muda antes de escolher; retorno cancela pontos opostos sem dado extra.
  await page.evaluate(()=>{getChar().hpCurrent=60;CritCallRules.startConcentration(getChar(),{name:'Efeito sintético'});renderAll();});
  const concentration=page.locator('[data-concentration-control]');await concentration.locator('summary').click();await page.locator('[data-concentration-action="environment"]').click();await dialog.locator('[data-health-lucky-feat]').selectOption('before');await stub([1,20]);await accept();await faceDialog();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).name),'Efeito sintético');await dialog.locator('[data-lucky-face][value="1"]').check();await accept();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).name),'Efeito sintético');assert.equal(await balance(),1);
  await reset();if(!await concentration.evaluate(e=>e.open))await concentration.locator('summary').click();
  await page.locator('[data-concentration-action="environment"]').click();await dialog.locator('[data-health-lucky-feat]').selectOption('before');await stub([1,20]);await accept();await faceDialog();await page.evaluate(()=>getChar().hpCurrent--);await dialog.locator('[data-lucky-face][value="0"]').check();await accept();assert.equal(await page.evaluate(()=>CritCallRules.concentration(getChar()).name),'Efeito sintético','escolha antiga não encerra um efeito após mudar a ficha');assert.equal(await balance(),2);
  await page.locator('[data-concentration-action="environment"]').click();await dialog.locator('[data-health-lucky-feat]').selectOption('before');await dialog.locator('[data-health-lucky-opposed]').check();await stub([20]);await accept();await settled();assert.equal(await page.evaluate(()=>window.luckyCalls),1);assert.equal(await balance(),1);
  // Dano/Fúria mantém o próprio formulário ao salvar o custo e retoma sem cobrar/rolar outra vez.
  await page.evaluate(()=>switchCharacter(2));const damage=page.locator('[data-rule-disclosure="healthDamage"]');await damage.locator(':scope > summary').click();await damage.locator('[data-health-damage]').fill('5');await damage.locator('[data-damage-survival]').selectOption('rage');await damage.evaluate(e=>window.luckyDamageForm=e);
  await damage.locator('[data-health-action="damage"]').click();await dialog.locator('[data-health-lucky-feat]').selectOption('before');await stub([1,20]);await accept();await faceDialog();assert.equal(await damage.evaluate(e=>e===window.luckyDamageForm),true);await cancel();assert.equal(await page.evaluate(()=>getChar().hpCurrent),5);assert.equal(await page.evaluate(()=>getChar().ruleState.used['barbaro:relentless'] || 0),0);assert.equal(await damage.locator('[data-health-damage]').inputValue(),'5');
  await damage.locator('[data-health-action="damage"]').click();await stub([]);await accept();await faceDialog();await dialog.locator('[data-lucky-face][value="1"]').check();await accept();assert.equal(await page.evaluate(()=>window.luckyCalls),0);assert.equal(await page.evaluate(()=>getChar().hpCurrent),1);assert.equal(await page.evaluate(()=>getChar().ruleState.used['barbaro:relentless']),1);assert.equal(await balance(),2);
  // Mobile/GG: escolhas por toque, saldo, foco e ausência de transbordamento nos dois layouts/três temas.
  await page.evaluate(()=>{switchCharacter(0);getChar().hpCurrent=60;setTab('lore');savePrivateNotes('Nota sintética Sortudo');setTab('main');});await reset();
  for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']) {
    await page.setViewportSize({width:320,height:950});await page.evaluate(({layout,theme})=>{setLayout(layout);setTheme(theme);setFontScale(125);},{layout,theme});
    await reset();await roll([4,18],'dis');await use([20]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await choice(2).tap();assert.equal(await choice(2).getAttribute('aria-pressed'),'true');assert.equal(await balance(),2);
  }
  await choice(2).scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/critcall-lucky-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{setTheme('pergaminho_claro');setFontScale(100);setLayout('classic_2014');});await page.screenshot({path:'/tmp/critcall-lucky-desktop.png'});
  // Pontos e notas persistem offline; dado rápido continua sem consumir reserva.
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});await page.unroute('**/*');await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof getChar==='function' && !document.getElementById('sheetApp').hidden);
  assert.equal(await balance(),2);assert.equal(await page.evaluate(()=>readPrivateNotes(getChar().id)),'Nota sintética Sortudo');await stub([1]);await page.evaluate(()=>rollQuickD20());await settled();assert.equal(await balance(),2);
  assert.deepEqual(errors,[]);console.log('PASS Sortudo: reserva única/descansos, custos/cancelamento/concorrência, escolha de qualquer d20/crítico/modo, racial/mínimo/inspiração, recebido/físico/OFF/Só Pool, morte/concentração/Fúria com retomada sem novo custo/rolagem, nós/rascunhos, dois layouts/três temas/320px/GG/toque e offline/notas.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
