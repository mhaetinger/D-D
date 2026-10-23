-- CritCall: redução autorizada pelo responsável em 23/10/2026, após o alerta
-- de egress. Só poda versões recuperáveis; documentos atuais/notas/imagens
-- não são apagados. Recibos pequenos preservam a idempotência por 30 dias.
begin;
create or replace function critcall_private.prune_versions(p_owner uuid)
returns void language plpgsql security invoker set search_path='' as $$
begin
  -- Chamador autorizado e lock da conta são responsabilidade da RPC. Esta
  -- função privada não tem grant ao cliente nem acesso via Data API.
  delete from public.critcall_versions where owner_id=p_owner and
    (received_at < clock_timestamp()-interval '7 days' or (not conflict and
     (kind='recovery' or (kind='preference' and (document_id='dnd_history_v1' or document_id like 'dnd_character_history_v2:%')))));
  with ranked as (
    select version_id,row_number() over(partition by document_key order by received_at desc,version_id desc) as per_doc,
      row_number() over(order by received_at desc,version_id desc) as per_account,
      sum(octet_length(value::text)) over(order by received_at desc,version_id desc rows unbounded preceding) as bytes
    from public.critcall_versions where owner_id=p_owner
  ) delete from public.critcall_versions v using ranked r
    where v.owner_id=p_owner and v.version_id=r.version_id and (r.per_doc>5 or r.per_account>50 or r.bytes>2097152);
  with ranked as (
    select operation_id,row_number() over(order by received_at desc,operation_id desc) as position
    from critcall_private.sync_receipts where owner_id=p_owner
  ) delete from critcall_private.sync_receipts r using ranked n
    where r.owner_id=p_owner and r.operation_id=n.operation_id and
      (n.position>2000 or r.received_at<clock_timestamp()-interval '30 days');
end;
$$;
revoke all on function critcall_private.prune_versions(uuid) from public,anon,authenticated;

