const { test } = require("node:test");
const assert = require("node:assert/strict");
const E = require("../public/rules/character-engine");
const { setup, choose, create } = require("./character-choices.cjs");

test('Ancestral Feérico consulta o parágrafo racial e a página correta, sem a narrativa do meio-elfo',()=>{
  for(const [race,page] of [['altoElfo',22],['elfoFloresta',22],['drow',22],['meioElfo',38]]) {
    const ref=E.reference('Ancestral Feérico',null,race,'race');
    assert.equal(ref.id,'ancestral-feerico');assert.equal(ref.pdfPage,page);
    assert.match(ref.text,/vantagem/);assert.match(ref.text,/resistência/);assert.match(ref.text,/dormir/);
    assert.ok(ref.text.length<250);assert.doesNotMatch(ref.text,/FLINT|embaixadores|Transe|Versatilidade/);
  }
});

test("o livro local contém 12 classes, 41 subclasses e 361 magias com descrição e página", () => {
  assert.equal(Object.keys(E.data.classes).length, 12);
  assert.equal(
    Object.values(E.data.classes).reduce(
      (n, c) => n + Object.keys(c.subclasses).length,
      0,
    ),
    41,
  );
  assert.equal(E.spells.length, 361);
  assert.ok(
    E.spells.every(
      (s) => s.text && s.time && s.pdfPage >= 213 && s.pdfPage <= 289,
    ),
  );
  assert.equal(E.options.feats.length, 42);
  assert.equal(E.options.invocations.length, 32);
  for (const [key, table] of Object.entries(E.progression.subclassSpells))
    for (const names of Object.values(table))
      for (const name of names)
        assert.ok(E.spell(name), `Magia não encontrada: ${key}: ${name}`);
});

for (const [id, c] of Object.entries(E.data.classes))
  for (const [sid, sub] of Object.entries(c.subclasses))
    test(`${c.name} / ${sub.name}: criação e 19 evoluções até o nível 20`, () => {
      let char = create(id, sid);
      assert.equal(char.classes[0].level, 1);
      assert.equal(char.skillsProf.length, new Set(char.skillsProf).size);
      assert.ok(
        char.features.length === 0,
        "sem características de exemplo da ficha de referência",
      );
      for (let level = 2; level <= 20; level++) {
        const before = JSON.stringify(char),
          d = E.context({}, {}, char, id);
        choose(d, sid);
        const next = E.levelUp(char, id, d.answers);
        assert.equal(
          JSON.stringify(char),
          before,
          "evoluir não altera o objeto de origem",
        );
        char = next;
        assert.equal(char.classes[0].level, level);
        for (const name of c.features[level] || [])
          assert.ok(
            E.features(char).some((f) => f.name === name && f.level === level),
            `Ganho ausente: ${name}`,
          );
        for (const name of sub.features[level] || [])
          assert.ok(
            E.features(char).some((f) => f.name === name && f.level === level),
            `Ganho de subclasse ausente: ${name}`,
          );
        assert.ok(char.hpMax > 0 && char.hpCurrent <= char.hpMax);
        assert.ok(
          E.features(char).every(
            (f, i, list) => !i || list[i - 1].order <= f.order,
          ),
        );
      }
      assert.equal(char.classes[0].subclassId, sid);
      assert.equal(char.rules.history.length, 20);
      if (id === "bruxo") {
        assert.equal(char.pactMagic.level, 5);
        assert.equal(char.pactMagic.total, 4);
        assert.equal(char.spells.filter((s) => s.arcanum).length, 4);
      }
      if (id === "feiticeiro") assert.equal(char.sorceryPoints.max, 20);
      if (c.casting && ["known", "prepared", "book"].includes(c.casting))
        assert.equal(char.standardSlots[9].total, 1);
      if (id === "paladino" || id === "patrulheiro")
        assert.equal(char.standardSlots[5].total, 2);
      if (sub.casting === "third") assert.equal(char.standardSlots[4].total, 1);
    });

