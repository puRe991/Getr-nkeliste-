create table public.balance_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  balance numeric(10,2) not null,
  status text not null check (status in ('sent', 'failed', 'skipped_no_provider')),
  detail text,
  created_at timestamptz not null default now()
);

create index balance_reminders_user_created_idx on public.balance_reminders (user_id, created_at desc);

alter table public.balance_reminders enable row level security;

create policy "admins read balance_reminders" on public.balance_reminders for select to authenticated using (public.current_app_role() = 'admin');
