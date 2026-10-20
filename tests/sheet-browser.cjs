const {unlockSheet}=require('./sheet-lock-actions.cjs');
// Regressão da ficha usando somente a edição pública e perfis isolados.
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require(process.env.DND_PLAYWRIGHT_MODULE || "playwright");
const { serve } = require("./serve.cjs");
(async () => {
  const server = await serve(process.env.DND_TEST_ROOT || path.join(__dirname, "../dist"));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const url = server.url;
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(await page.locator("#accessScreen").isVisible(), true);
    assert.equal(await page.locator("#sheetApp").isVisible(), false);
    await page.locator("#accessContinueLocal").click();
    assert.equal(await page.evaluate(() => characters.length), 0);
    await page
      .getByRole("button", { name: "Criar personagem", exact: true })
      .click();
    const wizard = page.locator("#characterWizard");
    await wizard.locator('[data-text="name"]').fill("Aventureira do teste");
    await wizard.locator('[data-setup="classId"]').selectOption("guerreiro");
    await wizard.locator('[data-setup="raceId"]').selectOption("humano");
    await wizard.locator('[data-setup="backgroundId"]').selectOption("soldado");
    const next = () => wizard.locator('[data-action="next"]').click();
    await next();
    for (const [i, key] of ["str", "dex", "con", "int", "wis", "cha"].entries()) {
      await wizard.locator(`[data-token="${i}"]`).click();
      await wizard.locator(`[data-slot="${key}"]`).click();
    }
    await next();
    await wizard
      .locator('[data-answer="raceLanguages"]')
      .selectOption("Abissal");
    await wizard
      .locator('[data-answer="backgroundTools"]')
      .selectOption("Jogo: dados");
    await wizard
      .locator('[data-answer="classSkills"][value="acrobacia"]')
      .check();
    await wizard
      .locator('[data-answer="classSkills"][value="lidar_animais"]')
      .check();
    await next();
    await wizard.locator('[data-answer="fighting"]').selectOption("Arquearia");
    await next();
    await next();
    for (const [key, value] of Object.entries({
      equipment0: "Cota de malha",
      equipment1: "Arma marcial e escudo",
      equipmentWeapons1: "Alabarda",
      equipment2: "Besta leve e 20 virotes",
      equipment3: "Pacote de aventureiro",
    }))
      await wizard.locator(`[data-answer="${key}"]`).selectOption(value);
    await next();
    await wizard.locator('[data-action="finish"]').click();
    await wizard.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => characters.length), 1);
    assert.equal(
      await page.evaluate(() => getChar().name),
      "Aventureira do teste",
    );
    await page.evaluate(() => setTab("lore"));
    await unlockSheet(page);
    await page.locator('[data-sheet-field="coins.po"]').fill('42');
    await page.locator('[data-sheet-field="coins.po"]').dispatchEvent('change');
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => getChar().coins.po), 42);
    await unlockSheet(page);
    await page.evaluate(() => openLevelUpModal());
    for (let i = 0; i < 4; i++) await next();
    await wizard.locator('[data-action="finish"]').click();
    await wizard.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => getChar().classes[0].level), 2);
    for (const theme of [
      "pergaminho_claro",
      "pergaminho_escuro",
      "obsidiana",
    ]) {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.evaluate((theme) => {
        setTheme(theme);
        setFontScale(125);
        setTab("main");
      }, theme);
      await page.waitForTimeout(350);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    const other = await browser.newPage();
    await other.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await other.evaluate(() => characters.length),
      0,
      "outro perfil não recebe fichas do primeiro",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: artefato público vazio, criação pela interface, evolução, moedas, persistência, isolamento entre perfis, três temas/320/GG; sem erros JS.",
    );
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
