-- Aplicar somente no projeto exclusivo CritCall. Não contém usuários ou segredos.
begin;
create table if not exists public.critcall_documents (
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_key text not null check (length(document_key) between 1 and 1200),
  kind text not null check (kind in ('character','note','preference','recovery')),
  document_id text not null check (length(document_id) between 1 and 300),
  value jsonb not null,
  revision bigint not null check (revision > 0),
  edited_at timestamptz not null,
  updated_at timestamptz not null default clock_timestamp(),
  operation_id uuid not null,
  primary key (owner_id, document_key)
);
-- Notas têm documentos próprios; não entram no JSON da ficha ou de seus snapshots.
create table if not exists public.critcall_versions (
  version_id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_key text not null,
  kind text not null,
  document_id text not null,
  value jsonb not null,
  base_revision bigint not null,
  revision bigint,
  edited_at timestamptz not null,
  received_at timestamptz not null default clock_timestamp(),
  operation_id uuid not null,
  conflict boolean not null,
  unique (owner_id, operation_id)
);
create index if not exists critcall_versions_lookup on public.critcall_versions(owner_id, document_key, received_at desc);
alter table public.critcall_documents enable row level security;
alter table public.critcall_versions enable row level security;
revoke all on public.critcall_documents, public.critcall_versions from public, anon, authenticated;
grant select on public.critcall_documents, public.critcall_versions to authenticated;
drop policy if exists critcall_documents_owner on public.critcall_documents;
create policy critcall_documents_owner on public.critcall_documents for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists critcall_versions_owner on public.critcall_versions;
create policy critcall_versions_owner on public.critcall_versions for select to authenticated using ((select auth.uid()) = owner_id);

-- A escrita passa exclusivamente por esta transação: autoria vem de auth.uid(),
-- nunca do JSON. O parâmetro de dono também impede enviar uma fila da conta
-- anterior com um token que o SDK acabou de trocar em outra aba.
-- Definer é necessário pois os clientes não podem alterar documentos/versões
-- diretamente. Caminho vazio, nomes qualificados e grants restritos são obrigatórios.
create or replace function public.critcall_save_document(
  p_owner_id uuid, p_key text, p_kind text, p_id text, p_value jsonb,
  p_base_revision bigint, p_operation_id uuid, p_edited_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_current public.critcall_documents%rowtype;
  v_previous public.critcall_versions%rowtype;
  v_conflict boolean;
  v_accept boolean;
  v_revision bigint;
  v_date timestamptz;
  v_value jsonb := coalesce(p_value, 'null'::jsonb);
begin
  if v_owner is null or p_owner_id is distinct from v_owner then
    raise exception 'Conta não autorizada' using errcode = '42501';
  end if;
  if p_kind is null or p_kind not in ('character','note','preference','recovery')
    or p_key is null or left(p_key,length(p_kind)+1) <> p_kind || ':' or length(p_key) > 1200
    or p_id is null or length(p_id) not between 1 and 300
    or p_base_revision is null or p_base_revision < 0 or p_operation_id is null
    or p_edited_at is null or not isfinite(p_edited_at)
    or octet_length(v_value::text) > 20000000 then
    raise exception 'Documento inválido' using errcode = '22023';
  end if;
  if p_edited_at > clock_timestamp() + interval '5 minutes' then
    raise exception 'Confira a data do dispositivo' using errcode = '22008';
  end if;
  if v_value <> 'null'::jsonb then
    if p_kind = 'character' and (jsonb_typeof(v_value) <> 'object' or v_value->>'id' is distinct from p_id or v_value ? 'privateNotes' or v_value ? 'playerNotes') then
      raise exception 'Ficha inválida ou com notas embutidas' using errcode = '22023';
    elsif p_kind in ('note','preference','recovery') and jsonb_typeof(v_value) <> 'string' then
      raise exception 'Texto inválido' using errcode = '22023';
    end if;
  end if;
  -- O lock inclui o dono; duas contas não disputam nem consultam a mesma linha.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_owner::text || ':' || p_key, 0));
  select * into v_previous from public.critcall_versions where owner_id = v_owner and operation_id = p_operation_id;
  select * into v_current from public.critcall_documents where owner_id = v_owner and document_key = p_key;
  if v_current.owner_id is not null and (v_current.kind <> p_kind or v_current.document_id <> p_id) then
    raise exception 'Identificador incompatível' using errcode = '22023';
  end if;
  if v_previous.version_id is not null then
    if v_previous.document_key <> p_key or v_previous.value <> v_value or v_previous.kind <> p_kind or v_previous.document_id <> p_id then
      raise exception 'Operação reutilizada com outro conteúdo' using errcode = '22023';
    end if;
    v_conflict := v_previous.conflict;
  else
    v_conflict := coalesce(v_current.revision,0) <> p_base_revision;
    v_accept := not v_conflict or v_current.owner_id is null or p_edited_at > v_current.edited_at
      or (p_edited_at = v_current.edited_at and p_operation_id > v_current.operation_id);
    v_revision := coalesce(v_current.revision,0) + 1;
    -- Atualizações causais nunca fazem a data da ficha andar para trás.
    v_date := case when not v_conflict and v_current.owner_id is not null
      then greatest(p_edited_at, v_current.edited_at + interval '1 microsecond') else p_edited_at end;
    insert into public.critcall_versions(owner_id,document_key,kind,document_id,value,base_revision,revision,edited_at,operation_id,conflict)
      values(v_owner,p_key,p_kind,p_id,v_value,p_base_revision,case when v_accept then v_revision else null end,p_edited_at,p_operation_id,v_conflict);
    if v_accept then
      insert into public.critcall_documents(owner_id,document_key,kind,document_id,value,revision,edited_at,operation_id)
        values(v_owner,p_key,p_kind,p_id,v_value,v_revision,v_date,p_operation_id)
        on conflict(owner_id,document_key) do update set value=excluded.value,revision=excluded.revision,
          edited_at=excluded.edited_at,updated_at=clock_timestamp(),operation_id=excluded.operation_id;
      select * into v_current from public.critcall_documents where owner_id=v_owner and document_key=p_key;
    end if;
  end if;
  return jsonb_build_object('document',jsonb_build_object('key',v_current.document_key,'kind',v_current.kind,'id',v_current.document_id,
    'value',v_current.value,'revision',v_current.revision,'edited_at',v_current.edited_at,'updated_at',v_current.updated_at,'operation_id',v_current.operation_id),
    'conflict',v_conflict,'server_time',clock_timestamp());
end;
$$;
revoke all on function public.critcall_save_document(uuid,text,text,text,jsonb,bigint,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.critcall_save_document(uuid,text,text,text,jsonb,bigint,uuid,timestamptz) to authenticated;
-- Calibra datas do cliente sem lhe conceder leitura/escrita em outra conta.
create or replace function public.critcall_sync_clock(p_owner_id uuid)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from p_owner_id then
    raise exception 'Conta não autorizada' using errcode = '42501';
  end if;
  return clock_timestamp();
end;
$$;
revoke all on function public.critcall_sync_clock(uuid) from public,anon,authenticated;
grant execute on function public.critcall_sync_clock(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
