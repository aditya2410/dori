-- ============================================================
-- Cart items — per-user cart persisted server-side
-- ============================================================

create table public.cart_items (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity   integer not null check (quantity > 0),
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

create index on public.cart_items (user_id);

-- Users can fully manage their own cart rows
alter table public.cart_items enable row level security;

create policy "cart_items_own"
  on public.cart_items
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.cart_items to authenticated;
