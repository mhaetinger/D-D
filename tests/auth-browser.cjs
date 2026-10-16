// Usa o SDK real com respostas HTTP controladas; nunca cria usuários reais.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require(process.env.DND_PLAYWRIGHT_MODULE || 'playwright');
const { serve } = require('./serve.cjs');
const { warrior } = require('./fixture.cjs');
const root = path.resolve(__dirname, '..');
const endpoint = 'https://dnd-login-test.supabase.co';
const ids = { a: '11111111-1111-4111-8111-111111111111', b: '22222222-2222-4222-8222-222222222222' };
const password = 'Senha de teste 123!';
// O relógio do token é fixo durante o roteiro: a conta simulada não pode mudar
// quando o login e a consulta de usuário atravessam a virada de um segundo.
const issuedAt = Math.floor(Date.now() / 1000);
const user = (key) => ({ id: ids[key], email: `${key}@example.test`, aud: 'authenticated', role: 'authenticated', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString() });
const jwt = (key) => {
  const json = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${json({ alg: 'HS256', typ: 'JWT' })}.${json({ sub: ids[key], email: `${key}@example.test`, role: 'authenticated', aud: 'authenticated', exp: issuedAt + 3600, iat: issuedAt })}.${Buffer.from('assinatura-de-teste').toString('base64url')}`;
};
const session = (key) => ({ access_token: jwt(key), refresh_token: `refresh_${key}`, token_type: 'bearer', expires_in: 3600, user: user(key) });

async function verify(prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dnd-auth-'));
  let server, browser, page;
  try {
    const vite = path.join(path.dirname(require.resolve('vite/package.json')), 'bin/vite.js');
    for (const args of [[vite, 'build', '--outDir', directory, '--emptyOutDir'], [path.join(root, 'scripts/build-offline.mjs'), directory]]) {
      const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: { ...process.env, VITE_SUPABASE_URL: endpoint, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', VITE_AUTH_ENABLED: 'true' } });
      assert.equal(result.status, 0, result.stderr || result.stdout);
    }
    server = await serve(directory, prefix);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const calls = [], errors = [];
    let revoked = false;
    await context.route(`${endpoint}/**`, async (route) => {
      const request = route.request(), url = new URL(request.url());
      const body = request.postData() ? request.postDataJSON() : {};
      calls.push({ method: request.method(), path: url.pathname, query: url.search, body });
      const headers = { 'x-supabase-api-version': '2024-01-01', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-expose-headers': 'x-supabase-api-version' };
      const respond = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(value) });
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.pathname.endsWith('/token')) {
        if (url.searchParams.get('grant_type') === 'pkce') return respond(session('a'));
        if (body.email === 'confirmar@example.test') return respond({ code: 'email_not_confirmed', msg: 'Email not confirmed' }, 400);
        const key = body.email === 'a@example.test' ? 'a' : body.email === 'b@example.test' ? 'b' : null;
        return key && body.password === password ? respond(session(key)) : respond({ code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400);
      }
      if (url.pathname.endsWith('/user')) {
        const key = request.headers().authorization?.includes(jwt('b')) ? 'b' : 'a';
        return revoked ? respond({ code: 'bad_jwt', msg: 'Invalid JWT' }, 401) : respond(user(key));
      }
      if (url.pathname.endsWith('/signup')) return body.email === 'smtp@example.test'
        ? respond({ code: 'email_address_not_authorized', msg: 'Email address not authorized' }, 403) : respond(user('a'));
      if (/\/(recover|resend)$/.test(url.pathname)) return respond({});
      if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers });
      return respond({ message: 'Rota inesperada no teste' }, 500);
    });
    const guest = warrior();
    await context.addInitScript((char) => {
      if (!localStorage.getItem('authTestSeeded')) {
        localStorage.setItem('orbyt_characters_v1', JSON.stringify({ schemaVersion: 1, characters: [char] }));
        localStorage.setItem('dnd_player_private_notes_v1', JSON.stringify({ [char.id]: 'Nota do espaço sem login' }));
        localStorage.setItem('authTestSeeded', 'true');
      }
    }, guest);
    page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(server.url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.getChar === 'function');
    assert.equal(await page.evaluate(() => getChar().id), guest.id);
    await page.evaluate(() => openAuthAccountModal());
    const form = page.locator('#accountForm');
    async function login(email, pass = password) {
      await page.locator('[data-auth-mode="login"]').click();
      await page.locator('#accountEmail').fill(email);
      await page.locator('#accountPassword').fill(pass);
      await form.getByRole('button', { name: 'Entrar', exact: true }).click();
    }
    await login('a@example.test', 'incorreta');
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('inválidos'));
    assert.equal(await page.evaluate(() => getChar().id), guest.id);
    await login('confirmar@example.test');
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('Confirme'));
    await page.locator('#accountResend').click();
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('outra mensagem'));
    revoked = true;
    await login('a@example.test');
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('Não foi possível concluir'));
    assert.equal(await page.evaluate(() => getChar().id), guest.id, 'token recebido sem identidade validada não confirma entrada');
    revoked = false;
    await login('a@example.test');
    await page.waitForFunction(() => characters.length === 0);
    assert.ok((await page.locator('#accountIdentity').textContent()).includes('a@example.test'));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('orbyt_characters_v1')).characters[0].id), guest.id);
    await page.evaluate(() => undoStep());
    assert.equal(await page.evaluate(() => characters.length), 0, 'o histórico anterior não atravessa a conta');
    const imported = { format: 'orbyt.character-backup', version: 1, exportedAt: new Date().toISOString(), characters: [{ ...guest, name: 'Ficha da conta A' }], privateNotes: { [guest.id]: 'Nota da conta A' } };
    await page.locator('#backupFile').setInputFiles({ name: 'teste.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    await page.waitForFunction(() => characters.length === 1);
    const idA = await page.evaluate(() => getChar().id);
    assert.notEqual(idA, guest.id);
    await page.locator('#accPlayerName').fill('Jogador A');
    await page.getByRole('button', { name: 'Salvar nome local', exact: true }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.getChar === 'function');
    assert.equal(await page.evaluate(() => getChar().id), idA);
    assert.equal(await page.locator('#currentUserBadge').textContent(), 'Jogador A');
    await page.goto(server.url + 'index.html', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.getChar === 'function');
    assert.equal(await page.evaluate(() => getChar().id), idA, 'raiz e index.html compartilham a sessão');
    await page.evaluate(() => openAuthAccountModal());
    await page.locator('#accountSignOut').click();
    await page.waitForFunction((id) => getChar()?.id === id, guest.id);
    assert.equal(await page.evaluate(() => readPrivateNotes(getChar().id)), 'Nota do espaço sem login');
    await login('b@example.test');
    await page.waitForFunction(() => characters.length === 0);
    assert.ok(!(await page.locator('#accountCharactersList').textContent()).includes('Ficha da conta A'));
    await page.locator('#accountSignOut').click();
    await page.waitForFunction((id) => getChar()?.id === id, guest.id);
    await login('a@example.test');
    await page.waitForFunction((id) => getChar()?.id === id, idA);
    assert.equal(await page.evaluate(() => readPrivateNotes(getChar().id)), 'Nota da conta A');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.getChar === 'function');
    assert.equal(await page.evaluate(() => getChar().id), idA);
    await page.evaluate(() => openAuthAccountModal());
    assert.ok((await page.locator('#accountIdentity').textContent()).includes('offline'));
    await page.locator('#accountSignOut').click();
    await page.waitForFunction((id) => getChar()?.id === id, guest.id);
    await context.setOffline(false);
    await page.locator('[data-auth-mode="signup"]').click();
    await page.locator('#accountEmail').fill('cadastro@example.test');
    await page.locator('#accountPassword').fill(password);
    await page.locator('#accountPasswordConfirm').fill('outra senha longa');
    for (const theme of ['pergaminho_claro', 'pergaminho_escuro', 'obsidiana']) {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.evaluate((theme) => { setTheme(theme); setFontScale(125); }, theme);
      const panel = page.locator('#authAccountModal > section');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.ok(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth));
      await panel.evaluate((el) => { el.scrollTop = 0; });
      if (process.env.DND_TEST_ARTIFACTS) {
        fs.mkdirSync(process.env.DND_TEST_ARTIFACTS, { recursive: true });
        await page.screenshot({ path: path.join(process.env.DND_TEST_ARTIFACTS, `login-${theme}-320.png`) });
      }
      await panel.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      const bounds = await panel.boundingBox();
      const before = await page.evaluate(() => scrollY);
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height - 15);
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => scrollY), before, 'rodinha no limite do perfil não alcança a página');
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => { setTheme('pergaminho_claro'); setFontScale(100); });
    await page.locator('#accountSubmit').click();
    assert.ok((await page.locator('#accountAccessStatus').textContent()).includes('iguais'));
    assert.equal(calls.filter((call) => call.path.endsWith('/signup')).length, 0);
    await page.locator('#accountPasswordConfirm').fill(password);
    await page.locator('#accountEmail').fill('smtp@example.test');
    await page.locator('#accountSubmit').click();
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('envio de e-mails'));
    await page.locator('#accountEmail').fill('cadastro@example.test');
    await page.locator('#accountSubmit').click();
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('Confira seu e-mail'));
    assert.equal(await page.evaluate(() => getChar().id), guest.id, 'cadastro sem confirmação não entra na conta');
    await page.locator('[data-auth-mode="reset"]').click();
    await page.locator('#accountSubmit').click();
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('Se o endereço'));
    await page.goto(server.url + '?code=recuperacao-de-teste', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.getChar === 'function');
    await page.locator('#accountSubmit').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#accountSubmit').textContent(), 'Salvar nova senha');
    await page.locator('#accountPassword').fill('Nova senha de teste 123!');
    await page.locator('#accountPasswordConfirm').fill('Nova senha de teste 123!');
    await page.locator('#accountSubmit').click();
    await page.waitForFunction(() => document.querySelector('#accountAccessStatus').textContent.includes('Senha atualizada'));
    assert.ok(!page.url().includes('code='));
    assert.ok(calls.some((call) => call.path.endsWith('/user') && call.method === 'PUT' && call.body.password === 'Nova senha de teste 123!'));
    assert.ok(calls.filter((call) => /\/(recover|resend|signup)$/.test(call.path)).every((call) => new URLSearchParams(call.query).get('redirect_to') === server.url));
    for (const theme of ['pergaminho_claro', 'pergaminho_escuro', 'obsidiana']) {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.evaluate((theme) => { setTheme(theme); setFontScale(125); }, theme);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.ok(await page.locator('#authAccountModal > section').evaluate((el) => el.scrollWidth <= el.clientWidth));
    }
    await context.setOffline(true);
    await page.locator('#accountSignOut').click();
    await page.waitForFunction((id) => getChar()?.id === id, guest.id);
    await context.setOffline(false);
    await login('a@example.test');
    await page.waitForFunction((id) => getChar()?.id === id, idA);
    await page.evaluate(() => { closeAuthAccountModal(); openLevelUpModal(); });
    revoked = true;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.locator('#accountWorkspaceChanged[open]').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#accountWorkspaceChanged').evaluate((el) => el.open), true);
    const pending = page.waitForEvent('download');
    await page.locator('#accountSwitchBackup').click();
    const backup = JSON.parse(fs.readFileSync(await (await pending).path(), 'utf8'));
    assert.equal(backup.characters[0].id, idA);
    assert.equal(backup.privateNotes, undefined);
    await page.locator('#accountSwitchContinue').click();
    assert.equal(await page.evaluate(() => getChar().id), guest.id);
    await page.evaluate(() => openNewCharacterModal());
    assert.equal(await page.locator('#characterWizard').isVisible(), true, 'o editor pode abrir depois da troca');
    await page.evaluate(() => CharacterWizard.close(true));
    revoked = false;
    await page.evaluate(() => openAuthAccountModal());
    await login('a@example.test');
    await page.waitForFunction((id) => getChar()?.id === id, idA);
    await page.locator('#backupFile').setInputFiles({ name: 'copia.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    await page.waitForFunction(() => characters.length === 2);
    await page.evaluate(() => { void deleteCharacter(0); });
    await page.locator('#confirmationDialog[open]').waitFor();
    revoked = true;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.locator('#accountWorkspaceChanged[open]').waitFor();
    await page.locator('#accountSwitchContinue').click();
    assert.equal(await page.evaluate(() => getChar().id), guest.id);
    assert.equal(await page.locator('#confirmationDialog').evaluate((el) => el.open), false);
    revoked = false;
    await login('a@example.test');
    await page.waitForFunction(() => characters.length === 2);
    assert.ok(await page.evaluate((id) => characters.some((char) => char.id === id), idA), 'a exclusão pendente da sessão anterior foi cancelada');
    assert.equal(await page.evaluate((pass) => Object.values(localStorage).some((value) => value.includes(pass)), password), false);
    await page.goto(server.url + '?error=access_denied&error_code=otp_expired&error_description=texto-nao-confiavel', { waitUntil: 'networkidle' });
    await page.locator('#authAccountModal').waitFor({ state: 'visible' });
    assert.ok((await page.locator('#accountAccessStatus').textContent()).includes('O link expirou'));
    assert.equal(await page.evaluate(() => characters.length), 2, 'link expirado preserva a conta válida e suas fichas');
    assert.ok(!page.url().includes('error_'));
    const fresh = await browser.newContext();
    await fresh.route(`${endpoint}/**`, route => route.abort());
    const wrongBrowser = await fresh.newPage();
    wrongBrowser.on('pageerror', error => errors.push(error.message));
    await wrongBrowser.goto(server.url + '?code=sem-verificador', { waitUntil: 'networkidle' });
    await wrongBrowser.locator('#authAccountModal').waitFor({ state: 'visible' });
    assert.ok((await wrongBrowser.locator('#accountAccessStatus').textContent()).includes('outro navegador'));
    assert.ok(!wrongBrowser.url().includes('code='));
    assert.equal(await wrongBrowser.evaluate(() => characters.length), 0);
    await fresh.close();
    assert.deepEqual(errors, []);
    console.log(`PASS ${prefix}: SDK real com HTTP simulado; cadastro/confirmação, PKCE/recuperação, contas A/B/local, offline, editores, links expirados/outro navegador, SMTP restrito e três temas/320px/GG; sem erros JS.`);
  } catch (error) {
    if (page && !page.isClosed()) {
      console.error('Estado do formulário:', await page.locator('#accountAccessStatus').textContent());
      await page.screenshot({ path: path.join(os.tmpdir(), 'dnd-auth-failure.png'), fullPage: true });
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
(async () => { for (const prefix of ['/D-D/', '/']) await verify(prefix); })().catch((error) => { console.error(error); process.exitCode = 1; });
