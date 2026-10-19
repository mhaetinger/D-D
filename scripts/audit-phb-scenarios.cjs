// Diagnóstico manual de cobertura: matches=false registra uma lacuna conhecida.
// Não integra a suíte de aprovação. Código 0 significa que a auditoria executou,
// não que todas as regras estão corretas. Usa só fixtures e navegador descartável;
// requisições fora do servidor local são bloqueadas.
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const E = require('../public/rules/character-engine');
const {create, choose, setup} = require('../tests/character-choices.cjs');
const {chromium} = require('playwright');
const {serve} = require('../tests/serve.cjs');

function level(id, n, sub, race = 'humano') {
  let c = create(id, sub, race);
  while (c.classes[0].level < n) {
    const d = E.context({}, {}, c, id);
    choose(d, sub);
    c = E.levelUp(c, id, d.answers);
  }
  return c;
}

(async () => {
  const fixtures = {
    fighter: level('guerreiro', 5, 'campeao'), cleric: level('clerigo', 5, 'conhecimento'),
    life: level('clerigo', 5, 'vida'), warlock: level('bruxo', 2, 'corruptor'),
    druid: level('druida', 8, 'lua'), mage: level('mago', 18, 'abjuracao'),
    mage20: level('mago', 20, 'abjuracao'), tiefling: level('guerreiro', 3, 'campeao', 'tiefling'),
    bard: level('bardo', 2, 'conhecimento'),
  };
  fixtures.warlock.rules.history.find(h => h.classId === 'bruxo' && h.level === 2).answers.invocations = [
    'Explosão Agonizante', E.options.invocations.find(i => i.level === 2 && !i.pact && !i.spell).name,
  ];
  const next = E.context({}, {}, fixtures.fighter, 'guerreiro');
  choose(next, 'campeao');
  fixtures.fighter6 = E.levelUp(fixtures.fighter, 'guerreiro', next.answers);
  const server = await serve(path.join(root, 'dist'));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(server.url).origin ? route.continue() : route.abort());
    await page.addInitScript(c => localStorage.setItem('critcall_characters_v1', JSON.stringify({schemaVersion: 1, characters: [c]})), fixtures.fighter);
    await page.goto(server.url);
    await page.locator('#accessContinueLocal').click();
    const cases = await page.evaluate(fixtures => {
      const E = CharacterEngine, R = CritCallRules, out = [];
      const record = (id, expected, actual) => out.push({id, expected, actual, matches: JSON.stringify(expected) === JSON.stringify(actual)});
      const use = c => { characters.splice(0, characters.length, structuredClone(c)); switchCharacter(0); return getChar(); };
      const cast = (c, name, castLevel) => {
        c.spells = [E.toSheetSpell(E.spell(name), c.classes[0].classId, {prepared: true})];
        const s = c.spells[0];
        setTab('spells');
        if (castLevel) setSpellCastLevelByIndex(0, String(castLevel));
        const display = getSpellEffectDetails(c, s, 0).base;
        setDiceMode('auto'); clearDicePool(); castSpellByIndex(0);
        return {display, roll: document.getElementById('dicePoolDisplay').textContent.trim()};
      };
      let c = use(fixtures.cleric);
      record('truque-escalonamento', {display: '2d8 Radiante', roll: '2d8'}, cast(c, 'Chama Sagrada'));
      c = use(fixtures.cleric); c.abilities.wis.score = 16;
      record('cura-modificador', {display: '1d8+3 Cura', roll: '1d8+3'}, cast(c, 'Curar Ferimentos', 1));
      c = use(fixtures.cleric); c.abilities.wis.score = 16;
      record('cura-upcast', {display: '3d8+3 Cura', roll: '3d8+3'}, cast(c, 'Curar Ferimentos', 3));
      c = use(fixtures.life); c.abilities.wis.score = 16;
      record('cura-discipulo-vida', {display: '1d8+6 Cura', roll: '1d8+6'}, cast(c, 'Curar Ferimentos', 1));
      c = use(fixtures.warlock); c.abilities.cha.score = 16;
      record('explosao-agonizante', '1d10+3', cast(c, 'Rajada Mística').roll);
      c = use(fixtures.fighter); const before = c.hpMax; changeAbility('con', 2);
      record('con-manual', before + 5, c.hpMax);
      c = use(fixtures.tiefling); const racial = c.spells.find(s => s.bookId === 'repreensao-infernal');
      record('tiefling-nivel-fixo', 2, getSelectedSpellCastLevel(c, racial, c.spells.indexOf(racial)));
      c = use(fixtures.mage); const mastery = E.selections(c, 'mago', 'mastery1')[0], ms = c.spells.find(s => s.bookId === mastery);
      ms.prepared = true; setDiceMode('off'); c.standardSlots[1].used = 0; castSpellByIndex(c.spells.indexOf(ms));
      record('dominar-magia', 0, c.standardSlots[1].used);
      c = use(fixtures.mage20); const sig = E.selections(c, 'mago', 'signature')[0], ss = c.spells.find(s => s.bookId === sig);
      ss.prepared = true; c.standardSlots[3].used = 0; castSpellByIndex(c.spells.indexOf(ss));
      record('assinatura-magica', {slots: 0, limitedUse: 1}, {slots: c.standardSlots[3].used, limitedUse: ss.limitedUse || 0});
      c = use(fixtures.druid); c.hpTemp = 5;
      c.ruleState = {active: {'druida:wildShape': true}, pools: {'druida:wildShape': 10}, used: {}, targets: {}};
      R.applyDamage(c, 4);
      record('dano-forma-temporarios', {temp: 1, beast: 10}, {temp: c.hpTemp, beast: c.ruleState.pools['druida:wildShape']});
      c = use(fixtures.druid);
      c.ruleState = {active: {'druida:wildShape': true}, pools: {'druida:wildShape': 10}, used: {}, targets: {}};
      // Forma recém-ativada de druida 8 dura até 4 h; cenário de descanso de 1 h.
      R.takeRest(c, 'short', E);
      record('forma-descanso-curto', true, c.ruleState.active['druida:wildShape']);
      c = use(fixtures.fighter); c.hpCurrent = 0; R.takeRest(c, 'long', E);
      record('descanso-iniciado-zero-pv', 0, c.hpCurrent);
      c = use(fixtures.mage);
      c.classes = [{classId: 'mago', level: 2, subclassId: 'abjuracao', subclass: 'Escola de Abjuração'}, {classId: 'clerigo', level: 1, subclassId: 'vida', subclass: 'Domínio da Vida'}];
      c.abilities.int.score = 16; c.ruleState = {active: {}, pools: {}, used: {}, targets: {}};
      R.onSpellCast(c, E.toSheetSpell(E.spell('Escudo da Fé'), 'clerigo'), 1, E);
      record('protecao-abjuracao-outra-classe', 7, c.ruleState.pools['mago:ward'] || 0);
      c = use(fixtures.mage); c.armorEquipped = 'Cota de malha'; c.shieldEquipped = true; c.armorProficiencies = [];
      const spell = E.toSheetSpell(E.spell('Mísseis Mágicos'), 'mago', {prepared: true});
      record('conjurar-armadura-sem-proficiencia', false, R.canCastNormally(c, spell, E));
      c = use(fixtures.mage); c.ruleState = {active: {}, pools: {'mago:ward': 10}, used: {}, targets: {}}; c.hpTemp = 5;
      changeHp(-4);
      const h = JSON.parse(localStorage.getItem('dnd_character_history_v2:' + c.id)), action = h.stack.at(-1).action;
      record('historico-absorcao-real', 0, Number(action.match(/\((\d+) absorvidos/)?.[1]));
      c = use(fixtures.bard); c.abilities.dex.score = 14;
      record('iniciativa-bardo', true, renderCombatBlock(c).includes('1d20+3'));
      record('raio-ardente-gemea', false, E.spellMeta(E.spell('Raio Ardente')).canTwin);
      record('chicote-ataque-magico', 'atq_magico', E.spellMeta(E.spell('Chicote de Espinhos')).defType);
      c = use(fixtures.fighter); for (const k of Object.keys(c.coins)) c.coins[k] = 0;
      const load = getCurrentLoadKg(c); c.coins.po = 1000;
      record('peso-moedas', load + 10, getCurrentLoadKg(c));
      const pre = fixtures.fighter;
      record('controle-pv-evolucao', pre.hpMax + Math.max(1, 6 + getMod(pre.abilities.con.score)), fixtures.fighter6.hpMax);
      return out;
    }, fixtures);
    const sniper = E.requirements(E.context({...setup('mago', 'humanoVariante'), allowFeats: true}, {racialFeat: 'Atirador de Magia', racialFeatClass: 'druida'})).find(f => f.id === 'racialFeatCantrip');
    const offered = sniper.options.some(o => o.value === 'criar-chamas');
    cases.push({id: 'atirador-criar-chamas', expected: true, actual: offered, matches: offered});
    console.log(JSON.stringify({sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(), summary: {cases: cases.length, divergences: cases.filter(c => !c.matches).length}, cases}, null, 2));
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
