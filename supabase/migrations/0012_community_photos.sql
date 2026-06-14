create table public.community_photos (
  id            uuid        primary key default gen_random_uuid(),
  url           text        not null,
  display_order integer     not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now()
);

alter table public.community_photos enable row level security;
grant all on public.community_photos to service_role;
