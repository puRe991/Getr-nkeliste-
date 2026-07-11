alter table public.users add column email text unique;
create index users_email_idx on public.users (lower(email));
