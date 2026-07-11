alter table public.transactions
  add column cancelled_at timestamptz,
  add column cancel_note text;

create index transactions_cancelled_idx on public.transactions (cancelled_at);

create or replace function public.cancel_booking(p_transaction_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_drink_id uuid;
  v_price numeric(10,2);
begin
  select user_id, drink_id, price into v_user_id, v_drink_id, v_price
  from public.transactions
  where id = p_transaction_id and cancelled_at is null
  for update;

  if not found then
    raise exception 'Buchung nicht gefunden oder bereits storniert';
  end if;

  update public.transactions set cancelled_at = now(), cancel_note = p_note where id = p_transaction_id;
  update public.users set balance = balance + v_price where id = v_user_id;
  update public.drinks set stock = stock + 1 where id = v_drink_id;
end;
$$;

grant execute on function public.cancel_booking(uuid, text) to authenticated;
