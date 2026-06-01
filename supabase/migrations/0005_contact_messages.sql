-- ============================================================
-- Contact form submissions
-- Run in Supabase SQL Editor or via: supabase db push
-- ============================================================

create table public.contact_messages (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  email      text not null,
  phone      text not null,
  message    text not null,
  is_read    boolean default false not null,
  ip_address text,
  created_at timestamptz default now()
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);
create index contact_messages_unread_idx  on public.contact_messages (is_read, created_at desc)
  where is_read = false;

alter table public.contact_messages enable row level security;

-- No anon/authenticated read. All writes via service role from server action.
-- Admin reads happen via service client in server components.
grant all on public.contact_messages to service_role;

-- ============================================================
-- Down:
-- drop table if exists public.contact_messages;
-- ============================================================
