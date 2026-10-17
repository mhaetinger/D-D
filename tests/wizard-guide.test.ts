import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adjust,
  assign,
  spent,
  totals,
  type AbilitySetup,
} from "../src/wizard/abilities";
import { backgroundSuggestions } from "../src/wizard/guidance";
const E = require("../public/rules/character-engine.js");
const refs = require("../public/rules/phb2014-references.js");
const T = require("../public/rules/rule-tooltips.js");
const keys = ["str", "dex", "con", "int", "wis", "cha"];
test("compra de pontos impede exceder 27 e devolve o custo correto", () => {
  const s: AbilitySetup = {
    abilityMethod: "pointBuy",
    baseScores: Object.fromEntries(keys.map((k) => [k, 8])),
    assignment: {},
    rolls: [],
  };
  for (const key of ["str", "dex", "con"])
    for (let i = 0; i < 7; i++) assert.equal(adjust(s, key, 1), true);
  assert.equal(spent(s), 27);
  assert.equal(adjust(s, "wis", 1), false);
  assert.equal(adjust(s, "str", 1), false);
  assert.equal(adjust(s, "str", -1), true);
  assert.equal(spent(s), 25);
  assert.equal(adjust(s, "wis", 1), true);
  assert.equal(adjust(s, "cha", 1), true);
  assert.equal(adjust(s, "int", 1), false);
  assert.equal(adjust(s, "int", -1), false);
});
test("peças são únicas e trocam de lugar, inclusive totais rolados iguais", () => {
  for (const method of ["standard", "rolled"]) {
    const s: AbilitySetup = {
      abilityMethod: method,
      baseScores: {},
      assignment: {},
      rolls: [
        [6, 6, 6, 1],
        [6, 6, 6, 2],
        [5, 5, 5, 1],
        [4, 4, 4, 1],
        [3, 3, 3, 1],
        [2, 2, 2, 1],
      ],
    };
    keys.forEach((k, i) => assert.ok(assign(s, String(i), k)));
    const before = [...Object.values(s.baseScores)].sort();
    for (let i = 0; i < 20; i++)
      assert.ok(assign(s, String(i % 6), keys[(i + 2) % 6]));
    assert.equal(new Set(Object.values(s.assignment)).size, 6);
    assert.deepEqual(Object.values(s.baseScores).sort(), before);
    assert.deepEqual(before, totals(s).slice().sort());
    assert.equal(assign(s, "9", "str"), false);
  }
});
for (const key of Object.keys(E.options.backgrounds))
  test(`sugestões completas do livro: ${key}`, () => {
    const suggestions = backgroundSuggestions(key, E.options.backgrounds, refs);
    assert.deepEqual(
      Object.values(suggestions).map((x) => x.length),
      [8, 6, 6, 6],
    );
    for (const values of Object.values(suggestions))
      assert.ok(values.every((v) => v.length > 20 && !v.includes("d6")));
  });
test("formatText converte glifos privados extraídos do PDF em marcadores visíveis", () => {
  const f = E.reference("Fúria", "barbaro");
  assert.ok(f?.text.includes("\uf0b7"));
  const formatted = T.formatText(f.text);
  assert.equal(formatted.includes("\uf0b7"), false);
  assert.ok(formatted.includes("• Você tem vantagem em testes de Força"));
});
test("pontos de vida iniciais respeitam máximo do livro, rolagem no dado, média fixa e valor adaptado", () => {
  const { setup, choose } = require("./character-choices.cjs");
  const s = setup("barbaro", "anaoColina", "soldado");
  const d = E.context(s, {});
  choose(d);
  // Anão da Colina tem CON +2 (13 -> 15, mod +2) + Tenacidade Anã (+1 PV/nível). Dado do Bárbaro = d12.
  const cMax = E.create({ ...s, hpMethod: "max" }, d.answers);
  assert.equal(cMax.hpMax, 12 + 2 + 1);
  assert.equal(cMax.hpCurrent, 15);

  const cRolled = E.create({ ...s, hpMethod: "rolled", hpRoll: 7 }, d.answers);
  assert.equal(cRolled.hpMax, 7 + 2 + 1);

  const cFixed = E.create({ ...s, hpMethod: "fixed" }, d.answers);
  assert.equal(cFixed.hpMax, 7 + 2 + 1);

  const cCustom = E.create(
    { ...s, hpMethod: "custom", hpCustom: 20 },
    d.answers,
  );
  assert.equal(cCustom.hpMax, 20);
});
test("equipamento inicial permite riqueza por classe com compras do Capítulo 5 e adaptação livre", () => {
  const { setup, choose } = require("./character-choices.cjs");
  const cat = E.equipmentCatalog();
  assert.ok(
    cat.some(
      (i: any) =>
        i.category === "armaduras" &&
        i.name === "Cota de malha" &&
        i.costCp === 7500,
    ),
  );
  assert.ok(
    cat.some(
      (i: any) =>
        i.category === "armas_marciais" &&
        i.name === "Espada Longa" &&
        i.costCp === 1500,
    ),
  );
  assert.ok(
    cat.some(
      (i: any) =>
        i.category === "pacotes" &&
        i.name === "Pacote de aventureiro" &&
        i.costCp === 1200,
    ),
  );

  for (const classId of Object.keys(E.data.classes)) {
    const w = E.startingWealth[classId];
    assert.ok(w.dice >= 2 && w.dice <= 5);
    const rolled = E.rollStartingWealth(classId, () => 0.5);
    assert.equal(rolled.rolls.length, w.dice);
    assert.ok(
      rolled.totalGold >= w.dice * w.mult &&
        rolled.totalGold <= w.dice * 4 * w.mult,
    );
  }

  const s = {
    ...setup("guerreiro", "humano", "soldado"),
    equipmentMethod: "wealth",
    wealthGold: 120,
    wealthPurchases: [
      { name: "Cota de malha", qty: 1 },
      { name: "Espada Longa", qty: 1 },
      { name: "Escudo", qty: 1 },
      { name: "Pacote de aventureiro", qty: 1 },
    ],
    customEquipment: [{ name: "Anel de sinete da família", qty: 1 }],
  };
  const d = E.context(s, {});
  choose(d);
  const char = E.create(s, d.answers);
  // Cota de malha (75) + Espada Longa (15) + Escudo (10) + Pacote de aventureiro (12) = 112 po gastos. Sobram 8 po.
  assert.equal(char.coins.po, 8);
  assert.equal(char.armorEquipped, "Cota de malha");
  assert.equal(char.shieldEquipped, true);
  assert.ok(char.weapons.some((w: any) => w.name === "Espada Longa"));
  assert.ok(
    char.inventoryItems.some(
      (i: any) => i.name === "Anel de sinete da família",
    ),
  );

  const charCustomGold = E.create({ ...s, customGold: 42 }, d.answers);
  assert.equal(charCustomGold.coins.po, 42);
});
