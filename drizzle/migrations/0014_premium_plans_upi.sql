alter table public.profiles add column if not exists premium_tier text;
alter table public.profiles add column if not exists premium_until timestamptz;
alter table public.zapupi_deposits add column if not exists purpose text not null default 'wallet';

-- Users may edit their own profile, but never money, plan or premium fields.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.balance := old.balance; new.paid_total := old.paid_total;
    new.referral_earnings := old.referral_earnings; new.blocked := old.blocked;
    new.plan := old.plan; new.plan_switches := old.plan_switches;
    new.referred_by := old.referred_by; new.referral_code := old.referral_code;
    new.premium_tier := old.premium_tier; new.premium_until := old.premium_until;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();

create or replace function public.credit_zapupi_deposit(_order_id text, _paid_amount numeric, _txn_id text, _utr text, _response jsonb)
returns text language plpgsql security definer set search_path to 'public' as $$
declare d public.zapupi_deposits; cur_until timestamptz; cur_tier text;
begin
  select * into d from public.zapupi_deposits where order_id = _order_id for update;
  if d.id is null then return 'not_found'; end if;
  if d.status = 'success' then return 'already'; end if;
  if abs(d.amount_inr - _paid_amount) > 0.01 then
    update public.zapupi_deposits set status='mismatch', txn_id=_txn_id, utr=_utr, gateway_response=_response, updated_at=now() where id=d.id;
    return 'mismatch';
  end if;
  update public.zapupi_deposits set status='success', txn_id=_txn_id, utr=_utr, gateway_response=_response, updated_at=now() where id=d.id;
  if d.purpose in ('plus', 'pro') then
    select premium_until, premium_tier into cur_until, cur_tier from public.profiles where id = d.user_id for update;
    update public.profiles set premium_tier = d.purpose,
      premium_until = case when cur_tier = d.purpose and cur_until > now() then cur_until else now() end + interval '30 days'
      where id = d.user_id;
  else
    update public.profiles set balance = balance + d.amount_inr where id = d.user_id;
  end if;
  return 'credited';
end $$;