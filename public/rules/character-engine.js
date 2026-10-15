/* Motor sem DOM: valida todas as escolhas antes de produzir uma nova ficha.
   Regras: livro de referência local; Patrulheiro Revisado confirmado pelo usuário.
   Não altera o objeto recebido, o armazenamento ou dados pessoais do personagem de referência. */
(function (root) {
  const node = typeof module !== "undefined";
  const D = node ? require("./phb2014-data") : root.PHB_DATA;
  const O = node ? require("./phb2014-options") : root.PHB_OPTIONS;
  const P = node ? require("./phb2014-progression") : root.PHB_PROGRESSION;
  const S = node ? require("./phb2014-spells") : root.PHB_SPELLS;
  const R = node ? require("./phb2014-references") : root.PHB_REFERENCES;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const norm = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const arr = (x) =>
    Array.isArray(x) ? x : x === undefined || x === null || x === "" ? [] : [x];
  const mod = (n) => Math.floor((n - 10) / 2);
  const uniq = (x) => [...new Set(x)];
  const allSkills = Object.keys(D.skills),
    allAbilities = Object.keys(D.abilities);
  // Livro local, pp. 165–166: cada grupo exige 13 em uma das habilidades.
  // Proficiências abaixo são apenas as de entrada por multiclasse, não as iniciais.
  const multiclass = {
    barbaro: {
      requires: [["str"]],
      armor: ["escudo"],
      weapons: "Armas simples e marciais",
    },
    bardo: {
      requires: [["cha"]],
      armor: ["leve"],
      skill: "any",
      instrument: true,
    },
    bruxo: { requires: [["cha"]], armor: ["leve"], weapons: "Armas simples" },
    clerigo: { requires: [["wis"]], armor: ["leve", "media", "escudo"] },
    druida: { requires: [["wis"]], armor: ["leve", "media", "escudo"] },
    feiticeiro: { requires: [["cha"]], armor: [] },
    guerreiro: {
      requires: [["str", "dex"]],
      armor: ["leve", "media", "escudo"],
      weapons: "Armas simples e marciais",
    },
    ladino: {
      requires: [["dex"]],
      armor: ["leve"],
      skill: "class",
      tools: ["Ferramentas de ladrão"],
    },
    mago: { requires: [["int"]], armor: [] },
    monge: {
      requires: [["dex"], ["wis"]],
      armor: [],
      weapons: "Armas simples, espadas curtas",
    },
    paladino: {
      requires: [["str"], ["cha"]],
      armor: ["leve", "media", "escudo"],
      weapons: "Armas simples e marciais",
    },
    patrulheiro: {
      requires: [["dex"], ["wis"]],
      armor: ["leve", "media", "escudo"],
      skill: "class",
      weapons: "Armas simples e marciais",
    },
  };
  function multiclassEligibility(char, classId) {
    const adding = !!char && !classEntry(char, classId),
      checks = [],
      errors = [];
    if (!Object.hasOwn(D.classes, classId))
      errors.push("Escolha uma das 12 classes do livro.");
    if (adding && !errors.length) {
      for (const id of uniq(
        char.classes.map((c) => c.classId).concat(classId),
      )) {
        const groups = multiclass[id]?.requires || [],
          required = groups
            .map((g) => g.map((k) => `${D.abilities[k]} 13`).join(" ou "))
            .join(" e "),
          actual = uniq(groups.flat())
            .map((k) => `${D.abilities[k]} ${char.abilities[k]?.score ?? "?"}`)
            .join(", "),
          met = groups.every((g) =>
            g.some((k) => char.abilities[k]?.score >= 13),
          );
        checks.push({ classId: id, required, actual, met });
        if (!met)
          errors.push(
            `Multiclasse — ${D.classes[id]?.name || id}: exige ${required}; atual: ${actual}.`,
          );
      }
    }
    if (char?.classes.reduce((n, c) => n + c.level, 0) >= 20)
      errors.push("O nível máximo do personagem é 20.");
    return { adding, allowed: !errors.length, checks, errors };
  }
  function unarmoredDefense(char) {
    // A ordem das entradas registra a aquisição da primeira Defesa sem Armadura.
    return (
      char.classes.find((c) => ["barbaro", "monge"].includes(c.classId))
        ?.classId || null
    );
  }
  function classFeatures(d) {
    const c = D.classes[d.classId];
    if (!c) return [];
    const owner = unarmoredDefense(
      d.char || { classes: [{ classId: d.classId }] },
    );
    return [
      ...(c.features[d.level] || []),
      ...(c.subclasses[effectiveSub(d)]?.features[d.level] || []),
      ...(c.asi.includes(d.level) ? ["Incremento no Valor de Habilidade"] : []),
    ].filter(
      (name) =>
        norm(name) !== "defesa-sem-armadura" || !owner || owner === d.classId,
    );
  }
  function multiclassNotes(char) {
    if (char.classes.length < 2) return [];
    const ids = char.classes.map((c) => c.classId),
      out = [];
    const add = (name, text) =>
      out.push({ name, text, page: 166, pdfPage: 165 });
    if (
      ids.includes("bruxo") &&
      char.classes.some(
        (c) =>
          (D.classes[c.classId]?.casting && c.classId !== "bruxo") ||
          D.classes[c.classId]?.subclasses[c.subclassId]?.casting,
      )
    )
      add(
        "Conjuração e Magia de Pacto",
        "As reservas são separadas. Uma magia conhecida/preparada pode usar qualquer reserva compatível, mantendo a habilidade de conjuração da sua classe de origem. Pacto recupera no descanso curto ou longo; Conjuração, no longo.",
      );
    if (
      char.classes.filter(
        (c) =>
          (D.classes[c.classId]?.casting && c.classId !== "bruxo") ||
          D.classes[c.classId]?.subclasses[c.subclassId]?.casting,
      ).length > 1
    )
      add(
        "Magias por classe",
        "Conhecidas, grimório e preparação seguem o nível de cada classe separadamente. Espaços combinados mais altos permitem aprimorar magias conhecidas, sem liberar novas magias desses círculos. Truques escalam pelo nível total do personagem.",
      );
    const extraSources = char.classes.filter((c) => {
      const sid = c.subclassId || inferSubclass(c);
      return Array.from({ length: c.level }, (_, i) => [
        ...(D.classes[c.classId]?.features[i + 1] || []),
        ...(D.classes[c.classId]?.subclasses[sid]?.features[i + 1] || []),
      ])
        .flat()
        .some((name) => /^ataque-extra/.test(norm(name)));
    });
    if (
      extraSources.length > 1 ||
      (extraSources.length &&
        selections(char, "bruxo", "invocations").includes("Lâmina Sedenta"))
    )
      add(
        "Ataque Extra não se soma",
        "Ataque Extra de classes diferentes e Lâmina Sedenta não somam ataques. Use a maior quantidade concedida por uma característica; a progressão adicional do Guerreiro exige níveis de Guerreiro.",
      );
    if (
      (classEntry(char, "clerigo")?.level || 0) >= 2 &&
      (classEntry(char, "paladino")?.level || 0) >= 3
    ) {
      const level = classEntry(char, "clerigo").level,
        uses = level >= 18 ? 3 : level >= 6 ? 2 : 1;
      add(
        "Canalizar Divindade compartilhado",
        `Os efeitos de Clérigo e Paladino ficam disponíveis, mas os usos não se somam: ${uses} uso(s) entre descansos curtos ou longos. O número só aumenta nos níveis de Clérigo que o concedem; controle o gasto manualmente.`,
      );
    }
    if (ids.includes("barbaro") && ids.includes("monge"))
      add(
        "Defesa sem Armadura",
        `Somente a primeira Defesa sem Armadura, de ${D.classes[unarmoredDefense(char)].name}, é adquirida. As fórmulas não se somam e a segunda classe não concede outra. Monge também exige estar sem escudo.`,
      );
    if (
      ids.includes("barbaro") &&
      char.classes.some(
        (c) =>
          D.classes[c.classId]?.casting ||
          D.classes[c.classId]?.subclasses[c.subclassId]?.casting,
      )
    )
      out.push({
        name: "Fúria e magia",
        text: "Durante a Fúria não é possível conjurar nem manter concentração. O estado de Fúria e a concentração ainda são controlados manualmente.",
        page: 48,
        pdfPage: 47,
      });
    if (ids.includes("druida"))
      out.push({
        name: "Armaduras do Druida",
        text: "Druidas não usam armaduras nem escudos feitos de metal, mesmo com proficiência obtida de outra classe. A escolha do material do equipamento permanece manual.",
        page: 72,
        pdfPage: 71,
      });
    return out;
  }
  const aliases = {
    "infringir-ferimentos": "infligir-ferimentos",
    "banquete-dos-herois": "banquete-de-herois",
    "enfraquecer-o-intelecto": "enfraquecer-intelecto",
    "nevoa-de-adagas": "nuvem-de-adagas",
    "invocar-familiar": "convocar-familiar",
    "passo-de-arvore": "caminhar-em-arvores",
    "protecao-contra-o-bem-e-mal": "protecao-contra-o-bem-e-o-mal",
  };
  delete aliases["protecao-contra-o-bem-e-mal"];
  aliases["protecao-contra-o-bem-e-o-mal"] = "protecao-contra-o-bem-e-mal";
  const spellIndex = new Map(S.map((s) => [s.id, s]));
  const classRanges = {
    barbaro: [46, 50],
    bardo: [51, 55],
    bruxo: [56, 62],
    clerigo: [63, 70],
    druida: [71, 76],
    feiticeiro: [77, 82],
    guerreiro: [83, 88],
    ladino: [89, 93],
    mago: [94, 101],
    monge: [102, 107],
    paladino: [108, 114],
    patrulheiro: [115, 121],
  };
  const referenceIndex = new Map();
  let referenceClass = null,
    referenceSubclass = null;
  for (const raw of R) {
    const key = norm(raw.name),
      currentClass =
        Object.keys(classRanges).find(
          (id) =>
            raw.page >= classRanges[id][0] && raw.page <= classRanges[id][1],
        ) || null;
    if (currentClass !== referenceClass) {
      referenceClass = currentClass;
      referenceSubclass = null;
    }
    if (referenceClass) {
      const sub = Object.entries(D.classes[referenceClass].subclasses).find(
        ([, sub]) =>
          norm(sub.name) === key ||
          (referenceClass === "patrulheiro" &&
            key === "conclave-do-rastreador" &&
            norm(sub.name).startsWith(key)),
      );
      if (sub) referenceSubclass = sub[0];
      if (referenceClass === "bruxo" && key === "invocacoes-misticas")
        referenceSubclass = null;
    }
    // Um título igual não significa uma regra igual: preserve seu contexto
    // no livro (ex.: Golpe Divino de Vida versus Enganação).
    const r = {
      ...raw,
      classId: referenceClass,
      subclassId: referenceSubclass,
    };
    if (!referenceIndex.has(key)) referenceIndex.set(key, []);
    referenceIndex.get(key).push(r);
  }
  function spell(value) {
    const id = norm(value);
    return spellIndex.get(aliases[id] || id);
  }
  function selections(char, classId, key) {
    let values =
      key === "disciplines" &&
      classEntry(char, "monge")?.subclassId === "quatroElementos"
        ? ["Sintonia Elemental"]
        : [];
    for (const e of (char?.rules?.history || []).filter(
      (e) => !classId || e.classId === classId,
    )) {
      if (["invocations", "maneuvers", "disciplines"].includes(key))
        values = values.filter(
          (x) => !arr(e.answers[key + "Replace"]).includes(x),
        );
      values.push(...arr(e.answers[key]));
      if (["invocations", "maneuvers", "disciplines"].includes(key))
        values.push(...arr(e.answers[key + "Replacement"]));
    }
    return values;
  }
  function classEntry(char, id) {
    return char?.classes?.find((c) => c.classId === id);
  }
  function effectiveSub(d) {
    return (
      d.answers.subclass ||
      classEntry(d.char, d.classId)?.subclassId ||
      inferSubclass(classEntry(d.char, d.classId))
    );
  }
  function inferSubclass(c) {
    if (!c) return "";
    return (
      Object.keys(D.classes[c.classId]?.subclasses || {}).find((k) =>
        norm(c.subclass).includes(
          norm(D.classes[c.classId].subclasses[k].name).replace(
            /^(caminho-do-|linhagem-|dominio-do-|o-)/,
            "",
          ),
        ),
      ) ||
      (c.classId === "feiticeiro" && /selvagem/i.test(c.subclass)
        ? "selvagem"
        : c.classId === "bruxo" && /corruptor|fiend/i.test(c.subclass)
          ? "corruptor"
          : "")
    );
  }
  function context(setup = {}, answers = {}, char = null, classId = null) {
    const id = classId || setup.classId;
    return {
      setup,
      char,
      classId: id,
      level: (classEntry(char, id)?.level || 0) + 1,
      answers,
      creating: !char,
      // Capturar antes de inserir a classe: applyChoices recalcula os requisitos
      // após atualizar a cópia, mas ainda precisa das escolhas de entrada.
      addingClass: !!char && !classEntry(char, id),
    };
  }
  function raceOf(d) {
    const id = d.setup.raceId || d.char?.rules?.raceId;
    return Object.hasOwn(O.races, id) ? O.races[id] : undefined;
  }
  function bgOf(d) {
    const id = d.setup.backgroundId || d.char?.rules?.backgroundId;
    return Object.hasOwn(O.backgrounds, id) ? O.backgrounds[id] : undefined;
  }
  function scores(d) {
    if (d.char) {
      const out = Object.fromEntries(
        allAbilities.map((a) => [a, d.char.abilities[a].score]),
      );
      return out;
    }
    const race = raceOf(d),
      out = Object.fromEntries(
        allAbilities.map((a) => [
          a,
          Number(d.setup.baseScores?.[a] || 10) + (race?.bonus[a] || 0),
        ]),
      );
    for (const a of arr(d.answers.raceAbilities)) if (a in out) out[a]++;
    return out;
  }
  function finalScores(d) {
    const out = scores(d);
    for (const k of arr(d.answers.asi)) if (k in out) out[k]++;
    for (const key of ["feat", "racialFeat"]) {
      const k = d.answers[key + "Ability"] || d.answers[key + "Resilient"];
      if (k in out && out[k] < 20) out[k]++;
    }
    return out;
  }
  function casting(d) {
    return (
      D.classes[d.classId]?.subclasses[effectiveSub(d)]?.casting ||
      D.classes[d.classId]?.casting ||
      null
    );
  }
  function ability(d) {
    return (
      D.classes[d.classId]?.subclasses[effectiveSub(d)]?.ability ||
      D.classes[d.classId]?.ability
    );
  }
  function maxSpellLevel(d) {
    const c = casting(d),
      n = d.level;
    if (c === "pact") return Math.min(5, Math.ceil(n / 2));
    if (c === "third")
      return n < 3 ? 0 : n < 7 ? 1 : n < 13 ? 2 : n < 19 ? 3 : 4;
    if (c?.startsWith("half")) return n < 2 ? 0 : Math.min(5, Math.ceil(n / 4));
    return c ? Math.min(9, Math.ceil(n / 2)) : 0;
  }
  function spellLimit(d) {
    return casting(d) === "third"
      ? d.level < 3
        ? 0
        : d.level < 7
          ? 1
          : d.level < 13
            ? 2
            : d.level < 19
              ? 3
              : 4
      : maxSpellLevel(d);
  }
  function subSpells(d) {
    let key = d.classId + ":" + effectiveSub(d);
    if (d.classId === "druida" && effectiveSub(d) === "terra")
      key =
        "terra:" +
        (d.answers.terrain || selections(d.char, "druida", "terrain")[0]);
    return Object.entries(P.subclassSpells[key] || {})
      .filter(([lv]) => +lv <= d.level)
      .flatMap(([, names]) => names.map(spell).filter(Boolean));
  }
  function spellOptions(
    d,
    {
      level = null,
      any = false,
      ritual = false,
      schools = null,
      exclude = [],
      list = null,
    } = {},
  ) {
    const ids = new Set(exclude.map((x) => spell(x)?.id || x));
    const classList = list || (casting(d) === "third" ? "mago" : d.classId);
    const expanded = d.classId === "bruxo" ? subSpells(d).map((s) => s.id) : [];
    return S.filter(
      (s) =>
        (any || s.classes.includes(classList) || expanded.includes(s.id)) &&
        (level === null
          ? s.level > 0 && s.level <= spellLimit(d)
          : s.level === level) &&
        (!ritual || s.ritual) &&
        (!schools || schools.includes(norm(s.school))) &&
        !ids.has(s.id),
    ).map((s) => ({
      value: s.id,
      label: `${s.name} (${s.level === 0 ? "truque" : s.level + "º círculo"})`,
      spell: s,
    }));
  }
  function learned(d) {
    return (d.char?.spells || []).filter(
      (s) => s.classId === d.classId && !s.automatic && !s.extraSource,
    );
  }
  function selectedSkills(d) {
    return uniq([
      ...(d.char?.skillsProf || []),
      ...(raceOf(d)?.skills || []),
      ...(bgOf(d)?.skills || []),
      ...arr(d.answers.classSkills),
      ...arr(d.answers.raceSkills),
      ...arr(d.answers.backgroundSkills),
      ...arr(d.answers.duplicateSkills),
      ...arr(d.answers.loreSkills),
      ...arr(d.answers.knowledgeSkills),
      ...arr(d.answers.natureSkill),
    ]);
  }
  function armorFor(d) {
    const existing =
      d.char?.armorProficiencies ||
      (d.char
        ? d.char.classes.flatMap((c, i) => [
            ...(i === 0
              ? D.classes[c.classId]?.armor || []
              : multiclass[c.classId]?.armor || []),
            ...(c.classId === "clerigo" &&
            ["vida", "natureza", "guerra", "tempestade"].includes(
              c.subclassId || inferSubclass(c),
            )
              ? ["pesada"]
              : []),
            ...(c.classId === "bardo" &&
            c.level >= 3 &&
            (c.subclassId || inferSubclass(c)) === "bravura"
              ? ["media", "escudo"]
              : []),
          ])
        : D.classes[d.classId]?.armor || []);
    let armor = [
      ...existing,
      ...(d.addingClass ? multiclass[d.classId]?.armor || [] : []),
      ...(raceOf(d)?.armor || []),
    ];
    if (
      d.classId === "clerigo" &&
      ["vida", "natureza", "guerra", "tempestade"].includes(effectiveSub(d))
    )
      armor.push("pesada");
    if (d.classId === "bardo" && d.level >= 3 && effectiveSub(d) === "bravura")
      armor.push("media", "escudo");
    return uniq(armor);
  }
  function hasCasting(d) {
    return (
      !!spellLimit(d) ||
      !!raceOf(d)?.cantrip ||
      !!raceOf(d)?.racialSpells ||
      !!d.char?.spells?.length
    );
  }
  function legalFeats(d) {
    const a = scores(d),
      owned = selections(d.char, null, "feat").concat(
        selections(d.char, null, "racialFeat"),
      );
    return O.feats
      .filter(
        (f) =>
          (f.repeat || !owned.includes(f.name)) &&
          (!f.casting || hasCasting(d)) &&
          (!f.armor || armorFor(d).includes(f.armor)) &&
          (!f.min || Object.entries(f.min).every(([k, v]) => a[k] >= v)) &&
          (!f.either || Object.entries(f.either).some(([k, v]) => a[k] >= v)),
      )
      .map((f) => ({ value: f.name, label: f.name }));
  }
  function requirements(d) {
    const req = [],
      a = d.answers,
      c = D.classes[d.classId],
      n = d.level,
      sub = effectiveSub(d),
      old = (key) => selections(d.char, d.classId, key);
    if (!Object.hasOwn(D.classes, d.classId)) return req;
    const add = (id, label, options, count = 1, extra = {}) => {
      const opts = options.map((o) =>
        typeof o === "string"
          ? { value: o, label: D.skills[o] || D.abilities[o] || o }
          : o,
      );
      req.push({
        id,
        label,
        options: opts,
        count,
        min: count,
        unique: true,
        step: "class",
        ...extra,
      });
    };
    const skill = (id, label, count, options = allSkills) =>
      add(
        id,
        label,
        options.filter(
          (s) =>
            !selectedSkills({ ...d, answers: { ...a, [id]: [] } }).includes(s),
        ),
        count,
        { step: "proficiencies" },
      );
    const toolOptions = (group) =>
      D.tools.filter(
        (t) =>
          !group ||
          (group === "artisan"
            ? t.startsWith("Ferramentas de artesão:")
            : group === "artisanDwarf"
              ? /ferreiro|cervejeiro|pedreiro/.test(t)
              : group === "instrument"
                ? t.startsWith("Instrumento:")
                : group === "game"
                  ? t.startsWith("Jogo:")
                  : true),
      );
    const lang = (id, label, count) =>
      add(
        id,
        label,
        D.languages.filter(
          (l) =>
            ![
              ...(raceOf(d)?.languages || []),
              ...String(d.char?.proficiencies?.languages || "").split(", "),
              ...[
                "raceLanguages",
                "backgroundLanguages",
                "knowledgeLanguages",
                "favoredLanguage",
                "featLanguages",
                "racialFeatLanguages",
              ]
                .filter((k) => k !== id)
                .flatMap((k) => arr(a[k])),
            ].includes(l),
        ),
        count,
        { step: "proficiencies" },
      );
    if (d.creating) {
      const r = raceOf(d),
        bg = bgOf(d);
      if (r?.abilityChoices)
        add(
          "raceAbilities",
          "Bônus raciais: +1 em habilidades diferentes",
          allAbilities.filter((k) => !r.abilityExclude?.includes(k)),
          r.abilityChoices,
          { step: "attributes" },
        );
      if (r?.skillChoices)
        skill("raceSkills", "Perícias da raça", r.skillChoices);
      if (r?.extraLanguages)
        lang("raceLanguages", "Idiomas adicionais da raça", r.extraLanguages);
      if (r?.toolChoice)
        add("raceTool", "Ferramenta da raça", toolOptions(r.toolChoice), 1, {
          step: "proficiencies",
        });
      if (r?.dragonChoice)
        add("raceDragon", "Ancestral dracônico da raça", O.dragons, 1, {
          step: "identity",
        });
      if (r?.cantrip)
        add(
          "raceCantrip",
          "Truque racial (Inteligência)",
          spellOptions(d, { level: 0, list: r.cantrip }),
          1,
          { step: "magic" },
        );
      if (bg) {
        const overlap = (bg.skills || []).filter((s) =>
          r?.skills?.includes(s),
        ).length;
        if (overlap)
          skill(
            "duplicateSkills",
            "Substituir perícia repetida de raça/antecedente",
            overlap,
          );
        if (bg.languages)
          lang("backgroundLanguages", "Idiomas do antecedente", bg.languages);
        if (bg.toolChoices)
          add(
            "backgroundTools",
            "Ferramenta do antecedente",
            toolOptions(bg.toolGroup),
            bg.toolChoices,
            { step: "proficiencies" },
          );
        if (bg.variants)
          add("backgroundVariant", "Variação do antecedente", bg.variants, 1, {
            step: "identity",
          });
      }
      skill(
        "classSkills",
        `Perícias iniciais de ${c.name}`,
        c.skillCount,
        c.skills,
      );
      if (d.classId === "bardo")
        add(
          "classTools",
          "Três instrumentos musicais",
          toolOptions("instrument"),
          3,
          { step: "proficiencies" },
        );
      if (d.classId === "monge")
        add(
          "classTools",
          "Ferramenta de artesão ou instrumento",
          toolOptions().filter((t) =>
            /^Ferramentas de artesão:|^Instrumento:/.test(t),
          ),
          1,
          { step: "proficiencies" },
        );
      const initialTools = [
        ...(r?.tools || []),
        ...(bg?.tools || []),
        ...(d.classId === "ladino"
          ? ["Ferramentas de ladrão"]
          : d.classId === "druida"
            ? ["Kit de herbalismo"]
            : []),
        ...arr(a.raceTool),
        ...arr(a.classTools),
        ...arr(a.backgroundTools),
      ];
      const repeated = initialTools.length - uniq(initialTools).length;
      if (repeated)
        add(
          "duplicateTools",
          "Substituir proficiência repetida em ferramenta",
          D.tools.filter((t) => !initialTools.includes(t)),
          repeated,
          { step: "proficiencies" },
        );
      equipmentRequirements(d, add);
    }
    if (d.addingClass) {
      const gains = multiclass[d.classId];
      if (gains.skill)
        skill(
          "classSkills",
          `Perícia de multiclasse: ${c.name}`,
          1,
          gains.skill === "any" ? allSkills : c.skills,
        );
      if (gains.instrument)
        add(
          "classTools",
          "Instrumento musical de multiclasse",
          toolOptions("instrument").filter(
            (t) => !String(d.char.proficiencies.tools).split(", ").includes(t),
          ),
          1,
          { step: "proficiencies" },
        );
    }
    if (
      n >= c.subLevel &&
      !effectiveSub({ ...d, answers: { ...a, subclass: "" } })
    )
      add(
        "subclass",
        `${c.name}: escolha a subclasse`,
        Object.entries(c.subclasses).map(([value, s]) => ({
          value,
          label: s.name,
        })),
        1,
        { step: "identity" },
      );
    if (
      (d.classId === "guerreiro" && n === 1) ||
      (d.classId === "guerreiro" && sub === "campeao" && n === 10) ||
      (["paladino", "patrulheiro"].includes(d.classId) && n === 2)
    ) {
      const styles =
        d.classId === "paladino"
          ? D.fighting.filter(
              (x) => !["Arquearia", "Combate com Duas Armas"].includes(x),
            )
          : d.classId === "patrulheiro"
            ? D.fighting.filter(
                (x) => !["Combate com Armas Grandes", "Proteção"].includes(x),
              )
            : D.fighting;
      add(
        "fighting",
        "Estilo de Luta",
        styles.filter((x) => !selections(d.char, null, "fighting").includes(x)),
      );
    }
    if (
      (d.classId === "ladino" && [1, 6].includes(n)) ||
      (d.classId === "bardo" && [3, 10].includes(n))
    )
      add(
        "expertise",
        "Especialização: dobrar proficiência",
        selectedSkills(d)
          .concat(d.classId === "ladino" ? ["Ferramentas de ladrão"] : [])
          .filter(
            (x) =>
              !old("expertise").includes(x) && !d.char?.expertise?.includes(x),
          ),
        2,
        { step: "proficiencies" },
      );
    if (d.classId === "bardo" && sub === "conhecimento" && n === 3)
      skill(
        "loreSkills",
        "Proficiências adicionais do Colégio do Conhecimento",
        3,
      );
    if (d.classId === "clerigo" && n === 1 && sub === "conhecimento") {
      skill("knowledgeSkills", "Bênçãos do Conhecimento (especialização)", 2, [
        "arcanismo",
        "historia",
        "natureza",
        "religiao",
      ]);
      lang("knowledgeLanguages", "Idiomas do Domínio do Conhecimento", 2);
    }
    if (d.classId === "clerigo" && n === 1 && sub === "natureza") {
      skill("natureSkill", "Perícia do Acólito da Natureza", 1, [
        "lidar_animais",
        "natureza",
        "sobrevivencia",
      ]);
      add(
        "natureCantrip",
        "Truque de druida do domínio",
        spellOptions(d, { level: 0, list: "druida" }),
        1,
        { step: "magic" },
      );
    }
    if (d.classId === "druida" && sub === "terra" && n === 2)
      add(
        "landCantrip",
        "Truque adicional do Círculo da Terra",
        spellOptions(d, { level: 0, exclude: learned(d).map((s) => s.name) }),
        1,
        { step: "magic" },
      );
    if (d.classId === "druida" && sub === "terra" && n === 3)
      add("terrain", "Terreno das magias do Círculo da Terra", O.terrains);
    if (d.classId === "feiticeiro" && sub === "draconica" && n === 1)
      add("dragon", "Ancestral dracônico da origem", O.dragons);
    if (d.classId === "feiticeiro" && [3, 10, 17].includes(n))
      add(
        "metamagic",
        "Opções de Metamágica",
        D.metamagic.filter((x) => !old("metamagic").includes(x)),
        n === 3 ? 2 : 1,
      );
    if (d.classId === "barbaro" && sub === "totemico" && [3, 6, 14].includes(n))
      add("totem", "Totem deste nível (independente dos anteriores)", [
        "Urso",
        "Águia",
        "Lobo",
      ]);
    if (d.classId === "patrulheiro") {
      if ([1, 6].includes(n)) {
        add(
          n === 1 ? "favored" : "greaterFavored",
          n === 1 ? "Inimigo Favorito (Revisado)" : "Inimigo Favorito Maior",
          n === 1 ? O.favored : O.greaterFavored,
        );
        lang("favoredLanguage", "Idioma associado ao inimigo favorito", 1);
      }
      const hunter = {
        3: [
          "Assassino de Colossos",
          "Matador de Gigantes",
          "Destruidor de Hordas",
        ],
        7: [
          "Escapar da Horda",
          "Defesa Contra Ataques Múltiplos",
          "Vontade de Aço",
        ],
        11: ["Saraivada", "Ataque Giratório"],
        15: ["Evasão", "Manter-se Contra a Maré", "Esquiva Sobrenatural"],
      };
      if (sub === "cacador" && hunter[n])
        add("hunter", "Escolha do Conclave do Caçador", hunter[n]);
      if (sub === "besta" && n === 3) {
        add("companion", "Companheiro animal", O.companions);
        add("companionSkills", "Duas perícias do companheiro", allSkills, 2);
        add("companionTrait", "Personalidade do companheiro", [
          "Sou resoluto em face do adversário.",
          "Mexeu com meus amigos, mexeu comigo.",
          "Permaneço alerta para que os outros descansem.",
          "As pessoas me subestimam por ser um animal.",
          "Apareço no momento certo.",
          "Coloco as necessidades dos meus amigos na frente de tudo.",
        ]);
        add("companionFlaw", "Defeito do companheiro", [
          "Se deixarem comida por aí, eu vou comer.",
          "Eu rosno para estranhos.",
          "Toda hora é hora de carinho na barriga.",
          "Tenho medo mortal de água.",
          "Minha ideia de dizer olá é um punhado de lambidas no rosto.",
          "Pulo nas criaturas para contar o quanto eu as amo.",
        ]);
      }
      if (sub === "besta" && c.asi.includes(n))
        add(
          "companionAsi",
          "Companheiro: +2 em uma habilidade ou +1 em duas (máximo 20)",
          allAbilities,
          2,
          { unique: false },
        );
    }
    if (d.classId === "guerreiro" && sub === "mestreBatalha") {
      if ([3, 7, 10, 15].includes(n)) {
        add(
          "maneuvers",
          "Manobras de Mestre de Batalha",
          D.maneuvers.filter((x) => !old("maneuvers").includes(x)),
          n === 3 ? 3 : 2,
        );
        if (n > 3)
          replacement("maneuvers", "Manobra", D.maneuvers, old("maneuvers"));
      }
      if (n === 3)
        add(
          "artisan",
          "Estudioso da Guerra: ferramenta de artesão",
          toolOptions("artisan"),
          1,
          { step: "proficiencies" },
        );
    }
    if (d.classId === "guerreiro" && sub === "cavaleiroArcano" && n === 3)
      add(
        "bondWeapons",
        "Vínculo com até duas armas possuídas (pode realizar o ritual depois)",
        uniq((d.char?.weapons || []).map((w) => w.name)),
        Math.min(2, d.char?.weapons?.length || 0),
        { min: 0 },
      );
    if (d.classId === "mago" && sub === "transmutacao" && n === 6)
      add("stoneEffect", "Efeito inicial da Pedra de Transmutador", [
        "Visão no escuro (18 m)",
        "Deslocamento +3 m",
        "Proficiência em resistência de Constituição",
        "Resistência a ácido",
        "Resistência a frio",
        "Resistência a fogo",
        "Resistência a elétrico",
        "Resistência a trovejante",
      ]);
    if (d.classId === "bruxo" && sub === "corruptor" && n === 10)
      add(
        "fiendResistance",
        "Resistência Demoníaca (pode mudar após descanso)",
        [
          "Ácido",
          "Concussão",
          "Cortante",
          "Elétrico",
          "Energia",
          "Fogo",
          "Frio",
          "Necrótico",
          "Perfurante",
          "Psíquico",
          "Radiante",
          "Trovejante",
          "Veneno",
        ],
        1,
        { min: 0 },
      );
    if (
      d.classId === "monge" &&
      sub === "quatroElementos" &&
      [3, 6, 11, 17].includes(n)
    ) {
      const opts = O.disciplines
        .filter((x) => x.level <= n && x.name !== "Sintonia Elemental")
        .map((x) => x.name);
      add(
        "disciplines",
        "Disciplina elemental",
        opts.filter((x) => !old("disciplines").includes(x)),
      );
      if (n > 3)
        replacement(
          "disciplines",
          "Disciplina elemental",
          opts,
          old("disciplines"),
        );
    }
    if (d.classId === "bruxo") {
      const pact = a.pact || old("pact")[0];
      if (n === 3)
        add("pact", "Dádiva do Pacto", [
          { value: "corrente", label: "Pacto da Corrente" },
          { value: "lamina", label: "Pacto da Lâmina" },
          { value: "tomo", label: "Pacto do Tomo" },
        ]);
      if (n === 3 && pact === "tomo")
        add(
          "tomeCantrips",
          "Três truques de qualquer classe (Carisma)",
          spellOptions(d, {
            level: 0,
            any: true,
            exclude: learned(d).map((s) => s.name),
          }),
          3,
          { step: "magic" },
        );
      if (n === 3 && pact === "corrente")
        add("familiar", "Forma inicial do familiar", [
          "Águia",
          "Aranha",
          "Caranguejo",
          "Cavalo-marinho",
          "Coruja",
          "Corvo",
          "Doninha",
          "Falcão",
          "Gato",
          "Lagarto",
          "Morcego",
          "Peixe",
          "Polvo",
          "Rã",
          "Rato",
          "Serpente venenosa",
          "Diabrete",
          "Pseudodragão",
          "Quasit",
          "Sprite",
        ]);
      if (n === 3 && pact === "lamina")
        add(
          "pactWeapon",
          "Forma inicial da arma do pacto",
          P.weapons.filter((x) => x.kind.endsWith("Melee")).map((x) => x.name),
        );
      const invLevel = { 2: 2, 5: 1, 7: 1, 9: 1, 12: 1, 15: 1, 18: 1 };
      const knownCantrips = learned(d)
        .map((s) => spell(s.name)?.id)
        .concat(arr(a.cantrips), arr(a.tomeCantrips));
      const opts = O.invocations
        .filter(
          (x) =>
            x.level <= n &&
            (!x.pact || x.pact === pact) &&
            (!x.spell || knownCantrips.includes(x.spell)),
        )
        .map((x) => x.name);
      if (invLevel[n])
        add(
          "invocations",
          "Invocações Místicas",
          opts.filter((x) => !old("invocations").includes(x)),
          invLevel[n],
        );
      if (n > 2)
        replacement(
          "invocations",
          "Invocação mística",
          opts,
          old("invocations"),
        );
      if (
        [...arr(a.invocations), ...arr(a.invocationsReplacement)].includes(
          "Livro de Segredos Antigos",
        ) &&
        !old("invocations").includes("Livro de Segredos Antigos")
      )
        add(
          "ancientRituals",
          "Livro de Segredos Antigos: dois rituais de 1º círculo",
          spellOptions(d, { level: 1, ritual: true, any: true }),
          2,
          { step: "magic" },
        );
      if ([11, 13, 15, 17].includes(n))
        add(
          "arcanum",
          `Arcana Mística: magia de ${Math.floor((n + 1) / 2)}º círculo`,
          spellOptions(d, { level: Math.floor((n + 1) / 2) }),
          1,
          { step: "magic" },
        );
    }
    const featsEnabled =
      d.setup.allowFeats ?? d.char?.rules?.allowFeats ?? false;
    if (c.asi.includes(n)) {
      add("advancement", "Incremento no Valor de Habilidade", [
        {
          value: "asi",
          label: "Distribuir 2 pontos em habilidades (máximo 20)",
        },
        ...(featsEnabled
          ? [{ value: "feat", label: "Talento (regra opcional habilitada)" }]
          : []),
      ]);
      if (a.advancement === "asi")
        add(
          "asi",
          "Distribua +2 em uma habilidade ou +1 em duas",
          allAbilities,
          2,
          { unique: false },
        );
      if (a.advancement === "feat") featRequirements("feat");
    }
    if (d.creating && raceOf(d)?.feat) featRequirements("racialFeat");
    magicRequirements(d, add);
    return req;
    function replacement(key, label, opts, owned) {
      if (!owned.length) return;
      add(
        key + "Replace",
        `Trocar uma ${label.toLowerCase()} conhecida (opcional)`,
        owned,
        1,
        { min: 0 },
      );
      if (a[key + "Replace"])
        add(
          key + "Replacement",
          `Nova ${label.toLowerCase()} para a troca`,
          opts.filter((x) => !owned.includes(x) && !arr(a[key]).includes(x)),
        );
    }
    function featRequirements(key) {
      add(key, "Escolha o talento", legalFeats(d));
      const f = O.feats.find((f) => f.name === a[key]);
      if (!f) return;
      if (f.increase)
        add(key + "Ability", "Habilidade que recebe +1", f.increase);
      if (f.choice === "element")
        add(
          key + "Element",
          "Tipo de dano",
          ["Ácido", "Elétrico", "Fogo", "Frio", "Trovejante"].filter(
            (x) =>
              !selections(d.char, null, "featElement")
                .concat(selections(d.char, null, "racialFeatElement"))
                .includes(x),
          ),
        );
      if (f.choice === "maneuvers")
        add(key + "Maneuvers", "Duas manobras do talento", D.maneuvers, 2);
      if (f.choice === "languages")
        lang(key + "Languages", "Três idiomas do talento", 3);
      if (f.choice === "resilient")
        add(
          key + "Resilient",
          "Habilidade: +1 e proficiência em resistência",
          allAbilities,
        );
      if (f.choice === "weapons")
        add(
          key + "Weapons",
          "Quatro armas simples ou marciais",
          P.weapons.map((x) => x.name),
          4,
        );
      if (f.choice === "proficiencies")
        add(
          key + "Proficiencies",
          "Três perícias ou ferramentas",
          allSkills
            .concat(D.tools)
            .filter((x) => !selectedSkills(d).includes(x)),
          3,
        );
      if (["initiate", "rituals", "attackCantrip"].includes(f.choice)) {
        const classes = [
          "bardo",
          "clerigo",
          "druida",
          "feiticeiro",
          "bruxo",
          "mago",
        ];
        add(
          key + "Class",
          "Classe de origem das magias",
          classes
            .filter(
              (value) =>
                f.choice !== "attackCantrip" ||
                spellOptions(d, { level: 0, list: value }).some((o) =>
                  [
                    "toque-arrepiante",
                    "raio-de-fogo",
                    "raio-de-gelo",
                    "toque-chocante",
                    "rajada-mistica",
                    "chicote-de-espinhos",
                  ].includes(o.value),
                ),
            )
            .map((value) => ({ value, label: D.classes[value].name })),
        );
        const list = a[key + "Class"];
        if (!list) return;
        const attackOnly = (options) =>
          options.filter((o) =>
            [
              "toque-arrepiante",
              "raio-de-fogo",
              "raio-de-gelo",
              "toque-chocante",
              "rajada-mistica",
              "chicote-de-espinhos",
            ].includes(o.value),
          );
        if (f.choice === "initiate") {
          add(
            key + "Cantrips",
            "Dois truques do talento",
            spellOptions(d, { level: 0, list }),
            2,
            { step: "magic" },
          );
          add(
            key + "Spell",
            "Magia de 1º círculo do talento",
            spellOptions(d, { level: 1, list }),
            1,
            { step: "magic" },
          );
        }
        if (f.choice === "rituals")
          add(
            key + "Rituals",
            "Dois rituais de 1º círculo",
            spellOptions(d, { level: 1, list, ritual: true }),
            2,
            { step: "magic" },
          );
        if (f.choice === "attackCantrip")
          add(
            key + "Cantrip",
            "Truque que exige uma jogada de ataque",
            attackOnly(spellOptions(d, { level: 0, list })),
            1,
            { step: "magic" },
          );
      }
    }
  }
  function equipmentRequirements(d, add) {
    const eq = P.equipment[d.classId];
    if (!eq) return;
    for (let i = 0; i < eq.groups.length; i++) {
      let options = eq.groups[i].flatMap((name) =>
        name.startsWith("@")
          ? name === "@instrument"
            ? D.tools.filter((t) => t.startsWith("Instrumento:"))
            : P.weapons
                .filter((w) =>
                  name === "@simple"
                    ? w.kind.startsWith("simple")
                    : w.kind === name.slice(1),
                )
                .map((w) => w.name)
          : [name],
      );
      if (d.classId === "clerigo")
        options = options.filter(
          (name) =>
            (name !== "Cota de malha" || armorFor(d).includes("pesada")) &&
            (name !== "Martelo de guerra" ||
              ["guerra", "tempestade"].includes(effectiveSub(d)) ||
              raceOf(d)?.name.startsWith("Anão")),
        );
      add(
        "equipment" + i,
        "Equipamento inicial — escolha " + (i + 1),
        uniq(options),
        1,
        { step: "equipment" },
      );
      const pick = d.answers["equipment" + i];
      if (pick === "Arma marcial e escudo")
        add(
          "equipmentWeapons" + i,
          "Arma marcial",
          P.weapons
            .filter((w) => w.kind.startsWith("martial"))
            .map((w) => w.name),
          1,
          { step: "equipment" },
        );
      if (pick === "Duas armas marciais")
        add(
          "equipmentWeapons" + i,
          "Duas armas marciais",
          P.weapons
            .filter((w) => w.kind.startsWith("martial"))
            .map((w) => w.name),
          2,
          { unique: false, step: "equipment" },
        );
      if (pick === "Duas armas simples corpo a corpo")
        add(
          "equipmentWeapons" + i,
          "Duas armas simples corpo a corpo",
          P.weapons.filter((w) => w.kind === "simpleMelee").map((w) => w.name),
          2,
          { unique: false, step: "equipment" },
        );
    }
    const items = eq.fixed.concat(
      eq.groups.map((_, i) => d.answers["equipment" + i]),
      bgOf(d)?.items || [],
    );
    for (const [name, id] of [
      ["Foco arcano", "arcaneFocus"],
      ["Foco druídico", "druidFocus"],
      ["Símbolo sagrado", "holySymbol"],
    ])
      if (items.includes(name))
        add(
          id,
          name + ": escolha a forma",
          P.gear
            .filter((g) =>
              g.name.toLowerCase().startsWith(name.toLowerCase() + ":"),
            )
            .map((g) => g.name),
          1,
          { step: "equipment" },
        );
  }
  function magicRequirements(d, add) {
    const type = casting(d),
      n = d.level,
      a = d.answers,
      learnedSpells = learned(d),
      exclude = learnedSpells.map((s) => s.name),
      school =
        d.classId === "guerreiro"
          ? ["abjuracao", "evocacao"]
          : ["encantamento", "ilusao"];
    if (!type) return;
    const table = P.counts[type === "third" ? "third" : d.classId];
    const nc = (table?.cantrips?.[n] || 0) - (table?.cantrips?.[n - 1] || 0);
    if (nc > 0)
      add(
        "cantrips",
        "Novos truques da classe",
        spellOptions(d, {
          level: 0,
          exclude: exclude.concat(
            d.classId === "ladino" ? ["mãos mágicas"] : [],
          ),
        }),
        nc,
        { step: "magic" },
      );
    if (type === "book")
      add(
        "spells",
        "Magias adicionadas ao grimório",
        spellOptions(d, { exclude }),
        n === 1 ? 6 : 2,
        { step: "magic" },
      );
    const secrets =
      d.classId === "bardo" &&
      ([10, 14, 18].includes(n) ||
        (n === 6 && effectiveSub(d) === "conhecimento"));
    if (secrets)
      add(
        "secrets",
        "Segredos Mágicos: duas magias de qualquer classe",
        S.filter(
          (s) => s.level <= spellLimit(d) && !exclude.includes(s.name),
        ).map((s) => ({
          value: s.id,
          label: `${s.name} (${s.level}º)`,
          spell: s,
        })),
        2,
        { step: "magic" },
      );
    if (["known", "halfKnown", "pact", "third"].includes(type)) {
      const count =
        (table?.known?.[n] || 0) -
        (table?.known?.[n - 1] || 0) -
        (d.classId === "bardo" && [10, 14, 18].includes(n) ? 2 : 0);
      if (type === "third" && n === 3) {
        add(
          "spells",
          "Duas magias da escola do arquétipo",
          spellOptions(d, { level: 1, schools: school }),
          2,
          { step: "magic" },
        );
        add(
          "freeSpell",
          "Uma magia de mago de qualquer escola",
          spellOptions(d, { level: 1, exclude: arr(a.spells) }),
          1,
          { step: "magic" },
        );
      } else if (count > 0)
        add(
          "spells",
          "Novas magias conhecidas",
          spellOptions(d, {
            exclude,
            schools:
              type === "third" && ![8, 14, 20].includes(n) ? school : null,
          }),
          count,
          { step: "magic" },
        );
      if (n > 1 && learnedSpells.some((s) => s.circle > 0)) {
        add(
          "spellReplace",
          "Substituir uma magia conhecida (opcional)",
          learnedSpells
            .filter((s) => s.circle > 0)
            .map((s) => ({
              value: spell(s.name)?.id || s.name,
              label: s.name,
            })),
          1,
          { min: 0, step: "magic" },
        );
        if (a.spellReplace) {
          const old = learnedSpells.find(
            (s) => (spell(s.name)?.id || s.name) === a.spellReplace,
          );
          add(
            "spellReplacement",
            "Magia substituta",
            spellOptions(d, {
              exclude: exclude.concat(arr(a.spells)),
              schools: type === "third" && !old?.unrestricted ? school : null,
            }),
            1,
            { step: "magic" },
          );
        }
      }
    }
    if (type === "book" || type === "prepared" || type === "halfPrepared") {
      if (type === "halfPrepared" && n < 2) return;
      const limit = Math.max(
        1,
        (type === "halfPrepared" ? Math.floor(n / 2) : n) +
          mod(finalScores(d)[ability(d)]),
      );
      const automatic = new Set(subSpells(d).map((s) => s.id));
      const opts =
        type === "book"
          ? uniq(exclude.concat(arr(a.spells)))
              .map(spell)
              .filter(Boolean)
              .map((s) => ({ value: s.id, label: s.name, spell: s }))
          : spellOptions(d, {}).filter((o) => !automatic.has(o.value));
      add(
        "prepared",
        `Magias preparadas (até ${limit}; alteráveis após descanso longo)`,
        opts,
        Math.min(limit, opts.length),
        { min: 0, step: "magic" },
      );
    }
    if (d.classId === "mago" && n === 2 && effectiveSub(d) === "ilusao") {
      const already = exclude.includes("Ilusão Menor");
      if (already)
        add(
          "illusionCantrip",
          "Ilusão Menor já conhecida: outro truque de mago",
          spellOptions(d, { level: 0, exclude }),
          1,
          { step: "magic" },
        );
    }
    const book = learnedSpells
      .map((s) => spell(s.name))
      .concat(arr(a.spells).map(spell))
      .filter(Boolean);
    if (d.classId === "mago" && n === 18)
      for (const lv of [1, 2])
        add(
          "mastery" + lv,
          `Dominar Magia: ${lv}º círculo`,
          book
            .filter((s) => s.level === lv)
            .map((s) => ({ value: s.id, label: s.name })),
          1,
          { step: "magic" },
        );
    if (d.classId === "mago" && n === 20)
      add(
        "signature",
        "Assinatura Mágica: duas magias do grimório de 3º círculo",
        book
          .filter((s) => s.level === 3)
          .map((s) => ({ value: s.id, label: s.name })),
        2,
        { step: "magic" },
      );
  }
  function validate(d) {
    const errors = [],
      r = requirements(d),
      c = D.classes[d.classId];
    if (!Object.hasOwn(D.classes, d.classId))
      errors.push("Escolha uma das 12 classes do livro.");
    if (d.addingClass)
      errors.push(...multiclassEligibility(d.char, d.classId).errors);
    if (
      d.level > 20 ||
      (d.char?.classes || []).reduce((n, c) => n + c.level, 0) >= 20
    )
      errors.push("O nível máximo do personagem é 20.");
    if (d.creating) {
      if (!d.setup.name?.trim()) errors.push("Informe o nome do personagem.");
      if (!raceOf(d)) errors.push("Escolha raça e sub-raça.");
      if (!bgOf(d)) errors.push("Escolha o antecedente.");
      if (!["standard", "pointBuy", "rolled"].includes(d.setup.abilityMethod))
        errors.push("Escolha um método de habilidades do livro.");
      if (raceOf(d)?.optional && !d.setup.allowFeats)
        errors.push(
          "Humano Variante exige habilitar a regra opcional de talentos.",
        );
      const base = allAbilities.map((k) => Number(d.setup.baseScores?.[k]));
      if (base.some((v) => !Number.isInteger(v) || v < 3 || v > 18))
        errors.push(
          "Atributos iniciais precisam ser inteiros entre 3 e 18 antes dos bônus raciais.",
        );
      if (
        d.setup.abilityMethod === "standard" &&
        base
          .slice()
          .sort((a, b) => a - b)
          .join(",") !== "8,10,12,13,14,15"
      )
        errors.push(
          "Distribua cada valor do conjunto padrão exatamente uma vez.",
        );
      if (d.setup.abilityMethod === "pointBuy") {
        const cost = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
        if (
          base.some((x) => cost[x] === undefined) ||
          base.reduce((s, x) => s + (cost[x] || 0), 0) > 27
        )
          errors.push(
            "Compra de pontos: valores de 8 a 15, com orçamento de 27 pontos.",
          );
      }
      if (d.setup.abilityMethod === "rolled") {
        const rolls = d.setup.rolls || [];
        if (
          rolls.length !== 6 ||
          rolls.some(
            (g) =>
              g.length !== 4 ||
              g.some((v) => !Number.isInteger(v) || v < 1 || v > 6),
          )
        )
          errors.push("Role seis grupos de 4d6.");
        else if (
          rolls
            .map((g) => g.reduce((a, b) => a + b, 0) - Math.min(...g))
            .sort((a, b) => a - b)
            .join(",") !==
          base
            .slice()
            .sort((a, b) => a - b)
            .join(",")
        )
          errors.push(
            "Atribua os seis totais rolados sem repetir ou perder um resultado.",
          );
      }
    }
    for (const field of r) {
      const vals = arr(d.answers[field.id]);
      if (vals.length < field.min || vals.length > field.count)
        errors.push(
          `${field.label}: escolha ${field.min === field.count ? field.count : "de " + field.min + " a " + field.count} opção(ões).`,
        );
      if (field.unique && new Set(vals).size !== vals.length)
        errors.push(`${field.label}: não repita opções.`);
      if (vals.some((v) => !field.options.some((o) => o.value === v)))
        errors.push(`${field.label}: há uma opção indisponível neste nível.`);
    }
    const abilities = scores(d);
    for (const key of ["asi", "companionAsi"]) {
      const vals = arr(d.answers[key]);
      if (key === "asi")
        for (const k of uniq(vals))
          if (abilities[k] + vals.filter((x) => x === k).length > 20)
            errors.push(
              "O incremento não pode elevar uma habilidade acima de 20.",
            );
    }
    const newSpellKeys = [
      "cantrips",
      "spells",
      "freeSpell",
      "spellReplacement",
      "secrets",
    ];
    const newIds = newSpellKeys.flatMap((k) => arr(d.answers[k]));
    if (uniq(newIds).length !== newIds.length)
      errors.push("Não escolha a mesma magia duas vezes para a classe.");
    const allLang = [
      "raceLanguages",
      "backgroundLanguages",
      "knowledgeLanguages",
      "favoredLanguage",
      "featLanguages",
      "racialFeatLanguages",
    ].flatMap((k) => arr(d.answers[k]));
    if (uniq(allLang).length !== allLang.length)
      errors.push("Escolha idiomas diferentes entre as origens.");
    return uniq(errors);
  }
  function assertValid(d) {
    const errors = validate(d);
    if (errors.length) {
      const e = new Error(errors.join("\n"));
      e.problems = errors;
      throw e;
    }
  }
  function toSheetSpell(s, classId, extra = {}) {
    return {
      name: s.name,
      bookId: s.id,
      circle: s.level,
      classId,
      // O texto do catálogo é a referência. Não classifica automaticamente
      // centenas de efeitos como ataque, área ou dano com base em palavras soltas.
      dmgType: "livro",
      targetType: null,
      defType: "nenhuma",
      time: s.time || "",
      range: s.range || "",
      v: s.components?.includes("V") || false,
      s: s.components?.includes("S") || false,
      m: s.components?.includes("M") || false,
      conc: !!s.concentration,
      ritual: false,
      ritualAvailable: !!s.ritual,
      canTwin: false,
      customRoll: "",
      effectSummary: s.duration || "Consultar descrição",
      notes: "",
      pdfPage: s.pdfPage,
      ...extra,
    };
  }
  function create(setup, answers) {
    const d = context(setup, answers);
    assertValid(d);
    const c = D.classes[d.classId],
      r = raceOf(d),
      bg = bgOf(d),
      stats = scores(d),
      hp =
        c.die +
        mod(stats.con) +
        (r.hpPerLevel || 0) +
        (d.classId === "feiticeiro" && effectiveSub(d) === "draconica" ? 1 : 0);
    const char = {
      id:
        "char_" +
        (root.crypto?.randomUUID?.() ||
          Date.now() + "_" + Math.random().toString(36).slice(2)),
      name: setup.name.trim(),
      playerName: setup.playerName || "Jogador",
      race: r.name,
      background: bg.name,
      alignment: setup.alignment || "Neutro",
      preferredLayout: setup.preferredLayout || "2014",
      xp: 0,
      size: r.size || "Médio",
      speed: r.speed,
      heroicInspiration: false,
      shieldEquipped: false,
      baseAcArmor: 10 + mod(stats.dex),
      mageArmorActive: false,
      hpCurrent: hp,
      hpMax: hp,
      hpTemp: 0,
      tidesOfChaosAvailable: true,
      abilities: Object.fromEntries(
        allAbilities.map((k) => [
          k,
          { score: stats[k], saveProf: c.saves.includes(k) },
        ]),
      ),
      skillsProf: selectedSkills(d),
      expertise: [],
      customSkillBonuses: {},
      classes: [
        {
          classId: d.classId,
          subclassId: effectiveSub(d) || "",
          subclass:
            c.subclasses[effectiveSub(d)]?.name ||
            "A escolher no nível " + c.subLevel,
          level: 1,
          hitDie: c.die,
          hitDiceUsed: 0,
        },
      ],
      pactMagic: { level: 1, total: 0, used: 0 },
      standardSlots: {},
      sorceryPoints: { current: 0, max: 0 },
      weapons: [],
      spells: [],
      features: [],
      proficiencies: { weapons: c.weapons, tools: "", languages: "" },
      coins: { pc: 0, pp: 0, pe: 0, po: bg.gold, pl: 0 },
      inventoryItems: [],
      physical: {
        age: setup.age || "",
        height: setup.height || "",
        weight: setup.weight || "",
        eyes: setup.eyes || "",
        skin: setup.skin || "",
        hair: setup.hair || "",
      },
      lore: {
        traits: setup.traits || "",
        ideals: setup.ideals || "",
        bonds: setup.bonds || "",
        flaws: setup.flaws || "",
        appearance: setup.appearance || "",
        allies: setup.allies || "",
        treasure: setup.treasure || "",
        backstory: setup.backstory || "",
      },
      rules: {
        version: 1,
        source: "phb-local-2014-revised-ranger",
        raceId: setup.raceId,
        backgroundId: setup.backgroundId,
        allowFeats: !!setup.allowFeats,
        baseScores: clone(setup.baseScores),
        abilityMethod: setup.abilityMethod,
        rolls: clone(setup.rolls || []),
        history: [],
        hpRolls: [],
      },
    };
    char.proficiencies.languages = uniq(
      r.languages.concat(
        arr(answers.raceLanguages),
        arr(answers.backgroundLanguages),
      ),
    ).join(", ");
    char.proficiencies.tools = uniq([
      ...(r.tools || []),
      ...(d.classId === "ladino"
        ? ["Ferramentas de ladrão"]
        : d.classId === "druida"
          ? ["Kit de herbalismo"]
          : []),
      ...bg.tools,
      ...arr(answers.raceTool),
      ...arr(answers.classTools),
      ...arr(answers.backgroundTools),
      ...arr(answers.duplicateTools),
    ]).join(", ");
    const equipment = P.equipment[d.classId];
    const items = [
      ...equipment.fixed,
      ...equipment.groups.flatMap((_, i) => {
        const pick = answers["equipment" + i];
        const chosen = arr(answers["equipmentWeapons" + i]);
        return chosen.length
          ? chosen.concat(pick === "Arma marcial e escudo" ? ["Escudo"] : [])
          : [pick];
      }),
      ...bg.items,
    ];
    for (const name of items)
      addEquipment(
        char,
        {
          "Foco arcano": answers.arcaneFocus,
          "Foco druídico": answers.druidFocus,
          "Símbolo sagrado": answers.holySymbol,
        }[name] || name,
      );
    // O criador permite começar com a armadura vestida; posse e uso continuam
    // separados para retirar/trocar equipamento sem apagar o item do inventário.
    if (setup.wearStartingArmor !== false) {
      char.armorEquipped =
        char.inventoryItems.find(
          (item) =>
            armorInfo(item.name)?.type !== "shield" && armorInfo(item.name),
        )?.name || null;
      char.shieldEquipped = char.inventoryItems.some(
        (item) => armorInfo(item.name)?.type === "shield",
      );
    }
    applyChoices(char, d);
    char.hpMax += mod(char.abilities.con.score) - mod(stats.con);
    char.hpCurrent = char.hpMax;
    refresh(char, true);
    return char;
  }
  function addEquipment(char, name) {
    if (!name) return;
    const bundles = {
      "Besta leve e 20 virotes": ["Besta leve", "20 Virotes"],
      "Arco curto e 20 flechas": ["Arco curto", "20 Flechas"],
      "Arco longo e 20 flechas": ["Arco longo", "20 Flechas"],
      "Armadura de couro, arco longo e 20 flechas": [
        "Armadura de couro",
        "Arco longo",
        "20 Flechas",
      ],
    };
    if (bundles[name]) {
      bundles[name].forEach((item) => addEquipment(char, item));
      return;
    }
    const multi = String(name).match(/^(\d+) (.+)$/),
      qty = multi ? +multi[1] : 1,
      itemName = multi ? multi[2] : name;
    const w = P.weapons.find(
      (w) =>
        norm(w.name) === norm(itemName) ||
        norm(w.name) + "s" === norm(itemName),
    );
    const armor = {
      "armadura-de-couro": 5,
      "cota-de-malha": 27.5,
      brunea: 22.5,
      escudo: 3,
      "escudo-de-madeira": 3,
    };
    const aliases = {
      "roupas-de-viajante": "roupas-de-viajante",
      "cobertor-de-inverno": "cobertor-de-inverno",
      "livro-de-preces": "livro",
      "vidro-de-tinta-escura": "tinta-frasco-de-30ml",
      pena: "caneta-tinteiro",
      "faca-pequena": "adaga",
      "traje-de-artista": "roupas-de-entretenimento",
    };
    const gear = P.gear.find(
      (g) => norm(g.name) === (aliases[norm(itemName)] || norm(itemName)),
    );
    const weight =
      w?.weight ??
      gear?.weight ??
      armor[norm(itemName)] ??
      (norm(itemName) === "flechas"
        ? 0.025
        : norm(itemName) === "virotes"
          ? 0.0375
          : null);
    char.inventoryItems.push({
      name: itemName,
      qty,
      weightKg: weight ?? 0,
      weightUnreviewed: weight === null,
      description:
        w?.properties ||
        "Equipamento inicial do livro. Consulte o capítulo 5 para peso e propriedades.",
    });
    if (w) {
      const finesse = /acuidade/.test(w.properties),
        m = w.kind.endsWith("Ranged")
          ? mod(char.abilities.dex.score)
          : finesse
            ? Math.max(
                mod(char.abilities.str.score),
                mod(char.abilities.dex.score),
              )
            : mod(char.abilities.str.score);
      char.weapons.push({
        ruleWeapon: w.name,
        name: w.name,
        bonus: "+" + (2 + m),
        damage: w.damage + (m >= 0 ? "+" : "") + m,
        dmgTypeLabel: "Consultar propriedades da arma",
        notes: w.properties,
        description: w.properties,
      });
    }
  }
  function applyChoices(char, d) {
    const a = d.answers,
      c = classEntry(char, d.classId),
      level = d.level;
    const allowed = new Set(requirements(d).map((f) => f.id));
    const clean = Object.fromEntries(
      Object.entries(a).filter(([key]) => allowed.has(key)),
    );
    char.rules.history.push({
      classId: d.classId,
      level,
      totalLevel: char.classes.reduce((s, c) => s + c.level, 0),
      answers: clone(clean),
    });
    if (a.subclass) {
      c.subclassId = a.subclass;
      c.subclass = D.classes[d.classId].subclasses[a.subclass].name;
    }
    for (const k of arr(a.asi)) char.abilities[k].score++;
    for (const key of ["feat", "racialFeat"]) {
      const f = O.feats.find((f) => f.name === a[key]);
      if (!f) continue;
      const k = a[key + "Ability"] || a[key + "Resilient"];
      if (k && char.abilities[k].score < 20) char.abilities[k].score++;
      if (f.choice === "resilient") char.abilities[k].saveProf = true;
      if (f.name === "Robusto") {
        const gain = 2 * char.classes.reduce((s, c) => s + c.level, 0);
        char.hpMax += gain;
        char.hpCurrent += gain;
      }
      if (f.name === "Mobilidade") char.speed += 3;
      if (f.name === "Proteção Leve")
        char.armorProficiencies = uniq(armorFor(d).concat("leve"));
      if (f.name === "Proteção Moderada")
        char.armorProficiencies = uniq(armorFor(d).concat("media", "escudo"));
      if (f.name === "Proteção Pesada")
        char.armorProficiencies = uniq(armorFor(d).concat("pesada"));
      if (f.name === "Influência Enganadora")
        char.skillsProf = uniq(
          char.skillsProf.concat("enganacao", "persuasao"),
        );
      char.skillsProf = uniq(
        char.skillsProf.concat(
          arr(a[key + "Proficiencies"]).filter((x) => allSkills.includes(x)),
        ),
      );
      const addedTools = arr(a[key + "Proficiencies"]).filter((x) =>
        D.tools.includes(x),
      );
      char.proficiencies.tools = uniq(
        char.proficiencies.tools.split(", ").concat(addedTools),
      )
        .filter(Boolean)
        .join(", ");
      if (a[key + "Weapons"])
        char.proficiencies.weapons += "; " + arr(a[key + "Weapons"]).join(", ");
      if (a[key + "Languages"])
        char.proficiencies.languages = uniq(
          char.proficiencies.languages
            .split(", ")
            .concat(arr(a[key + "Languages"])),
        ).join(", ");
      const list = a[key + "Class"];
      for (const suffix of ["Cantrips", "Cantrip", "Spell", "Rituals"])
        for (const id of arr(a[key + suffix])) {
          const s = spell(id);
          if (
            s &&
            !char.spells.some(
              (x) => x.bookId === s.id && x.extraSource === f.name,
            )
          )
            char.spells.push(
              toSheetSpell(s, list || d.classId, {
                extraSource: f.name,
                ritual: suffix === "Rituals",
                limitedUse: suffix === "Spell" ? 1 : 0,
                learnedAt: level,
              }),
            );
        }
    }
    char.skillsProf = uniq(char.skillsProf.concat(selectedSkills(d)));
    if (d.addingClass) {
      const gains = multiclass[d.classId];
      if (gains.weapons)
        char.proficiencies.weapons = uniq(
          [char.proficiencies.weapons, gains.weapons].filter(Boolean),
        ).join("; ");
      char.proficiencies.tools = uniq(
        String(char.proficiencies.tools || "")
          .split(", ")
          .concat(gains.tools || [], arr(a.classTools)),
      )
        .filter(Boolean)
        .join(", ");
    }
    char.expertise = uniq(
      (char.expertise || []).concat(arr(a.expertise), arr(a.knowledgeSkills)),
    );
    for (const k of ["favoredLanguage", "knowledgeLanguages"])
      if (a[k])
        char.proficiencies.languages = uniq(
          char.proficiencies.languages.split(", ").concat(arr(a[k])),
        ).join(", ");
    if (a.artisan)
      char.proficiencies.tools = uniq(
        char.proficiencies.tools.split(", ").concat(arr(a.artisan)),
      )
        .filter(Boolean)
        .join(", ");
    const replacementUnrestricted =
      char.spells.find(
        (s) =>
          s.classId === d.classId &&
          (s.bookId || spell(s.name)?.id) === a.spellReplace,
      )?.unrestricted || false;
    if (a.spellReplace)
      char.spells = char.spells.filter(
        (s) =>
          !(
            s.classId === d.classId &&
            (spell(s.name)?.id || s.name) === a.spellReplace &&
            !s.extraSource
          ),
      );
    for (const [key, extra] of Object.entries({
      cantrips: {},
      spells: {
        unrestricted: casting(d) === "third" && [8, 14, 20].includes(level),
      },
      freeSpell: { unrestricted: true },
      spellReplacement: { unrestricted: replacementUnrestricted },
      secrets: { secret: true },
      prepared: {},
      tomeCantrips: { extraSource: "Pacto do Tomo" },
      raceCantrip: { extraSource: "Truque racial", castingAbility: "int" },
      natureCantrip: { extraSource: "Acólito da Natureza" },
      landCantrip: { extraSource: "Círculo da Terra" },
      illusionCantrip: { extraSource: "Ilusão Menor Aprimorada" },
      ancientRituals: {
        extraSource: "Livro de Segredos Antigos",
        ritual: true,
      },
      arcanum: { extraSource: "Arcana Mística", arcanum: true, limitedUse: 1 },
    }))
      for (const id of arr(a[key])) {
        const s = spell(id);
        if (
          s &&
          !char.spells.some(
            (x) =>
              x.bookId === s.id &&
              x.classId === d.classId &&
              (extra.extraSource
                ? x.extraSource === extra.extraSource
                : !x.extraSource),
          )
        )
          char.spells.push(
            toSheetSpell(s, d.classId, { learnedAt: level, ...extra }),
          );
      }
    if (requirements(d).some((f) => f.id === "prepared"))
      char.spells.forEach((s) => {
        if (
          s.circle > 0 &&
          s.classId === d.classId &&
          !s.automatic &&
          !s.extraSource
        )
          s.prepared = arr(a.prepared).includes(s.bookId || spell(s.name)?.id);
      });
    if (d.classId === "barbaro" && level === 20)
      for (const k of ["str", "con"])
        char.abilities[k].score = Math.min(24, char.abilities[k].score + 4);
    char.armorProficiencies = uniq(
      (char.armorProficiencies || []).concat(armorFor(d)),
    );
    if (
      d.classId === "ladino" &&
      effectiveSub(d) === "assassino" &&
      level === 3
    )
      char.proficiencies.tools = uniq(
        char.proficiencies.tools
          .split(", ")
          .concat("Kit de disfarce", "Kit de venenos"),
      )
        .filter(Boolean)
        .join(", ");
    if (
      arr(a.invocations)
        .concat(arr(a.invocationsReplacement))
        .includes("Influência Enganadora")
    )
      char.skillsProf = uniq(char.skillsProf.concat("enganacao", "persuasao"));
    if (
      d.classId === "patrulheiro" &&
      effectiveSub(d) === "subterraneo" &&
      level >= 7
    )
      char.abilities.wis.saveProf = true;
    if (d.classId === "ladino" && level >= 15)
      char.abilities.wis.saveProf = true;
    if (d.classId === "monge" && level >= 14)
      allAbilities.forEach((k) => (char.abilities[k].saveProf = true));
  }
  function levelUp(original, classId, answers, hpRoll = null) {
    const char = clone(original);
    for (const cls of char.classes)
      if (!cls.subclassId) cls.subclassId = inferSubclass(cls);
    let entry = classEntry(char, classId);
    const d = context({}, answers, char, classId);
    assertValid(d);
    const die = D.classes[classId].die;
    if (
      hpRoll !== null &&
      (!Number.isInteger(hpRoll) || hpRoll < 1 || hpRoll > die)
    )
      throw new Error("Rolagem de PV inválida.");
    const oldCon = mod(char.abilities.con.score),
      totalBefore = char.classes.reduce((n, c) => n + c.level, 0);
    const race = O.races[char.rules?.raceId];
    if (!char.rules)
      char.rules = {
        version: 1,
        source: "phb-local-2014-revised-ranger",
        history: [],
        legacy: true,
        allowFeats: false,
        hpRolls: [],
      };
    char.rules.history ||= [];
    char.rules.hpRolls ||= [];
    if (!entry) {
      entry = {
        classId,
        subclassId: "",
        subclass: "A escolher no nível " + D.classes[classId].subLevel,
        level: 0,
        hitDie: die,
        hitDiceUsed: 0,
      };
      char.classes.push(entry);
    }
    entry.level++;
    entry.subclassId = effectiveSub(d) || entry.subclassId;
    char.rules.hpRolls.push({
      classId,
      level: entry.level,
      roll: hpRoll,
      fixed: hpRoll === null ? die / 2 + 1 : null,
    });
    const hpGain =
      Math.max(1, (hpRoll ?? die / 2 + 1) + oldCon) +
      (race?.hpPerLevel || 0) +
      (classId === "feiticeiro" && effectiveSub(d) === "draconica" ? 1 : 0) +
      (selections(char, null, "feat")
        .concat(selections(char, null, "racialFeat"))
        .includes("Robusto")
        ? 2
        : 0);
    char.hpMax += hpGain;
    char.hpCurrent += hpGain;
    applyChoices(char, d);
    // Alterar CON muda retroativamente todos os dados de vida já adquiridos.
    const conDelta = mod(char.abilities.con.score) - oldCon;
    char.hpMax += conDelta * (totalBefore + 1);
    char.hpCurrent += conDelta * (totalBefore + 1);
    refresh(char, false);
    return char;
  }
  function refresh(char, fill) {
    const race = O.races[char.rules?.raceId];
    if (race && !char.rules.legacy) {
      const monk = classEntry(char, "monge")?.level || 0,
        barbarian = classEntry(char, "barbaro")?.level || 0;
      const feats = selections(char, null, "feat").concat(
        selections(char, null, "racialFeat"),
      );
      char.speed = movementSpeed(char);
    }
    let caster = 0;
    const castingClasses = char.classes.filter(
      (c) =>
        (D.classes[c.classId]?.casting &&
          D.classes[c.classId].casting !== "pact" &&
          (!D.classes[c.classId].casting.startsWith("half") || c.level >= 2)) ||
        (c.level >= 3 &&
          D.classes[c.classId]?.subclasses[c.subclassId]?.casting),
    );
    for (const c of castingClasses) {
      const kind =
        D.classes[c.classId].subclasses[c.subclassId]?.casting ||
        D.classes[c.classId].casting;
      caster += kind?.startsWith("half")
        ? Math.floor(c.level / 2)
        : kind === "third"
          ? Math.floor(c.level / 3)
          : c.level;
    }
    if (castingClasses.length === 1) {
      const c = castingClasses[0],
        kind =
          D.classes[c.classId].subclasses[c.subclassId]?.casting ||
          D.classes[c.classId].casting;
      caster = kind?.startsWith("half")
        ? c.level < 2
          ? 0
          : Math.ceil(c.level / 2)
        : kind === "third"
          ? c.level < 3
            ? 0
            : Math.ceil(c.level / 3)
          : c.level;
    }
    const slots = P.fullSlots[Math.min(caster, 20)] || [];
    for (let i = 1; i <= 9; i++) {
      const old = char.standardSlots[i] || { total: 0, used: 0 };
      const created = fill ? 0 : old.created || 0,
        total = (slots[i - 1] || 0) + created;
      char.standardSlots[i] = {
        total,
        used: fill ? 0 : Math.min(old.used, total),
        ...(created ? { created } : {}),
      };
    }
    const w = classEntry(char, "bruxo");
    if (w) {
      const n = w.level;
      char.pactMagic = {
        level: Math.min(5, Math.ceil(n / 2)),
        total: n >= 17 ? 4 : n >= 11 ? 3 : n >= 2 ? 2 : 1,
        used: fill
          ? 0
          : Math.min(
              char.pactMagic?.used || 0,
              n >= 17 ? 4 : n >= 11 ? 3 : n >= 2 ? 2 : 1,
            ),
      };
    }
    const sorc = classEntry(char, "feiticeiro");
    const max = sorc?.level >= 2 ? sorc.level : 0,
      spent =
        (char.sorceryPoints?.max || 0) - (char.sorceryPoints?.current || 0);
    char.sorceryPoints = {
      max,
      current: fill ? max : Math.max(0, max - spent),
    };
    // Sempre preparadas não consomem escolhas. A lista ampliada de patrono só
    // aumenta as opções: NÃO concede automaticamente essas magias ao bruxo.
    for (const cls of char.classes) {
      const d = { ...context({}, {}, char, cls.classId), level: cls.level };
      if (cls.classId !== "bruxo")
        for (const s of subSpells(d))
          grant(s, cls.classId, "Magia de subclasse", { prepared: true });
      if (cls.classId === "clerigo" && cls.subclassId === "luz")
        grant(spell("luz"), cls.classId, "Truque Adicional");
      if (cls.classId === "ladino" && cls.subclassId === "trapaceiroArcano")
        grant(spell("mãos mágicas"), cls.classId, "Mãos Mágicas Malabaristas");
      if (
        cls.classId === "mago" &&
        cls.subclassId === "ilusao" &&
        !char.spells.some((s) => s.bookId === "ilusao-menor")
      )
        grant(spell("ilusão menor"), cls.classId, "Ilusão Menor Aprimorada");
      if (
        cls.classId === "mago" &&
        cls.subclassId === "necromancia" &&
        cls.level >= 6
      )
        grant(spell("animar mortos"), cls.classId, "Escravos Mortos-Vivos", {
          automatic: false,
          extraSource: undefined,
          bookBonus: true,
          prepared: false,
        });
      if (
        cls.classId === "mago" &&
        cls.subclassId === "transmutacao" &&
        cls.level >= 10
      )
        grant(spell("metamorfose"), cls.classId, "Metamorfo", {
          automatic: false,
          extraSource: undefined,
          bookBonus: true,
          prepared: false,
        });
      if (cls.classId === "monge" && cls.subclassId === "sombras")
        grant(spell("ilusão menor"), cls.classId, "Artes Sombrias");
      if (
        cls.classId === "bruxo" &&
        selections(char, "bruxo", "pact").includes("corrente")
      )
        grant(spell("convocar familiar"), cls.classId, "Pacto da Corrente", {
          ritual: true,
        });
    }
    const r = O.races[char.rules?.raceId],
      total = char.classes.reduce((s, c) => s + c.level, 0);
    for (const [lv, names] of Object.entries(r?.racialSpells || {}))
      if (+lv <= total)
        for (const id of names)
          grant(spell(id), char.classes[0].classId, r.name, {
            castingAbility: r.name.startsWith("Gnomo") ? "int" : "cha",
            limitedUse: +lv > 1 ? 1 : 0,
          });
    if (char.rules?.raceId === "altoElfo")
      for (const id of selections(char, null, "raceCantrip")) {
        const s = char.spells.find((s) => s.bookId === id);
        if (s) s.castingAbility = "int";
      }
    function grant(s, classId, source, extra = {}) {
      if (!s) return;
      const independent = !!extra.limitedUse || !!extra.castingAbility;
      const existing = char.spells.find(
        (x) =>
          x.bookId === s.id &&
          x.classId === classId &&
          (!independent || x.extraSource === source),
      );
      if (!existing)
        char.spells.push(
          toSheetSpell(s, classId, {
            automatic: true,
            extraSource: source,
            ...extra,
          }),
        );
      else if (source === "Magia de subclasse")
        Object.assign(existing, {
          automatic: true,
          extraSource: source,
          prepared: true,
        });
    }
  }
  function reference(
    name,
    classId = null,
    subclassId = null,
    kind = "feature",
  ) {
    const aliases = {
      "intervencao-divina-aprimorada": "intervencao-divina",
      "aprimoramento-de-forma-selvagem": "forma-selvagem",
      "metamagica-adicional": "metamagica",
      "manobras-adicionais": "superioridade-em-combate",
      "movimento-sem-armadura-aprimorado": "movimento-sem-armadura",
      "disciplina-elemental-adicional": "discipulo-dos-elementos",
      "auras-aprimoradas": "aura-de-protecao",
    };
    const originalKey = norm(name.replace(/\s*\([^)]*\)/g, "")),
      key =
        classId === "bardo" && originalKey === "especializacao"
          ? "aptidao"
          : aliases[originalKey] || originalKey,
      range = classRanges[classId];
    const refs = (referenceIndex.get(key) || []).filter((r) => r.text.trim());
    if (kind === "feat")
      return refs.find((r) => r.page >= 167 && r.page <= 172) || null;
    if (kind === "race") {
      const race = O.races[subclassId],
        id = subclassId || "";
      const family = id.startsWith("anao")
        ? "ANÕES"
        : id.startsWith("halfling")
          ? "HALFLINGS"
          : id.startsWith("humano")
            ? "HUMANOS"
            : id.startsWith("gnomo")
              ? "GNOMOS"
              : id === "meioElfo"
                ? "MEIO-ELFOS"
                : id === "meioOrc"
                  ? "MEIO-ORCS"
                  : id === "draconato"
                    ? "DRACONATOS"
                    : id === "tiefling"
                      ? "TIEFLINGS"
                      : "ELFOS";
      const raceHeading =
        { halflingLeve: "PÉS LEVES", halflingRobusto: "ROBUSTO" }[id] ||
        race?.name;
      const candidates = [
        ...(referenceIndex.get(norm(raceHeading)) || []),
        ...(referenceIndex.get(
          norm(
            id === "humanoVariante"
              ? "TRAÇOS RACIAIS ALTERNATIVOS"
              : "TRAÇOS RACIAIS DOS " + family,
          ),
        ) || []),
      ].filter((r) => r.page <= 43);
      return (
        refs.find(
          (r) =>
            r.page <= 43 &&
            candidates.some((c) => Math.abs(c.page - r.page) <= 1),
        ) ||
        candidates.find((r) => norm(r.text).includes(originalKey)) ||
        candidates[0] ||
        null
      );
    }
    return (
      refs.find(
        (r) =>
          classId &&
          subclassId &&
          r.classId === classId &&
          r.subclassId === subclassId,
      ) ||
      refs.find((r) => classId && r.classId === classId && !r.subclassId) ||
      refs.find((r) => !range || (r.page >= range[0] && r.page <= range[1])) ||
      refs[0] ||
      (referenceIndex.get("canalizar-divindade-" + key) || []).find(
        (r) => !range || (r.page >= range[0] && r.page <= range[1]),
      ) ||
      ([
        "arma-sagrada",
        "expulsar-o-profano",
        "ira-da-natureza",
        "expulsar-os-infieis",
        "abjurar-inimigo",
        "voto-de-inimizade",
      ].includes(key)
        ? R.find(
            (r) =>
              r.page ===
                (["arma-sagrada", "expulsar-o-profano"].includes(key)
                  ? 112
                  : ["ira-da-natureza", "expulsar-os-infieis"].includes(key)
                    ? 113
                    : 114) && r.id === "canalizar-divindade",
          )
        : null) ||
      null
    );
  }
  function features(char) {
    const out = [],
      history = char.rules?.history || [];
    const r = O.races[char.rules?.raceId],
      bg = O.backgrounds[char.rules?.backgroundId];
    if (r)
      r.traits.forEach((name) =>
        out.push({
          name,
          level: 1,
          order: 0,
          source: r.name,
          reference: reference(name, null, char.rules?.raceId, "race"),
        }),
      );
    if (bg)
      out.push({
        name: bg.feature,
        level: 1,
        order: 0,
        source: bg.name,
        reference: reference(bg.feature),
      });
    let offset = 0;
    for (const cls of char.classes) {
      const c = D.classes[cls.classId];
      if (!c) continue;
      const sid = cls.subclassId || inferSubclass(cls),
        sub = c.subclasses[sid];
      for (let lv = 1; lv <= cls.level; lv++) {
        const order =
          history.find((e) => e.classId === cls.classId && e.level === lv)
            ?.totalLevel || offset + lv;
        const names = classFeatures({
          ...context({}, {}, char, cls.classId),
          level: lv,
        });
        const event = history.find(
          (e) => e.classId === cls.classId && e.level === lv,
        );
        for (const name of names)
          out.push({
            name,
            level: lv,
            order,
            source:
              c.name +
              (sub?.features[lv]?.includes(name) ? " · " + sub.name : ""),
            classId: cls.classId,
            reference: reference(name, cls.classId, sid),
            choices:
              name === "Incremento no Valor de Habilidade" && event
                ? arr(event.answers.asi).map((k) => "+1 " + D.abilities[k])
                : [],
          });
        if (event)
          for (const key of [
            "fighting",
            "expertise",
            "metamagic",
            "totem",
            "hunter",
            "favored",
            "greaterFavored",
            "companion",
            "pact",
            "invocations",
            "invocationsReplacement",
            "maneuvers",
            "maneuversReplacement",
            "disciplines",
            "disciplinesReplacement",
            "dragon",
            "terrain",
            "feat",
            "racialFeat",
            "mastery1",
            "mastery2",
            "signature",
            "stoneEffect",
            "fiendResistance",
          ])
            for (const choice of arr(event.answers[key]))
              out.push({
                name:
                  key === "pact"
                    ? {
                        tomo: "Pacto do Tomo",
                        lamina: "Pacto da Lâmina",
                        corrente: "Pacto da Corrente",
                      }[choice]
                    : D.skills[choice] || spell(choice)?.name || choice,
                level: lv,
                order,
                source: c.name + " · escolha",
                classId: cls.classId,
                reference: optionReference(
                  {
                    classId: cls.classId,
                    level: lv,
                    answers: { subclass: sid },
                    char,
                  },
                  { id: key },
                  { value: choice, label: choice },
                ),
                choices: ["feat", "racialFeat"].includes(key)
                  ? Object.entries(event.answers)
                      .filter(
                        ([child]) => child !== key && child.startsWith(key),
                      )
                      .flatMap(([, value]) =>
                        arr(value).map(
                          (v) =>
                            D.abilities[v] ||
                            D.skills[v] ||
                            D.classes[v]?.name ||
                            spell(v)?.name ||
                            v,
                        ),
                      )
                  : key === "companion"
                    ? [
                        "companionSkills",
                        "companionTrait",
                        "companionFlaw",
                      ].flatMap((k) =>
                        arr(event.answers[k]).map((v) => D.skills[v] || v),
                      )
                    : key === "pact"
                      ? ["pactWeapon", "familiar", "tomeCantrips"].flatMap(
                          (k) =>
                            arr(event.answers[k]).map(
                              (v) => spell(v)?.name || v,
                            ),
                        )
                      : [],
              });
        if (event?.answers.companionAsi)
          out.push({
            name: "Incremento do companheiro",
            level: lv,
            order,
            source: c.name + " · " + sub?.name,
            reference: reference("Vínculo com o Companheiro", cls.classId, sid),
            choices: arr(event.answers.companionAsi).map(
              (k) => "+1 " + D.abilities[k],
            ),
          });
      }
      offset += cls.level;
    }
    return out.sort((a, b) => a.order - b.order);
  }
  function rollAbilities(random = Math.random) {
    return Array.from({ length: 6 }, () =>
      Array.from({ length: 4 }, () => 1 + Math.floor(random() * 6)),
    );
  }
  function choiceParent(key, level, value) {
    key = key.replace(/Replace(?:ment)?$/, "");
    if (key === "totem")
      return (
        {
          3: "Totem Espiritual",
          6: "Aspecto da Besta",
          14: "Sintonia Totêmica",
        }[level] || ""
      );
    if (key === "hunter")
      return (
        {
          3: "Presa do Caçador",
          7: "Táticas Defensivas",
          11: "Ataque Múltiplo",
          15: "Defesa de Caçador Superior",
        }[level] || ""
      );
    if (key === "pact")
      return (
        {
          tomo: "Pacto do Tomo",
          corrente: "Pacto da Corrente",
          lamina: "Pacto da Lâmina",
        }[value] || ""
      );
    return (
      {
        disciplines: "Disciplinas Elementais",
        disciplinesReplacement: "Disciplinas Elementais",
        invocations: "Invocações Místicas",
        invocationsReplacement: "Invocações Místicas",
        maneuvers: "Manobras",
        maneuversReplacement: "Manobras",
        expertise: "Especialização",
        fighting: "Estilo de Luta",
        companion: "Vínculo com o Companheiro",
        stoneEffect: "Pedra de Transmutador",
        fiendResistance: "Resistência Demoníaca",
        favored: "Inimigo Favorito",
        greaterFavored: "Inimigo Favorito Maior",
        terrain: "Magias de Círculo",
        dragon: "Ancestral Dracônico",
        mastery1: "Dominar Magia",
        mastery2: "Dominar Magia",
        signature: "Assinatura Mágica",
        metamagic: "Metamágica",
      }[key] || ""
    );
  }
  // A mesma consulta serve ao assistente e à ficha. Opções homônimas (Urso,
  // Evasão etc.) precisam do nível e da subclasse, não só de uma busca pelo nome.
  function optionReference(d, field, option) {
    const key = field.id,
      value = option.value,
      sid = effectiveSub(d),
      classId = d.classId;
    if (option.spell || (field.step === "magic" && spell(value)))
      return option.spell || spell(value);
    if (["feat", "racialFeat"].includes(key))
      return reference(value, null, null, "feat");
    if (key === "subclass")
      return reference(
        D.classes[classId]?.subclasses[value]?.name || option.label,
        classId,
        value,
      );
    const parent = reference(choiceParent(key, d.level, value), classId, sid);
    let ref = ["totem", "hunter"].includes(key)
      ? parent
      : reference(option.label, classId, sid) || parent;
    if (!ref) return null;
    // Algumas opções são parágrafos dentro de uma seção, em vez de títulos.
    // Recorta só entre nomes conhecidos, sem cortar texto por tamanho.
    const names = key.startsWith("maneuvers")
      ? D.maneuvers
      : key.startsWith("disciplines")
        ? O.disciplines.map((x) => x.name)
        : key === "totem"
          ? ["Águia", "Lobo", "Urso"]
          : key === "hunter"
            ? field.options?.map((x) => x.label) || []
            : [];
    if (names.length) {
      const flat = ref.text.replace(/\s+/g, " ");
      const marks = names
        .map((name) => ({
          name,
          index: flat.indexOf(
            name + (key.startsWith("disciplines") ? " " : "."),
          ),
        }))
        .filter((x) => x.index >= 0)
        .sort((a, b) => a.index - b.index);
      // Disciplinas sem pré-requisito terminam o nome com um ponto.
      for (const name of names)
        if (!marks.some((x) => x.name === name)) {
          const index = flat.indexOf(name + ".");
          if (index >= 0) marks.push({ name, index });
        }
      marks.sort((a, b) => a.index - b.index);
      const at = marks.findIndex((x) => x.name === value);
      if (at >= 0)
        ref = {
          ...ref,
          name: option.label,
          text: flat.slice(marks[at].index, marks[at + 1]?.index).trim(),
        };
    }
    return ref;
  }
  // Apenas armas criadas pelo catálogo usam cálculo automático. Ataques legados
  // e fórmulas editadas continuam absolutos, preservando as adaptações da mesa.
  function weaponStats(char, entry) {
    const w = P.weapons.find((w) => w.name === entry?.ruleWeapon);
    if (!w) return entry;
    const ids = char.classes.map((c) => c.classId),
      primary = ids[0],
      name = norm(w.name),
      simple = w.kind.startsWith("simple");
    const martial =
      ids.some((id) =>
        ["barbaro", "guerreiro", "paladino", "patrulheiro"].includes(id),
      ) ||
      char.classes.some(
        (c) =>
          (c.classId === "clerigo" &&
            ["guerra", "tempestade"].includes(c.subclassId)) ||
          (c.classId === "bardo" && c.subclassId === "bravura" && c.level >= 3),
      );
    let proficient =
      martial ||
      (simple &&
        (["bardo", "bruxo", "clerigo", "ladino", "monge"].includes(primary) ||
          ids
            .slice(1)
            .some((id) => /simples/i.test(multiclass[id]?.weapons || ""))));
    if (
      ["bardo", "ladino"].includes(primary) &&
      ["besta-de-mao", "espada-longa", "espada-curta", "rapieira"].includes(
        name,
      )
    )
      proficient = true;
    if (ids.includes("monge") && name === "espada-curta") proficient = true;
    if (
      ["feiticeiro", "mago"].includes(primary) &&
      ["adaga", "dardo", "funda", "bordao", "besta-leve"].includes(name)
    )
      proficient = true;
    if (
      primary === "druida" &&
      [
        "adaga",
        "azagaia",
        "bordao",
        "cimitarra",
        "clava",
        "porrete",
        "dardo",
        "foice-curta",
        "funda",
        "lanca",
        "maca",
      ].includes(name)
    )
      proficient = true;
    const racial = char.rules?.raceId || "";
    if (
      racial.startsWith("anao") &&
      [
        "machado-de-batalha",
        "machadinha",
        "martelo-leve",
        "martelo-de-guerra",
      ].includes(name)
    )
      proficient = true;
    if (
      ["altoElfo", "elfoFloresta"].includes(racial) &&
      ["espada-longa", "espada-curta", "arco-curto", "arco-longo"].includes(
        name,
      )
    )
      proficient = true;
    if (
      racial === "drow" &&
      ["rapieira", "espada-curta", "besta-de-mao"].includes(name)
    )
      proficient = true;
    if (
      selections(char, null, "featWeapons")
        .concat(selections(char, null, "racialFeatWeapons"))
        .includes(w.name)
    )
      proficient = true;
    const monk = classEntry(char, "monge")?.level || 0,
      monkWeapon =
        monk &&
        !char.armorEquipped &&
        !char.shieldEquipped &&
        (name === "espada-curta" ||
          (simple &&
            w.kind === "simpleMelee" &&
            !/pesada|duas mãos/i.test(w.properties)));
    const str = mod(char.abilities.str.score),
      dex = mod(char.abilities.dex.score),
      bonusAbility = w.kind.endsWith("Ranged")
        ? dex
        : /acuidade/i.test(w.properties) || monkWeapon
          ? Math.max(str, dex)
          : str;
    let die = w.damage;
    if (monkWeapon) {
      const sides = monk >= 17 ? 10 : monk >= 11 ? 8 : monk >= 5 ? 6 : 4;
      if (/^1d\d+$/.test(die) && +die.slice(2) < sides) die = "1d" + sides;
    }
    const attack =
      bonusAbility +
      (proficient
        ? 2 +
          Math.floor((char.classes.reduce((n, c) => n + c.level, 0) - 1) / 4)
        : 0);
    return {
      ...entry,
      bonus: (attack >= 0 ? "+" : "") + attack,
      damage:
        die === "0" ? "0" : die + (bonusAbility >= 0 ? "+" : "") + bonusAbility,
      dmgTypeLabel: w.damageType,
    };
  }
  function armorInfo(name) {
    const key = norm(name).replace(/^armadura-de-/, "");
    const armors = {
      acolchoada: [11, 99, "leve"],
      couro: [11, 99, "leve"],
      "couro-batido": [12, 99, "leve"],
      "gibao-de-peles": [12, 2, "media"],
      "camisa-de-malha": [13, 2, "media"],
      brunea: [14, 2, "media"],
      peitoral: [14, 2, "media"],
      "meia-armadura": [15, 2, "media"],
      "cota-de-aneis": [14, 0, "pesada"],
      "cota-de-malha": [16, 0, "pesada", 13],
      "cota-de-talas": [17, 0, "pesada", 15],
      placas: [18, 0, "pesada", 15],
      escudo: [2, 0, "shield"],
      "escudo-de-madeira": [2, 0, "shield"],
    };
    const values = armors[key];
    return values
      ? {
          base: values[0],
          dexCap: values[1],
          type: values[2],
          strength: values[3] || 0,
        }
      : null;
  }
  function movementSpeed(char) {
    const race = O.races[char.rules?.raceId];
    if (!race || char.rules.legacy) return char.speed ?? 9;
    const armor = armorInfo(char.armorEquipped),
      monk = classEntry(char, "monge")?.level || 0,
      barbarian = classEntry(char, "barbaro")?.level || 0;
    const feats = selections(char, null, "feat").concat(
      selections(char, null, "racialFeat"),
    );
    return (
      race.speed +
      (feats.includes("Mobilidade") ? 3 : 0) +
      (barbarian >= 5 && armor?.type !== "pesada" ? 3 : 0) +
      (monk >= 2 && !char.shieldEquipped && !armor
        ? monk >= 18
          ? 9
          : monk >= 14
            ? 7.5
            : monk >= 10
              ? 6
              : monk >= 6
                ? 4.5
                : 3
        : 0) -
      (armor?.strength > char.abilities.str.score &&
      !char.rules.raceId.startsWith("anao")
        ? 3
        : 0)
    );
  }
  const api = {
    data: D,
    options: O,
    progression: P,
    spells: S,
    context,
    requirements,
    validate,
    create,
    levelUp,
    features,
    reference,
    optionReference,
    rollAbilities,
    scores,
    finalScores,
    spell,
    spellLimit,
    casting,
    selections,
    toSheetSpell,
    refresh,
    inferSubclass,
    weaponStats,
    armorInfo,
    movementSpeed,
    multiclass,
    multiclassEligibility,
    multiclassNotes,
    unarmoredDefense,
    classFeatures,
  };
  if (node) module.exports = api;
  else root.CharacterEngine = api;
})(globalThis);
