const assert = require("node:assert/strict");
const E = require("../public/rules/character-engine");
const setup = (classId, raceId = "humano", backgroundId = "soldado") => ({
  name: "Personagem de teste",
  playerName: "Teste",
  classId,
  raceId,
  backgroundId,
  abilityMethod: "standard",
  baseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  allowFeats: false,
});

// O simulador preenche o contrato público, como a interface. Nunca ignora erros
// do motor nem usa dados internos para fabricar uma ficha já pronta.
function choose(d, subclass, overrides = {}) {
  Object.assign(d.answers, overrides);
  for (let iteration = 0; iteration < 80; iteration++) {
    let changed = false;
    for (const field of E.requirements(d)) {
      if (field.min === 0 && !Object.hasOwn(overrides, field.id)) {
        d.answers[field.id] =
          field.id === "prepared"
            ? field.options.slice(0, field.count).map((o) => o.value)
            : "";
        continue;
      }
      const current = Array.isArray(d.answers[field.id])
        ? d.answers[field.id]
        : d.answers[field.id]
          ? [d.answers[field.id]]
          : [];
      if (
        current.length === field.count &&
        current.every((v) => field.options.some((o) => o.value === v))
      )
        continue;
      let opts = field.options;
      if (field.id === "subclass" && subclass)
        opts = opts.filter((o) => o.value === subclass);
      if (field.id === "asi")
        opts = [...opts].sort(
          (a, b) => E.scores(d)[a.value] - E.scores(d)[b.value],
        );
      if (field.id === "spells" && d.classId === "mago")
        opts = [...opts].sort(
          (a, b) =>
            b.spell.level - a.spell.level || a.label.localeCompare(b.label),
        );
      if (Object.hasOwn(overrides, field.id)) continue;
      if (opts.length < field.count && field.unique)
        throw new Error(
          `${d.classId} nível ${d.level}: opções insuficientes em ${field.id} (${opts.length}/${field.count})`,
        );
      const values = field.unique
        ? opts.slice(0, field.count).map((o) => o.value)
        : Array(field.count).fill(opts[0]?.value);
      d.answers[field.id] = field.count === 1 ? values[0] : values;
      changed = true;
      break;
    }
    if (!changed) return d.answers;
  }
  throw new Error(`Escolhas não convergiram: ${d.classId} ${d.level}`);
}
function create(classId, subclass, raceId, backgroundId, overrides) {
  const s = setup(classId, raceId, backgroundId),
    d = E.context(s, {});
  choose(d, subclass, overrides);
  return E.create(s, d.answers);
}


module.exports = { setup, choose, create };
