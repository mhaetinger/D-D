import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {IDBFactory} from 'fake-indexeddb';
import {SyncEngine,type RemotePort} from '../src/sync/engine';
import {BrowserJournal,type RemoteDocument,type Pending} from '../src/sync/journal';
import {documentKey,readDocuments,type Documents} from '../src/sync/documents';
import {cloudDocuments,isCloudDocument} from '../src/sync/cloud-policy';
import {SupabaseDocuments} from '../src/sync/supabase-port';
import {SHEET_KEY} from '../src/storage/character-store';
import {warrior} from './fixture.cjs';

const scope='manual-conta';
const row=(kind:RemoteDocument['kind'],id:string,value:unknown,revision=1):RemoteDocument=>({kind,id,key:documentKey(kind,id),value,revision,edited_at:'2026-10-23T12:00:00.000Z',updated_at:'2026-10-23T12:00:00.000Z',operation_id:crypto.randomUUID()});
function setup(initial:Documents={}) {
 let docs=structuredClone(initial),calls=0;
 const sent:Pending[]=[],rows:RemoteDocument[]=[],journal=new BrowserJournal(new IDBFactory());
 const remote:RemotePort={clock:async()=>{calls++;return new Date().toISOString();},pull:async()=>{calls++;return structuredClone(rows);},push:async op=>{calls++;sent.push(structuredClone(op));const saved=row(op.kind,op.id,op.value,(rows.find(d=>d.key===op.key)?.revision||0)+1);rows.splice(0,rows.length,...rows.filter(d=>d.key!==op.key),saved);return {document:saved,conflict:false,server_time:new Date().toISOString()};}};
 const engine=new SyncEngine(scope,journal,remote,{read:()=>structuredClone(docs),apply:values=>{docs={...Object.fromEntries(Object.entries(docs).filter(([,d])=>!isCloudDocument(d))),...structuredClone(values)};},canApply:()=>true},{manual:true,shouldSync:isCloudDocument});
 return {engine,journal,sent,rows,get docs(){return docs;},set docs(value:Documents){docs=value;},get calls(){return calls;}};
}

test('manual: cinquenta edições ficam no aparelho e o clique envia só a ficha atual, sem desfazer',async()=>{
 const char=warrior(),historyId='dnd_character_history_v2:'+char.id,characterKey=documentKey('character',char.id),historyKey=documentKey('preference',historyId);
 const s=setup();await s.engine.capture(true);
 for(let i=1;i<=50;i++) {s.docs={[characterKey]:{kind:'character',id:char.id,value:{...char,hpCurrent:i}},[historyKey]:{kind:'preference',id:historyId,value:'Histórico local '+i}};await s.engine.capture();}
 assert.equal(s.calls,0);assert.equal(s.engine.pending,50);assert.match(s.engine.status,/neste aparelho/);
 await s.engine.run();assert.equal(s.sent.length,1);assert.equal((s.sent[0].value as any).hpCurrent,50);assert.equal(s.docs[historyKey].value,'Histórico local 50');assert.equal(s.engine.pending,0);
 assert.ok(s.sent.every(isCloudDocument));const after=s.calls;await s.engine.capture();await s.engine.applyLatest();assert.equal(s.calls,after,'captura e reaplicação local não iniciam rede');
});

test('manual: filas e caches antigos de histórico são preservados sem envio, exclusão ou projeção',async()=>{
 const id='dnd_history_v1',key=documentKey('preference',id),old:Pending={kind:'preference',id,key,value:'Histórico antigo intacto',baseRevision:0,operationId:crypto.randomUUID(),parentId:null,editedAt:'2026-10-20T12:00:00Z',clockOffset:0,uncalibrated:true};
 const s=setup({[key]:{kind:'preference',id,value:'Histórico local mais recente'}});
 await s.journal.change(scope,state=>{state.pending=[structuredClone(old)];state.remote[key]=row('preference',id,'Histórico da nuvem');state.projected[key]={kind:'preference',id,value:'Projeção antiga preservada'};});
 s.rows.push(row('preference',id,'Histórico remoto não deve substituir o local'));
 await s.engine.capture(true);await s.engine.applyLatest();assert.equal(s.calls,0);assert.equal(s.engine.pending,0);
 await s.engine.run();assert.equal(s.sent.length,0);assert.equal(s.docs[key].value,'Histórico local mais recente');
 await s.journal.change(scope,state=>{assert.deepEqual(state.pending,[old]);assert.equal(state.remote[key].value,'Histórico da nuvem');assert.equal(state.projected[key].value,'Projeção antiga preservada');});
});

test('manual: histórico ilegível não impede capturar ficha e fica byte a byte no armazenamento local',()=>{
 const char=warrior(),raw='{histórico ilegível',values=new Map([[SHEET_KEY,JSON.stringify({schemaVersion:1,characters:[char]})],['dnd_history_v1',raw],['dnd_character_history_v2:'+char.id,raw]]);
 const port={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)},removeItem:(key:string)=>{values.delete(key)}};
 const docs=readDocuments(port,[],false);assert.equal(Object.values(docs).filter(d=>d.kind==='character').length,1);assert.ok(Object.values(docs).every(isCloudDocument));assert.equal(values.get('dnd_history_v1'),raw);assert.equal(values.get('dnd_character_history_v2:'+char.id),raw);
 assert.equal(isCloudDocument({kind:'note',id:char.id}),true);assert.equal(isCloudDocument({kind:'recovery',id:'critcall_recovery_v1'}),false);
});

test('manual: primeiro acesso baixa ficha/notas e ignora conteúdos antigos de histórico e recuperação',async()=>{
 const owner='11111111-1111-4111-8111-111111111111',char=warrior(),rows=[row('character',char.id,char),row('note',char.id,'Nota privada'),row('preference','dnd_history_v1','x'.repeat(2000000)),row('preference','dnd_character_history_v2:'+char.id,'y'.repeat(2000000)),row('recovery','critcall_recovery_v1','z'.repeat(2000000))];
 const reads:{select:string;keys:string[]}[]=[];
 const client=createClient('https://critcall-manual-test.supabase.co','sb_publishable_test',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async input=>{
  const url=new URL(String(input));assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);const select=url.searchParams.get('select')!,filter=url.searchParams.get('document_key'),keys=filter?filter.slice(4,-1).split(',').map(s=>s.replace(/^"|"$/g,'')):[];reads.push({select,keys});
  const found=filter?rows.filter(d=>keys.includes(d.key)):rows.map(({key,kind,id,revision})=>({key,kind,id,revision}));return new Response(JSON.stringify(found),{headers:{'content-type':'application/json','content-range':`0-${found.length-1}/${found.length}`}});
 }}});
 const received=await new SupabaseDocuments(client,owner).pull();assert.deepEqual(received.map(d=>d.kind),['character','note']);assert.equal(reads.length,2);assert.ok(reads[1].keys.every(key=>key.startsWith('character:')||key.startsWith('note:')));assert.equal(cloudDocuments(Object.fromEntries(rows.map(d=>[d.key,d])))[rows[2].key],undefined);
});