for (const raceId of Object.keys(E.options.races).filter(
  (id) => id !== "humanoVariante",
))
  test(`criação com raça ${E.options.races[raceId].name}`, () => {
    const char = create("guerreiro", "campeao", raceId, "sabio");
    assert.equal(char.race, E.options.races[raceId].name);
    assert.ok(char.skillsProf.every((key) => key in E.data.skills));
  });

test("incompleto, duplicado e fora da classe são rejeitados sem alterar a ficha", () => {
  const char = create("feiticeiro", "selvagem");
  assert.equal(char.sorceryPoints.max, 0);
  assert.ok(!char.spells.some((s) => s.name === "Rajada Mística"));
  const before = JSON.stringify(char);
  assert.throws(() => E.levelUp(char, "feiticeiro", {}));
  const d = E.context({}, {}, char, "feiticeiro");
  choose(d);
  d.answers.spells = "curar-ferimentos";
  assert.throws(() => E.levelUp(char, "feiticeiro", d.answers), /indisponível/);
  assert.equal(JSON.stringify(char), before);
});

test("rolagem descarta exatamente um menor de cada 4d6 e exige distribuir os seis totais", () => {
  const rolls = E.rollAbilities(() => 0);
  assert.deepEqual(
    rolls,
    Array.from({ length: 6 }, () => [1, 1, 1, 1]),
  );
  const s = setup("guerreiro");
  s.abilityMethod = "rolled";
  s.rolls = rolls;
  s.baseScores = Object.fromEntries(
    Object.keys(E.data.abilities).map((k) => [k, 3]),
  );
  const d = E.context(s, {});
  choose(d, "campeao");
  assert.equal(E.validate(d).length, 0);
  s.baseScores.str = 4;
  assert.ok(E.validate(d).some((e) => e.includes("totais rolados")));
});

test("escolhas do Patrulheiro são as da versão revisada confirmada", () => {
  const d = E.context(setup("patrulheiro"), {}),
    fields = E.requirements(d);
  assert.deepEqual(
    fields.find((f) => f.id === "favored").options.map((o) => o.value),
    ["Bestas", "Fadas", "Humanoides", "Monstruosidades", "Mortos-vivos"],
  );
  assert.ok(!fields.some((f) => /terreno/i.test(f.label)));
  assert.ok(
    E.data.classes.patrulheiro.features[6].includes("Inimigo Favorito Maior"),
  );
});

for (const feat of E.options.feats)
  test(`talento opcional: ${feat.name} e suas escolhas dependentes`, () => {
    const s = setup("clerigo", "humanoVariante");
    s.allowFeats = true;
    s.abilityMethod = "rolled";
    s.rolls = Array.from({ length: 6 }, () => [6, 6, 6, 6]);
    s.baseScores = Object.fromEntries(
      Object.keys(E.data.abilities).map((k) => [k, 18]),
    );
    const d = E.context(s, {});
    choose(d, "guerra", { racialFeat: feat.name });
    const char = E.create(s, d.answers);
    assert.ok(E.selections(char, null, "racialFeat").includes(feat.name));
    assert.ok(E.features(char).some((f) => f.name === feat.name));
  });

function evolve(char, id, sub, target) {
  while (char.classes.find((c) => c.classId === id).level < target) {
    const d = E.context({}, {}, char, id);
    choose(d, sub);
    char = E.levelUp(char, id, d.answers);
  }
  return char;
}

