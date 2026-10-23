// Diagnóstico da ficha publicada em dist/, com personagens inteiramente fictícios.
// Executar após npm run build: node --import tsx scripts/audit-book-ui.cjs
// Não faz parte da suíte de aprovação: divergências documentam trabalho pendente.
const path=require('node:path');
const {isDeepStrictEqual}=require('node:util');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const {serve}=require('../tests/serve.cjs');
const {makeAuditCharacter:make}=require('./audit-book-consistency.cjs');

async function auditBookUI(){
  const fixtures={mage:make('mago',20,'abjuracao'),fighter:make('guerreiro',5,'campeao'),champion:make('guerreiro',7,'campeao'),cleric:make('clerigo',3,'enganacao'),intervention:make('clerigo',20,'vida'),paladin:make('paladino',20,'devocao'),sorcerer:make('feiticeiro',18,'draconica'),druid:make('druida',5,'lua'),portent:make('mago',14,'adivinhacao')};
  fixtures.sorcerer.rules.history.find(h=>h.level===3).answers.metamagic=['Magia Duplicada','Magia Sutil'];
  const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
  try{
    const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
    await page.addInitScript(c=>localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]})),fixtures.fighter);
    await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();
    await page.evaluate(fixtures=>{
      window.auditFixtures=fixtures;window.auditCases=[];
      window.auditRecord=(id,expected,actual)=>auditCases.push({id,expected,actual,matches:JSON.stringify(expected)===JSON.stringify(actual)});
      window.auditUse=id=>{characters.splice(0,characters.length,structuredClone(auditFixtures[id]));switchCharacter(0);setDiceMode('off');setTab('main');return getChar();};
    },fixtures);
    await page.evaluate(()=>{
      const c=auditUse('mage');c.spells=['Chuva de Meteoros','Tempestade de Gelo','Raio de Bruxa','Raio Solar','Zona da Verdade'].map(n=>CharacterEngine.toSheetSpell(CharacterEngine.spell(n),'mago',{prepared:true}));setTab('spells');
      for(const[i,circle,formula]of [[0,9,'20d6+20d6'],[1,4,'2d8+4d6'],[2,3,'3d12']]){
        setSpellCastLevelByIndex(i,circle);const effect=getSpellEffectDetails(c,c.spells[i],i);
        auditRecord(c.spells[i].name+'/previa',formula,effect.formula);
      }
      setDiceMode('auto');castSpellByIndex(0);
      auditRecord('meteoros/rolagem','40d6',document.getElementById('dicePoolDisplay').textContent.replace(/\s+/g,''));
      setDiceMode('off');
    });
    await page.waitForFunction(()=>document.getElementById('dice3dResultText').textContent.includes('Concussão:'));
    await page.evaluate(()=>auditRecord('meteoros/tipos-rolados',true,document.getElementById('dice3dResultText').textContent.includes('Fogo:')));
    await page.getByRole('button',{name:'Consultar descrição de Zona da Verdade',exact:true}).click();
    const text=await page.locator('#featureConsultation').innerText();
    await page.evaluate(text=>auditRecord('zona/texto-flutuante',false,text.includes('APÊNDICE A')),text);
    await page.screenshot({path:'/tmp/critcall-auditoria-zona.png'});
    await page.getByRole('button',{name:'Fechar consulta',exact:true}).click();
    await page.evaluate(()=>{
      const c=auditUse('paladin');c.spells=[CharacterEngine.toSheetSpell(CharacterEngine.spell('Onda Destrutiva'),'paladino',{prepared:true})];setTab('spells');
      const before=c.standardSlots[5].used;castSpellByIndex(0);
      auditRecord('onda/conjura-com-formula-valida',{used:before+1,invalid:false},{used:c.standardSlots[5].used,invalid:document.body.textContent.includes('Não foi possível montar uma rolagem válida')});
    });
    await page.evaluate(()=>{const c=auditUse('champion');c.abilities.dex.score=14;c.classes[0].subclassId='';c.classes[0].subclass='Campeão (livro de 2014)';setDiceMode('auto');renderAll();});
    for(const layout of ['classic_2014','modern_2024']){
      await page.evaluate(layout=>setLayout(layout),layout);
      await page.locator('button[onclick*="Teste de Destreza"]').click();
      await page.evaluate(layout=>auditRecord('atletismo/teste-direto/'+layout,'4',document.getElementById('dicePoolModInput').value),layout);
    }
    await page.evaluate(()=>auditUse('fighter'));await page.locator('#sheetEditLock').click();
    const before=await page.evaluate(()=>({score:getChar().abilities.con.score,max:getChar().hpMax}));
    await page.locator('[data-sheet-field="abilities.con.score"]').fill(String(before.score+2));await page.keyboard.press('Tab');
    await page.waitForFunction(score=>getChar().abilities.con.score===score,before.score+2);
    await page.evaluate(expected=>auditRecord('con/digitar',expected,getChar().hpMax),before.max+5);
    await page.evaluate(expected=>{auditUse('fighter');if(document.getElementById('sheetEditLock').getAttribute('aria-pressed')!=='true')document.getElementById('sheetEditLock').click();changeAbility('con',2);auditRecord('con/botoes',expected,getChar().hpMax);},before.max+5);
    await page.evaluate(()=>{
      const c=auditUse('fighter');c.hpCurrent=10;setDiceMode('off');renderAll();
      window.auditRandom=Math.random;window.auditRandomCalls=0;Math.random=()=>{auditRandomCalls++;return 0;};
      document.querySelector('[data-rule-action="use"][data-resource="guerreiro:secondWind"]').click();
      auditRecord('retomar-folego/OFF/dado-virtual',0,auditRandomCalls);
      auditRecord('retomar-folego/OFF/cura-imediata',10,c.hpCurrent);
    });
    await page.getByRole('button',{name:'Cancelar',exact:true}).click();
    await page.evaluate(()=>auditRecord('retomar-folego/cancelar',undefined,getChar().ruleState?.used?.['guerreiro:secondWind']));
    await page.locator('[data-rule-action="use"][data-resource="guerreiro:secondWind"]').click();
    await page.locator('[data-health-face]').fill('4');
    await page.getByRole('button',{name:'Aplicar resultado',exact:true}).click();
    await page.waitForFunction(()=>getChar().hpCurrent===19);
    await page.evaluate(()=>{auditRecord('retomar-folego/face-fisica',{hp:19,used:1,calls:0},{hp:getChar().hpCurrent,used:getChar().ruleState.used['guerreiro:secondWind'],calls:auditRandomCalls});Math.random=auditRandom;});
    await page.evaluate(()=>{const c=auditUse('fighter');c.hpCurrent=10;setDiceMode('auto');renderAll();window.auditRandom=Math.random;Math.random=()=>0;});
    await page.locator('[data-rule-action="use"][data-resource="guerreiro:secondWind"]').click();
    await page.locator('#confirmationAccept').click();
    await page.waitForFunction(()=>getChar().hpCurrent===16);
    await page.evaluate(()=>{auditRecord('retomar-folego/dado-virtual',{hp:16,used:1},{hp:getChar().hpCurrent,used:getChar().ruleState.used['guerreiro:secondWind']});Math.random=auditRandom;});
    await page.evaluate(()=>{
      const c=auditUse('cleric');CritCallRules.startConcentration(c,{name:'Bênção'});renderAll();
      document.querySelector('[data-rule-action="toggle"][data-resource="clerigo:duplicate"]').click();
    });
    await page.getByRole('button',{name:'Cancelar',exact:true}).click();
    await page.evaluate(()=>{auditRecord('duplicidade/cancelar-conserva-concentracao','Bênção',CritCallRules.concentration(getChar())?.name);auditRecord('duplicidade/cancelar-sem-gasto',undefined,getChar().ruleState.used['shared:channel']);});
    await page.locator('[data-rule-action="toggle"][data-resource="clerigo:duplicate"]').click();
    await page.locator('#confirmationAccept').click();
    await page.waitForFunction(()=>getChar().ruleState?.active?.['clerigo:duplicate']);
    await page.evaluate(()=>{const c=getChar();auditRecord('duplicidade/interface',false,CritCallRules.concentration(c)?.name==='Bênção');auditRecord('duplicidade/desconta-uma-reserva',1,c.ruleState.used['shared:channel']);auditRecord('duplicidade/vinculo','clerigo:duplicate',CritCallRules.concentration(c)?.resourceId);});
    await page.locator('[data-concentration-control] summary').click();
    await page.locator('[data-concentration-action="end"]').click();
    await page.evaluate(()=>auditRecord('duplicidade/encerra-junto',false,getChar().ruleState.active['clerigo:duplicate']));
    await page.evaluate(()=>{
      const c=auditUse('intervention');
      document.querySelector('[data-rule-action="use"][data-resource="clerigo:intervention"]').click();
      auditRecord('intervencao/bloqueio-pelo-relogio-real',false,(c.ruleState.blockedUntil?.['clerigo:intervention']||0)>Date.now()+6*24*60*60*1000);
      auditRecord('intervencao/semana-na-aventura',true,c.ruleState.interventionPending);
    });
    await page.locator('[data-rule-action="interventionWeek"]').click();
    await page.getByRole('button',{name:'A semana passou',exact:true}).click();
    await page.waitForFunction(()=>getChar().ruleState.interventionPending===false);
    await page.evaluate(()=>auditRecord('intervencao/libera-semana',0,getChar().ruleState.used['clerigo:intervention']));
    await page.evaluate(()=>{const c=auditUse('druid');c.ruleState={active:{'druida:wildShape':true},pools:{'druida:wildShape':3},beastMax:20};renderAll();window.auditRandom=Math.random;window.auditRandomCalls=0;Math.random=()=>{auditRandomCalls++;return 0;};});
    await page.locator('[data-rule-action="use"][data-resource="druida:combatHealing"]').click();
    await page.locator('[data-heal-slot]').selectOption('2');
    await page.locator('#confirmationAccept').click();
    await page.locator('[data-resource-die]').nth(0).fill('3');
    await page.locator('[data-resource-die]').nth(1).fill('5');
    await page.locator('#confirmationAccept').click();
    await page.waitForFunction(()=>getChar().ruleState.pools['druida:wildShape']===11);
    await page.evaluate(()=>{const c=getChar();auditRecord('forma-lua/fisico-sem-sorteio',{hp:11,used:1,calls:0},{hp:c.ruleState.pools['druida:wildShape'],used:c.standardSlots[2].used,calls:auditRandomCalls});Math.random=auditRandom;});
    await page.evaluate(()=>{const c=auditUse('portent');c.ruleState={portent:[]};renderAll();window.auditRandom=Math.random;window.auditRandomCalls=0;Math.random=()=>{auditRandomCalls++;return 0;};});
    await page.locator('[data-rule-action="portentInitial"]').click();
    for(const[i,face]of ['2','13','20'].entries())await page.locator('[data-resource-die]').nth(i).fill(face);
    await page.locator('#confirmationAccept').click();
    await page.waitForFunction(()=>getChar().ruleState.portent.length===3);
    await page.evaluate(()=>auditRecord('pressagio/inicial-fisico',[2,13,20],getChar().ruleState.portent.map(p=>p.value)));
    await page.evaluate(()=>void longRest());
    await page.locator('#confirmationAccept').click();
    for(const[i,face]of ['4','10','17'].entries())await page.locator('[data-resource-die]').nth(i).fill(face);
    await page.locator('#confirmationAccept').click();
    await page.waitForFunction(()=>getChar().ruleState.portent[0].value===4);
    await page.evaluate(()=>{auditRecord('pressagio/descanso-fisico',{faces:[4,10,17],calls:0},{faces:getChar().ruleState.portent.map(p=>p.value),calls:auditRandomCalls});Math.random=auditRandom;});
    await page.evaluate(()=>{const c=auditUse('portent');c.ruleState={portent:[]};setDiceMode('auto');renderAll();window.auditRandom=Math.random;Math.random=()=>0;});
    await page.locator('[data-rule-action="portentInitial"]').click();
    await page.evaluate(()=>auditRecord('pressagio/virtual-desabilita-todas-faces',true,[...document.querySelectorAll('[data-resource-die]')].every(field=>field.disabled)));
    await page.locator('[data-health-source]').selectOption('physical');
    await page.locator('[data-resource-die]').nth(1).fill('25');
    await page.locator('[data-health-source]').selectOption('virtual');
    await page.locator('#confirmationAccept').click();
    await page.waitForFunction(()=>getChar().ruleState.portent.length===3);
    await page.evaluate(()=>{auditRecord('pressagio/troca-fisico-virtual',[1,1,1],getChar().ruleState.portent.map(p=>p.value));Math.random=auditRandom;});
    await page.evaluate(()=>{
      const c=auditUse('sorcerer');c.spells=[CharacterEngine.toSheetSpell(CharacterEngine.spell('Ilusão Menor'),'feiticeiro')];setTab('spells');
      auditRecord('ilusao-menor/botao-gemea',0,document.querySelectorAll('button[aria-label="Ativar Magia Gêmea para Ilusão Menor"]').length);
    });
    await page.setViewportSize({width:390,height:850});await page.evaluate(()=>setFontScale(125));
    await page.screenshot({path:'/tmp/critcall-auditoria-grimorio-mobile.png'});
    const cases=await page.evaluate(()=>auditCases);
    cases.push({id:'erros-javascript',expected:[],actual:errors,matches:isDeepStrictEqual(errors,[])});
    return {sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:path.join(__dirname,'..'),encoding:'utf8'}).trim(),buildRevision:await page.locator('meta[name="critcall-build"]').getAttribute('content'),scope:'Chromium, build dist sob /D-D/, conta local fictícia, rede externa bloqueada; nenhuma alteração em dados reais',summary:{cases:cases.length,divergences:cases.filter(c=>!c.matches).length},cases};
  }finally{await browser.close();await server.close();}
}
module.exports={auditBookUI};
if(require.main===module)auditBookUI().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1;});
