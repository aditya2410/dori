-- Sale / coupon codes. Percentage off the subtotal, valid within a date range,
-- usable once per user. Optional minimum order, max-discount cap, and a total
-- usage limit across all customers.
create table public.sales (
  id                  uuid default gen_random_uuid() primary key,
  code                text not null,
  description         text,
  discount_percent    smallint not null check (discount_percent > 0 and discount_percent <= 100),
  min_order_paise     integer check (min_order_paise >= 0),
  max_discount_paise  integer check (max_discount_paise >= 0),
  usage_limit         integer check (usage_limit > 0),
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  is_active           boolean not null default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  check (ends_at > starts_at)
);

-- Codes are matched case-insensitively, so enforce uniqueness on lower(code).
create unique index sales_code_unique on public.sales (lower(code));

create trigger sales_updated_at
  before update on public.sales
  for each row execute function public.handle_updated_at();

alter table public.sales enable row level security;
-- No anon/authenticated policies: all reads/writes go through the service role
-- (admin panel + checkout server routes). Service role bypasses RLS.

-- Link an order to the sale it used, plus the rupees discounted.
alter table public.orders
  add column discount_paise integer not null default 0 check (discount_paise >= 0),
  add column sale_id        uuid references public.sales(id) on delete set null;

-- Enforce "one redemption per user per sale" at the DB level. A cancelled order
-- frees the code again (it's excluded from the index), and pending/paid orders
-- hold the slot. Total usage is derived by counting non-cancelled orders.
create unique index orders_sale_user_unique
  on public.orders (sale_id, user_id)
  where sale_id is not null and status <> 'cancelled';

create index on public.orders (sale_id);

grant all on table public.sales to service_role;
