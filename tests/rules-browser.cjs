const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const {serve} = require('./serve.cjs');
const {warrior} = require('./fixture.cjs');
(async()=>{
  const server=await serve(path.join(__dirname,'../dist')), browser=await chromium.launch();
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const c=warrior();c.name='Regras sintéticas';c.classes=[{classId:'barbaro',level:5,subclassId:'berserker',subclass:'Caminho do Furioso',hitDie:12,hitDiceUsed:0}];c.armorEquipped=null;c.shieldEquipped=false;c.abilities.str.score=18;c.proficiencies.weapons='';c.weapons=[{name:'Martelo de Guerra',bonus:'+0',damage:'1d8+0',notes:'',dmgTypeLabel:'concussão'}];c.features=[{title:'Anotação importada',description:'Texto legível'}];
    await page.addInitScript(c=>{if(!localStorage.getItem('rulesSeeded')){localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]}));localStorage.setItem('rulesSeeded','true');}},c);
    await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
    await page.getByRole('button',{name:'Atq +7',exact:true}).waitFor();
    await page.locator('[data-resource="barbaro:rage"][data-rule-action="toggle"]').click();
    assert.equal(await page.locator('[data-resource="barbaro:rage"][data-rule-action="toggle"]').getAttribute('aria-pressed'),'true');
    assert.ok((await page.locator('#sheetViewport').innerText()).includes('Dano 1d8+6'));
    await page.locator('[data-resource="barbaro:frenzy"]').click();
    await page.locator('[data-resource="barbaro:rage"][data-rule-action="toggle"]').click();
    assert.equal(await page.locator('[data-rule-exhaustion]').inputValue(),'1');
    await page.locator('[data-weapon-hands="0"]').selectOption('2');
    assert.ok((await page.locator('#sheetViewport').innerText()).includes('Dano 1d10+4'));
    await page.getByRole('button',{name:'Descrição de Martelo de Guerra',exact:true}).hover();
    await page.locator('#bookTooltip').waitFor({state:'visible'});
    assert.ok((await page.locator('#bookTooltipContent').innerText()).includes('proficiência 3'));
    assert.equal(await page.locator('#bookTooltip p').first().evaluate(el=>getComputedStyle(el).textAlign),'justify');
    await page.evaluate(()=>hideBookTooltip());
    await page.locator('[data-rule-exhaustion]').selectOption('4');
    const hp=await page.evaluate(()=>getChar().hpCurrent);
    assert.ok(hp<=Math.floor(c.hpMax/2));
    assert.ok(!(await page.locator('body').innerText()).includes('[object Object]'));
    await page.evaluate(()=>{setTab('main');shortRest();});
    assert.equal(await page.evaluate(()=>getChar().exhaustion),4);
    // Recarregar conserva recursos e rótulos legíveis.
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('[data-rule-exhaustion]').inputValue(),'4');
    assert.ok(!(await page.locator('body').innerText()).includes('[object Object]'));
    for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']) {
      await page.setViewportSize({width:320,height:760});await page.evaluate(t=>{setTheme(t);setFontScale(125);},theme);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    await page.locator('.rule-panel').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/critcall-rules-mobile.png'});
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>{
      const c=getChar();c.classes=[{classId:'mago',level:3,subclassId:'abjuracao',subclass:'Escola de Abjuração',hitDie:6,hitDiceUsed:0}];c.rules.history=[];c.exhaustion=0;
      c.spells=[CharacterEngine.toSheetSpell(CharacterEngine.spell('detectar-magia'),'mago',{prepared:false})];c.standardSlots={1:{used:0,total:4}};
      recordStepAndSave('Magia sintética não preparada',true);setTab('spells');toggleAllPanels(false);
    });
    assert.equal(await page.locator('[data-cast-spell="0"]').count(),0,'ritual não preparado não pode ser lançado normalmente');
    assert.ok((await page.locator('#sheetViewport').innerText()).includes('Não preparada · ritual disponível'));
    await page.getByRole('button',{name:'Ritual',exact:true}).click();
    assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),0);
    await page.evaluate(()=>{getChar().spells[0].prepared=true;recordStepAndSave('Preparou a magia sintética',true);});
    await page.locator('[data-cast-spell="0"]').click();
    assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1,'magia ritual preparada gasta espaço no lançamento normal');
    const book=await browser.newPage();book.on('pageerror',e=>errors.push(e.message));
    await book.goto(server.url+'book.html#page=148');
    await book.waitForFunction(()=>document.querySelector('#bookReader').dataset.renderedPage==='148' && document.querySelector('#bookReader').getAttribute('aria-busy')==='false');
    const font=await book.evaluate(()=>getComputedStyle(document.documentElement).fontSize);
    await book.keyboard.press('Control++');
    assert.ok(Number(await book.locator('#bookZoom').inputValue())>1);
    await book.keyboard.press('Control+0');assert.equal(await book.locator('#bookZoom').inputValue(),'1');
    await book.locator('#bookReader').dispatchEvent('wheel',{ctrlKey:true,deltaY:-120,bubbles:true,cancelable:true});
    assert.ok(Number(await book.locator('#bookZoom').inputValue())>1);
    assert.equal(await book.evaluate(()=>getComputedStyle(document.documentElement).fontSize),font);
    assert.deepEqual(errors,[]);
    console.log('PASS regras na interface: arma importada, proficiência, mãos, fúria/frenesi/exaustão, texto recuperado, persistência, três temas/320px/GG e zoom local de teclado/rodinha.');
  } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
