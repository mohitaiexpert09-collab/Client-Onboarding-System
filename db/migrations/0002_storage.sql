-- Storage bucket for client file/asset/credential uploads.
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

-- Org members can manage files under their org's folder (path: <org_id>/...).
create policy "client-files member read" on storage.objects
  for select using (
    bucket_id = 'client-files'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
  );

create policy "client-files member write" on storage.objects
  for insert with check (
    bucket_id = 'client-files'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
  );

create policy "client-files member delete" on storage.objects
  for delete using (
    bucket_id = 'client-files'
    and public.is_org_member((split_part(name, '/', 1))::uuid)
  );
