const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.DND_PLAYWRIGHT_MODULE || "playwright");
const { serve } = require("./serve.cjs");

(async () => {
  const server = await serve(path.join(__dirname, ".."));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${server.url}book.html#page=58`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector("#bookReader").getAttribute("data-url")?.endsWith("#page=58"));
    await page.waitForFunction(() => document.querySelector("#bookReader").dataset.renderedPage === "58" && document.querySelector("#bookReader").getAttribute("aria-busy") === "false");
    assert.ok(await page.locator(".textLayer").textContent().then((text) => text.length > 100));
    assert.ok(await page.locator(".pdf-page canvas").evaluate((canvas) => {
      const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 1600) if (pixels[i] < 220) ink++;
      return ink > 20;
    }), "o canvas contém a página renderizada, não apenas uma área em branco");
    assert.equal(await page.locator("#bookSelect").inputValue(), "jogador");
    assert.equal(await page.locator("#bookPage").inputValue(), "58");
    assert.equal(await page.locator("#openBook").getAttribute("href"), "books/livro-jogador-2014.pdf#page=58");

    // Consulta sob o prefixo do Pages: o PDF deve existir e ter o MIME correto.
    for (const name of ["jogador", "mestre"]) {
      const response = await context.request.get(`${server.url}books/livro-${name}-2014.pdf`);
      assert.equal(response.status(), 200);
      assert.equal(response.headers()["content-type"], "application/pdf");
      assert.equal((await response.body()).subarray(0, 5).toString(), "%PDF-");
    }
    await page.locator("#bookSelect").selectOption("mestre");
    await page.waitForFunction(() => location.hash === "#book=mestre&page=1");
    assert.equal(await page.locator("#bookPage").getAttribute("max"), "322");
    await page.locator("#bookPage").fill("322");
    await page.getByRole("button", { name: "Ir à página", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("#bookReader").getAttribute("data-url") === "books/livro-mestre-2014.pdf#page=322");
    await page.waitForFunction(() => document.querySelector("#bookReader").dataset.renderedBook === "mestre" && document.querySelector("#bookReader").dataset.renderedPage === "322" && document.querySelector("#bookReader").getAttribute("aria-busy") === "false");
    assert.equal(await page.locator("#downloadBook").getAttribute("href"), "books/livro-mestre-2014.pdf");
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("#bookPage").inputValue(), "322");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector("#bookPage").value === "1");
    await page.getByRole("button", { name: "Próxima página", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("#bookReader").dataset.renderedPage === "2" && document.querySelector("#bookReader").getAttribute("aria-busy") === "false");
    await page.getByRole("button", { name: "Página anterior", exact: true }).click();
    await page.waitForFunction(() => document.querySelector("#bookReader").dataset.renderedPage === "1" && document.querySelector("#bookReader").getAttribute("aria-busy") === "false");
    await page.locator("#bookZoom").selectOption("2");
    await page.waitForFunction(() => document.querySelector("#bookReader").getAttribute("aria-busy") === "false");
    assert.ok(await page.locator("#bookReader").evaluate((el) => el.scrollWidth > el.clientWidth));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    // Rodinha no limite do leitor não deve alcançar a página de trás.
    await page.locator("#bookReader").evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const bounds = await page.locator("#bookReader").boundingBox();
    const scrollBefore = await page.evaluate(() => scrollY);
    await page.mouse.move(bounds.x + bounds.width / 2, Math.min(bounds.y + 100, 950));
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => scrollY), scrollBefore);
    await page.locator("#bookZoom").selectOption("1");

    const artifactDir = process.env.DND_TEST_ARTIFACTS;
    for (const theme of ["pergaminho_claro", "pergaminho_escuro", "obsidiana"]) {
      await page.evaluate((theme) => {
        localStorage.setItem("dnd_sheet_theme", theme);
        localStorage.setItem("dnd_font_scale", "125");
      }, theme);
      await page.setViewportSize({ width: 320, height: 800 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.querySelector("#bookReader").getAttribute("aria-busy") === "false" && !!document.querySelector(".pdf-page canvas"));
      assert.equal(await page.locator("body").getAttribute("data-theme"), theme);
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), "20px");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (artifactDir) {
        fs.mkdirSync(artifactDir, { recursive: true });
        await page.screenshot({ path: path.join(artifactDir, `library-${theme}-320.png`) });
      }
    }
    // A consulta deve continuar funcionando quando o usuário bloqueia o storage.
    const restricted = await context.newPage();
    restricted.on("pageerror", (error) => errors.push(error.message));
    await restricted.addInitScript(() => {
      Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage bloqueado"); } });
    });
    await restricted.goto(`${server.url}book.html#page=58`, { waitUntil: "domcontentloaded" });
    await restricted.waitForFunction(() => document.querySelector("#bookPage").value === "58");
    await restricted.waitForFunction(() => document.querySelector("#bookReader").dataset.renderedPage === "58" && document.querySelector("#bookReader").getAttribute("aria-busy") === "false");

    // Trocas antes de terminar o render não podem deixar a página antiga na tela.
    await page.locator("#bookSelect").selectOption("jogador");
    await page.locator("#bookSelect").selectOption("mestre");
    await page.locator("#bookSelect").selectOption("jogador");
    await page.locator("#bookPage").fill("59");
    await page.getByRole("button", { name: "Ir à página", exact: true }).click();
    await page.locator("#bookPage").fill("58");
    await page.getByRole("button", { name: "Ir à página", exact: true }).click();
    assert.equal(new URL(page.url()).hash, "#book=jogador&page=58");
    await page.waitForFunction(() => document.querySelector("#bookReader").dataset.renderedBook === "jogador" && document.querySelector("#bookReader").dataset.renderedPage === "58" && document.querySelector("#bookReader").getAttribute("aria-busy") === "false");
    assert.equal(await page.locator("#bookReader").getAttribute("data-error"), null);

    // Falha de rede mantém os links e permite tentar a mesma página novamente.
    const unavailable = await context.newPage();
    await unavailable.route("**/books/livro-jogador-2014.pdf", (route) => route.fulfill({ status: 404, body: "Não encontrado" }));
    await unavailable.goto(`${server.url}book.html#page=58`, { waitUntil: "domcontentloaded" });
    await unavailable.waitForFunction(() => document.querySelector("#bookReader").dataset.error === "true");
    assert.equal(await unavailable.locator("#openBook").getAttribute("href"), "books/livro-jogador-2014.pdf#page=58");
    await unavailable.unroute("**/books/livro-jogador-2014.pdf");
    await unavailable.getByRole("button", { name: "Ir à página", exact: true }).click();
    await unavailable.waitForFunction(() => document.querySelector("#bookReader").dataset.renderedPage === "58" && document.querySelector("#bookReader").getAttribute("aria-busy") === "false");
    await unavailable.close();

    // A ficha continua vazia em um perfil novo e oferece os textos nos balões.
    const fresh = await browser.newPage();
    fresh.on("pageerror", (error) => errors.push(error.message));
    await fresh.goto(server.url, { waitUntil: "networkidle" });
    assert.equal(await fresh.evaluate(() => characters.length), 0);
    await fresh.getByRole("button", { name: "Criar personagem", exact: true }).click();
    const wizard = fresh.locator("#characterWizard");
    await wizard.locator('[data-text="name"]').fill("Teste de consulta");
    await wizard.locator('[data-setup="classId"]').selectOption("bruxo");
    await wizard.locator('[data-setup="raceId"]').selectOption("humano");
    await wizard.locator('[data-setup="backgroundId"]').selectOption("soldado");
    await wizard.locator('[data-answer="subclass"]').selectOption("corruptor");
    for (let i = 0; i < 3; i++) {
      if (i === 2) {
        await wizard.locator('[data-answer="raceLanguages"]').selectOption("Abissal");
        await wizard.locator('[data-answer="backgroundTools"]').selectOption("Jogo: dados");
        await wizard.locator('[data-answer="classSkills"][value="arcanismo"]').check();
        await wizard.locator('[data-answer="classSkills"][value="enganacao"]').check();
      }
      await wizard.locator('[data-action="next"]').click();
    }
    const source = wizard.locator('summary[data-rule-tooltip]').first();
    await source.focus();
    await fresh.waitForFunction(() => document.querySelector("#ruleTooltip")?.hidden === false);
    const tooltip = await fresh.locator("#ruleTooltip").innerText();
    assert.ok(tooltip.length > 150);
    assert.ok(!tooltip.includes("Descrição completa não incluída"));
    await source.click();
    const link = wizard.locator('a[href^="book.html#page="]').first();
    const popupPromise = fresh.waitForEvent("popup");
    const href = await link.getAttribute("href");
    await link.click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    assert.equal(new URL(popup.url()).pathname, "/D-D/book.html");
    assert.equal(await popup.locator("#bookPage").inputValue(), href.split("=").pop());
    await popup.close();
    assert.deepEqual(errors, []);
    console.log("PASS: PDFs renderizados sob /D-D/ com texto selecionável, links por página, Mestre, navegação/recarga/voltar, zoom e rodinha contida, três temas em 320px/GG, storage bloqueado, falha de rede/repetição e balão/link no criador; sem erros JS.");
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
