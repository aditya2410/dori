-- Atomic stock restore used when order creation fails after decrement
create or replace function public.increment_stock(
  p_product_id uuid,
  p_quantity    integer
)
returns void
language plpgsql as $$
begin
  update public.products
  set stock = stock + p_quantity
  where id = p_product_id;
end;
$$;