test("magias de domínio permanecem sempre preparadas e não consomem a seleção diária", () => {
  let char = create("clerigo", "vida");
  char = evolve(char, "clerigo", "vida", 3);
  for (const id of [
    "bencao",
    "curar-ferimentos",
    "restauracao-menor",
    "arma-espiritual",
  ])
    assert.ok(
      char.spells.some((s) => s.bookId === id && s.automatic && s.prepared),
    );
  const d = E.context({}, {}, char, "clerigo");
  choose(d, "vida");
  assert.ok(
    !E.requirements(d)
      .find((f) => f.id === "prepared")
      .options.some((o) => o.value === "curar-ferimentos"),
  );
});
test("aumentar Constituição em 2 no nível 4 aplica o bônus de PV aos quatro níveis", () => {
  let char = evolve(create("guerreiro", "campeao"), "guerreiro", "campeao", 3);
  const hp = char.hpMax;
  const d = E.context({}, {}, char, "guerreiro");
  choose(d, "campeao", { advancement: "asi", asi: ["con", "con"] });
  const next = E.levelUp(char, "guerreiro", d.answers);
  assert.equal(next.hpMax - hp, 12); // 6 + CON 2 + quatro ajustes retroativos.
});
test("Ataque Certeiro não é aceito como truque de ataque do Atirador de Magia", () => {
  const s = setup("mago", "humanoVariante");
  s.allowFeats = true;
  const d = E.context(s, {
    racialFeat: "Atirador de Magia",
    racialFeatClass: "mago",
  });
  const opts = E.requirements(d).find(
    (f) => f.id === "racialFeatCantrip",
  ).options;
  assert.ok(opts.some((o) => o.value === "raio-de-fogo"));
  assert.ok(!opts.some((o) => o.value === "ataque-certeiro"));
});
test("perder Sintonia Elemental numa troca não permite trocá-la novamente", () => {
  let char = evolve(
    create("monge", "quatroElementos"),
    "monge",
    "quatroElementos",
    5,
  );
  const d = E.context({}, {}, char, "monge");
  choose(d, "quatroElementos", { disciplinesReplace: "Sintonia Elemental" });
  char = E.levelUp(char, "monge", d.answers);
  assert.ok(
    !E.selections(char, "monge", "disciplines").includes("Sintonia Elemental"),
  );
  char = evolve(char, "monge", "quatroElementos", 10);
  const next = E.context({}, {}, char, "monge");
  assert.ok(
    !E.requirements(next)
      .find((f) => f.id === "disciplinesReplace")
      .options.some((o) => o.value === "Sintonia Elemental"),
  );
});
test("o monge usa Destreza e escala das Artes Marciais; ataques manuais são preservados", () => {
  let char = create("monge", "maoAberta");
  const sword = char.weapons.find((w) => w.ruleWeapon === "Espada Curta");
  assert.ok(sword);
  char.abilities.str.score = 9;
  char.abilities.dex.score = 16;
  assert.equal(E.weaponStats(char, sword).bonus, "+5");
  assert.equal(E.weaponStats(char, sword).damage, "1d6+3");
  char = evolve(char, "monge", "maoAberta", 17);
  assert.match(E.weaponStats(char, sword).damage, /^1d10/);
  const custom = { name: "Arma da mesa", bonus: "+12", damage: "2d6+8" };
  assert.deepEqual(E.weaponStats(char, custom), custom);
});
test("equipamento inicial e proficiências de ferramentas são concedidos sem copiar inventário da ficha de referência", () => {
  const thief = create("ladino", "ladrao");
  assert.match(thief.proficiencies.tools, /Ferramentas de ladrão/);
  const druid = create("druida", "terra", "humano", "eremita");
  assert.match(druid.proficiencies.tools, /Kit de herbalismo/);
  assert.ok(E.selections(druid, null, "duplicateTools").length === 1);
  const fighter = create("guerreiro", "campeao");
  assert.equal(fighter.armorEquipped, "Cota de malha");
  assert.equal(fighter.shieldEquipped, true);
  assert.ok(fighter.weapons.some((w) => w.name === "Besta Leve"));
  assert.equal(E.progression.weapons.length, 37);
});

module.exports = { choose, create, setup };

