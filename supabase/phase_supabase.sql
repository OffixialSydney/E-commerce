-- =========================================================================
-- SID BESPOKE — COMBINED SUPABASE SETUP SCRIPT (SAFE TO RE-RUN)
-- =========================================================================
-- This version starts by dropping anything this script previously created,
-- so you can run the WHOLE file again any time you hit an error while
-- setting up — no more "already exists" errors.
--
-- ⚠️ Only run this on a project with no real data yet. The reset section
-- below deletes the app's tables (products, orders, customers, etc.).
-- Don't run this against a live store that already has real orders.
--
-- HOW TO RUN THIS:
--   - Supabase project → SQL Editor → New Query
--   - Paste this ENTIRE file and click "Run"
--   - If it errors partway through, just click Run again from the top —
--     don't try to resume partway through, since the reset section at the
--     top needs to run first every time.
--
-- Sections:
--   0. RESET      — drops tables/types/functions/policies if they exist
--   1. SCHEMA     — tables, enums, indexes, triggers
--   2. RLS        — Row Level Security policies
--   3. FUNCTIONS  — order numbers, atomic stock reserve/restore
--   4. STORAGE    — buckets + their access policies
-- =========================================================================


-- =========================================================================
-- SECTION 0 OF 4: RESET
-- Drops everything this script creates, only if it already exists.
-- Safe to run on a brand new project too (everything just no-ops).
-- =========================================================================

-- Storage policies (storage.objects is a shared system table, so its
-- policies aren't dropped automatically when we drop our own tables)
drop policy if exists "public can view product images bucket" on storage.objects;
drop policy if exists "admins can upload product images" on storage.objects;
drop policy if exists "admins can update product images bucket" on storage.objects;
drop policy if exists "admins can delete product images bucket" on storage.objects;
drop policy if exists "admins can view payment proofs bucket" on storage.objects;
drop policy if exists "admins can delete payment proofs bucket" on storage.objects;

-- Tables (CASCADE also removes their own policies, triggers, and indexes)
drop table if exists payment_proofs cascade;
drop table if exists payments cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists customers cascade;
drop table if exists product_images cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists messages cascade;
drop table if exists store_settings cascade;
drop table if exists admin_profiles cascade;

-- Enum types (must come after the tables that use them are gone)
drop type if exists order_status cascade;
drop type if exists payment_method cascade;
drop type if exists payment_status cascade;

-- Functions (must come after policies/triggers that reference them are gone)
drop function if exists is_admin() cascade;
drop function if exists set_updated_at() cascade;
drop function if exists generate_order_number() cascade;
drop function if exists reserve_stock(jsonb) cascade;
drop function if exists restore_stock(jsonb) cascade;


-- =========================================================================
-- SECTION 1 OF 4: SCHEMA (tables, enums, indexes, triggers)
-- =========================================================================

-- =========================================================
-- SID BESPOKE — DATABASE SCHEMA
-- Run this in the Supabase SQL editor (or via CLI migration)
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------

create type order_status as enum (
  'pending',
  'payment_pending',
  'payment_verification',
  'payment_confirmed',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

create type payment_method as enum ('card', 'bank_transfer');

create type payment_status as enum (
  'pending',
  'awaiting_verification',
  'confirmed',
  'failed',
  'rejected'
);

-- ---------------------------------------------------------
-- ADMIN PROFILES
-- Linked 1:1 with a Supabase Auth user (auth.users)
-- ---------------------------------------------------------

create table admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'admin', -- e.g. 'admin', 'superadmin'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_slug on categories(slug);
create index idx_categories_active on categories(is_active);

-- ---------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null check (price >= 0),
  previous_price numeric(12,2) check (previous_price is null or previous_price >= 0),
  category_id uuid references categories(id) on delete set null,
  sku text unique,
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  low_stock_threshold int not null default 5,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  is_active boolean not null default true, -- enable/disable product
  view_count int not null default 0, -- used for "popularity" sort
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_products_slug on products(slug);
create index idx_products_category on products(category_id);
create index idx_products_active on products(is_active);
create index idx_products_featured on products(is_featured) where is_featured = true;
create index idx_products_new_arrival on products(is_new_arrival) where is_new_arrival = true;
create index idx_products_best_seller on products(is_best_seller) where is_best_seller = true;
create index idx_products_stock on products(stock_quantity);

-- Computed helper: is the product currently purchasable
-- (kept simple: stock_quantity > 0 and is_active = true; enforced in app logic + RLS-safe RPC below)

-- ---------------------------------------------------------
-- PRODUCT IMAGES
-- ---------------------------------------------------------

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null, -- path within the product-images bucket
  display_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_product_images_product on product_images(product_id);

-- ---------------------------------------------------------
-- CUSTOMERS
-- Guest customers — no auth account. Identified by phone number.
-- Rows are created/looked-up at checkout time.
-- ---------------------------------------------------------

create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  whatsapp_number text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_phone on customers(phone);

-- ---------------------------------------------------------
-- ORDERS
-- ---------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- e.g. SID-20260919-4821
  customer_id uuid not null references customers(id) on delete restrict,

  -- delivery info snapshot (kept even if customer record changes later)
  full_name text not null,
  phone text not null,
  whatsapp_number text,
  email text,
  delivery_address text not null,
  city text not null,
  state text not null,
  delivery_instructions text,

  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),

  payment_method payment_method not null,
  payment_status payment_status not null default 'pending',
  order_status order_status not null default 'pending',

  -- access token used so a guest can view their own order status
  -- without an account (paired with phone number lookup)
  access_code text not null default encode(gen_random_bytes(6), 'hex'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_order_number on orders(order_number);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_status on orders(order_status);
create index idx_orders_payment_status on orders(payment_status);
create index idx_orders_phone on orders(phone);
create index idx_orders_created_at on orders(created_at desc);

-- ---------------------------------------------------------
-- ORDER ITEMS
-- ---------------------------------------------------------

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,

  -- snapshot fields so historical orders stay accurate even if the
  -- product is later edited, deleted or repriced
  product_name text not null,
  product_slug text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),

  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);

