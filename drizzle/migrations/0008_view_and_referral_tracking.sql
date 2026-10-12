create table public.view_daily (
  file_id uuid not null, owner_id uuid not null, day date not null default current_date,
  views int not null default 0, primary key (file_id, day));
create index view_daily_owner_day on public.view_daily(owner_id, day);
grant select on public.view_daily to authenticated;
grant all on public.view_daily to service_role;
alter table public.view_daily enable row level security;
create policy "owner reads view stats" on public.view_daily for select to authenticated using (auth.uid() = owner_id);

create table public.referral_daily (
  referrer_id uuid not null, referred_id uuid not null, day date not null default current_date,
  signup_bonus numeric not null default 0, commission numeric not null default 0,
  primary key (referrer_id, referred_id, day));
create index referral_daily_ref_day on public.referral_daily(referrer_id, day);
grant select on public.referral_daily to authenticated;
grant all on public.referral_daily to service_role;
alter table public.referral_daily enable row level security;
create policy "referrer reads stats" on public.referral_daily for select to authenticated using (auth.uid() = referrer_id);

create index if not exists profiles_referred_by on public.profiles(referred_by);

CREATE OR REPLACE FUNCTION public.record_view(_slug text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare o uuid; fid uuid; r uuid; p text; b boolean; v uuid := auth.uid(); n int;
begin
  if v is not null then
    insert into public.view_events(file_slug, viewer_id) values (_slug, v) on conflict do nothing;
    get diagnostics n = row_count;
    if n = 0 then return; end if;
  end if;
  update public.files set views = views + 1 where slug = _slug returning owner_id, id into o, fid;
  if o is null then return; end if;
  insert into public.view_daily(file_id, owner_id, day, views) values (fid, o, current_date, 1)
    on conflict (file_id, day) do update set views = view_daily.views + 1;
  if o = v then return; end if;
  select plan, referred_by, blocked into p, r, b from public.profiles where id = o;
  if p = 'view' and not b then
    update public.profiles set balance = balance + 0.003 where id = o;
    if r is not null then
      update public.profiles set balance = balance + 0.0003, referral_earnings = referral_earnings + 0.0003 where id = r;
      insert into public.referral_daily(referrer_id, referred_id, day, commission) values (r, o, current_date, 0.0003)
        on conflict (referrer_id, referred_id, day) do update set commission = referral_daily.commission + 0.0003;
    end if;
  end if;
end $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
declare ref uuid; ref_plan text;
begin
  select id, plan into ref, ref_plan from public.profiles where referral_code = new.raw_user_meta_data->>'ref';
  insert into public.profiles(id, email, display_name, referred_by)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), ref);
  if ref is not null then
    insert into public.referral_daily(referrer_id, referred_id, day, signup_bonus)
      values (ref, new.id, current_date, case when ref_plan = 'referral' then 0.10 else 0 end)
      on conflict do nothing;
    if ref_plan = 'referral' then
      update public.profiles set balance = balance + 0.10, referral_earnings = referral_earnings + 0.10 where id = ref;
    end if;
  end if;
  return new;
end $$;

-- Referred users list for the referrer, names masked for privacy.
create or replace function public.my_referrals()
returns table(name text, joined timestamptz, earned numeric)
language sql stable security definer set search_path to 'public'
as $$
  select left(coalesce(p.display_name,'User'),2) || '***', p.created_at,
    coalesce((select sum(d.signup_bonus + d.commission) from public.referral_daily d where d.referrer_id = auth.uid() and d.referred_id = p.id),0)
  from public.profiles p where p.referred_by = auth.uid()
  order by p.created_at desc limit 200
$$;
grant execute on function public.my_referrals() to authenticated;