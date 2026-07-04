-- Replace the compare-at price with a simple discount percentage. The struck-
-- through "original" price is computed from it on the storefront, and the
-- "N% OFF" badge uses it directly. Null / 0 = no discount shown.
alter table public.products
  add column discount_percent integer;

alter table public.products
  drop column if exists compare_at_paise;
