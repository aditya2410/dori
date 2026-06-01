-- ============================================================
-- Series (product collections) + product_series join table + bestseller flags
-- Run in Supabase SQL Editor or via: supabase db push
-- ============================================================

-- ── Series table ─────────────────────────────────────────────
create table public.series (
  id              uuid default gen_random_uuid() primary key,
  slug            text unique not null,
  name            text not null,
  description     text,
  cover_image_url text,
  display_order   integer default 100,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create trigger series_updated_at
  before update on public.series
  for each row execute function public.handle_updated_at();

-- ── Many-to-many: a product can belong to multiple series ─────
-- (e.g. a bag can be both "Mini Bags" and "Iconic")
create table public.product_series (
  product_id uuid references public.products(id) on delete cascade not null,
  series_id  uuid references public.series(id)   on delete cascade not null,
  primary key (product_id, series_id)
);

-- ── Bestseller flags directly on products ────────────────────
alter table public.products
  add column is_bestseller    boolean default false not null,
  add column bestseller_order integer;

-- ── Indexes ───────────────────────────────────────────────────
-- Fast lookup: all products in a series
create index product_series_series_id_idx  on public.product_series (series_id);
-- Fast lookup: all series a product belongs to
create index product_series_product_id_idx on public.product_series (product_id);

create index products_bestseller_idx on public.products (is_bestseller, bestseller_order)
  where is_bestseller = true and is_active = true;

create index series_display_order_idx on public.series (display_order)
  where is_active = true;

-- ── RLS ───────────────────────────────────────────────────────
alter table public.series         enable row level security;
alter table public.product_series enable row level security;

create policy "Anyone can read active series" on public.series
  for select using (is_active = true);

-- product_series is readable if the linked series is active
create policy "Anyone can read product_series for active series" on public.product_series
  for select using (
    exists (
      select 1 from public.series s
      where s.id = series_id and s.is_active = true
    )
  );

-- ── Grants ────────────────────────────────────────────────────
grant select on public.series         to anon, authenticated;
grant select on public.product_series to anon, authenticated;
grant all    on public.series         to service_role;
grant all    on public.product_series to service_role;

-- ── Seed series (display_order controls side-menu order) ──────
insert into public.series (slug, name, description, display_order) values
  ('mini-bags',   'Mini Bags',   'Small but mighty — our most-loved compact pieces.', 10),
  ('iconic',      'Iconic',      'The pieces people come back for, season after season.', 20),
  ('white-pearl', 'White Pearl', 'Our signature white pearl collection.', 30);

-- ============================================================
-- Down (roll back):
--
-- alter table public.products
--   drop column if exists bestseller_order,
--   drop column if exists is_bestseller;
-- drop table if exists public.product_series;
-- drop table if exists public.series;
-- ============================================================
