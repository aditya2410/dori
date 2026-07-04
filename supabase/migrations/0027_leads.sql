-- Contact leads captured by the exit-intent discount offer (WhatsApp/email in
-- exchange for a first-order code). These are the recoverable bounces — follow
-- up via WhatsApp/email.
create table public.leads (
  id          uuid        primary key default gen_random_uuid(),
  contact     text        not null,
  channel     text        not null,          -- 'whatsapp' | 'email'
  source      text        not null default 'exit_capture',
  landed_from text,                          -- 'instagram' | 'facebook' | 'referral' | 'direct'
  path        text,
  created_at  timestamptz not null default now()
);

alter table public.leads enable row level security;
grant all on public.leads to service_role;