test("características homônimas consultam a subclasse correta do livro", () => {
  assert.match(
    E.reference("Golpe Divino", "clerigo", "vida").text,
    /dano\s+radiante/,
  );
  assert.match(
    E.reference("Golpe Divino", "clerigo", "enganacao").text,
    /veneno/,
  );
  assert.match(
    E.reference("Proficiência Adicional", "bardo", "bravura").text,
    /armadura médias/,
  );
  assert.match(
    E.reference("Proficiência Adicional", "bardo", "conhecimento").text,
    /três perícias/,
  );
  assert.match(
    E.reference("Especialização", "ladino").text,
    /ferramentas de ladrão/,
  );
});
test("Sortudo racial não consulta o talento homônimo", () => {
  const racial = E.reference("Sortudo", null, "halflingLeve", "race"),
    feat = E.reference("Sortudo", null, null, "feat");
  assert.equal(racial.page, 28);
  assert.match(racial.text, /Sortudo/);
  assert.doesNotMatch(racial.text, /3 pontos de sorte/);
  assert.equal(feat.page, 172);
  assert.match(feat.text, /3 pontos de sorte/);
});
test("os 42 talentos têm consulta própria, sem cair numa raça ou classe de mesmo nome", () => {
  for (const feat of E.options.feats) {
    const ref = E.reference(feat.name, null, null, "feat");
    assert.ok(ref?.text, feat.name);
    assert.ok(ref.page >= 167 && ref.page <= 172, feat.name);
  }
});

test("todos os ganhos e subclasses das 12 classes têm texto local para consulta", () => {
  for (const [id, cls] of Object.entries(E.data.classes)) {
    for (const [sid, sub] of Object.entries(cls.subclasses)) {
      assert.ok(E.reference(sub.name, id, sid)?.text, sub.name);
      for (const table of [cls.features, sub.features])
        for (const names of Object.values(table))
          for (const name of names)
            assert.ok(
              E.reference(name, id, sid)?.text,
              `${id}/${sid}: ${name}`,
            );
    }
  }
});

test("invocações, metamagias, manobras e disciplinas possuem consulta por opção", () => {
  for (const [id, sid, key, names] of [
    [
      "bruxo",
      "corruptor",
      "invocations",
      E.options.invocations.map((x) => x.name),
    ],
    ["feiticeiro", "selvagem", "metamagic", E.data.metamagic],
    ["guerreiro", "mestreBatalha", "maneuvers", E.data.maneuvers],
    [
      "monge",
      "quatroElementos",
      "disciplines",
      E.options.disciplines.map((x) => x.name),
    ],
  ]) {
    const d = { classId: id, level: 20, answers: { subclass: sid } };
    for (const value of names) {
      const ref = E.optionReference(d, { id: key }, { value, label: value });
      assert.ok(ref?.text, `${key}: ${value}`);
      assert.ok(ref.pdfPage > 0);
      if (["maneuvers", "disciplines"].includes(key))
        assert.ok(ref.text.startsWith(value), value);
    }
  }
  const d = {
    classId: "guerreiro",
    level: 3,
    answers: { subclass: "mestreBatalha" },
  };
  assert.match(
    E.optionReference(
      d,
      { id: "maneuvers" },
      { value: "Ataque de Precisão", label: "Ataque de Precisão" },
    ).text,
    /qualquer efeito do ataque ser aplicado\./,
  );
  assert.match(
    E.optionReference(
      d,
      { id: "maneuvers" },
      { value: "Passo Evasivo", label: "Passo Evasivo" },
    ).text,
    /deslocamento\.$/,
  );
});

test("o mesmo totem mostra a regra do nível e não uma escolha de outro nível", () => {
  const text = (level) =>
    E.optionReference(
      { classId: "barbaro", level, answers: { subclass: "totemico" } },
      { id: "totem" },
      { value: "Urso", label: "Urso" },
    ).text;
  assert.match(text(3), /exceto dano psíquico/);
  assert.match(text(6), /capacidade de carga/i);
  assert.match(text(14), /desvantagem nas jogadas de ataque/);
  assert.doesNotMatch(text(6), /exceto dano psíquico/);
});

