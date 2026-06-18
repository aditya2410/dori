-- Optional separate billing address. Null = same as the shipping address.
alter table public.orders add column billing_address jsonb;
