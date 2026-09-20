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
