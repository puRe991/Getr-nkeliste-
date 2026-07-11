alter table public.transactions
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.users(id) on delete set null,
  add column cancel_note text;

create index transactions_cancelled_idx on public.transactions (cancelled_at);

create or replace function public.cancel_booking(p_transaction_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction record;
  v_caller_id uuid;
  v_caller_role public.user_role;
begin
  v_caller_role := public.current_app_role();
  select id into v_caller_id from public.users where auth_user_id = auth.uid() limit 1;

  select * into v_transaction from public.transactions where id = p_transaction_id for update;
  if not found then
    raise exception 'Buchung nicht gefunden';
  end if;
  if v_transaction.cancelled_at is not null then
    raise exception 'Buchung wurde bereits storniert';
  end if;

  if v_caller_role <> 'admin' then
    if v_caller_id is null or v_transaction.user_id <> v_caller_id then
      raise exception 'Keine Berechtigung';
    end if;
    if v_transaction.created_at < now() - interval '10 minutes' then
      raise exception 'Zeitfenster für Storno abgelaufen';
    end if;
  end if;

  update public.transactions
    set cancelled_at = now(), cancelled_by = v_caller_id, cancel_note = p_note
    where id = p_transaction_id;

  update public.users set balance = balance + v_transaction.price where id = v_transaction.user_id;
  update public.drinks set stock = stock + 1 where id = v_transaction.drink_id;
end;
$$;

grant execute on function public.cancel_booking(uuid, text) to authenticated;
