const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{serve}=require('./serve.cjs'),{warrior}=require('./fixture.cjs');
(async()=>{
 const server=await serve(path.join(__dirname,'../dist')),browser=await chromium.launch();
 try {
  const page=await browser.newPage({viewport:{width:1280,height:950},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(server.url).origin?r.continue():r.abort());
  const c=warrior();c.classes=[{classId:'barbaro',level:3,subclassId:'berserker',subclass:'Berserker',hitDie:12,hitDiceUsed:0}];c.rules={raceId:'humano',legacy:true,history:[]};
  await page.addInitScript(c=>localStorage.setItem('critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[c]})),c);await page.goto(server.url,{waitUntil:'networkidle'});await page.locator('#accessContinueLocal').click();await page.evaluate(()=>{setFontScale(100);setTheme('pergaminho_claro');});
  const rage=page.getByRole('button',{name:'Consultar Fúria',exact:true}),pop=page.locator('#featureConsultation'),tip=page.locator('#ruleTooltip');
  const original=await page.evaluate(()=>JSON.stringify({...getChar(),preferredLayout:null}));await rage.hover();await tip.waitFor({state:'visible'});const text=await tip.locator('p').innerText();await rage.evaluate(e=>window.featureNameNode=e);
  await rage.tap();await pop.waitFor({state:'visible'});assert.equal(await pop.locator('p').innerText(),text);assert.equal(await rage.evaluate(e=>e===window.featureNameNode),true);assert.equal(await page.locator('.feature-entry details').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify({...getChar(),preferredLayout:null})),original);const book=new URL(await pop.locator('a').getAttribute('href'),server.url);assert.equal(book.origin,new URL(server.url).origin);assert.ok(book.pathname.endsWith('/book.html'));assert.match(book.hash,/^#page=\d+$/);
  const y=await page.evaluate(()=>scrollY);await pop.hover();await page.mouse.wheel(0,500);assert.equal(await page.evaluate(()=>scrollY),y);await pop.getByRole('button',{name:'Fechar consulta'}).click();await pop.waitFor({state:'hidden'});
  await rage.focus();await rage.press('Enter');await pop.waitFor({state:'visible'});await page.keyboard.press('Escape');await pop.waitFor({state:'hidden'});assert.equal(await rage.evaluate(e=>e===document.activeElement),true);
  // O toque consulta a regra; o botão de ativar continua sendo outra ação.
  for(const width of [390,430])for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']){
   await page.setViewportSize({width,height:900});await page.evaluate(theme=>{setFontScale(125);setTheme(theme);},theme);
   const cards=await page.locator('.sheet-ability-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,height:r.height};}));
   const rows=new Map();for(const r of cards){const key=Math.round(r.top);rows.set(key,[...(rows.get(key)||[]),r.height]);}assert.ok([...rows.values()].some(r=>r.length>1));for(const heights of rows.values())assert.ok(Math.max(...heights)-Math.min(...heights)<1);
   await rage.tap();await pop.waitFor({state:'visible'});assert.equal(await pop.evaluate(e=>e.scrollWidth>e.clientWidth),false);assert.equal(await page.evaluate(()=>JSON.stringify({...getChar(),preferredLayout:null})),original);await pop.getByRole('button',{name:'Fechar consulta'}).click();
  }
  await rage.tap();await pop.waitFor({state:'visible'});await page.screenshot({path:'/tmp/critcall-feature-consult-mobile.png'});await page.touchscreen.tap(4,4);await pop.waitFor({state:'hidden'});
  await page.locator('[data-resource="barbaro:rage"][data-rule-action="toggle"]').click();assert.equal(await page.evaluate(()=>!!getChar().ruleState.active['barbaro:rage']),true);
  await rage.tap();await pop.waitFor({state:'visible'});await page.evaluate(()=>setTab('spells'));await pop.waitFor({state:'hidden'});assert.deepEqual(errors,[]);
  // O moderno distribui origens inteiras pela largura do quadro, inclusive
  // perto do antigo breakpoint de 1024px, sem remontar consultas/controles.
  await page.evaluate(()=>{
   const c=getChar();c.rules={raceId:'meioElfo',backgroundId:'sabio',history:[{classId:'feiticeiro',level:3,answers:{metamagic:['Magia Acelerada','Magia Duplicada']}}]};
   c.classes=[{classId:'feiticeiro',level:6,subclassId:'selvagem',subclass:'Magia Selvagem',hitDie:6,hitDiceUsed:0},{classId:'bruxo',level:1,subclassId:'corruptor',subclass:'O Corruptor',hitDie:8,hitDiceUsed:0}];setTab('main');setLayout('modern_2024');
  });
  const features=page.locator('[data-sheet-features]'),ancestry=page.getByRole('button',{name:'Consultar Ancestral Feérico',exact:true});
  for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana'])for(const scale of [100,125]) {
   await page.evaluate(({theme,scale})=>{setTheme(theme);setFontScale(scale);},{theme,scale});await ancestry.evaluate(e=>window.ancestryNode=e);
   const unchanged=await page.evaluate(()=>JSON.stringify(getChar()));
   for(const width of [800,1055,1140,1440,320]) {
    await page.setViewportSize({width,height:950});
    assert.equal(await ancestry.evaluate(e=>e===window.ancestryNode),true,'resize preserva o nó da consulta');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await features.evaluate(e=>e.scrollWidth>e.clientWidth),false);
    assert.equal(await page.evaluate(()=>JSON.stringify(getChar())),unchanged);
    const groups=await features.locator('[data-feature-group]').evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,left:Math.round(e.getBoundingClientRect().left),fragments:e.getClientRects().length})));
    assert.ok(groups.every(g=>g.fragments===1),'cada origem/classe fica inteira');
    if(width===1055 && scale===100){assert.ok(new Set(groups.map(g=>g.left)).size>=2);assert.ok(groups.every(g=>g.width<500));}
   }
  }
  await page.setViewportSize({width:1055,height:950});await page.evaluate(()=>{setTheme('pergaminho_claro');setFontScale(100);});
  await features.screenshot({path:'/tmp/critcall-features-modern-1055.png',style:'.app-topbar {visibility:hidden !important;}'});
  await ancestry.hover();await tip.waitFor({state:'visible'});const ancestryText=await tip.locator('p').innerText();assert.match(ancestryText,/vantagem/);assert.doesNotMatch(ancestryText,/FLINT|Tanis|embaixadores/);
  await ancestry.tap();await pop.waitFor({state:'visible'});assert.equal(await pop.locator('p').innerText(),ancestryText);assert.match(await pop.locator('a').getAttribute('href'),/page=38$/);await pop.getByRole('button',{name:'Fechar consulta'}).click();
  for(const [name,pattern,bookPage] of [['Versatilidade em Perícia',/proficiência em duas perícias/,38],['Pesquisador',/biblioteca/,140]]){
   const trigger=page.getByRole('button',{name:'Consultar '+name,exact:true});
   await trigger.hover();await tip.waitFor({state:'visible'});const content=await tip.locator('p').innerText();assert.match(content,pattern);assert.doesNotMatch(content,/FLINT|embaixadores/);
   await trigger.tap();await pop.waitFor({state:'visible'});assert.equal(await pop.locator('p').innerText(),content);assert.ok((await pop.locator('a').getAttribute('href')).endsWith('page='+bookPage));await pop.getByRole('button',{name:'Fechar consulta'}).click();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS consulta: hover e toque com mesmo texto/livro, sem expandir a ficha ou ativar recurso, teclado/Esc/toque fora, rolagem contida, nós/dados preservados e atributos alinhados em 390/430px/GG/três temas.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
