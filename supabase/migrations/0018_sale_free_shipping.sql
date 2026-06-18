-- Optionally waive shipping for orders that use this code. Limit "first few
-- orders" via the existing usage_limit (Total uses).
alter table public.sales add column free_shipping boolean not null default false;
