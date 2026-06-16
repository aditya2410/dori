create table visitor_logs (
  id          bigserial primary key,
  request_id  text,
  ip          inet,
  country     text,
  city        text,
  pathname    text,
  user_agent  text,
  user_id     uuid references auth.users(id),
  created_at  timestamptz default now()
);

alter table visitor_logs enable row level security;

create index idx_visitor_logs_created_at on visitor_logs (created_at);
create index idx_visitor_logs_pathname   on visitor_logs (pathname);

grant all on table visitor_logs to service_role;
grant usage, select on sequence visitor_logs_id_seq to service_role;