-- ---------------------------------------------------------
-- PAYMENTS
-- One row per payment attempt/record tied to an order.
-- ---------------------------------------------------------

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount numeric(12,2) not null check (amount >= 0),
  reference text, -- payment provider reference (e.g. Paystack ref)
  provider text default 'paystack',
  paid_at timestamptz,
  raw_response jsonb, -- verification payload from provider, for audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_order on payments(order_id);
create index idx_payments_reference on payments(reference);
create index idx_payments_status on payments(status);

-- ---------------------------------------------------------
-- PAYMENT PROOFS (bank transfer screenshots)
-- ---------------------------------------------------------

create table payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  payment_id uuid references payments(id) on delete set null,
  storage_path text not null, -- path within the private payment-proofs bucket
  uploaded_at timestamptz not null default now(),
  reviewed boolean not null default false,
  reviewed_by uuid references admin_profiles(id),
  reviewed_at timestamptz,
  decision text check (decision in ('confirmed', 'rejected')) -- null until reviewed
);

create index idx_payment_proofs_order on payment_proofs(order_id);

-- ---------------------------------------------------------
-- MESSAGES (customer enquiries)
-- ---------------------------------------------------------

create table messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_messages_read on messages(is_read);
create index idx_messages_created_at on messages(created_at desc);

-- ---------------------------------------------------------
-- STORE SETTINGS
-- Single-row configuration table (enforced via check constraint).
-- ---------------------------------------------------------

create table store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Sid Bespoke',
  whatsapp_number text not null default '',
  bank_name text default '',
  account_name text default '',
  account_number text default '',
  delivery_fee numeric(12,2) not null default 0,
  delivery_timeframe text not null default 'Orders are usually delivered within 1–3 business days.',
  contact_email text default '',
  contact_phone text default '',
  updated_at timestamptz not null default now()
);

insert into store_settings (id) values (1);

