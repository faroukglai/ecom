-- Security hardening:
--  1. Only the store admin (by JWT email) may manage data; any other signed-in user gets nothing.
--  2. Anonymous clients can no longer insert orders directly. Orders are created through
--     public.place_order(), which reprices everything from the database in one transaction.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'faroukglai2002@gmail.com';
$$;

-- Admin-only policies -------------------------------------------------------
drop policy if exists "admin manage categories" on public.categories;
create policy "admin manage categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manage products" on public.products;
create policy "admin manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read order items" on public.order_items;
create policy "admin read order items" on public.order_items
  for select to authenticated using (public.is_admin());

-- No direct public inserts any more.
drop policy if exists "anyone can create orders" on public.orders;
drop policy if exists "anyone can create order items" on public.order_items;

-- Storage: only the admin may write product images (reads stay public).
drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- Record the coupon and discount on each order ------------------------------
alter table public.orders add column if not exists discount numeric(10,2) not null default 0;
alter table public.orders add column if not exists coupon text not null default '';

-- Atomic, server-priced order creation --------------------------------------
-- orders.subtotal keeps its existing meaning: the amount after discount, before shipping.
create or replace function public.place_order(
  p_name text,
  p_phone text,
  p_location text,
  p_lines jsonb,
  p_coupon text default ''
)
returns table (order_number text, subtotal numeric, discount numeric, shipping numeric, total numeric)
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
  v_gross numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric := c_shipping;
  v_count int;
  v_found int;
  v_order_id uuid;
  v_number text;
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

  v_number := 'DR-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8));

  insert into public.orders (order_number, customer_name, phone, location, subtotal, discount, coupon, shipping, total, status, payment_method)
  values (v_number, v_name, v_phone, v_location, v_gross - v_discount, v_discount, v_coupon, v_shipping, v_gross - v_discount + v_shipping, 'new', 'cod')
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, product_name, product_image, quantity, unit_price)
  select v_order_id, p.id, p.name, p.image, ol.quantity, p.price
  from _order_lines ol
  join public.products p on p.id = ol.product_id;

  return query select v_number, v_gross - v_discount, v_discount, v_shipping, v_gross - v_discount + v_shipping;
end;
$$;

revoke all on function public.place_order(text, text, text, jsonb, text) from public;
grant execute on function public.place_order(text, text, text, jsonb, text) to anon, authenticated;
