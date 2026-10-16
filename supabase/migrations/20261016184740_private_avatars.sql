-- Imagens ficam no Storage privado, não nos documentos/versões da ficha.
-- O serviço de Storage aplica limite de bytes e MIME antes de aceitar o arquivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('critcall-avatars', 'critcall-avatars', false, 32768, array['image/webp'])
on conflict (id) do update set public = false, file_size_limit = 32768, allowed_mime_types = array['image/webp'];

-- Um prefixo por dono e um UUID de imagem, sem caminhos ou nomes do arquivo original.
-- SELECT/INSERT/UPDATE são necessários ao upsert; DELETE fica restrito ao mesmo dono.
drop policy if exists critcall_avatar_read on storage.objects;
create policy critcall_avatar_read on storage.objects for select to authenticated
using (bucket_id = 'critcall-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists critcall_avatar_insert on storage.objects;
create policy critcall_avatar_insert on storage.objects for insert to authenticated
with check (bucket_id = 'critcall-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.]webp$');
drop policy if exists critcall_avatar_update on storage.objects;
create policy critcall_avatar_update on storage.objects for update to authenticated
using (bucket_id = 'critcall-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'critcall-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.]webp$');
drop policy if exists critcall_avatar_delete on storage.objects;
create policy critcall_avatar_delete on storage.objects for delete to authenticated
using (bucket_id = 'critcall-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
