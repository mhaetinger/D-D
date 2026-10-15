const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.DND_PLAYWRIGHT_MODULE || "playwright");
const { serve } = require("./serve.cjs");
const { warrior } = require("./fixture.cjs");
const LEGACY = "dnd_sheet_public_v1", KEY = "orbyt_characters_v1", NOTES = "dnd_player_private_notes_v1";
async function downloadBackup(page) {
  const pending = page.waitForEvent("download");
  await page.locator("#exportBackup").click();
  const download = await pending;
  return JSON.parse(fs.readFileSync(await download.path(), "utf8"));
}
async function importBackup(page, value) {
  await page.locator("#backupFile").setInputFiles({ name: "fichas.json", mimeType: "application/json", buffer: Buffer.from(typeof value === "string" ? value : JSON.stringify(value)) });
}
(async () => {
  const server = await serve(process.env.DND_TEST_ROOT || path.join(__dirname, "../dist"));
  const browser = await chromium.launch({ headless: true });
  try {
    const errors = [], external = [];
    const char = warrior(), old = JSON.stringify([char]);
    const context = await browser.newContext();
    await context.addInitScript(({ old, id }) => {
      if (!localStorage.getItem("testSeeded")) {
        localStorage.setItem("dnd_sheet_public_v1", old);
        localStorage.setItem("dnd_player_private_notes_v1", JSON.stringify({ [id]: "Uma nota privada de teste" }));
        localStorage.setItem("testSeeded", "true");
      }
    }, { old, id: char.id });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => { if (/^https?:/.test(r.url()) && !r.url().startsWith(new URL(server.url).origin)) external.push(r.url()); });
    await page.goto(server.url, { waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => getChar().name), char.name);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), LEGACY), old);
    assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).schemaVersion, KEY), 1);
    assert.equal(await page.locator('i[data-lucide]').count(), 0, "todos os ícones usados foram incluídos no bundle");
    await page.evaluate(() => openAuthAccountModal());
    const plain = await downloadBackup(page);
    assert.equal(plain.format, "orbyt.character-backup");
    assert.equal(plain.privateNotes, undefined);
    await page.locator("#backupIncludeNotes").check();
    const full = await downloadBackup(page);
    assert.equal(full.privateNotes[char.id], "Uma nota privada de teste");
    await importBackup(page, full);
    await page.waitForFunction(() => characters.length === 2);
    const imported = await page.evaluate(() => characters[1].id);
    assert.notEqual(imported, char.id);
    assert.equal(await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key))[id], { key: NOTES, id: imported }), "Uma nota privada de teste");
    await importBackup(page, "{arquivo inválido");
    await page.waitForFunction(() => document.querySelector("#backupStatus").textContent.includes("JSON válido"));
    assert.equal(await page.evaluate(() => characters.length), 2);

    // Texto importado é dado: nem nomes nem história executam marcação.
    const hostile = structuredClone(plain);
    hostile.characters[0].name = '<img src=x onerror="window.importExecuted=1">';
    hostile.characters[0].lore.backstory = '<svg onload="window.importExecuted=1">';
    await importBackup(page, hostile);
    await page.waitForFunction(() => characters.length === 3);
    await page.evaluate(() => { closeAuthAccountModal(); setTab("lore"); });
    assert.equal(await page.evaluate(() => window.importExecuted), undefined);
    assert.equal(await page.locator('#sheetViewport img').count(), 0);
    assert.equal(await page.locator('textarea[aria-label="Anotações pessoais do jogador"]').inputValue(), "");
    for (const theme of ["pergaminho_claro", "pergaminho_escuro", "obsidiana"]) {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.evaluate((theme) => { setTheme(theme); setFontScale(125); openAuthAccountModal(); }, theme);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const panel = await page.locator('#authAccountModal > section').boundingBox();
      assert.ok(panel.x >= 0 && panel.x + panel.width <= 320);
      assert.ok(await page.locator('#authAccountModal > section').evaluate((el) => el.scrollWidth <= el.clientWidth));
      const nameArea = await page.locator('#accountCharactersList > div:first-child > .min-w-0').boundingBox();
      assert.ok(nameArea.width >= 130, "nome mantém largura legível no perfil em 320 px/GG");
      if (process.env.DND_TEST_ARTIFACTS) {
        fs.mkdirSync(process.env.DND_TEST_ARTIFACTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.DND_TEST_ARTIFACTS, `perfil-${theme}-320.png`) });
      }
    }
    await page.evaluate(() => closeAuthAccountModal());
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => { setTheme("pergaminho_claro"); setFontScale(100); });

    // Cache completo, depois rede indisponível de verdade e recarga sob /D-D/.
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const manifest = await page.request.get(server.url + "offline-manifest.json").then((r) => r.json());
    assert.ok(manifest.files.includes("index.html") && manifest.files.includes("rules/character-engine.js"));
    assert.ok(manifest.files.every((name) => !name.endsWith(".pdf")));
    await context.setOffline(true);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => characters.length), 3);
    assert.equal(await page.evaluate(() => window.importExecuted), undefined);
    await page.evaluate(() => switchCharacter(0));
    await page.evaluate(() => openLevelUpModal());
    const wizard = page.locator("#characterWizard");
    for (let i = 0; i < 4; i++) await wizard.locator('[data-action="next"]').click();
    await wizard.locator('[data-action="finish"]').click();
    await wizard.waitFor({ state: "hidden" });
    assert.equal(await page.evaluate(() => getChar().classes[0].level), 2);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => getChar().classes[0].level), 2);
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), LEGACY), old);
    assert.deepEqual(external, [], "fontes, ícones e código são servidos pelo aplicativo");
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === "orbyt_characters_v1") throw new DOMException("Sem espaço", "QuotaExceededError");
        return original.call(this, key, value);
      };
      updateField("name", "Alteração ainda não salva");
      showToast("Nome alterado!");
    });
    assert.ok((await page.locator("#toast").innerText()).includes("não foram salvas"));
    assert.notEqual(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).characters[0].name, KEY), "Alteração ainda não salva");
    await page.evaluate(() => openAuthAccountModal());
    const unsaved = await downloadBackup(page);
    assert.equal(unsaved.characters[0].name, "Alteração ainda não salva");

    // O cache não contém dados do jogador nem transfere a ficha para outro perfil.
    const other = await browser.newContext();
    const empty = await other.newPage();
    empty.on("pageerror", (e) => errors.push(e.message));
    await empty.goto(server.url, { waitUntil: "networkidle" });
    assert.equal(await empty.evaluate(() => characters.length), 0);
    await other.close();

    // Uma coleção corrompida não vira uma ficha vazia gravada sobre o original.
    const recovery = await browser.newContext();
    await recovery.addInitScript(() => { if (!localStorage.getItem("recoverySeeded")) { localStorage.setItem("orbyt_characters_v1", "{danificado"); localStorage.setItem("recoverySeeded", "true"); } });
    const damaged = await recovery.newPage();
    damaged.on("pageerror", (e) => errors.push(e.message));
    await damaged.goto(server.url, { waitUntil: "networkidle" });
    assert.equal(await damaged.locator("#storageIssue").isVisible(), true);
    assert.equal(await damaged.evaluate((key) => localStorage.getItem(key), KEY), "{danificado");
    const recoveryDownload = damaged.waitForEvent("download");
    await damaged.locator("#downloadRecovery").click();
    assert.equal(fs.readFileSync(await (await recoveryDownload).path(), "utf8"), "{danificado");
    await importBackup(damaged, plain);
    await damaged.locator("#confirmationDialog[open]").waitFor();
    await damaged.getByRole("button", { name: "Cancelar", exact: true }).click();
    assert.equal(await damaged.evaluate((key) => localStorage.getItem(key), KEY), "{danificado");
    await importBackup(damaged, plain);
    await damaged.locator("#confirmationAccept").click();
    await damaged.waitForFunction(() => characters.length === 1);
    assert.equal(await damaged.evaluate(() => localStorage.getItem("orbyt_recovery_v1")), "{danificado");
    await recovery.close();

    const blocked = await browser.newContext();
    await blocked.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("Bloqueado"); } }); });
    const limited = await blocked.newPage();
    limited.on("pageerror", (e) => errors.push(e.message));
    await limited.goto(server.url, { waitUntil: "networkidle" });
    assert.equal(await limited.locator("#storageIssue").isVisible(), true);
    assert.equal(await limited.evaluate(() => characters.length), 0);
    await blocked.close();
    assert.deepEqual(errors, []);
    console.log("PASS: build sem CDN, migração preservando legado, backups com notas opcionais, importação de cópias, texto não executável, recarga/evolução offline, perfis isolados, recuperação com cancelamento/confirmação e storage bloqueado.");
  } finally {
    await browser.close();
    await server.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
