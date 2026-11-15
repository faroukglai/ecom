-- Phase 5: order operations.
--  * New statuses: refused (customer refused the parcel) and returned.
--  * Internal note on every order.
--  * place_order() now protects against spam and accidental double orders:
--      - the same phone with the same total within 30 minutes returns the existing order (no duplicate)
--      - more than 3 orders from one phone in 24 hours, or 8 from one network in an hour, are refused (SQLSTATE 54000)
-- Run after 20261110120000_lock_down_rls_and_atomic_orders.sql.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refused', 'returned'));

alter table public.orders add column if not exists note text not null default '';
alter table public.orders add column if not exists ip_hash text;

create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_ip_hash_idx on public.orders (ip_hash, created_at desc);

drop function if exists public.place_order(text, text, text, jsonb, text);

create or replace function public.place_order(
  p_name text,
  p_phone text,
  p_location text,
  p_lines jsonb,
  p_coupon text default '',
  p_ip_hash text default null
)
returns table (order_number text, subtotal numeric, discount numeric, shipping numeric, total numeric, already_exists boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  c_shipping constant numeric := 7;
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_location text := btrim(coalesce(p_location, ''));
  v_coupon text := upper(btrim(coalesce(p_coupon, '')));
  v_phone_key text;
  v_gross numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric := c_shipping;
  v_total numeric;
  v_count int;
  v_found int;
  v_order_id uuid;
  v_number text;
  v_existing record;
begin
  if v_name = '' or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;
  if v_phone !~ '^[+0-9 ()-]{8,20}$' or length(regexp_replace(v_phone, '\D', '', 'g')) < 8 then
    raise exception 'Please enter a valid phone number.' using errcode = '22023';
  end if;
  if char_length(v_location) < 4 or char_length(v_location) > 400 then
    raise exception 'Please enter your location.' using errcode = '22023';
  end if;
  if v_coupon <> '' and v_coupon not in ('WELCOME10', 'HOME15', 'FREESHIP') then
    raise exception 'That discount code is not valid.' using errcode = '22023';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'Your cart needs at least one item.' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p_lines);
  if v_count < 1 or v_count > 30 then
    raise exception 'Your cart needs at least one item.' using errcode = '22023';
  end if;

  create temporary table if not exists _order_lines (
    product_id text, quantity int
  ) on commit drop;
  truncate _order_lines;

  insert into _order_lines (product_id, quantity)
  select l.id, l.quantity
  from jsonb_to_recordset(p_lines) as l(id text, quantity int);

  if exists (select 1 from _order_lines where product_id is null or quantity is null or quantity < 1 or quantity > 20)
     or (select count(distinct product_id) from _order_lines) <> v_count then
    raise exception 'Please check your cart quantities.' using errcode = '22023';
  end if;

  select count(*), coalesce(sum(p.price * ol.quantity), 0)
    into v_found, v_gross
  from _order_lines ol
  join public.products p on p.id = ol.product_id
   and p.visibility = 'published'
   and (p.publish_date is null or p.publish_date <= now());
  if v_found <> v_count then
    raise exception 'One of the items is no longer available.' using errcode = '22023';
  end if;

  v_gross := round(v_gross, 2);
  if v_coupon = 'WELCOME10' then
    v_discount := round(v_gross * 0.10, 2);
  elsif v_coupon = 'HOME15' then
    if v_gross < 200 then
      raise exception 'HOME15 needs a subtotal of 200 TND.' using errcode = '22023';
    end if;
    v_discount := round(v_gross * 0.15, 2);
  elsif v_coupon = 'FREESHIP' then
    v_shipping := 0;
  end if;
  v_total := v_gross - v_discount + v_shipping;

  -- Same customer, same amount, last 30 minutes: treat it as a double tap and hand back the existing order.
  v_phone_key := right(regexp_replace(v_phone, '\D', '', 'g'), 8);
  select o.order_number, o.subtotal, o.discount, o.shipping, o.total
    into v_existing
  from public.orders o
  where right(regexp_replace(o.phone, '\D', '', 'g'), 8) = v_phone_key
    and o.total = v_total
    and o.status = 'new'
    and o.created_at > now() - interval '30 minutes'
  order by o.created_at desc
  limit 1;
  if found then
    return query select v_existing.order_number, v_existing.subtotal, v_existing.discount, v_existing.shipping, v_existing.total, true;
    return;
  end if;

  -- Spam limits (SQLSTATE 54000 is mapped to "too many orders" by the API).
  if (select count(*) from public.orders o
        where right(regexp_replace(o.phone, '\D', '', 'g'), 8) = v_phone_key
          and o.created_at > now() - interval '24 hours') >= 3 then
    raise exception 'Too many orders from this phone number.' using errcode = '54000';
  end if;
  if p_ip_hash is not null and (select count(*) from public.orders o
        where o.ip_hash = p_ip_hash and o.created_at > now() - interval '1 hour') >= 8 then
    raise exception 'Too many orders from this network.' using errcode = '54000';
  end if;

  v_number := 'DR-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8));

  insert into public.orders (order_number, customer_name, phone, location, subtotal, discount, coupon, shipping, total, status, payment_method, ip_hash)
  values (v_number, v_name, v_phone, v_location, v_gross - v_discount, v_discount, v_coupon, v_shipping, v_total, 'new', 'cod', p_ip_hash)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, product_image, quantity, unit_price)
  select v_order_id, p.id, p.name, p.image, ol.quantity, p.price
  from _order_lines ol
  join public.products p on p.id = ol.product_id;

  return query select v_number, v_gross - v_discount, v_discount, v_shipping, v_total, false;
end;
$$;

revoke all on function public.place_order(text, text, text, jsonb, text, text) from public;
grant execute on function public.place_order(text, text, text, jsonb, text, text) to anon, authenticated;
