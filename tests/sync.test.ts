import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { BrowserJournal, type Pending, type RemoteDocument } from "../src/sync/journal";
import { SyncEngine, type RemotePort, type PushResult } from "../src/sync/engine";
import { canonical, documentKey, readDocuments, projectDocuments, type Documents } from "../src/sync/documents";
import { SupabaseDocuments } from "../src/sync/supabase-port";
import { createClient } from "@supabase/supabase-js";
const { warrior } = require("./fixture.cjs");

class Remote implements RemotePort {
  rows: Record<string, RemoteDocument> = {};
  sent: Pending[] = [];
  accepted = new Map<string, PushResult>();
  fail = false;
  loseResponse = false;
  hold: (() => Promise<void>) | null = null;
  async pull() { if (this.fail) throw new Error("offline"); return structuredClone(Object.values(this.rows)); }
  async push(op: Pending) {
    if (this.fail) throw new Error("offline");
    this.sent.push(structuredClone(op));
    if (this.hold) await this.hold();
    if (this.accepted.has(op.operationId)) return structuredClone(this.accepted.get(op.operationId)!);
    const old = this.rows[op.key];
    const row = { ...op, revision: (old?.revision ?? 0) + 1, edited_at: op.editedAt, updated_at: new Date().toISOString(), operation_id: op.operationId };
    this.rows[op.key] = row;
    const result = { document: row, conflict: !!old && old.revision !== op.baseRevision, server_time: new Date().toISOString() };
    this.accepted.set(op.operationId, result);
    if (this.loseResponse) { this.loseResponse = false; throw new Error("resposta perdida após commit"); }
    return structuredClone(result);
  }
}
function setup(remote = new Remote(), journal = new BrowserJournal(new IDBFactory()), scope = "conta-a") {
  let docs: Documents = {}, editing = false;
  const engine = new SyncEngine(scope, journal, remote, { read: () => structuredClone(docs), apply: values => { docs = structuredClone(Object.fromEntries(Object.entries(values).filter(([, doc]) => doc.value !== null))); }, canApply: () => !editing });
  return { engine, journal, remote, get docs() { return docs; }, set docs(next: Documents) { docs = next; }, edit(value: boolean) { editing = value; } };
}
const name = (value: string): Documents => ({ [documentKey("preference", "dnd_public_player_name")]: { kind: "preference", id: "dnd_public_player_name", value } });

