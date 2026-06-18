-- Separate cap for free shipping: only the first N orders using the code get
-- free shipping (independent of usage_limit / the discount). Null = all orders
-- that use the code (while free_shipping is on).
alter table public.sales add column free_shipping_limit integer check (free_shipping_limit > 0);
