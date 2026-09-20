-- =========================================================
-- SID BESPOKE — ROW LEVEL SECURITY POLICIES
-- Run after schema.sql
--
-- Model:
--   - "anon"/"authenticated" (public) = customer-facing traffic,
--     always going through the browser with the anon key.
--   - Admin dashboard signs in via Supabase Auth, so admin checks
--     are done with `exists (select 1 from admin_profiles where id = auth.uid())`.
--   - All writes that must be trusted (orders, payments, stock changes)
--     are performed by server-side code using the SERVICE ROLE key,
--     which bypasses RLS entirely. Public RLS below only needs to allow
--     the read-only / limited-write access customers genuinely need
--     directly from the browser (mostly just SELECT on catalogue data).
--   - Because checkout is guest-based, order creation is NOT done via
--     a public RLS insert — it always goes through a server action /
--     API route using the service role key. This avoids needing complex
--     policies to prevent customers from tampering with prices/stock.
-- =========================================================

alter table admin_profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table payment_proofs enable row level security;
alter table messages enable row level security;
alter table store_settings enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid()
  );
$$ language sql stable security definer;

-- ---------------------------------------------------------
-- ADMIN PROFILES
-- ---------------------------------------------------------

create policy "admins can view own profile"
  on admin_profiles for select
  using (id = auth.uid());

create policy "admins can view all admin profiles"
  on admin_profiles for select
  using (is_admin());

create policy "no public writes to admin_profiles"
  on admin_profiles for all
  using (false)
  with check (false);

-- (Admin creation/promotion is done manually via SQL or a service-role
-- server action — never exposed as a public insert.)

-- ---------------------------------------------------------
-- CATEGORIES — public read (active only), admin full access
-- ---------------------------------------------------------

create policy "public can view active categories"
  on categories for select
  using (is_active = true or is_admin());

create policy "admins manage categories"
  on categories for insert with check (is_admin());
create policy "admins update categories"
  on categories for update using (is_admin());
create policy "admins delete categories"
  on categories for delete using (is_admin());

-- ---------------------------------------------------------
-- PRODUCTS — public read (active only), admin full access
-- ---------------------------------------------------------

create policy "public can view active products"
  on products for select
  using (is_active = true or is_admin());

create policy "admins manage products"
  on products for insert with check (is_admin());
create policy "admins update products"
  on products for update using (is_admin());
create policy "admins delete products"
  on products for delete using (is_admin());

-- ---------------------------------------------------------
-- PRODUCT IMAGES — public read, admin write
-- ---------------------------------------------------------

create policy "public can view product images"
  on product_images for select
  using (true);

create policy "admins manage product images"
  on product_images for insert with check (is_admin());
create policy "admins update product images"
  on product_images for update using (is_admin());
create policy "admins delete product images"
  on product_images for delete using (is_admin());

-- ---------------------------------------------------------
-- CUSTOMERS — no direct public access at all.
-- All customer record creation/lookup happens server-side
-- (service role) during checkout and order-status lookup.
-- ---------------------------------------------------------

create policy "admins can view customers"
  on customers for select using (is_admin());
create policy "admins can update customers"
  on customers for update using (is_admin());
create policy "no public access to customers"
  on customers for insert with check (is_admin());
create policy "no public delete of customers"
  on customers for delete using (is_admin());

-- ---------------------------------------------------------
-- ORDERS — no direct public access. Order status lookups by
-- guests go through a server action that validates order_number +
-- phone (or access_code) before returning data — never raw table
-- access from the browser.
-- ---------------------------------------------------------

create policy "admins can view all orders"
  on orders for select using (is_admin());
create policy "admins can update orders"
  on orders for update using (is_admin());
create policy "no public insert of orders"
  on orders for insert with check (is_admin());
create policy "no public delete of orders"
  on orders for delete using (is_admin());

-- ---------------------------------------------------------
-- ORDER ITEMS — admin only direct access (same reasoning as orders)
-- ---------------------------------------------------------

create policy "admins can view order items"
  on order_items for select using (is_admin());
create policy "no public insert of order items"
  on order_items for insert with check (is_admin());
create policy "no public update of order items"
  on order_items for update using (is_admin());
create policy "no public delete of order items"
  on order_items for delete using (is_admin());

-- ---------------------------------------------------------
-- PAYMENTS — admin only direct access. Payment verification is
-- always performed server-side against the provider API.
-- ---------------------------------------------------------

create policy "admins can view payments"
  on payments for select using (is_admin());
create policy "no public insert of payments"
  on payments for insert with check (is_admin());
create policy "no public update of payments"
  on payments for update using (is_admin());
create policy "no public delete of payments"
  on payments for delete using (is_admin());

-- ---------------------------------------------------------
-- PAYMENT PROOFS — admin only. Screenshot upload happens via a
-- server action that writes to Storage + this table using the
-- service role key, after validating the order belongs to the
-- customer making the request.
-- ---------------------------------------------------------

create policy "admins can view payment proofs"
  on payment_proofs for select using (is_admin());
create policy "admins can update payment proofs"
  on payment_proofs for update using (is_admin());
create policy "no public insert of payment proofs"
  on payment_proofs for insert with check (is_admin());
create policy "no public delete of payment proofs"
  on payment_proofs for delete using (is_admin());

-- ---------------------------------------------------------
-- MESSAGES — public can insert (submit an enquiry), admin can
-- read/update. No public select, so customers can't browse others'
-- messages.
-- ---------------------------------------------------------

create policy "public can submit a message"
  on messages for insert
  with check (true);

create policy "admins can view messages"
  on messages for select using (is_admin());
create policy "admins can update messages"
  on messages for update using (is_admin());
create policy "admins can delete messages"
  on messages for delete using (is_admin());

-- ---------------------------------------------------------
-- STORE SETTINGS — public read (needed for WhatsApp number,
-- delivery fee, bank details display), admin write only.
-- ---------------------------------------------------------

create policy "public can view store settings"
  on store_settings for select using (true);

create policy "admins can update store settings"
  on store_settings for update using (is_admin());
create policy "no public insert of store settings"
  on store_settings for insert with check (is_admin());
create policy "no public delete of store settings"
  on store_settings for delete using (is_admin());
