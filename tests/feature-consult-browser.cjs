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
  console.log('PASS consulta: hover e toque com mesmo texto/livro, sem expandir a ficha ou ativar recurso, teclado/Esc/toque fora, rolagem contida, nós/dados preservados e atributos alinhados em 390/430px/GG/três temas.');
 }finally{await browser.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