-- ---------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_admin_profiles_updated_at before update on admin_profiles
  for each row execute function set_updated_at();
create trigger trg_categories_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();
create trigger trg_store_settings_updated_at before update on store_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------
-- Auto out-of-stock: whenever stock_quantity hits 0, we don't need a
-- separate boolean — the app treats stock_quantity <= 0 as out of stock.
-- Kept as a generated-style check for clarity/safety only.
-- ---------------------------------------------------------

alter table products add constraint chk_stock_non_negative check (stock_quantity >= 0);


-- =========================================================================
-- SECTION 2 OF 4: ROW LEVEL SECURITY POLICIES
-- =========================================================================

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


-- =========================================================================
-- SECTION 3 OF 4: DATABASE FUNCTIONS
-- =========================================================================

-- =========================================================
-- SID BESPOKE — DATABASE FUNCTIONS
-- Run after schema.sql and rls_policies.sql
--
-- These are called from server-side code using the service role
-- key (never directly from the browser).
-- =========================================================

-- ---------------------------------------------------------
-- Generate a human-friendly order number, e.g. SID-20260919-4821
-- Retries on the rare collision.
-- ---------------------------------------------------------

create or replace function generate_order_number()
returns text as $$
declare
  candidate text;
  exists_already boolean;
begin
  loop
    candidate := 'SID-' || to_char(now(), 'YYYYMMDD') || '-' ||
                 lpad(floor(random() * 10000)::int::text, 4, '0');
    select exists(select 1 from orders where order_number = candidate) into exists_already;
    exit when not exists_already;
  end loop;
  return candidate;
end;
$$ language plpgsql;

-- ---------------------------------------------------------
-- Atomically reserve stock for a set of cart items.
-- Prevents overselling under concurrent checkouts by locking the
-- product rows (FOR UPDATE) inside a single transaction and
-- failing the whole operation if any item doesn't have enough stock.
--
-- items: jsonb array like [{"product_id": "...", "quantity": 2}, ...]
--
-- Returns jsonb: { "success": true } or
--                { "success": false, "insufficient": [product_id, ...] }
-- ---------------------------------------------------------

create or replace function reserve_stock(items jsonb)
returns jsonb as $$
declare
  item jsonb;
  p_id uuid;
  qty int;
  current_stock int;
  insufficient_ids uuid[] := '{}';
begin
  -- Lock all involved product rows first, in a stable order, to avoid deadlocks
  perform 1 from products
    where id in (select (value->>'product_id')::uuid from jsonb_array_elements(items) as value)
    order by id
    for update;

  for item in select * from jsonb_array_elements(items)
  loop
    p_id := (item->>'product_id')::uuid;
    qty := (item->>'quantity')::int;

    select stock_quantity into current_stock from products where id = p_id;

    if current_stock is null or current_stock < qty then
      insufficient_ids := array_append(insufficient_ids, p_id);
    end if;
  end loop;

  if array_length(insufficient_ids, 1) > 0 then
    return jsonb_build_object('success', false, 'insufficient', to_jsonb(insufficient_ids));
  end if;

  -- All good — deduct stock
  for item in select * from jsonb_array_elements(items)
  loop
    p_id := (item->>'product_id')::uuid;
    qty := (item->>'quantity')::int;

    update products
      set stock_quantity = stock_quantity - qty,
          is_active = case when stock_quantity - qty <= 0 then is_active else is_active end
      where id = p_id;
  end loop;

  return jsonb_build_object('success', true);
end;
$$ language plpgsql;

-- ---------------------------------------------------------
-- Restore stock (used when an order is cancelled after stock
-- was already reserved/deducted).
-- ---------------------------------------------------------

create or replace function restore_stock(items jsonb)
returns void as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    update products
      set stock_quantity = stock_quantity + (item->>'quantity')::int
      where id = (item->>'product_id')::uuid;
  end loop;
end;
$$ language plpgsql;


-- =========================================================================
-- SECTION 4 OF 4: STORAGE BUCKETS + POLICIES
-- =========================================================================

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
