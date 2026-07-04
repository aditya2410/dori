-- Lightweight exit-intent feedback. Captured when a visitor shows intent to
-- leave (desktop mouse-out to the top, or mobile back-navigation), so we learn
-- why reel/ad traffic bounces. No PII required.
create table public.feedback (
  id          uuid        primary key default gen_random_uuid(),
  reason      text,        -- quick-pick reason (nullable)
  message     text,        -- optional free text
  source      text        not null default 'exit_intent',
  landed_from text,        -- 'instagram' | 'facebook' | 'referral' | 'direct'
  path        text,        -- page the visitor was on
  created_at  timestamptz  not null default now()
);

alter table public.feedback enable row level security;
grant all on public.feedback to service_role;
