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
