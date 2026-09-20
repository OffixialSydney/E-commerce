-- =========================================================
-- SID BESPOKE — STORAGE BUCKETS
-- Run after schema.sql and rls_policies.sql (needs is_admin()).
--
-- Buckets:
--   product-images   -> public read, admin write
--   payment-proofs   -> private, admin-only read, service-role write
-- =========================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- product-images: anyone can view, only admins can upload/modify/delete
-- ---------------------------------------------------------

create policy "public can view product images bucket"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

create policy "admins can update product images bucket"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());

create policy "admins can delete product images bucket"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ---------------------------------------------------------
-- payment-proofs: private. Only admins can read via the dashboard.
-- Uploads happen from a server action using the SERVICE ROLE key
-- (which bypasses these policies entirely), so no public insert
-- policy is needed or granted here.
-- ---------------------------------------------------------

create policy "admins can view payment proofs bucket"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and is_admin());

create policy "admins can delete payment proofs bucket"
  on storage.objects for delete
  using (bucket_id = 'payment-proofs' and is_admin());
