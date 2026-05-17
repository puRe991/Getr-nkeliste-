create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'mitglied');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  role public.user_role not null default 'mitglied',
  is_active boolean not null default true,
  balance numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.drinks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  price numeric(10,2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  icon text not null default '🥤',
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  drink_id uuid not null references public.drinks(id) on delete restrict,
  price numeric(10,2) not null check (price > 0),
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index users_name_idx on public.users using btree (lower(name));
create index users_active_idx on public.users (is_active);
create index drinks_active_idx on public.drinks (is_active);
create index drinks_stock_idx on public.drinks (stock);
create index transactions_created_at_idx on public.transactions (created_at desc);
create index transactions_user_created_idx on public.transactions (user_id, created_at desc);
create index transactions_drink_created_idx on public.transactions (drink_id, created_at desc);

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.users where auth_user_id = auth.uid() and is_active = true limit 1), 'mitglied'::public.user_role);
$$;

create or replace function public.book_drink(p_user_id uuid, p_drink_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric(10,2);
  v_transaction_id uuid;
begin
  select price into v_price from public.drinks where id = p_drink_id and is_active = true and stock > 0 for update;
  if v_price is null then
    raise exception 'Getränk nicht verfügbar';
  end if;

  perform 1 from public.users where id = p_user_id and is_active = true for update;
  if not found then
    raise exception 'Benutzer nicht aktiv';
  end if;

  update public.drinks set stock = stock - 1 where id = p_drink_id;
  update public.users set balance = balance - v_price where id = p_user_id;
  insert into public.transactions (user_id, drink_id, price) values (p_user_id, p_drink_id, v_price) returning id into v_transaction_id;
  return v_transaction_id;
end;
$$;

create or replace function public.book_drink_by_id(p_user_id uuid, p_drink_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$ select public.book_drink(p_user_id, p_drink_id); $$;

alter table public.users enable row level security;
alter table public.drinks enable row level security;
alter table public.transactions enable row level security;
alter table public.settings enable row level security;

create policy "authenticated read users" on public.users for select to authenticated using (true);
create policy "admins manage users" on public.users for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "authenticated read drinks" on public.drinks for select to authenticated using (true);
create policy "admins manage drinks" on public.drinks for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "authenticated read transactions" on public.transactions for select to authenticated using (true);
create policy "admins insert transactions" on public.transactions for insert to authenticated with check (public.current_app_role() = 'admin');
create policy "admins read settings" on public.settings for select to authenticated using (public.current_app_role() = 'admin');
create policy "admins manage settings" on public.settings for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

grant execute on function public.book_drink(uuid, uuid) to authenticated;
grant execute on function public.book_drink_by_id(uuid, uuid) to authenticated;