// Multiclasse: entradas por todas as classes, sem enumerar builds de nível 20.
function multiCreate(id, subclass, overrides = {}) {
  const s = {
    ...setup(id),
    abilityMethod: "rolled",
    baseScores: Object.fromEntries(
      Object.keys(E.data.abilities).map((k) => [k, 13]),
    ),
    rolls: Array.from({ length: 6 }, () => [5, 4, 4, 1]),
  };
  const d = E.context(s, {});
  choose(d, subclass, overrides);
  return E.create(s, d.answers);
}
function advance(char, id, subclass, overrides = {}) {
  const d = E.context({}, {}, char, id);
  choose(d, subclass, overrides);
  return E.levelUp(char, id, d.answers);
}
for (const first of Object.keys(E.data.classes)) {
  test(`multiclasse: ${first} entra nas outras 11 classes e continua ambas`, () => {
    for (const next of Object.keys(E.data.classes).filter(
      (id) => id !== first,
    )) {
      const original = multiCreate(first);
      original.classes[0].hitDiceUsed = 1;
      original.hpCurrent--;
      const before = JSON.stringify(original),
        equipment = JSON.stringify({
          items: original.inventoryItems,
          coins: original.coins,
          weapons: original.weapons,
        }),
        saves = Object.values(original.abilities).map((a) => a.saveProf);
      let char = advance(original, next);
      assert.equal(JSON.stringify(original), before, "origem preservada");
      assert.deepEqual(
        char.classes.map((c) => [c.classId, c.level]),
        [
          [first, 1],
          [next, 1],
        ],
      );
      assert.equal(char.classes[0].hitDiceUsed, 1);
      assert.equal(char.classes[1].hitDiceUsed, 0);
      assert.equal(char.classes[1].hitDie, E.data.classes[next].die);
      const expected =
        E.data.classes[next].die / 2 +
        1 +
        2 +
        (next === "feiticeiro" && char.classes[1].subclassId === "draconica"
          ? 1
          : 0);
      assert.equal(
        char.hpMax - original.hpMax,
        expected,
        `${first}→${next}: PV de nível posterior ao primeiro`,
      );
      assert.equal(
        char.hpMax - char.hpCurrent,
        1,
        "evoluir não cura o dano anterior",
      );
      assert.equal(
        JSON.stringify({
          items: char.inventoryItems,
          coins: char.coins,
          weapons: char.weapons,
        }),
        equipment,
        "não recebe equipamento nem ouro de nova classe",
      );
      assert.deepEqual(
        Object.values(char.abilities).map((a) => a.saveProf),
        saves,
        "resistências iniciais não são concedidas outra vez",
      );
      if (next === "bardo") {
        assert.equal(char.skillsProf.length, original.skillsProf.length + 1);
        assert.equal(
          char.proficiencies.tools
            .split(", ")
            .filter((t) => t.startsWith("Instrumento:")).length,
          original.proficiencies.tools
            .split(", ")
            .filter((t) => t.startsWith("Instrumento:")).length + 1,
        );
      }
      char = advance(char, next);
      char = advance(char, first);
      assert.deepEqual(
        char.classes.map((c) => c.level),
        [2, 2],
      );
      assert.equal(char.rules.history.at(-1).totalLevel, 4);
      assert.equal(char.skillsProf.length, new Set(char.skillsProf).size);
    }
  });
}
test("multiclasse: requisitos da origem e de todas as classes, incluindo OU e E", () => {
  const char = multiCreate("guerreiro");
  char.abilities.str.score = 12;
  assert.equal(
    E.multiclassEligibility(char, "bruxo").allowed,
    true,
    "Guerreiro aceita DES 13",
  );
  char.abilities.dex.score = 12;
  assert.match(
    E.multiclassEligibility(char, "bruxo").errors.join(" "),
    /Guerreiro/,
  );
  assert.throws(() => advance(char, "bruxo"), /Guerreiro/);
  char.abilities.str.score = 14;
  assert.equal(
    E.multiclassEligibility(char, "monge").allowed,
    false,
    "Monge exige DES e SAB",
  );
  char.abilities.dex.score = 14;
  char.abilities.wis.score = 12;
  assert.equal(E.multiclassEligibility(char, "patrulheiro").allowed, false);
  char.abilities.wis.score = 14;
  char.abilities.cha.score = 12;
  assert.equal(E.multiclassEligibility(char, "paladino").allowed, false);
  assert.equal(
    E.multiclassEligibility(char, "guerreiro").allowed,
    true,
    "continuar classe atual não exige requalificação",
  );
  char.abilities.cha.score = 14;
  const two = advance(char, "mago");
  two.abilities.int.score = 12;
  assert.match(E.multiclassEligibility(two, "bruxo").errors.join(" "), /Mago/);
  assert.throws(() => E.levelUp(char, "__proto__", {}), /12 classes/);
});
test("multiclasse: terceira classe, subclasses, histórico e limite global 20", () => {
  let char = multiCreate("feiticeiro", "selvagem");
  char = advance(char, "bruxo", "corruptor");
  char = advance(char, "clerigo", "vida");
  assert.deepEqual(
    char.classes.map((c) => c.subclassId),
    ["selvagem", "corruptor", "vida"],
  );
  assert.equal(
    char.armorProficiencies.includes("pesada"),
    true,
    "Domínio da Vida concede pesada pela característica",
  );
  assert.equal(char.rules.history.at(-1).totalLevel, 3);
  assert.ok(
    E.features(char)
      .filter((f) => f.classId === "clerigo")
      .every((f) => f.order === 3),
  );
  while (char.classes.reduce((n, c) => n + c.level, 0) < 20)
    char = advance(char, "feiticeiro", "selvagem");
  const before = JSON.stringify(char);
  assert.throws(() => E.levelUp(char, "mago", {}), /máximo/);
  assert.throws(() => E.levelUp(char, "bruxo", {}), /máximo/);
  assert.equal(JSON.stringify(char), before);
});
test("multiclasse: proficiências reduzidas, Estilo de Luta e Especialização sem repetição", () => {
  let char = advance(multiCreate("mago"), "guerreiro", undefined, {
    fighting: "Defesa",
  });
  assert.ok(!char.armorProficiencies.includes("pesada"));
  const rapier = { ruleWeapon: "Rapieira" };
  let bard = advance(multiCreate("mago"), "bardo");
  assert.equal(
    E.weaponStats(bard, rapier).bonus,
    "+2",
    "Bardo como nova classe não concede rapieira",
  );
  bard = advance(bard, "ladino");
  assert.equal(
    E.weaponStats(bard, rapier).bonus,
    "+2",
    "Ladino como nova classe também não concede rapieira",
  );
  assert.ok(bard.proficiencies.tools.includes("Ferramentas de ladrão"));
  char = advance(char, "paladino");
  const d = E.context({}, {}, char, "paladino");
  assert.ok(
    !E.requirements(d)
      .find((f) => f.id === "fighting")
      .options.some((o) => o.value === "Defesa"),
  );
  assert.throws(
    () => advance(char, "paladino", undefined, { fighting: "Defesa" }),
    /indisponível/,
  );
  let rogue = advance(multiCreate("ladino"), "bardo");
  rogue = advance(rogue, "bardo");
  const req = E.requirements(E.context({}, {}, rogue, "bardo")).find(
    (f) => f.id === "expertise",
  );
  assert.ok(req.options.every((o) => !rogue.expertise.includes(o.value)));
});
test("multiclasse: Conjuração só combina classes que já receberam a característica", () => {
  let char = multiCreate("paladino");
  char = advance(advance(char, "paladino"), "paladino");
  assert.equal(char.standardSlots[1].total, 3);
  char.standardSlots[1].used = 1;
  char = advance(char, "patrulheiro");
  assert.equal(
    char.standardSlots[1].total,
    3,
    "Patrulheiro 1 ainda não altera a tabela de Paladino 3",
  );
  assert.equal(char.standardSlots[1].used, 1);
  char = advance(char, "patrulheiro");
  assert.equal(
    char.standardSlots[1].total,
    3,
    "dois meios conjuradores arredondam separadamente para baixo",
  );
  let ranger = multiCreate("patrulheiro", "cacador");
  for (let i = 0; i < 3; i++)
    ranger = advance(ranger, "patrulheiro", "cacador");
  for (let i = 0; i < 3; i++) ranger = advance(ranger, "mago", "abjuracao");
  assert.deepEqual(
    [1, 2, 3].map((n) => ranger.standardSlots[n].total),
    [4, 3, 2],
  );
  assert.ok(
    ranger.spells
      .filter((s) => s.classId === "patrulheiro")
      .every((s) => s.circle <= 1),
  );
  assert.ok(
    ranger.spells
      .filter((s) => s.classId === "mago")
      .every((s) => s.circle <= 2),
  );
  let pact = multiCreate("bruxo", "corruptor");
  pact = advance(advance(pact, "bruxo"), "bruxo");
  pact.pactMagic.used = 1;
  for (let i = 0; i < 3; i++) pact = advance(pact, "feiticeiro", "selvagem");
  assert.deepEqual(pact.pactMagic, { level: 2, total: 2, used: 1 });
  assert.deepEqual(
    [1, 2, 3].map((n) => pact.standardSlots[n].total),
    [4, 2, 0],
  );
});
test("multiclasse: dois arquétipos de um terço usam níveis próprios e não somam frações", () => {
  let char = multiCreate("guerreiro", "cavaleiroArcano");
  for (let i = 0; i < 3; i++)
    char = advance(char, "guerreiro", "cavaleiroArcano");
  for (let i = 0; i < 3; i++)
    char = advance(char, "ladino", "trapaceiroArcano");
  assert.equal(
    char.standardSlots[1].total,
    3,
    "Guerreiro 4 / Ladino 3 conta como conjurador 2",
  );
  assert.equal(char.standardSlots[2].total, 0);
  assert.ok(char.spells.every((s) => s.circle <= 1));
});
test("multiclasse: primeira Defesa sem Armadura e interações do livro", () => {
  for (const [first, next] of [
    ["barbaro", "monge"],
    ["monge", "barbaro"],
  ]) {
    const char = advance(multiCreate(first), next);
    assert.equal(E.unarmoredDefense(char), first);
    assert.equal(
      E.features(char).filter((f) => f.name === "Defesa sem Armadura").length,
      1,
    );
    assert.ok(
      E.multiclassNotes(char).some((n) => n.name === "Defesa sem Armadura"),
    );
  }
  let char = multiCreate("clerigo", "vida");
  for (let i = 0; i < 5; i++) char = advance(char, "clerigo");
  for (let i = 0; i < 3; i++) char = advance(char, "paladino", "devocao");
  assert.match(
    E.multiclassNotes(char).find((n) => /Canalizar/.test(n.name)).text,
    /2 uso/,
  );
  let martial = multiCreate("guerreiro", "campeao");
  for (let i = 0; i < 4; i++)
    martial = advance(martial, "guerreiro", "campeao");
  for (let i = 0; i < 5; i++) martial = advance(martial, "paladino", "devocao");
  assert.ok(
    E.multiclassNotes(martial).some((n) => /Ataque Extra/.test(n.name)),
  );
});
