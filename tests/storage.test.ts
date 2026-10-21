import { test } from "node:test";
import assert from "node:assert/strict";
import { CharacterStore, SHEET_KEY, LEGACY_KEY, NOTES_KEY, RECOVERY_KEY } from "../src/storage/character-store";
import { parseBackup, validateCharacters } from "../src/storage/validation";
const { warrior } = require("./fixture.cjs");
const E = require("../public/rules/character-engine.js");
const { create, choose } = require("./character-choices.cjs");
class MemoryStorage {
  data = new Map<string, string>();
  fail = "";
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { if (key === this.fail) throw new Error("quota"); this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}
function fixture() {
  const storage = new MemoryStorage();
  const store = new CharacterStore(() => storage);
  store.read();
  const char = warrior();
  return { storage, store, char };
}
test("migra a coleção antiga sem apagar o original ou misturar as anotações", () => {
  const { storage, store, char } = fixture();
  const original = JSON.stringify([char]);
  storage.setItem(LEGACY_KEY, original);
  storage.setItem(NOTES_KEY, JSON.stringify({ [char.id]: "Segredo pessoal" }));
  assert.deepEqual(store.read(), [char]);
  assert.equal(store.issue, null);
  assert.equal(storage.getItem(LEGACY_KEY), original);
  assert.equal(JSON.parse(storage.getItem(SHEET_KEY)!).schemaVersion, 1);
  assert.equal(storage.getItem(SHEET_KEY)!.includes("Segredo pessoal"), false);
  char.coins.po = 42;
  assert.equal(store.write([char]), true);
  assert.equal(storage.getItem(LEGACY_KEY), original);
  assert.equal(new CharacterStore(() => storage).read()[0].coins && JSON.stringify(new CharacterStore(() => storage).read()).includes('"po":42'), true);
});
test("JSON inválido, formato incompleto e versão futura preservam o conteúdo original", () => {
  for (const raw of ["{danificado", '{"schemaVersion":2,"characters":[]}', '{"schemaVersion":1,"characters":[{"id":"incompleto"}]}']) {
    const { storage, store } = fixture();
    storage.setItem(SHEET_KEY, raw);
    assert.deepEqual(store.read(), []);
    assert.equal(store.issue?.kind, "invalid");
    assert.equal(store.raw, raw);
    assert.equal(store.write([]), false);
    assert.equal(storage.getItem(SHEET_KEY), raw);
  }
});
test("erro de quota não declara sucesso nem substitui a coleção anterior", () => {
  const { storage, store, char } = fixture();
  store.write([char]);
  const original = storage.getItem(SHEET_KEY);
  storage.fail = SHEET_KEY;
  char.name = "Alteração em memória";
  assert.equal(store.write([char]), false);
  assert.equal(store.issue?.kind, "write");
  assert.equal(storage.getItem(SHEET_KEY), original);
  assert.equal(store.backup([char]).characters[0].name, "Alteração em memória");
});
test("armazenamento bloqueado permite backup em memória e informa o limite", () => {
  const { char } = fixture();
  const store = new CharacterStore(() => { throw new Error("Bloqueado"); });
  assert.deepEqual(store.read(), []);
  assert.equal(store.issue?.kind, "unavailable");
  assert.equal(store.backup([char]).characters.length, 1);
  assert.equal(store.write([char]), false);
});
test("restabelecer permissão sem reler não permite sobrescrever fichas desconhecidas", () => {
  const { storage, char } = fixture();
  const original = JSON.stringify([char]);
  storage.setItem(LEGACY_KEY, original);
  let blocked = true;
  const store = new CharacterStore(() => { if (blocked) throw new Error("Bloqueado"); return storage; });
  store.read();
  blocked = false;
  assert.equal(store.write([]), false);
  assert.throws(() => store.importCopies(store.backup([char]), []), /Reabra a página/);
  assert.equal(storage.getItem(LEGACY_KEY), original);
  assert.equal(storage.getItem(SHEET_KEY), null);
});
test("uma gravação antes da leitura inicial não substitui dados que ainda não foram conferidos", () => {
  const { storage, char } = fixture();
  const original = JSON.stringify({ schemaVersion: 1, characters: [char] });
  storage.setItem(SHEET_KEY, original);
  const unopened = new CharacterStore(() => storage);
  assert.equal(unopened.write([]), false);
  assert.equal(storage.getItem(SHEET_KEY), original);
});
test("backup exclui notas por padrão; inclusão explícita só leva as dos personagens exportados", () => {
  const { storage, store, char } = fixture();
  storage.setItem(NOTES_KEY, JSON.stringify({ [char.id]: "Minha nota", outro: "Nota de outra ficha" }));
  const plain = store.backup([char]);
  assert.equal(plain.privateNotes, undefined);
  const full = store.backup([char], true);
  assert.deepEqual(full.privateNotes, { [char.id]: "Minha nota" });
  assert.equal(Object.hasOwn(full.characters[0], "privateNotes"), false);
  assert.deepEqual(parseBackup(JSON.stringify(full)), full);
});
test("importar faz cópias com novos IDs, mantém fichas e remapeia notas sem sobrescrever as antigas", () => {
  const { storage, store, char } = fixture();
  storage.setItem(NOTES_KEY, JSON.stringify({ [char.id]: "Nota original" }));
  const full = store.backup([char], true);
  const chars = store.importCopies(full, [char]);
  assert.equal(chars.length, 2);
  assert.notEqual(chars[0].id, chars[1].id);
  assert.equal(chars[0].id, char.id);
  assert.deepEqual(store.notes(), { [char.id]: "Nota original", [chars[1].id]: "Nota original" });
  assert.deepEqual(new CharacterStore(() => storage).read(), chars);
});
test("falha na importação mantém as fichas e reverte a escrita das notas", () => {
  const { storage, store, char } = fixture();
  store.write([char]);
  storage.setItem(NOTES_KEY, JSON.stringify({ [char.id]: "Nota original" }));
  const original = storage.getItem(SHEET_KEY);
  const originalNotes = storage.getItem(NOTES_KEY);
  const full = store.backup([char], true);
  storage.fail = SHEET_KEY;
  assert.throws(() => store.importCopies(full, [char]), /fichas anteriores foram preservadas/);
  assert.equal(storage.getItem(SHEET_KEY), original);
  assert.equal(storage.getItem(NOTES_KEY), originalNotes);
});
test("recuperação exige confirmação e mantém uma cópia dos dados ilegíveis", () => {
  const { storage, store, char } = fixture();
  storage.setItem(SHEET_KEY, "{danificado");
  store.read();
  const backup = store.backup([char]);
  assert.throws(() => store.importCopies(backup, []), /Confirme a recuperação/);
  assert.equal(storage.getItem(SHEET_KEY), "{danificado");
  const result = store.importCopies(backup, [], true);
  assert.equal(result.length, 1);
  assert.equal(storage.getItem(RECOVERY_KEY), "{danificado");
  assert.equal(store.issue, null);
});
test("uma segunda recuperação não sobrescreve a cópia da primeira", () => {
  const { storage, store, char } = fixture();
  storage.setItem(SHEET_KEY, "{segunda");
  storage.setItem(RECOVERY_KEY, "{primeira");
  store.read();
  store.importCopies(store.backup([char]), [], true);
  assert.equal(storage.getItem(RECOVERY_KEY), "{primeira");
  assert.ok([...storage.data.entries()].some(([key, value]) => key.startsWith(RECOVERY_KEY + "_") && value === "{segunda"));
});
test("arquivos malformados, versões desconhecidas e propriedades reservadas são rejeitados", () => {
  const { store, char } = fixture();
  assert.throws(() => parseBackup("não é JSON"), /JSON válido/);
  assert.throws(() => parseBackup('{"format":"critcall.character-backup","version":9,"characters":[]}'), /versão/);
  assert.throws(() => parseBackup(JSON.stringify({ ...store.backup([char]), privateNotes: { desconhecido: "Nota" } })), /correspondente/);
  assert.throws(() => validateCharacters([char, structuredClone(char)]), /identificador/);
  const dangerous = JSON.parse(JSON.stringify(char));
  dangerous.lore = JSON.parse('{"__proto__":{"poluido":true}}');
  assert.throws(() => validateCharacters([dangerous]), /reservada/);
  assert.equal((Object.prototype as Record<string, unknown>).poluido, undefined);
  const badWeapon = structuredClone(char);
  badWeapon.weapons[0].bonus = '<img src=x onerror="alert(1)">';
  assert.throws(() => validateCharacters([badWeapon]), /arma/);
});
test("o salvamento aceita as 41 subclasses em todos os níveis de 1 a 20", () => {
  for (const [id, cls] of Object.entries(E.data.classes) as [string, { subclasses: Record<string, unknown> }][]) {
    for (const sid of Object.keys(cls.subclasses)) {
      let char = create(id, sid);
      for (let level = 1; level <= 20; level++) {
        assert.doesNotThrow(() => validateCharacters([char]), `${id}/${sid}/${level}`);
        if (level < 20) {
          const context = E.context({}, {}, char, id);
          char = E.levelUp(char, id, choose(context, sid));
        }
      }
    }
  }
});
