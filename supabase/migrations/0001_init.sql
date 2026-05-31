-- ============================================================
-- Boutique — initial schema
-- Run in Supabase SQL editor or via: supabase db push
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  full_name  text,
  phone      text,
  role       text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now()
);

create table public.addresses (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  line1      text not null,
  line2      text,
  city       text not null,
  state      text not null,
  pincode    text not null,
  country    text default 'IN',
  is_default boolean default false,
  created_at timestamptz default now()
);

create table public.products (
  id          uuid default gen_random_uuid() primary key,
  slug        text unique not null,
  name        text not null,
  description text,
  price_paise integer not null check (price_paise > 0),
  images      jsonb default '[]'::jsonb,
  stock       integer default 0 check (stock >= 0),
  is_active   boolean default true,
  created_at  timestamptz default now()
);

create table public.orders (
  id                   uuid default gen_random_uuid() primary key,
  user_id              uuid references auth.users(id),
  order_number         text unique not null,
  status               text not null default 'created'
    check (status in ('created', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal_paise       integer not null check (subtotal_paise >= 0),
  shipping_paise       integer default 0 check (shipping_paise >= 0),
  total_paise          integer not null check (total_paise >= 0),
  shipping_address     jsonb not null,
  tracking_number      text,
  razorpay_order_id    text,
  razorpay_payment_id  text unique,
  razorpay_signature   text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create table public.order_items (
  id               uuid default gen_random_uuid() primary key,
  order_id         uuid references public.orders(id) on delete cascade not null,
  product_id       uuid references public.products(id),
  product_name     text not null,
  unit_price_paise integer not null check (unit_price_paise > 0),
  quantity         integer not null check (quantity > 0),
  created_at       timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.orders (user_id);
create index on public.orders (status);
create index on public.orders (created_at desc);
create index on public.order_items (order_id);
create index on public.products (slug);
create index on public.products (is_active);
-- Partial unique index on razorpay_payment_id for idempotent webhook processing
create unique index orders_razorpay_payment_id_unique
  on public.orders (razorpay_payment_id)
  where razorpay_payment_id is not null;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- STOCK MANAGEMENT
-- Decrement stock atomically; raises exception if insufficient.
-- Called inside the order-creation transaction from the API route.
-- ============================================================

create or replace function public.decrement_stock(
  p_product_id uuid,
  p_quantity    integer
)
returns void
language plpgsql as $$
begin
  update public.products
  set stock = stock - p_quantity
  where id = p_product_id
    and stock >= p_quantity;

  if not found then
    raise exception 'insufficient_stock' using hint = p_product_id::text;
  end if;
end;
$$;

-- ============================================================
-- ROLE GRANTS
-- RLS is a second gate — the role needs table-level access first.
-- ============================================================

grant usage on schema public to authenticated, anon;

-- authenticated users: own rows on profiles/addresses/orders; read-only on products
grant select, update                        on public.profiles    to authenticated;
grant select, insert, update, delete        on public.addresses   to authenticated;
grant select                                on public.products    to authenticated;
grant select                                on public.orders      to authenticated;
grant select                                on public.order_items to authenticated;

-- anon: public product browsing only
grant select                                on public.products    to anon;

-- service_role: full access for API-route mutations (order creation, stock, admin)
grant usage on schema public to service_role;
grant all on public.profiles    to service_role;
grant all on public.addresses   to service_role;
grant all on public.products    to service_role;
grant all on public.orders      to service_role;
grant all on public.order_items to service_role;
grant all on public.cart_items  to service_role;
grant execute on function public.decrement_stock to service_role;
grant execute on function public.increment_stock to service_role;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.addresses   enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Profiles: each user reads and updates only their own row
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Addresses: full CRUD on own rows only
create policy "addresses_select_own"
  on public.addresses for select
  using (auth.uid() = user_id);

create policy "addresses_insert_own"
  on public.addresses for insert
  with check (auth.uid() = user_id);

create policy "addresses_update_own"
  on public.addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "addresses_delete_own"
  on public.addresses for delete
  using (auth.uid() = user_id);

-- Products: anyone can read active products; writes go through service role
create policy "products_select_active"
  on public.products for select
  using (is_active = true);

-- Orders: users read their own; all mutations via service role (API routes only)
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

-- Order items: users read items that belong to their orders
create policy "order_items_select_own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );
