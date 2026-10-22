insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','image/avif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');

drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images');