create or replace function public.critcall_save_document(
  p_owner_id uuid, p_key text, p_kind text, p_id text, p_value jsonb,
  p_base_revision bigint, p_operation_id uuid, p_edited_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := auth.uid();
  v_current public.critcall_documents%rowtype;
  v_previous critcall_private.sync_receipts%rowtype;
  v_hash bytea;
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
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('critcall-retention:' || v_owner::text, 0));
  v_hash := pg_catalog.sha256(pg_catalog.convert_to(jsonb_build_array(p_key,p_kind,p_id,v_value)::text,'UTF8'));
  select * into v_previous from critcall_private.sync_receipts where owner_id = v_owner and operation_id = p_operation_id;
  -- Uma chamada iniciada por cliente antigo durante a migração pode terminar
  -- depois do backfill. Recupera seu recibo pelo snapshot ainda disponível.
  if v_previous.operation_id is null then
    insert into critcall_private.sync_receipts(owner_id,operation_id,document_key,payload_hash,conflict,received_at)
      select owner_id,operation_id,document_key,
        pg_catalog.sha256(pg_catalog.convert_to(jsonb_build_array(document_key,kind,document_id,value)::text,'UTF8')),conflict,received_at
      from public.critcall_versions where owner_id=v_owner and operation_id=p_operation_id
      on conflict(owner_id,operation_id) do nothing;
    select * into v_previous from critcall_private.sync_receipts where owner_id=v_owner and operation_id=p_operation_id;
  end if;
  select * into v_current from public.critcall_documents where owner_id = v_owner and document_key = p_key;
  if v_current.owner_id is not null and (v_current.kind <> p_kind or v_current.document_id <> p_id) then
    raise exception 'Identificador incompatível' using errcode = '22023';
  end if;
  if v_current.operation_id = p_operation_id then
    if v_current.value <> v_value then raise exception 'Operação reutilizada com outro conteúdo' using errcode = '22023'; end if;
    v_conflict := coalesce(v_previous.conflict,false);
  elsif v_previous.operation_id is not null then
    if v_previous.document_key <> p_key or v_previous.payload_hash <> v_hash then
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
    insert into critcall_private.sync_receipts(owner_id,operation_id,document_key,payload_hash,conflict)
      values(v_owner,p_operation_id,p_key,v_hash,v_conflict);
    -- Não versionar o histórico inteiro a cada passo evita crescimento quadrático.
    -- O documento atual e a fila continuam guardando esse histórico normalmente.
    if v_conflict and not v_accept and octet_length(v_value::text)>2097152 then
      raise exception 'Edição simultânea maior que o histórico disponível. A fila local foi preservada para revisão.' using errcode='22023';
    end if;
    -- Um conflito de histórico precisa conservar a candidata vencida. Quando
    -- a candidata nova vence, o estado anterior também recebe uma versão.
    if v_conflict and v_accept and v_current.owner_id is not null and
      (p_kind='recovery' or (p_kind='preference' and (p_id='dnd_history_v1' or p_id like 'dnd_character_history_v2:%'))) then
      if octet_length(v_current.value::text)>2097152 then
        raise exception 'Histórico anterior maior que o limite de conflito. Preserve uma cópia antes de resolver.' using errcode='22023';
      end if;
      insert into public.critcall_versions(owner_id,document_key,kind,document_id,value,base_revision,revision,edited_at,operation_id,conflict)
        values(v_owner,p_key,p_kind,p_id,v_current.value,greatest(v_current.revision-1,0),v_current.revision,v_current.edited_at,v_current.operation_id,true)
        on conflict(owner_id,operation_id) do nothing;
    end if;
    if v_conflict or (p_kind <> 'recovery' and not (p_kind='preference' and
      (p_id='dnd_history_v1' or p_id like 'dnd_character_history_v2:%'))) then
      insert into public.critcall_versions(owner_id,document_key,kind,document_id,value,base_revision,revision,edited_at,operation_id,conflict)
        values(v_owner,p_key,p_kind,p_id,v_value,p_base_revision,case when v_accept then v_revision else null end,p_edited_at,p_operation_id,v_conflict);
    end if;
    if v_accept then
      insert into public.critcall_documents(owner_id,document_key,kind,document_id,value,revision,edited_at,operation_id)
        values(v_owner,p_key,p_kind,p_id,v_value,v_revision,v_date,p_operation_id)
        on conflict(owner_id,document_key) do update set value=excluded.value,revision=excluded.revision,
          edited_at=excluded.edited_at,updated_at=clock_timestamp(),operation_id=excluded.operation_id;
      select * into v_current from public.critcall_documents where owner_id=v_owner and document_key=p_key;
    end if;
  end if;
  perform critcall_private.prune_versions(v_owner);
  return jsonb_build_object('document',jsonb_build_object('key',v_current.document_key,'kind',v_current.kind,'id',v_current.document_id,
    'value',v_current.value,'revision',v_current.revision,'edited_at',v_current.edited_at,'updated_at',v_current.updated_at,'operation_id',v_current.operation_id),
    'conflict',v_conflict,'server_time',clock_timestamp());
end;
$$;
revoke all on function public.critcall_save_document(uuid,text,text,text,jsonb,bigint,uuid,timestamptz) from public, anon, authenticated;
grant execute on function public.critcall_save_document(uuid,text,text,text,jsonb,bigint,uuid,timestamptz) to authenticated;

create or replace function public.critcall_version_policy(p_owner_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or auth.uid() is distinct from p_owner_id then
    raise exception 'Conta não autorizada' using errcode='42501';
  end if;
  return jsonb_build_object('version',1,'per_document',5,'days',7,'per_account',50,'bytes',2097152);
end;
$$;
revoke all on function public.critcall_version_policy(uuid) from public,anon,authenticated;
grant execute on function public.critcall_version_policy(uuid) to authenticated;
-- Aplica os limites também às contas inativas, sem consultar conteúdos.
-- O mesmo lock da gravação evita disputar a retenção de uma conta em edição.
do $$ declare account_id uuid; begin
  for account_id in select distinct owner_id from public.critcall_versions loop
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('critcall-retention:' || account_id::text,0));
    perform critcall_private.prune_versions(account_id);
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
