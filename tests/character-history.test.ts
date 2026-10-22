import {test} from 'node:test';
import assert from 'node:assert/strict';
import {characterSnapshot,historyKey,historyComparable,migrateCharacterHistories,splitLegacyHistory,validateCharacterHistory} from '../src/storage/character-history';
import {readDocuments,projectDocuments,documentKey,validateDocument} from '../src/sync/documents';
const {warrior}=require('./fixture.cjs');
const step=(action:string,chars:any[])=>({action,timestamp:'2026-10-19T12:00:00Z',isCheckpoint:false,stateJson:JSON.stringify(chars)});
test('histórico antigo é separado por mudança real, com ponteiros independentes e original preservado',()=>{
  const a=warrior(),b={...warrior(),name:'Segunda ficha'},a2=structuredClone(a),b2=structuredClone(b);a2.coins.po=42;b2.hpCurrent=3;
  const raw=JSON.stringify({stack:[step('Início',[a,b]),step('Moedas A',[a2,b]),step('Dano B',[a2,b2]),step('Checkpoint sem autor',[a2,b2])],pointer:2});
  const split=splitLegacyHistory(raw),ha=split.get(a.id)!,hb=split.get(b.id)!;
  assert.deepEqual(ha.stack.map(s=>s.action),['Início','Moedas A']);
  assert.deepEqual(hb.stack.map(s=>s.action),['Início','Dano B']);
  assert.equal(ha.pointer,1);assert.equal(hb.pointer,1);
  for(const h of split.values()) assert.doesNotThrow(()=>validateCharacterHistory(JSON.stringify(h),h.characterId));
  const values=new Map([['dnd_history_v1',raw]]),port={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>{values.delete(k)}};
  migrateCharacterHistories(port);assert.equal(values.get('dnd_history_v1'),raw);
  const existing=values.get(historyKey(a.id));migrateCharacterHistories(port);assert.equal(values.get(historyKey(a.id)),existing);
  assert.throws(()=>validateCharacterHistory(JSON.stringify({...ha,pointer:0,stack:[step('Ficha errada',[b])]}),a.id),/outra ficha/);
});
test('migração com quota preserva o original e comparação ignora perfil/layout',()=>{
  const a=warrior(),raw=JSON.stringify({stack:[step('Início',[a])],pointer:0});
  const port={getItem:(k:string)=>k==='dnd_history_v1'?raw:null,setItem:()=>{throw Error('quota')},removeItem:()=>{throw Error('não apagar')}};
  assert.throws(()=>migrateCharacterHistories(port),/quota/);assert.equal(port.getItem('dnd_history_v1'),raw);
  assert.equal(historyComparable(characterSnapshot(a)),historyComparable(characterSnapshot({...a,preferredLayout:'modern_2024',playerName:'Perfil atual'})));
});
test('documentos de histórico são validados por dono da ficha, projetados separados e ilegíveis preservados',()=>{
  const a=warrior(),b=warrior(),h=(c:any)=>JSON.stringify({version:2,characterId:c.id,stack:[step('Início',[c])],pointer:0});
  const values=new Map([['critcall_characters_v1',JSON.stringify({schemaVersion:1,characters:[a,b]})],[historyKey(a.id),h(a)],[historyKey(b.id),h(b)]]);
  const port={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>{values.delete(k)}};
  const docs=readDocuments(port);assert.ok(docs[documentKey('preference',historyKey(a.id))]);assert.ok(docs[documentKey('preference',historyKey(b.id))]);
  assert.throws(()=>validateDocument({kind:'preference',id:historyKey(a.id),value:h(b)}),/inválido/);
  projectDocuments(port,docs);assert.equal(values.get(historyKey(b.id)),h(b));
  values.set(historyKey(a.id),'{ilegível');const recovered=readDocuments(port);
  assert.ok(Object.values(recovered).some(d=>d.kind==='recovery' && d.value==='{ilegível'));
  assert.equal(values.get(historyKey(a.id)),'{ilegível');
  assert.ok(recovered[documentKey('character',a.id)]);
});

test('limite de histórico conserva o estado atual, ponteiro e vizinhos sem alterar a origem',async()=>{
 const {boundedCharacterHistory,HISTORY_MAX_STEPS,HISTORY_MAX_BYTES}=await import('../src/storage/character-history');
 const c=warrior(),stack=Array.from({length:150},(_,i)=>step('Passo '+i,[{...c,hpCurrent:i}]));
 const original={version:2 as const,characterId:c.id,stack,pointer:50},bounded=boundedCharacterHistory(original);
 assert.equal(original.stack.length,150);assert.equal(bounded.stack.length,HISTORY_MAX_STEPS);assert.equal(bounded.stack[bounded.pointer],stack[50]);assert.equal(bounded.stack[bounded.pointer-1],stack[49]);assert.equal(bounded.stack[bounded.pointer+1],stack[51]);
 const large={...original,pointer:149,stack:stack.map(s=>({...s,action:'ç'.repeat(20000)}))},limited=boundedCharacterHistory(large);
 assert.ok(new TextEncoder().encode(JSON.stringify(limited)).byteLength<=HISTORY_MAX_BYTES);assert.equal(limited.stack[limited.pointer],large.stack[149]);
 const huge={...original,pointer:0,stack:[{...stack[0],action:'a'.repeat(HISTORY_MAX_BYTES+1)}]};assert.equal(boundedCharacterHistory(huge).stack[0],huge.stack[0]);
});
