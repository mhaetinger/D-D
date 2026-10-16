// PostgreSQL real e descartável: nenhum endereço/usuário do Supabase é utilizado.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync, spawn } = require('node:child_process');
const container = `critcall-sync-test-${randomUUID()}`;
const image = process.env.CRITCALL_TEST_POSTGRES_IMAGE || 'postgres:16-alpine';
const a = '11111111-1111-4111-8111-111111111111', b = '22222222-2222-4222-8222-222222222222';
const run = (args, input) => spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 1024 * 1024 });
function sql(text, ok = true) {
  const result = run(['exec','-i',container,'psql','-h','127.0.0.1','-U','postgres','-At','-v','ON_ERROR_STOP=1'], text);
  if (ok) assert.equal(result.status, 0, result.stderr);
  else assert.notEqual(result.status, 0, 'operação proibida deveria falhar');
  return result.stdout.trim().split('\n').at(-1);
}
const as = (owner, query) => `set role authenticated; set request.jwt.claim.sub = '${owner}'; ${query}`;
function save(owner, key, value, base, date, op = randomUUID(), kind = 'preference', id = 'dnd_public_player_name') {
  return `select public.critcall_save_document('${owner}', '${key}', '${kind}', '${id}', '${JSON.stringify(value).replaceAll("'","''")}'::jsonb, ${base}, '${op}', '${date}');`;
}
const past = (seconds) => new Date(Date.now() - seconds * 1000).toISOString();
async function concurrent(text) {
  return new Promise((resolve,reject) => {
    const child = spawn('docker',['exec','-i',container,'psql','-h','127.0.0.1','-U','postgres','-At','-v','ON_ERROR_STOP=1']);
    let out='', err=''; child.stdout.on('data',part=>{out+=part;}); child.stderr.on('data',part=>{err+=part;});
    child.on('error',reject); child.on('exit',code=>code === 0 ? resolve(out) : reject(new Error(err)));
    child.stdin.end(text);
  });
}
(async () => {
  try {
    const started = run(['run','--rm','--detach','--network','none','--name',container,'-e','POSTGRES_HOST_AUTH_METHOD=trust',image]);
    assert.equal(started.status,0,started.stderr);
    let ready = false;
    for (let n=0; n<80; n++) {
      if (run(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres']).status === 0) { ready=true; break; }
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    assert.equal(ready,true,'PostgreSQL não iniciou');
    sql(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key);
      insert into auth.users values ('${a}'),('${b}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon;`);
    const migration = fs.readFileSync(path.join(__dirname,'../supabase/migrations/202610160001_personal_sync.sql'),'utf8');
    sql(migration);
    sql(`set role anon; select public.critcall_sync_clock('${a}');`,false);
    sql(as(a,`select public.critcall_sync_clock('${b}');`),false);
    assert.ok(Number.isFinite(Date.parse(sql(as(a,`select public.critcall_sync_clock('${a}');`)))));
    sql('set role anon; select * from public.critcall_documents;', false);
    sql('set role anon; select * from public.critcall_versions;', false);
    sql(`set role anon; ${save(a,'preference:dnd_public_player_name','Proibido',0,past(20))}`, false);
    sql(as(a,save(b,'preference:dnd_public_player_name','Invadir B',0,past(20))), false);
    const operation = randomUUID();
    const first = JSON.parse(sql(as(a,save(a,'preference:dnd_public_player_name','Pessoa A',0,past(60),operation))));
    assert.equal(first.document.revision,1); assert.equal(first.conflict,false);
    sql(as(a,save(a,'preference:dnd_public_player_name','Pessoa A',0,past(60),operation)));
    assert.equal(sql(as(a,'select count(*) from public.critcall_versions;')),'1','repetição de resposta não duplica versão');
    sql(as(a,save(a,'preference:dnd_public_player_name','Alterar operação',0,past(60),operation)),false);
    assert.equal(sql(as(b,'select count(*) from public.critcall_documents;')),'0');
    assert.equal(sql(as(b,'select count(*) from public.critcall_versions;')),'0');
    sql(as(a,"update public.critcall_documents set value='\"Inválido\"';"),false);
    sql(as(a,'delete from public.critcall_versions;'),false);
    const newer = JSON.parse(sql(as(a,save(a,'preference:dnd_public_player_name','Mais recente offline',0,past(10)))));
    assert.equal(newer.conflict,true); assert.equal(newer.document.value,'Mais recente offline');
    const older = JSON.parse(sql(as(a,save(a,'preference:dnd_public_player_name','Cópia antiga',0,past(100)))));
    assert.equal(older.document.value,'Mais recente offline');
    assert.equal(sql(as(a,'select count(*) from public.critcall_versions;')),'3','inclusive versão perdedora é preservada');
    const deleted = JSON.parse(sql(as(a,save(a,'preference:dnd_public_player_name',null,2,past(5)))));
    assert.equal(deleted.document.value,null);
    const stale = JSON.parse(sql(as(a,save(a,'preference:dnd_public_player_name','Não ressuscitar',1,past(20)))));
    assert.equal(stale.document.value,null);
    sql(as(a,save(a,'note:char1','Nota privada',0,past(5),randomUUID(),'note','char1')));
    assert.equal(sql(as(b,"select count(*) from public.critcall_documents where kind='note';")),'0');
    sql(as(a,save(a,'character:char1',{id:'char1',privateNotes:'Não embutir'},0,past(5),randomUUID(),'character','char1')),false);
    sql(as(a,save(a,'preference:futuro','Relógio errado',0,new Date(Date.now()+86400000).toISOString())),false);
    await Promise.all([100,80,60].map((age,n)=>concurrent(as(a,save(a,'note:concorrente',`Concorrente ${n}`,0,past(age),randomUUID(),'note','concorrente')))));
    assert.equal(sql(as(a,"select value #>> '{}' from public.critcall_documents where document_key='note:concorrente';")),'Concorrente 2');
    assert.equal(sql(as(a,"select count(*) from public.critcall_versions where document_key='note:concorrente';")),'3');
    sql(migration);
    assert.equal(sql(as(a,"select count(*) from public.critcall_versions where document_key='note:concorrente';")),'3','reaplicar migração preserva dados');
    console.log('PASS PostgreSQL 16 real: RPC transacional/idempotente, datas, concorrência, tombstones, histórico de conflitos, notas separadas, RLS de duas contas e recusa de anon/escrita direta; migração reaplicável.');
  } finally { run(['rm','--force',container]); }
})().catch(error=>{console.error(error);process.exitCode=1;});
