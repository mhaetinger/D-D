import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {IDBFactory} from 'fake-indexeddb';
import {SupabaseDocuments} from '../src/sync/supabase-port';
import {SyncEngine} from '../src/sync/engine';
import {BrowserJournal,type RemoteDocument} from '../src/sync/journal';
import {documentKey,type Documents} from '../src/sync/documents';

const owner='11111111-1111-4111-8111-111111111111';
const doc=(id:string,value:string|null,revision=1):RemoteDocument=>({key:documentKey('note',id),kind:'note',id,value,revision,operation_id:crypto.randomUUID(),edited_at:'2026-10-23T10:00:00Z',updated_at:'2026-10-23T10:00:00Z'});
function server(rows:RemoteDocument[],pageSize=500) {
 const requests:{select:string;keys:string[]|null;bytes:number}[]=[];
 let failValues=false,invalidManifest=false,beforeValues=()=>{};
 const client=createClient('https://critcall-egress-test.supabase.co','sb_publishable_test',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async input=>{
  const url=new URL(String(input));if(url.pathname.endsWith('/rpc/critcall_sync_clock'))return new Response(JSON.stringify(new Date().toISOString()),{status:200,headers:{'content-type':'application/json'}});assert.equal(url.searchParams.get('owner_id'),'eq.'+owner);assert.equal(url.pathname,'/rest/v1/critcall_documents');
  const select=url.searchParams.get('select')!,manifest=select==='key:document_key,kind,id:document_id,revision';
  const filter=url.searchParams.get('document_key'),keys=filter?filter.slice(4,-1).split(',').map(s=>s.replace(/^"|"$/g,'')):null;
  if(!manifest)beforeValues();
  if(!manifest && failValues)return new Response(JSON.stringify({message:'Falha simulada'}),{status:503,headers:{'content-type':'application/json'}});
  const all=rows.filter(d=>!keys||keys.includes(d.key)).sort((a,b)=>a.key<b.key?-1:1),offset=Number(url.searchParams.get('offset')||0),limit=Math.min(pageSize,Number(url.searchParams.get('limit')||500));
  const selected=all.slice(offset,offset+limit).map(d=>manifest?{key:d.key,kind:d.kind,id:d.id,revision:invalidManifest?null:d.revision}:d),body=JSON.stringify(selected);
  requests.push({select,keys,bytes:new TextEncoder().encode(body).byteLength});
  return new Response(body,{status:200,headers:{'content-type':'application/json','content-range':all.length?`${offset}-${offset+selected.length-1}/${all.length}`:'*/0'}});
 }}});
 return {port:new SupabaseDocuments(client,owner),requests,set fail(value:boolean){failValues=value;},set malformed(value:boolean){invalidManifest=value;},onValues(fn:()=>void){beforeValues=fn;}};
}
const revisions=(rows:RemoteDocument[])=>Object.fromEntries(rows.map(d=>[d.key,d.revision]));

test('egress: cem consultas sem edição não baixam novamente um histórico de 2 MiB',async t=>{
 const rows=[doc('historico','x'.repeat(2*1024*1024)),doc('ficha','Texto pequeno')],s=server(rows);
 const first=await s.port.pull(),firstBytes=s.requests.reduce((n,r)=>n+r.bytes,0),known=revisions(first);s.requests.length=0;
 for(let i=0;i<100;i++)assert.deepEqual(await s.port.pull(known),[]);
 assert.ok(s.requests.every(r=>r.select==='key:document_key,kind,id:document_id,revision'&&!r.keys));
 const lightBytes=s.requests.reduce((n,r)=>n+r.bytes,0);assert.ok(lightBytes<firstBytes/50);assert.equal(typeof rows[0].value,'string');assert.equal((rows[0].value as string).length,2*1024*1024);
 t.diagnostic(`100 ciclos sem mudança: ${lightBytes} bytes de JSON; leitura completa repetida: ${firstBytes*100} bytes. Valores e diário preservados.`);
});
test('egress: baixa só documento novo/alterado e tombstone, mantendo histórico conhecido',async()=>{
 const rows=[doc('historico','Grande preservado'),doc('muda','Antigo'),doc('apaga','Preservar antes de excluir')],known=revisions(rows),s=server(rows);
 rows[1]={...rows[1],value:'Novo',revision:2};rows[2]={...rows[2],value:null,revision:2};rows.push(doc('novo','Adicionado'));
 const received=await s.port.pull(known);assert.deepEqual(received.map(d=>d.id),['apaga','muda','novo']);assert.equal(received[0].value,null);assert.ok(s.requests.filter(r=>r.keys).every(r=>!r.keys!.includes('note:historico')));assert.equal(known['note:muda'],1);
});
test('egress: índice e valores respeitam paginação reduzida e lotes de até 25 chaves',async()=>{
 const rows=Array.from({length:61},(_,i)=>doc(String(i).padStart(3,'0'),'Texto')),s=server(rows,7);
 const received=await s.port.pull({});assert.equal(received.length,61);assert.equal(new Set(received.map(d=>d.key)).size,61);assert.ok(s.requests.filter(r=>r.keys).every(r=>r.keys!.length<=25));assert.ok(s.requests.filter(r=>!r.keys).length>1);
});
test('egress: gravação entre índice e conteúdo retorna a revisão mais nova; falha não avança cache',async()=>{
 const rows=[doc('muda','Anterior',2)],s=server(rows),known={'note:muda':1};
 s.onValues(()=>{rows[0]={...rows[0],value:'Posterior',revision:3};});assert.equal((await s.port.pull(known))[0].revision,3);assert.equal(known['note:muda'],1);
 s.fail=true;await assert.rejects(s.port.pull(known));assert.equal(known['note:muda'],1);s.fail=false;s.malformed=true;await assert.rejects(s.port.pull(known),/inválidas/);assert.equal(known['note:muda'],1);
});
test('egress: diário persistido fornece revisões após recarga e aplica só a alteração recebida',async()=>{
 const rows=[doc('preservada','Texto preservado'),doc('atual','Original')],s=server(rows),journal=new BrowserJournal(new IDBFactory()),scope='egress-conta';let visible:Documents={};
 const view={read:()=>structuredClone(visible),apply:(docs:Documents)=>{visible=structuredClone(Object.fromEntries(Object.entries(docs).filter(([,d])=>d.value!==null)));},canApply:()=>true};
 const a=new SyncEngine(scope,journal,s.port,view);await a.capture(true);await a.run();assert.equal(visible['note:atual'].value,'Original');
 s.requests.length=0;const b=new SyncEngine(scope,journal,s.port,view);await b.capture(true);await b.run();assert.ok(s.requests.every(r=>r.select==='key:document_key,kind,id:document_id,revision'));
 rows[1]={...rows[1],value:'Alteração do outro dispositivo',revision:2};await b.run();assert.equal(visible['note:atual'].value,'Alteração do outro dispositivo');assert.equal(visible['note:preservada'].value,'Texto preservado');
 rows[1]={...rows[1],value:null,revision:3};await b.run();assert.equal(visible['note:atual'],undefined);assert.equal(visible['note:preservada'].value,'Texto preservado');
});
