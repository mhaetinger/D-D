import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAuthConfig } from "../src/auth/config";
import { workspaceKey, workspaceStorage } from "../src/storage/account-scope";
import { CharacterStore, SHEET_KEY, LEGACY_KEY, NOTES_KEY } from "../src/storage/character-store";
const { warrior } = require("./fixture.cjs");
class MemoryStorage {
  data = new Map<string, string>();
  fail = "";
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { if (key === this.fail) throw new Error("quota"); this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}
test("login desativado sem configuração; chaves privilegiadas e URLs com credenciais são recusadas", () => {
  assert.equal(parseAuthConfig(undefined, ""), null);
  assert.deepEqual(parseAuthConfig("https://orbyt.supabase.co", "sb_publishable_test"), { url: "https://orbyt.supabase.co", publishableKey: "sb_publishable_test" });
  const jwt = (role: string) => `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
  assert.ok(parseAuthConfig("https://orbyt.supabase.co", jwt("anon")));
  for (const key of ["sb_secret_test", jwt("service_role"), "senha", ""]) assert.throws(() => parseAuthConfig("https://orbyt.supabase.co", key));
  for (const url of ["http://orbyt.supabase.co", "https://senha@orbyt.supabase.co", "https://orbyt.supabase.co/path", "https://orbyt.supabase.co/?token=secreto"]) assert.throws(() => parseAuthConfig(url, "sb_publishable_test"));
});
test("cada conta/projeto tem fichas, legado e notas próprios; entrar não adota as fichas sem login", () => {
  const storage = new MemoryStorage(), char = warrior();
  storage.setItem(LEGACY_KEY, JSON.stringify([char]));
  storage.setItem(NOTES_KEY, JSON.stringify({ [char.id]: "Nota sem login" }));
  const make = (project: string, userId: string) => {
    const port = workspaceStorage(() => storage, workspaceKey({ project, userId }));
    return new CharacterStore(() => port);
  };
  const a = make("projeto-a", "pessoa-a"), b = make("projeto-a", "pessoa-b"), otherProject = make("projeto-b", "pessoa-a");
  assert.deepEqual(a.read(), []); assert.deepEqual(b.read(), []); assert.deepEqual(otherProject.read(), []);
  a.write([char]); a.writeNote(char.id, "Nota da conta A");
  b.write([{ ...char, name: "Conta B" }]); b.writeNote(char.id, "Nota da conta B");
  assert.equal(a.read()[0].name, char.name);
  assert.equal(b.read()[0].name, "Conta B");
  assert.equal(a.note(char.id), "Nota da conta A");
  assert.equal(b.note(char.id), "Nota da conta B");
  assert.deepEqual(otherProject.notes(), {});
  const guest = new CharacterStore(() => storage);
  assert.equal(guest.read()[0].name, char.name);
  assert.equal(guest.note(char.id), "Nota sem login");
  assert.equal(a.backup([char]).privateNotes, undefined);
});
test("uma escrita iniciada no espaço anterior nunca é redirecionada a outra conta", () => {
  const storage = new MemoryStorage();
  const a = workspaceStorage(() => storage, "conta-a:");
  const b = workspaceStorage(() => storage, "conta-b:");
  b.setItem(SHEET_KEY, "estado B");
  a.setItem(SHEET_KEY, "estado A");
  a.removeItem(SHEET_KEY);
  assert.equal(b.getItem(SHEET_KEY), "estado B");
});
test("nota com falha de quota continua na memória e no backup explícito; dados anteriores são preservados", () => {
  const storage = new MemoryStorage(), char = warrior(), store = new CharacterStore(() => storage);
  store.read(); store.write([char]); store.writeNote(char.id, "Nota anterior");
  storage.fail = NOTES_KEY;
  assert.equal(store.writeNote(char.id, "Rascunho novo"), false);
  assert.equal(store.note(char.id), "Rascunho novo");
  assert.equal(store.backup([char], true).privateNotes![char.id], "Rascunho novo");
  assert.equal(JSON.parse(storage.getItem(NOTES_KEY)!)[char.id], "Nota anterior");
  assert.equal(store.backup([char]).privateNotes, undefined);
});
test("nota corrompida não é sobrescrita pela edição e sua falha não apaga a ficha", () => {
  const storage = new MemoryStorage(), char = warrior(), store = new CharacterStore(() => storage);
  store.read(); store.write([char]); storage.setItem(NOTES_KEY, "{ilegível");
  assert.equal(store.writeNote(char.id, "Texto a recuperar"), false);
  assert.equal(store.note(char.id), "Texto a recuperar");
  assert.equal(storage.getItem(NOTES_KEY), "{ilegível");
  assert.equal(store.read()[0].id, char.id);
});
