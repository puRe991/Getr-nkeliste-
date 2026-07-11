create table public.balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(10,2) not null check (amount <> 0),
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index balance_adjustments_user_created_idx on public.balance_adjustments (user_id, created_at desc);

alter table public.balance_adjustments enable row level security;

create policy "authenticated read balance_adjustments" on public.balance_adjustments for select to authenticated using (true);
create policy "admins insert balance_adjustments" on public.balance_adjustments for insert to authenticated with check (public.current_app_role() = 'admin');

create or replace function public.adjust_balance(p_user_id uuid, p_amount numeric, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_adjustment_id uuid;
begin
  if public.current_app_role() <> 'admin' then
    raise exception 'Nur Admins dürfen Kontostände anpassen';
  end if;

  select id into v_admin_id from public.users where auth_user_id = auth.uid() limit 1;

  perform 1 from public.users where id = p_user_id for update;
  if not found then
    raise exception 'Benutzer nicht gefunden';
  end if;

  update public.users set balance = balance + p_amount where id = p_user_id;
  insert into public.balance_adjustments (user_id, amount, note, created_by)
  values (p_user_id, p_amount, p_note, v_admin_id)
  returning id into v_adjustment_id;

  return v_adjustment_id;
end;
$$;

grant execute on function public.adjust_balance(uuid, numeric, text) to authenticated;
