const {unlockSheet}=require('./sheet-lock-actions.cjs');
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
    const defense=page.locator('[data-rule-disclosure="defense"]');
    await defense.locator('summary').click();
    assert.equal(await defense.locator('button').count(),0);
    assert.equal(await defense.locator('[data-rule-tooltip]').count(),7);
    for(const label of await defense.locator('[data-rule-tooltip]').all()) {
      await label.hover();await page.locator('#ruleTooltip').waitFor({state:'visible'});
      await page.waitForFunction(name=>document.querySelector('#ruleTooltip strong')?.textContent===name,JSON.parse(await label.getAttribute('data-rule-tooltip')).name);
      assert.ok((await page.locator('#ruleTooltip').innerText()).length>80);
      assert.equal(await defense.locator('input[type="checkbox"]:checked').count(),0,'passar o mouse não marca o efeito');
    }
    await defense.locator('summary').focus();await page.keyboard.press('Tab');
    await page.waitForFunction(()=>document.querySelector('#ruleTooltip')?.hidden===false && document.querySelector('#ruleTooltip strong')?.textContent==='Fórmula de CA');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('heading',{name:'Recursos e condições',exact:true}).count(),0);
    const rageEntry=page.locator('.feature-entry').filter({has:page.locator('[data-resource="barbaro:rage"]')});
    await rageEntry.locator('summary').click();
    await page.locator('[data-resource="barbaro:rage"][data-rule-action="toggle"]').click();
    assert.equal(await rageEntry.locator('details').getAttribute('open'),'');
    assert.equal(await page.locator('[data-rule-control="barbaro:rage"]').count(),1);
    assert.ok(await page.locator('[data-rule-exhaustion]').evaluate(el=>el.closest('.t-card-accent').textContent.includes('Status de Combate')));
    assert.equal(await page.locator('[data-resource="barbaro:rage"][data-rule-action="toggle"]').getAttribute('aria-pressed'),'true');
    assert.ok((await page.locator('#sheetViewport').innerText()).includes('Dano 1d8+6'));
    await page.locator('[data-resource="barbaro:frenzy"]').click();
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.resource),'barbaro:frenzy');
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
    await page.locator('.feature-list').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/critcall-rules-mobile.png'});
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>{
      const c=getChar();c.classes=[{classId:'mago',level:3,subclassId:'abjuracao',subclass:'Escola de Abjuração',hitDie:6,hitDiceUsed:0}];c.rules.history=[];c.exhaustion=0;
      c.spells=[CharacterEngine.toSheetSpell(CharacterEngine.spell('detectar-magia'),'mago',{prepared:false})];c.standardSlots={1:{used:0,total:4}};
      recordStepAndSave('Magia sintética não preparada',true);setTab('spells');toggleAllPanels(false);
    });
    assert.equal(await page.locator('[data-cast-spell="0"]').count(),0,'ritual não preparado não pode ser lançado normalmente');
    assert.equal(await page.locator('[data-rule-action="prepare"][data-class="mago"]').count(),1);
    assert.ok((await page.locator('#sheetViewport').innerText()).includes('Não preparada · ritual disponível'));
    await page.getByRole('button',{name:'Ritual',exact:true}).click();
    assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),0);
    await page.evaluate(()=>{getChar().spells[0].prepared=true;recordStepAndSave('Preparou a magia sintética',true);});
    await page.locator('[data-cast-spell="0"]').click();
    assert.equal(await page.evaluate(()=>getChar().standardSlots[1].used),1,'magia ritual preparada gasta espaço no lançamento normal');
    // Feitiçaria tem uma reserva e uma ação por opção, no grimório existente.
    await page.evaluate(()=>{
      const c=getChar();c.classes=[{classId:'feiticeiro',level:6,subclassId:'selvagem',subclass:'Magia Selvagem',hitDie:6,hitDiceUsed:0},{classId:'bruxo',level:1,subclassId:'corruptor',subclass:'O Corruptor',hitDie:8,hitDiceUsed:0}];
      c.rules.history=[{classId:'feiticeiro',level:3,answers:{metamagic:['Magia Acelerada','Magia Sutil']}}];c.ruleState={used:{},active:{},pools:{},targets:{}};
      c.sorceryPoints={max:6,current:6};c.pactMagic={level:1,total:1,used:0};c.spells=[];
      recordStepAndSave('Feiticeiro e bruxo sintéticos',true);setTab('main');toggleAllPanels(false);
    });
    assert.equal(await page.locator('[data-rule-control^="feiticeiro:"]').count(),0);
    assert.ok(!(await page.locator('#sheetViewport').innerText()).includes('Pts Feitiçaria'));
    assert.equal(await page.locator('button[onclick="triggerBencaoChamasNegras()"]').count(),1);
    await page.evaluate(()=>setTab('spells'));
    assert.equal(await page.locator('button[onclick="triggerBencaoChamasNegras()"]').count(),0);
    assert.equal(await page.getByRole('button',{name:/^Magia Acelerada/}).count(),1);
    assert.equal(await page.getByRole('button',{name:/^Dobrar a Sorte/}).count(),1);
    assert.equal(await page.locator('[data-rule-control="feiticeiro:tides"]').count(),1);
    assert.equal(await page.locator('[data-rule-control="feiticeiro:sorcery"]').count(),0);
    await page.getByRole('button',{name:/^Magia Acelerada/}).click();
    assert.equal(await page.evaluate(()=>getChar().sorceryPoints.current),4);
    await page.locator('[data-resource="feiticeiro:meta-magia-sutil"][data-rule-action="use"]').click();
    assert.equal(await page.evaluate(()=>getChar().sorceryPoints.current),3);
    await page.reload({waitUntil:'networkidle'});await page.evaluate(()=>setTab('spells'));
    assert.equal(await page.evaluate(()=>getChar().sorceryPoints.current),3);
    for(const layout of ['classic_2014','modern_2024']) for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']) {
      await page.setViewportSize({width:320,height:760});await page.evaluate(({layout,theme})=>{setTheme(theme);setFontScale(125);getChar().preferredLayout=layout;recordStepAndSave('Apresentação sintética',true);setTab('main');}, {layout,theme});
      assert.equal(await page.locator('[data-rule-exhaustion]').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.evaluate(()=>setTab('spells'));
      assert.equal(await page.locator('[data-rule-control="feiticeiro:tides"]').count(),1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await page.evaluate(()=>setTab('main'));await defense.locator('summary').click();
      assert.equal(await defense.evaluate(el=>el.scrollWidth>el.clientWidth),false);
      for(const label of await defense.locator('.rule-effect-row label').all()) {
        assert.ok(await label.evaluate(el=>el.querySelector('span').getBoundingClientRect().left-el.querySelector('input').getBoundingClientRect().right>=7),'texto separado da caixa nos três temas/320px/GG');
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>{setTheme('pergaminho_claro');setFontScale(100);setLayout('classic_2014');setTab('main');scrollTo(0,0);});
    await page.screenshot({path:'/tmp/critcall-context-main.png'});
    await page.evaluate(()=>{setTab('spells');scrollTo(0,0);});
    await page.screenshot({path:'/tmp/critcall-context-spells.png'});
    // Evolução: reutiliza a grade da criação sem listas/dicas por ponto.
    await unlockSheet(page);
    await page.evaluate(()=>{
      const c=getChar();c.classes=[{classId:'barbaro',level:3,subclassId:'berserker',subclass:'Caminho do Furioso',hitDie:12,hitDiceUsed:0}];c.rules.history=[];c.rules.allowFeats=true;c.abilities.str.score=19;c.abilities.con.score=18;c.abilities.cha.score=20;
      c.sorceryPoints={max:0,current:0};c.pactMagic={level:0,total:0,used:0};c.ruleState={used:{},active:{},pools:{},targets:{}};
      recordStepAndSave('Bárbaro para evolução sintética',true);openLevelUpModal();
    });
    const wizard=page.locator('#characterWizard'),next=()=>wizard.locator('[data-action="next"]').click();
    await next();await next();
    await wizard.locator('[data-answer="advancement"]').selectOption('asi');
    assert.equal(await wizard.locator('[data-answer="asi"]').count(),0);
    assert.equal(await wizard.locator('.cw-asi-grid .cw-source').count(),0);
    const score=key=>wizard.locator(`.cw-asi-grid [data-ability-card="${key}"]`);
    assert.equal(await score('cha').locator('[data-increment="1"]').isDisabled(),true);
    await page.evaluate(()=>window.incrementGrid=document.querySelector('.cw-asi-grid'));
    await score('con').locator('[data-increment="1"]').click();await score('con').locator('[data-increment="1"]').click();
    assert.equal(await score('con').locator('[data-increment-value]').innerText(),'20');
    assert.equal(await score('str').locator('[data-increment="1"]').isDisabled(),true);
    await score('con').locator('[data-increment="-1"]').click();await score('str').locator('[data-increment="1"]').click();
    assert.equal(await score('str').locator('[data-increment-value]').innerText(),'20');
    assert.equal(await score('con').locator('[data-increment-value]').innerText(),'19');
    assert.equal(await page.evaluate(()=>window.incrementGrid.isConnected),true);
    await wizard.locator('[data-action="back"]').click();await next();
    assert.equal(await score('str').locator('[data-increment-value]').innerText(),'20');
    for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']) {
      await page.setViewportSize({width:320,height:760});await page.evaluate(t=>{setTheme(t);setFontScale(125);},theme);
      assert.equal(await wizard.locator('.cw-dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    }
    await page.setViewportSize({width:1100,height:850});await page.evaluate(()=>setFontScale(100));
    await page.screenshot({path:'/tmp/critcall-asi.png'});
    await next();await next();await wizard.locator('[data-action="finish"]').click();await wizard.waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>getChar().abilities.str.score),20);assert.equal(await page.evaluate(()=>getChar().abilities.con.score),19);
    assert.equal(await page.evaluate(()=>getChar().classes[0].level),4);
    // Desfazer A não restaura B nem altera notas; excluir B conserva seu próprio histórico.
    const aId=await page.evaluate(()=>{
      getChar().name='Ficha A';getChar().coins.po=10;recordStepAndSave('A10');getChar().coins.po=20;recordStepAndSave('A20');
      const aId=getChar().id,b=structuredClone(getChar());b.id=crypto.randomUUID();b.name='Ficha B';b.coins.po=50;commitCreatedCharacter(b);
      b.coins.po=70;recordStepAndSave('B70');localStorage.setItem('dnd_player_private_notes_v1',JSON.stringify({[aId]:'Nota A',[b.id]:'Nota B'}));
      switchCharacter(characters.findIndex(c=>c.id===aId));return aId;
    });
    await page.evaluate(()=>undoStep());
    assert.equal(await page.evaluate(()=>getChar().coins.po),10);
    assert.equal(await page.evaluate(()=>characters.find(c=>c.name==='Ficha B').coins.po),70);
    await page.evaluate(()=>redoStep());assert.equal(await page.evaluate(()=>getChar().coins.po),20);
    await page.evaluate(()=>jumpToHistoryStep(0));assert.equal(await page.evaluate(()=>characters.find(c=>c.name==='Ficha B').coins.po),70);
    await page.evaluate(()=>{window.pendingDeletion=deleteCharacter(characters.findIndex(c=>c.name==='Ficha B'));});await page.locator('#confirmationAccept').click();
    await page.evaluate(()=>window.pendingDeletion);
    assert.equal(await page.evaluate(()=>characters.length),1);
    await page.evaluate(()=>toggleHistoryDrawer());await page.locator('#deletedCharacterHistories summary').click();
    await page.getByRole('button',{name:'Restaurar Ficha B',exact:true}).click();
    assert.equal(await page.evaluate(()=>getChar().name),'Ficha B');assert.equal(await page.evaluate(()=>getChar().coins.po),70);
    assert.ok(!(await page.locator('#historyTimelineList').innerText()).includes('A20'));
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>getChar().coins.po),70);
    assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('dnd_player_private_notes_v1'))[id],aId),'Nota A');
    const book=await browser.newPage();book.on('pageerror',e=>errors.push(e.message));
    await book.goto(server.url+'book.html#page=148');
    await book.waitForFunction(()=>document.querySelector('#bookReader').dataset.renderedPage==='148' && document.querySelector('#bookReader').getAttribute('aria-busy')==='false');
    const font=await book.evaluate(()=>getComputedStyle(document.documentElement).fontSize);
    await book.keyboard.press('Control++');
    assert.ok(Number(await book.locator('#bookZoom').inputValue())>1);
    for(const delta of [-85,140,-230,60,-150]) await book.locator('#bookReader').dispatchEvent('wheel',{ctrlKey:true,deltaY:delta,bubbles:true,cancelable:true});
    assert.ok(await book.locator('#bookZoom [data-custom-zoom]').count()<=1,'porcentagens intermediárias não acumulam opções');
    await book.locator('#bookZoom').selectOption('1');assert.equal(await book.locator('#bookZoom [data-custom-zoom]').count(),0);
    await book.keyboard.press('Control+0');assert.equal(await book.locator('#bookZoom').inputValue(),'1');
    await book.locator('#bookReader').dispatchEvent('wheel',{ctrlKey:true,deltaY:-120,bubbles:true,cancelable:true});
    assert.ok(Number(await book.locator('#bookZoom').inputValue())>1);
    assert.equal(await book.evaluate(()=>getComputedStyle(document.documentElement).fontSize),font);
    assert.deepEqual(errors,[]);
    console.log('PASS regras na interface: arma importada, mãos, fúria/frenesi/exaustão, controles únicos nos locais existentes, feitiçaria compartilhada/persistente, preparação sem duplicação, layouts/temas/320px/GG e zoom local.');
  } finally {await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
