-- Optional "compare-at" (MRP / was) price per product. When set and higher than
-- price_paise, the storefront shows a strikethrough original + a % OFF badge.
-- Null = no discount shown (never fabricated).
alter table public.products
  add column compare_at_paise integer;
