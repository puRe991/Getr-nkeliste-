create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "own push_subscriptions manage" on public.push_subscriptions for all to authenticated
  using (user_id = (select id from public.users where auth_user_id = auth.uid()))
  with check (user_id = (select id from public.users where auth_user_id = auth.uid()));

create policy "admins read push_subscriptions" on public.push_subscriptions for select to authenticated
  using (public.current_app_role() = 'admin');
