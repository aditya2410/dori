-- Curated "Shop our reels" row on the home page. Each reel is a video that can
-- optionally link to a product (making the card shoppable). Managed from
-- /admin/reels.
create table public.home_reels (
  id            uuid        primary key default gen_random_uuid(),
  video_url     text        not null,
  product_id    uuid        references public.products(id) on delete set null,
  caption       text,
  display_order integer     not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now()
);

alter table public.home_reels enable row level security;
grant all on public.home_reels to service_role;
