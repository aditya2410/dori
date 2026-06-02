-- Allow shipping to someone other than the account holder
alter table public.addresses
  add column full_name     text,
  add column phone         text,
  add column contact_email text;
