const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.DND_PLAYWRIGHT_MODULE || 'playwright');
const { serve } = require('./serve.cjs');
(async () => {
  const server = await serve(process.env.DND_TEST_ROOT || path.join(__dirname,'../dist'));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(server.url,{waitUntil:'networkidle'});
    await page.locator('#accessContinueLocal').click();
    assert.equal(await page.locator('#diceTrayBody').isVisible(),false);
    assert.equal(await page.locator('#diceDockValue').textContent(),'20');
    await page.evaluate(()=>document.fonts.ready);
    const originalShape=await page.locator('#diceDock svg').innerHTML();
    const originalBox=await page.locator('#diceDock').boundingBox();
    const normalImage=await page.locator('#diceDock').screenshot();
    const savedBefore=await page.evaluate(()=>JSON.stringify({...localStorage}));
    for(const [mode,symbol,label] of [['adv','↑','Vantagem'],['dis','↓','Desvantagem']]) {
      await page.evaluate(mode=>setRollMode(mode),mode);
      assert.equal(await page.locator('#diceDockMode').textContent(),symbol);
      assert.match(await page.locator('#diceDock').getAttribute('aria-label'),new RegExp(label));
      assert.equal(await page.locator('#diceDockAura').isVisible(),true);
      assert.equal(await page.locator('#diceDockAura').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
      assert.deepEqual(await page.locator('#diceDock').boundingBox(),originalBox,'aura não move nem redimensiona o dado');
      assert.equal(await page.locator('#diceDock svg').innerHTML(),originalShape);
      const {x,y,width,height}=originalBox;
      await page.screenshot({path:`/tmp/critcall-dice-${mode}.png`,clip:{x:Math.max(0,x-12),y:Math.max(0,y-12),width:width+24,height:height+24}});
    }
    await page.evaluate(()=>setRollMode('normal'));
    assert.equal(await page.locator('#diceDockAura').isVisible(),false);
    assert.equal(await page.locator('#diceDockMode').isVisible(),false);
    assert.deepEqual(await page.locator('#diceDock').screenshot(),normalImage,'normal retorna ao desenho exato, sem aura ou marcador');
    assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),savedBefore,'aparência transitória não grava dados');
    await page.evaluate(()=>{window.__rolls=0;Math.random=()=>{window.__rolls++;return .45;};});
    await page.locator('#diceDock').focus(); await page.keyboard.press('r');
    await page.waitForFunction(()=>document.querySelector('#diceDockValue').textContent==='10');
    await page.locator('#diceDock').click();
    await page.locator('#rollMode-adv').click();
    assert.equal(await page.locator('#diceDockAura').isVisible(),false,'bandeja aberta não recebe aura');
    await page.locator('#dicePoolModInput').fill('7'); await page.locator('#dicePoolModInput').dispatchEvent('change');
    const pool=await page.locator('#dicePoolDisplay').textContent();
    await page.locator('#diceTrayMinimizeButton').click();
    await page.waitForFunction(()=>document.querySelector('#dice3dTray').getAnimations().length===0);
    const start=await page.locator('#diceDock').boundingBox();
    await page.mouse.move(start.x+30,start.y+30); await page.mouse.down();
    await page.mouse.move(start.x+180,start.y-120,{steps:12}); await page.waitForTimeout(250); await page.mouse.up();
    assert.equal(await page.evaluate(()=>window.__rolls),1,'arrastar devagar não rola');
    const moved=await page.locator('#diceDock').boundingBox();
    assert.ok(moved.x>start.x+100);
    await page.mouse.move(moved.x+30,moved.y+30); await page.mouse.down();
    await page.mouse.move(moved.x+230,moved.y-70,{steps:2}); await page.mouse.up();
    await page.waitForFunction(()=>window.__rolls===2);
    await page.waitForFunction(()=>document.querySelector('#dice3dResultText').textContent.includes('d20 normal'));
    assert.equal(await page.locator('#diceTrayBody').isVisible(),false);
    assert.equal(await page.locator('#dicePoolDisplay').textContent(),pool,'arremesso não altera pool/modo/modificador');
    assert.ok((await page.locator('#dice3dResultText').textContent()).includes('1d20[10]'));
    await page.locator('#diceDock').focus(); await page.keyboard.press('r');
    await page.evaluate(()=>{Math.random=()=>.8;}); await page.keyboard.press('r');
    await page.waitForFunction(()=>document.querySelector('#diceDockValue').textContent==='17');
    const position=await page.locator('#diceDock').boundingBox();
    await page.locator('#diceDock').click(); await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('#diceTrayBody').isVisible(),false,'reabrir entra recolhido');
    assert.equal(await page.locator('#diceDockValue').textContent(),'17');
    const restored=await page.locator('#diceDock').boundingBox();
    assert.ok(Math.abs(restored.x-position.x)<2 && Math.abs(restored.y-position.y)<2);
    await page.setViewportSize({width:320,height:640}); await page.evaluate(()=>setFontScale(125));
    await page.waitForFunction(()=>getComputedStyle(document.documentElement).fontSize==='20px');
    const mobile=await page.locator('#diceDock').boundingBox();
    assert.ok(mobile.x>=0&&mobile.y>=0&&mobile.x+mobile.width<=320&&mobile.y+mobile.height<=640);
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const theme of ['pergaminho_claro','pergaminho_escuro','obsidiana']) {
      await page.evaluate(theme=>setTheme(theme),theme);
      for(const mode of ['normal','adv','dis']) {
        await page.evaluate(mode=>setRollMode(mode),mode);
        const box=await page.locator('#diceDock').boundingBox();
        assert.deepEqual(box,mobile,`${theme}/${mode}: mesma posição e tamanho em 320px/GG`);
        assert.deepEqual(await page.locator('#diceDockAura').evaluate(e=>[getComputedStyle(e,'::before').animationName,getComputedStyle(e,'::after').animationName,...[...e.children].map(i=>getComputedStyle(i).animationName)]),Array(6).fill('none'),'movimento reduzido deixa somente efeito estático');
      }
    }
    await page.evaluate(()=>setDiceMode('off')); assert.equal(await page.locator('#diceDock').isVisible(),false);
    assert.deepEqual(errors,[]);
    console.log('PASS dado: normal idêntico após alternar modos, aura/símbolos sem mover ou gravar, movimento reduzido, fechado ao abrir, último total, teclado, arraste lento, arremesso d20 normal sem alterar pool, rolagens rápidas, posição/recarga, 320px/GG/três temas e modo OFF.');
  } finally {await browser.close();await server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
