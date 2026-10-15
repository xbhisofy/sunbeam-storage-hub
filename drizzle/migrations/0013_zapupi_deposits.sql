create table public.zapupi_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id text not null unique,
  amount_inr numeric not null,
  status text not null default 'pending' check (status in ('pending','success','failed','mismatch')),
  payment_url text,
  txn_id text,
  utr text,
  gateway_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.zapupi_deposits to authenticated;
grant all on public.zapupi_deposits to service_role;
alter table public.zapupi_deposits enable row level security;
create policy "user reads own deposits" on public.zapupi_deposits for select to authenticated using (auth.uid() = user_id);

create table public.zapupi_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  payload jsonb,
  created_at timestamptz not null default now()
);
grant all on public.zapupi_webhook_events to service_role;
alter table public.zapupi_webhook_events enable row level security;

create or replace function public.credit_zapupi_deposit(_order_id text, _paid_amount numeric, _txn_id text, _utr text, _response jsonb)
returns text language plpgsql security definer set search_path to 'public' as $$
declare d public.zapupi_deposits;
begin
  select * into d from public.zapupi_deposits where order_id = _order_id for update;
  if d.id is null then return 'not_found'; end if;
  if d.status = 'success' then return 'already'; end if;
  if abs(d.amount_inr - _paid_amount) > 0.01 then
    update public.zapupi_deposits set status='mismatch', txn_id=_txn_id, utr=_utr, gateway_response=_response, updated_at=now() where id=d.id;
    return 'mismatch';
  end if;
  update public.zapupi_deposits set status='success', txn_id=_txn_id, utr=_utr, gateway_response=_response, updated_at=now() where id=d.id;
  update public.profiles set balance = balance + d.amount_inr where id = d.user_id;
  return 'credited';
end $$;