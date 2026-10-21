const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
const {unlockSheet}=require('./sheet-lock-actions.cjs'),{confirmationActions}=require('./confirmation.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try {
  const page=await browser.newPage({viewport:{width:1140,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.weapons[0].tableReference={origin:'Exemplo sintético',reviewed:true};
  await page.addInitScript(c=>{if(!localStorage.getItem('weaponEditorSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('weaponEditorSeeded','1');}},c);
  await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await unlockSheet(page);
  await page.evaluate(()=>{setDiceMode('off');setFontScale(100);setTheme('pergaminho_claro');openHomebrewModal('weapon');});
  const editor=page.locator('#homebrewModal'),field=id=>editor.locator('#'+id),adjustments=editor.locator('.weapon-editor-adjustments'),{accept,cancel}=confirmationActions(page);
  // A captura do editor inteiro não deve pintar o cabeçalho fixo da página
  // sobre o início do recorte, que é maior que a janela em fonte GG.
  const screenshot=path=>editor.screenshot({path,style:'.app-topbar,#toast,[role=tooltip] {visibility:hidden !important;}'});
  const original=await page.evaluate(()=>JSON.stringify({...getChar(),preferredLayout:null}));
  await field('hbWepName').fill('Ataque da mesa');await field('hbWepBonus').fill('+5');await editor.getByRole('button',{name:'Limpar dados',exact:true}).click();
  await field('hbDamageDie8').click();await field('hbDamageDie4').click();await field('hbWepDamageMod').fill('3');
  await field('hbWepNotes').fill('Resumo preservado');await field('hbWepDescription').fill('Descrição da mesa.');
  await field('hbWepName').evaluate(e=>{window.weaponEditor=e.closest('#homebrewModal');window.weaponName=e;});
  // Alternar cálculo não recria campos nem descarta os totais digitados.
  await field('hbWepMode').selectOption('auto');assert.equal(await field('hbWepBonus').isDisabled(),true);assert.equal(await field('hbDamageDie8').isDisabled(),true);
  await field('hbWepMode').selectOption('manual');assert.equal(await field('hbWepBonus').inputValue(),'+5');assert.equal(await field('hbWepDmg').inputValue(),'1d4+1d8+3');
  await adjustments.locator('summary').click();await field('hbWepProf').selectOption('yes');await field('hbWepMagic').fill('2');await field('hbWepAttackAdjust').fill('1');await field('hbWepDamageAdjust').fill('2');await field('hbWepDuel').check();
  const checkLayout=async()=>{
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await editor.evaluate(e=>e.scrollWidth>e.clientWidth),false);
   const issues=await editor.evaluate(e=>{
    const result=[],bounds=e.getBoundingClientRect(),visible=n=>!!n.getClientRects().length;
    for(const control of e.querySelectorAll('input,select,textarea,button'))if(visible(control)){
     const r=control.getBoundingClientRect();if(r.left<bounds.left-1||r.right>bounds.right+1||r.width<10)result.push(control.id||control.textContent);
    }
    for(const label of e.querySelectorAll('.weapon-editor-field')){
     const text=label.querySelector('span'),control=label.querySelector('input,select');if(!visible(control))continue;
     if(text.getBoundingClientRect().bottom>control.getBoundingClientRect().top)result.push(text.textContent+' sobreposto');
    }
    for(const label of e.querySelectorAll('.weapon-editor-checks label')){
     const input=label.querySelector('input'),text=label.querySelector('span');if(visible(input)&&input.getBoundingClientRect().right>text.getBoundingClientRect().left)result.push('checkbox sobreposto');
    }
    return result;
   });assert.deepEqual(issues,[]);
   assert.equal(await field('hbWepName').evaluate(e=>e===window.weaponName&&e.closest('#homebrewModal')===window.weaponEditor),true);
   assert.equal(await field('hbWepName').inputValue(),'Ataque da mesa');assert.equal(await field('hbWepMagic').inputValue(),'2');assert.equal(await page.evaluate(()=>JSON.stringify({...getChar(),preferredLayout:null})),original);
  };
  // A largura real da coluna também conta no desktop; temas e GG não podem
  // devolver controles nativos brancos ou causar sobreposição no celular.
  for(const width of [1140,320])for(const layout of ['classic_2014','modern_2024'])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width,height:1000});await page.evaluate(({layout,theme,width})=>{setLayout(layout);setTheme(theme);setFontScale(width===320?125:100);},{layout,theme,width});
   await checkLayout();const backgrounds=await editor.locator('#hbWepMagic,#hbWepMode,#hbWepName').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundColor));assert.equal(new Set(backgrounds).size,1);assert.notEqual(backgrounds[0],'rgb(255, 255, 255)');
  }
  await screenshot('/tmp/critcall-weapon-editor-mobile-expanded.png');await adjustments.locator('summary').click();await screenshot('/tmp/critcall-weapon-editor-mobile.png');
  await page.setViewportSize({width:1140,height:1000});await page.evaluate(()=>{setLayout('classic_2014');setTheme('pergaminho_claro');setFontScale(100);});await screenshot('/tmp/critcall-weapon-editor-desktop.png');
  await field('hbSaveBtn').click();await editor.waitFor({state:'hidden'});const manual=await page.evaluate(()=>getChar().weapons.at(-1));
  assert.equal(manual.damage,'1d4+1d8+3');assert.equal(manual.bonus,'+5');assert.equal(manual.calculationMode,'manual');assert.equal(manual.proficient,true);assert.equal(manual.magicBonus,2);assert.equal(manual.attackAdjustment,1);assert.equal(manual.damageAdjustment,2);assert.equal(manual.duelingEligible,true);assert.equal(manual.description,'Descrição da mesa.');
  // Editar a arma automática conserva catálogo, metadados e cálculo usado
  // pelos botões. Cancelar uma segunda edição mantém a versão salva.
  await page.evaluate(()=>openHomebrewModal('weapon',0));assert.equal(await field('hbWepMode').inputValue(),'auto');await adjustments.locator('summary').click();await field('hbWepMagic').fill('2');await field('hbWepAttackAdjust').fill('1');await field('hbWepDamageAdjust').fill('2');
  await screenshot('/tmp/critcall-weapon-editor-auto.png');await field('hbSaveBtn').click();assert.deepEqual(await page.evaluate(()=>getChar().weapons[0].tableReference),c.weapons[0].tableReference);assert.equal(await page.evaluate(()=>getChar().weapons[0].ruleWeapon),'Alabarda');
  const card=page.locator('[data-weapon-card="0"]');assert.match(await card.locator('.weapon-rolls').innerText(),/Atq \+8/);assert.match(await card.locator('.weapon-rolls').innerText(),/Dano 1d10\+7/);
  const saved=await page.evaluate(()=>JSON.stringify(getChar()));await page.evaluate(()=>openHomebrewModal('weapon',0));await field('hbWepName').fill('Não salvar');await editor.getByRole('button',{name:'Cancelar',exact:true}).click();await cancel();assert.equal(await field('hbWepName').inputValue(),'Não salvar');await editor.getByRole('button',{name:'Cancelar',exact:true}).click();await accept();assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),saved);
  await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>getChar().weapons.at(-1).damage),'1d4+1d8+3');assert.deepEqual(await page.evaluate(()=>getChar().weapons[0].tableReference),c.weapons[0].tableReference);assert.deepEqual(errors,[]);
  console.log('PASS editor de armas: manual/automático, dados/ajustes/metadados, cancelar e recarregar, mesmos nós/rascunhos, coluna estreita/320px/GG/três temas/dois layouts sem sobreposição.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
