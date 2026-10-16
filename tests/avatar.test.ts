import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { isAvatarRef, avatarMarkup, prepareAvatar } from "../src/media/avatar";
import { AvatarCache } from "../src/media/avatar-cache";
import { validateDocument } from "../src/sync/documents";
import { validateCharacters } from "../src/storage/validation";
const { warrior } = require("./fixture.cjs");
const ref = { id: "11111111-1111-4111-8111-111111111111", revision: "22222222-2222-4222-8222-222222222222" };
test("imagens só aceitam referências compactas, nunca URLs de backup", () => {
  assert.equal(isAvatarRef(ref), true);
  for (const value of [null, "javascript:alert(1)", { id: "https://example.test/foto", revision: ref.revision }, { ...ref, revision: "<img>" }]) {
    assert.equal(isAvatarRef(value), false);
    assert.ok(!avatarMarkup(value).includes("data-avatar-id"));
  }
  assert.throws(() => validateCharacters([{ ...warrior(), avatar: { id: "externa", revision: "invalida" } }]));
  assert.doesNotThrow(() => validateCharacters([{ ...warrior(), avatar: ref }]));
  assert.throws(() => validateDocument({ kind: "preference", id: "dnd_profile_avatar", value: '"https://example.test/foto"' }));
});
test("recusa arquivos grandes ou formatos ativos antes de tentar decodificar", async () => {
  await assert.rejects(prepareAvatar(new File(["<svg/>"], "teste.svg", { type: "image/svg+xml" })), /JPG, PNG ou WebP/);
  await assert.rejects(prepareAvatar(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "grande.png", { type: "image/png" })), /até 5 MB/);
});
test("cache mantém versões anteriores e separa imagens por conta", async () => {
  Object.assign(globalThis, { indexedDB: new IDBFactory() });
  const cache = new AvatarCache(), blob = new Blob(["webp"], { type: "image/webp" });
  await cache.put({ ...ref, scope: "A:", key: `A:${ref.id}:${ref.revision}`, blob, pending: true });
  assert.equal(await cache.get("B:", ref), undefined);
  assert.equal((await cache.get("A:", ref))?.pending, true);
  const newer = { ...ref, revision: "33333333-3333-4333-8333-333333333333" };
  await cache.put({ ...newer, scope: "A:", key: `A:${newer.id}:${newer.revision}`, blob, pending: false });
  assert.equal((await cache.get("A:", ref))?.pending, true);
  assert.equal((await cache.get("A:", newer))?.pending, false);
  assert.equal((await cache.list("A:")).length, 2);
});
test("não confia na extensão/MIME de um SVG renomeado como PNG", async () => {
  await assert.rejects(prepareAvatar(new File(['<svg onload="alert(1)"/>'], "disfarce.png", { type: "image/png" })), /conteúdo do arquivo/);
});
