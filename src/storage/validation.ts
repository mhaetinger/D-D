import { isAvatarRef } from "../media/avatar";
import { legacyBackupFormat } from "./legacy";
import { normalizeCharacterText } from "../rules/text";
export interface CharacterRecord extends Record<string, unknown> {
  id: string;
  name: string;
}
const classes = new Set(["barbaro", "bardo", "bruxo", "clerigo", "druida", "feiticeiro", "guerreiro", "ladino", "mago", "monge", "paladino", "patrulheiro"]);
const abilities = ["str", "dex", "con", "int", "wis", "cha"];
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e9;
const string = (v: unknown): v is string => typeof v === "string";
function expect(ok: unknown, label: string): asserts ok {
  if (!ok) throw new Error(`Formato inválido: ${label}. Nenhuma ficha foi substituída.`);
}
function inspect(value: unknown, depth = 0, budget = { nodes: 0 }) {
  expect(depth <= 60 && ++budget.nodes < 200_000, "arquivo muito complexo");
  if (typeof value === "string") expect(value.length <= 200_000, "texto muito longo");
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      expect(!["__proto__", "prototype", "constructor"].includes(key), "propriedade reservada");
      inspect(child, depth + 1, budget);
    }
  }
}

/** Valida o formato consumido pela ficha; não recalcula escolhas ou altera os textos. */
export function validateCharacters(value: unknown): CharacterRecord[] {
  expect(Array.isArray(value) && value.length <= 1_000, "lista de personagens");
  inspect(value);
  const ids = new Set<string>();
  for (const item of value) {
    expect(object(item), "personagem");
    expect(string(item.id) && item.id.length > 0 && item.id.length < 200 && !ids.has(item.id), "identificador repetido ou ausente");
    ids.add(item.id);
    if (item.avatar !== undefined && item.avatar !== null) expect(isAvatarRef(item.avatar), "referência de imagem");
    expect(string(item.name) && string(item.playerName) && string(item.race) && string(item.background) && string(item.alignment), "identidade");
    expect(!Object.hasOwn(item, "privateNotes") && !Object.hasOwn(item, "playerNotes"), "anotações pessoais devem ficar separadas");
    expect(object(item.abilities), "atributos");
    for (const key of abilities) {
      const score = item.abilities[key];
      expect(object(score) && Number.isInteger(score.score) && finite(score.score) && score.score >= 0 && score.score <= 30 && typeof score.saveProf === "boolean", `atributo ${key}`);
    }
    expect(Array.isArray(item.classes) && item.classes.length > 0 && item.classes.length <= 12, "classes");
    const classIds = new Set();
    let total = 0;
    for (const entry of item.classes) {
      expect(object(entry) && string(entry.classId) && classes.has(entry.classId) && !classIds.has(entry.classId), "classe desconhecida ou repetida");
      expect(finite(entry.level) && Number.isInteger(entry.level) && entry.level >= 1 && entry.level <= 20 && string(entry.subclass), "nível ou subclasse");
      classIds.add(entry.classId);
      total += entry.level;
    }
    expect(total <= 20, "nível total superior a 20");
    for (const key of ["hpCurrent", "hpMax", "hpTemp", "baseAcArmor", "speed"]) expect(finite(item[key]), key);
    expect((item.hpMax as number) > 0, "PV máximos");
    for (const key of ["skillsProf", "expertise", "weapons", "spells", "features", "inventoryItems"]) expect(Array.isArray(item[key]), key);
    for (const key of ["skillsProf", "expertise"]) expect((item[key] as unknown[]).every(string), key);
    for (const key of ["lore", "physical", "proficiencies"]) expect(object(item[key]) && Object.values(item[key]).every(string), key);
    for (const key of ["traits", "ideals", "bonds", "flaws", "backstory"]) expect(string((item.lore as Record<string, unknown>)[key]), `história: ${key}`);
    expect(object(item.coins), "moedas");
    for (const key of ["pc", "pp", "pe", "po", "pl"]) expect(finite(item.coins[key]) && (item.coins[key] as number) >= 0, `moeda ${key}`);
    for (const key of ["pactMagic", "sorceryPoints"]) expect(object(item[key]) && Object.values(item[key]).every(finite), key);
    expect(object(item.standardSlots), "espaços de magia");
    for (const slot of Object.values(item.standardSlots)) expect(object(slot) && finite(slot.used) && finite(slot.total), "espaço de magia");
    for (const weapon of item.weapons as unknown[]) {
      // Vazio em um ataque manual significa dado ausente, não bônus +0.
      // Sopros/efeitos com resistência também podem não fazer jogada de ataque.
      expect(object(weapon) && string(weapon.name) && string(weapon.damage) && /^[\dd+\-\s]+$/i.test(weapon.damage) && (/^[+\-]?\d+$/.test(String(weapon.bonus)) || weapon.calculationMode==='manual' && weapon.bonus===''), "arma e dados de dano");
    }
    for (const spell of item.spells as unknown[]) expect(object(spell) && string(spell.name) && finite(spell.circle) && spell.circle >= 0 && spell.circle <= 9, "magia");
    for (const entry of item.inventoryItems as unknown[]) expect(object(entry) && string(entry.name) && finite(entry.qty) && finite(entry.weightKg), "item do inventário");
    if (item.rules !== undefined) expect(object(item.rules) && Array.isArray(item.rules.history) && item.rules.history.every(object), "histórico de escolhas");
  }
  return (value as CharacterRecord[]).map(normalizeCharacterText);
}

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export interface Backup {
  format: "critcall.character-backup";
  version: 1;
  exportedAt: string;
  characters: CharacterRecord[];
  privateNotes?: Record<string, string>;
}
export function parseBackup(text: string): Backup {
  expect(new TextEncoder().encode(text).length <= MAX_BACKUP_BYTES, "backup maior que 20 MB");
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error("O arquivo não contém JSON válido. Nenhum dado foi alterado."); }
  if (Array.isArray(data)) return { format: "critcall.character-backup", version: 1, exportedAt: "", characters: validateCharacters(data) };
  expect(object(data) && ["critcall.character-backup",legacyBackupFormat].includes(String(data.format)) && data.version === 1, "tipo ou versão de backup não suportado");
  expect(data.exportedAt === undefined || string(data.exportedAt), "data do backup");
  const characters = validateCharacters(data.characters);
  if (data.privateNotes !== undefined) {
    expect(object(data.privateNotes), "anotações pessoais");
    const ids = new Set(characters.map((c) => c.id));
    expect(Object.entries(data.privateNotes).every(([id, text]) => ids.has(id) && string(text) && text.length <= 2_000_000), "anotações pessoais sem personagem correspondente");
  }
  return { format: "critcall.character-backup", version: 1, exportedAt: String(data.exportedAt || ""), characters, ...(data.privateNotes ? { privateNotes: data.privateNotes as Record<string, string> } : {}) };
}