test("fila IndexedDB sobrevive à recarga offline, separa notas e envia o perfil completo", async () => {
  const a = setup();
  await a.engine.capture(true);
  const char = warrior();
  a.docs = { ...name("Jogador persistente"), [documentKey("character", char.id)]: { kind: "character", id: char.id, value: char }, [documentKey("note", char.id)]: { kind: "note", id: char.id, value: "Nota exclusiva" } };
  await a.engine.capture();
  a.remote.fail = true; await a.engine.run();
  assert.equal(a.engine.pending, 3);
  const reloaded = setup(a.remote, a.journal); reloaded.docs = a.docs;
  await reloaded.engine.capture(true);
  a.remote.fail = false; await reloaded.engine.run();
  assert.equal(reloaded.engine.pending, 0);
  assert.equal(a.remote.sent.length, 3);
  assert.equal(JSON.stringify(a.remote.sent.find(op => op.kind === "character")).includes("Nota exclusiva"), false);
  const otherComputer = setup(a.remote); await otherComputer.engine.capture(true); await otherComputer.engine.run();
  assert.equal(canonical(otherComputer.docs), canonical(a.docs));
});
test("perda da resposta após commit repete o mesmo identificador sem duplicar a versão", async () => {
  const a = setup(); await a.engine.capture(true);
  a.docs = name("Nome novo"); await a.engine.capture();
  a.remote.loseResponse = true; await a.engine.run();
  assert.equal(a.engine.pending, 1);
  await a.engine.run();
  assert.equal(a.engine.pending, 0);
  assert.equal(a.remote.sent[0].operationId, a.remote.sent[1].operationId);
  assert.equal(a.remote.accepted.size, 1);
});
test("uma edição durante a requisição permanece na fila e não é sobrescrita pela resposta", async () => {
  const a = setup(); await a.engine.capture(true);
  a.docs = name("Antes"); await a.engine.capture();
  let entered!: () => void, release!: () => void;
  const called = new Promise<void>(resolve => { entered = resolve; });
  const waiting = new Promise<void>(resolve => { release = resolve; });
  a.remote.hold = async () => { entered(); await waiting; };
  const sending = a.engine.run(); await called;
  a.docs = name("Depois"); await a.engine.capture(); release(); await sending;
  assert.equal(a.engine.pending, 1);
  assert.equal(Object.values(a.docs)[0].value, "Depois");
  a.remote.hold = null; await a.engine.run();
  assert.equal(a.engine.pending, 0);
  assert.equal(Object.values(a.remote.rows)[0].value, "Depois");
  assert.equal(a.remote.sent.at(-1)!.baseRevision, 1);
});
test("atualização de outro computador aguarda o editor e depois carrega a versão remota", async () => {
  const a = setup(); await a.engine.capture(true);
  const b = setup(a.remote); await b.engine.capture(true); b.docs = name("No outro PC"); await b.engine.capture(); await b.engine.run();
  a.edit(true); await a.engine.run();
  assert.equal(a.engine.deferred, true); assert.deepEqual(a.docs, {});
  a.edit(false); await a.engine.run();
  assert.equal(Object.values(a.docs)[0].value, "No outro PC");
});
test("tombstone não ressuscita ficha e uma conta nunca lê a fila de outra", async () => {
  const remote = new Remote(), journal = new BrowserJournal(new IDBFactory());
  const a = setup(remote, journal, "a"); await a.engine.capture(true); a.docs = name("A"); await a.engine.capture(); await a.engine.run();
  a.docs = {}; await a.engine.capture(); await a.engine.run();
  assert.equal(Object.values(remote.rows)[0].value, null);
  const b = setup(new Remote(), journal, "b"); await b.engine.capture(true); await b.engine.run();
  assert.equal(b.remote.sent.length, 0); assert.deepEqual(b.docs, {});
});
test("cache antigo sem data não se apresenta como uma edição nova", async () => {
  const a = setup(); a.docs = name("Legado"); await a.engine.capture(true); await a.engine.run();
  assert.equal(a.remote.sent[0].editedAt, "1970-01-01T00:00:00.000Z");
});
test("transações de duas abas não perdem operações da fila", async () => {
  const factory = new IDBFactory();
  const a = new BrowserJournal(factory), b = new BrowserJournal(factory);
  await Promise.all(Array.from({ length: 30 }, (_, n) => (n % 2 ? a : b).change("mesma-conta", state => { state.offset += 1; })));
  assert.equal(await a.change("mesma-conta", state => state.offset), 30);
});
test("documentos remotos inválidos e notas embutidas não substituem fichas válidas", async () => {
  const a = setup(); await a.engine.capture(true); a.docs = name("Preservar"); await a.engine.capture(); await a.engine.run();
  const char = warrior(); char.privateNotes = "Não pode";
  a.remote.rows.ruim = { key: "character:errado", kind: "character", id: char.id, value: char, revision: 2, edited_at: new Date().toISOString(), updated_at: new Date().toISOString(), operation_id: crypto.randomUUID() };
  await a.engine.run();
  assert.equal(Object.values(a.docs)[0].value, "Preservar");
  assert.match(a.engine.status, /Sem confirmação/);
});
test("projeção preserva o formato legado e mantém notas fora do backup de fichas", () => {
  const data = new Map<string, string>();
  const port = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key,value); }, removeItem: (key: string) => { data.delete(key); } };
  const char = warrior();
  const docs: Documents = { ...name("Pessoa"), [documentKey("character",char.id)]: { kind: "character", id: char.id, value: char }, [documentKey("note",char.id)]: { kind: "note", id: char.id, value: "Segredo" } };
  projectDocuments(port,docs);
  assert.equal(data.get("orbyt_characters_v1")!.includes("Segredo"),false);
  assert.equal(canonical(readDocuments(port)),canonical(docs));
});
test("falha na projeção reverte as chaves já escritas e preserva o histórico ilegível", () => {
  const data = new Map<string, string>([["orbyt_characters_v1",JSON.stringify({schemaVersion:1,characters:[]})],["dnd_history_v1","{ilegível"]]);
  let fail = false;
  const port = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { if(fail&&key==='dnd_player_private_notes_v1')throw new Error('quota');data.set(key,value); }, removeItem: (key: string) => { data.delete(key); } };
  assert.ok(Object.values(readDocuments(port)).some(doc=>doc.kind==='recovery'&&doc.value==='{ilegível'));
  const before = data.get('orbyt_characters_v1'); fail=true;
  const char=warrior();
  assert.throws(()=>projectDocuments(port,{[documentKey('character',char.id)]:{kind:'character',id:char.id,value:char}}));
  assert.equal(data.get('orbyt_characters_v1'),before);
  assert.equal(data.get('dnd_history_v1'),'{ilegível');
});
test("primeira edição calibra a data no servidor sem redatar o legado", async () => {
  const a = setup();
  (a.remote as RemotePort).clock = async () => new Date(Date.now()+60000).toISOString();
  await a.engine.capture(true); a.docs=name('Data calibrada'); await a.engine.capture(); await a.engine.run();
  assert.ok(Date.parse(a.remote.sent[0].editedAt)>Date.now()+55000);
  const legacy=setup(a.remote); legacy.docs=name('Legado'); await legacy.engine.capture(true); await legacy.engine.run();
  assert.equal(legacy.remote.sent.at(-1)!.editedAt,'1970-01-01T00:00:00.000Z');
});
test("paginação carrega tudo mesmo com limite do PostgREST menor que o solicitado", async () => {
  const offsets: number[]=[]; const total=1123;
  const client=createClient('https://critcall-pagination.supabase.co','sb_publishable_test',{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async(input)=>{
      const url=new URL(String(input)); const offset=Number(url.searchParams.get('offset')||0); offsets.push(offset);
      const length=Math.min(100,total-offset);
      return new Response(JSON.stringify(Array.from({length},(_,n)=>({key:`note:${offset+n}`,kind:'note',id:String(offset+n),value:'Texto',revision:1,edited_at:new Date().toISOString(),updated_at:new Date().toISOString(),operation_id:crypto.randomUUID()}))),{status:200,headers:{'content-type':'application/json','content-range':`${offset}-${offset+length-1}/${total}`}});
    }}
  });
  const rows=await new SupabaseDocuments(client,'dono-fictício').pull();
  assert.equal(rows.length,total); assert.equal(new Set(rows.map(row=>row.key)).size,total);
  assert.deepEqual(offsets,Array.from({length:12},(_,n)=>n*100));
});
test("um documento recusado permanece na fila sem impedir o envio dos demais", async () => {
  const a=setup(); await a.engine.capture(true);
  const push=a.remote.push.bind(a.remote);
  a.remote.push=async op=>{if(op.kind==='note')throw Object.assign(new Error('Item recusado'),{code:'22023'});return push(op);};
  a.docs={ [documentKey('note','bloqueada')]:{kind:'note',id:'bloqueada',value:'Preservar na fila'},...name('Nome salvo mesmo assim') };
  await a.engine.capture(); await a.engine.run();
  assert.equal(a.engine.pending,1);
  assert.equal(Object.values(a.remote.rows)[0].value,'Nome salvo mesmo assim');
  assert.equal(a.docs[documentKey('note','bloqueada')].value,'Preservar na fila');
});
