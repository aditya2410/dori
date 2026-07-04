-- ============================================================
-- Cash on Delivery (COD)
-- Adds a payment method to orders and a 'confirmed' status for
-- COD orders that are placed and ready to ship but whose cash is
-- collected on delivery (i.e. not yet paid — distinct from a failed
-- payment, which is 'cancelled').
-- ============================================================

alter table public.orders
  add column payment_method text not null default 'razorpay'
    check (payment_method in ('razorpay', 'cod'));

-- Widen the status enum with 'confirmed'. Prepaid orders keep the
-- created -> paid lifecycle; COD orders go straight to 'confirmed'
-- and then flow through the same shipped -> delivered pipeline.
alter table public.orders
  drop constraint orders_status_check,
  add constraint orders_status_check
    check (status in ('created', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'));
