alter table public.orders
  add column settled boolean not null default false;
