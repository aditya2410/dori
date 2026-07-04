-- ============================================================
-- COD handling fee
-- Stored as a separate amount (paise) on the order so it can be
-- shown as its own line item — never folded into product prices.
-- 0 when the order is prepaid or the fee is disabled.
-- ============================================================

alter table public.orders
  add column cod_fee_paise integer not null default 0 check (cod_fee_paise >= 0);
