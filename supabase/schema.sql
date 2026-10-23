-- Darivo store schema, policies, admin confirm, and catalog seed.
-- Run once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  parent_id text references public.categories(id) on delete set null,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  brand text not null default 'Darivo',
  category_id text references public.categories(id) on delete set null,
  price numeric(10,2) not null,
  old_price numeric(10,2),
  image text not null,
  gallery text[] not null default '{}',
  color text not null default '',
  material text not null default '',
  description text not null default '',
  page_title text not null default '',
  meta_description text not null default '',
  is_new boolean not null default false,
  visibility text not null default 'published' check (visibility in ('published', 'scheduled', 'hidden')),
  publish_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  location text not null,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 7,
  total numeric(10,2) not null,
  status text not null default 'new' check (status in ('new', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'cod',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  product_image text not null default '',
  quantity integer not null check (quantity > 0 and quantity <= 20),
  unit_price numeric(10,2) not null
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_visibility_idx on public.products(visibility);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public read visible categories" on public.categories;
create policy "public read visible categories" on public.categories
  for select to anon, authenticated using (visible = true);

drop policy if exists "admin manage categories" on public.categories;
create policy "admin manage categories" on public.categories
  for all to authenticated using (true) with check (true);

drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products
  for select to anon, authenticated
  using (visibility = 'published' and (publish_date is null or publish_date <= now()));

drop policy if exists "admin manage products" on public.products;
create policy "admin manage products" on public.products
  for all to authenticated using (true) with check (true);

drop policy if exists "anyone can create orders" on public.orders;
create policy "anyone can create orders" on public.orders
  for insert to anon, authenticated with check (true);

drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders
  for select to authenticated using (true);

drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders
  for update to authenticated using (true) with check (true);

drop policy if exists "anyone can create order items" on public.order_items;
create policy "anyone can create order items" on public.order_items
  for insert to anon, authenticated with check (true);

drop policy if exists "admin read order items" on public.order_items;
create policy "admin read order items" on public.order_items
  for select to authenticated using (true);

-- Confirm the store owner so login works without a mailbox round-trip.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
where email = 'faroukglai2002@gmail.com';

insert into public.categories (id, name, slug, description, sort_order) values
  ('living-room', 'Living room', 'living-room', 'Soft textures and considered pieces for the room you live in.', 1),
  ('kitchen-dining', 'Kitchen & dining', 'kitchen-dining', 'Everyday tableware for meals that become memories.', 2),
  ('bedroom', 'Bedroom', 'bedroom', 'Quiet light and linen for slower evenings.', 3),
  ('bath', 'Bath', 'bath', 'Natural warmth for daily rituals.', 4),
  ('decor', 'Decor', 'decor', 'Small objects that change the feeling of a room.', 5),
  ('lighting', 'Lighting', 'lighting', 'Warm glow for the end of the day.', 6),
  ('storage', 'Storage', 'storage', 'A natural home for the little things.', 7),
  ('garden-outdoor', 'Garden & outdoor', 'garden-outdoor', 'Pieces for unhurried afternoons outside.', 8),
  ('gifts', 'Gifts', 'gifts', 'Something lovely to give, or keep.', 9)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.products (
  id, slug, name, brand, category_id, price, old_price, image, gallery, color, material, description, page_title, meta_description, is_new, visibility
) values
  ('linen-cushion', 'washed-linen-cushion', 'Washed linen cushion', 'Darivo', 'living-room', 49, 65, '/images/cushion.webp', array['/images/cushion.webp','/images/hero.webp'], 'Sage green', '100% linen', $d$A little softness goes a long way. Our washed linen cushion brings a relaxed texture and a beautifully lived-in feel to your favourite corner. Includes a removable, machine-washable cover.$d$, 'Washed linen cushion', 'Sage washed linen cushion for a softer living room.', false, 'published'),
  ('amber-vase', 'handblown-amber-vase', 'Handblown amber vase', 'Darivo', 'decor', 69, 85, '/images/vase.webp', array['/images/vase.webp'], 'Warm amber', 'Handblown glass', $d$Warm amber glass catches the afternoon light. Each gently rounded vase is individually handblown, with small variations that make your piece your own. Beautiful with a single stem or just as it is.$d$, 'Handblown amber vase', 'Handblown amber glass vase for considered interiors.', false, 'published'),
  ('rattan-lamp', 'oak-rattan-table-lamp', 'Oak & rattan table lamp', 'Darivo', 'lighting', 159, 199, '/images/lamp.webp', array['/images/lamp.webp'], 'Natural oak', 'Oak & rattan', $d$Soft light for slow evenings. A handwoven rattan shade sits on a solid oak base, casting a warm, gentle glow across your bedside or reading corner. E27 bulb sold separately.$d$, 'Oak & rattan table lamp', 'Oak and rattan table lamp with a warm evening glow.', false, 'published'),
  ('stoneware-set', 'everyday-stoneware-set', 'Everyday stoneware set', 'Darivo', 'kitchen-dining', 129, 159, '/images/plates.webp', array['/images/plates.webp','/images/kitchen.webp'], 'Warm ivory', 'Glazed stoneware', $d$Made for the meals that become memories. Four softly speckled plates and a serving bowl, finished in a warm ivory glaze. Dishwasher and microwave safe, so everyday really means everyday.$d$, 'Everyday stoneware set', 'Ivory glazed stoneware plates and bowl for everyday meals.', true, 'published'),
  ('woven-basket', 'woven-seagrass-basket', 'Woven seagrass basket', 'Darivo', 'storage', 59, 75, '/images/basket.webp', array['/images/basket.webp'], 'Natural', 'Woven seagrass', $d$A natural home for all the little things. Handwoven seagrass, easy carry handles, and a generous shape make this basket just right for blankets, books, or a favourite plant.$d$, 'Woven seagrass basket', 'Handwoven seagrass storage basket for living rooms.', false, 'published'),
  ('ceramic-candle', 'slow-sunday-ceramic-candle', 'Slow Sunday ceramic candle', 'Darivo', 'decor', 39, null, '/images/candle.webp', array['/images/candle.webp'], 'Chalk', 'Soy wax & ceramic', $d$A quiet ritual for the end of the day. Notes of fig, cedar, and soft linen in a reusable ceramic vessel. Hand-poured soy wax with a cotton wick. Approximately 40 hours of burn time.$d$, 'Slow Sunday ceramic candle', 'Fig and cedar soy candle in a reusable ceramic vessel.', true, 'published'),
  ('bedroom-cushion', 'bedside-linen-cushion', 'Bedside linen cushion', 'Darivo', 'bedroom', 55, null, '/images/cushion.webp', array['/images/cushion.webp','/images/bedroom.webp'], 'Sage green', '100% linen', $d$The finishing touch for an inviting bed. Breathable linen, a soft filled inner, and thoughtful stitching for comfort that lasts.$d$, 'Bedside linen cushion', 'Sage linen cushion for a restful bedroom.', true, 'published'),
  ('bath-basket', 'bathroom-storage-basket', 'Bathroom storage basket', 'Darivo', 'bath', 45, null, '/images/basket.webp', array['/images/basket.webp','/images/bath.webp'], 'Natural', 'Woven seagrass', $d$Bring natural warmth to your daily routine. A handwoven basket for fresh towels and everyday essentials. Keep in a dry, ventilated space.$d$, 'Bathroom storage basket', 'Seagrass basket for towels and bathroom essentials.', false, 'published'),
  ('outdoor-vase', 'terrace-glass-vase', 'Terrace glass vase', 'Darivo', 'garden-outdoor', 79, null, '/images/vase.webp', array['/images/vase.webp'], 'Warm amber', 'Handblown glass', $d$Set the table for long, unhurried afternoons. This amber glass vase brings a warm glow to a covered terrace. Store indoors after use.$d$, 'Terrace glass vase', 'Amber glass vase for covered terraces and outdoor tables.', false, 'published'),
  ('dinner-bundle', 'gathering-stoneware-set', 'The gathering dinner set', 'Darivo', 'kitchen-dining', 219, 258, '/images/plates.webp', array['/images/plates.webp','/images/kitchen.webp'], 'Warm ivory', 'Glazed stoneware', $d$Room for everyone at the table. Two of our everyday stoneware sets, with eight plates and two serving bowls. A thoughtful foundation for shared meals.$d$, 'The gathering dinner set', 'Stoneware dinner set for gathering around the table.', false, 'published'),
  ('reading-lamp', 'quiet-corner-lamp', 'Quiet corner bedside lamp', 'Darivo', 'bedroom', 169, null, '/images/lamp.webp', array['/images/lamp.webp','/images/bedroom.webp'], 'Natural oak', 'Oak & rattan', $d$Your cue to slow down. A tactile oak and rattan lamp for late chapters and gentle mornings. E27 bulb sold separately.$d$, 'Quiet corner bedside lamp', 'Oak and rattan bedside lamp for slow evenings.', true, 'published'),
  ('candle-duo', 'slow-sunday-candle-duo', 'Slow Sunday candle duo', 'Darivo', 'gifts', 70, 78, '/images/candle.webp', array['/images/candle.webp'], 'Chalk', 'Soy wax & ceramic', $d$One to give, one to keep. Two hand-poured fig and cedar candles, each in a ceramic vessel that lives on after the last flame.$d$, 'Slow Sunday candle duo', 'Pair of fig and cedar ceramic candles, ready to gift.', false, 'published')
on conflict (id) do update set
  name = excluded.name,
  brand = excluded.brand,
  category_id = excluded.category_id,
  price = excluded.price,
  old_price = excluded.old_price,
  image = excluded.image,
  gallery = excluded.gallery,
  color = excluded.color,
  material = excluded.material,
  description = excluded.description,
  page_title = excluded.page_title,
  meta_description = excluded.meta_description,
  is_new = excluded.is_new,
  visibility = excluded.visibility;
