-- Mirror auth.users.email onto profiles so we can look up a user by email via
-- PostgREST (needed for guest checkout: resolve/create an account per email).
alter table public.profiles add column email text;

-- Backfill existing profiles from auth.users.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

-- Case-insensitive uniqueness (emails are unique in auth.users anyway).
create unique index profiles_email_unique on public.profiles (lower(email)) where email is not null;

-- Keep email in sync on signup (guest checkout creates users via the admin API,
-- which fires this trigger too).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;
