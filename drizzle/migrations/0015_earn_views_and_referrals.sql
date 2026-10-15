COMMENT ON COLUMN public.profiles.plan IS 'DEPRECATED: every user now earns from both views and referrals';
COMMENT ON COLUMN public.profiles.plan_switches IS 'DEPRECATED: plan switching removed';

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare ref uuid;
begin
  select id into ref from public.profiles where referral_code = new.raw_user_meta_data->>'ref';
  insert into public.profiles(id, email, display_name, referred_by)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), ref);
  if ref is not null then
    insert into public.referral_daily(referrer_id, referred_id, day, signup_bonus)
      values (ref, new.id, current_date, 0.10) on conflict do nothing;
    update public.profiles set balance = balance + 0.10, referral_earnings = referral_earnings + 0.10 where id = ref and not blocked;
  end if;
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.record_view(_slug text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare o uuid; fid uuid; pf uuid; po uuid; pb boolean; r uuid; b boolean; v uuid := auth.uid(); n int;
begin
  if v is not null then
    insert into public.view_events(file_slug, viewer_id) values (_slug, v) on conflict do nothing;
    get diagnostics n = row_count;
    if n = 0 then return; end if;
  end if;
  update public.files set views = views + 1 where slug = _slug returning owner_id, id, parent_file_id into o, fid, pf;
  if o is null then return; end if;
  insert into public.view_daily(file_id, owner_id, day, views) values (fid, o, current_date, 1)
    on conflict (file_id, day) do update set views = view_daily.views + 1;
  if o = v then return; end if;
  select referred_by, blocked into r, b from public.profiles where id = o;
  if not b then
    update public.profiles set balance = balance + 0.003 where id = o;
    if r is not null then
      update public.profiles set balance = balance + 0.0003, referral_earnings = referral_earnings + 0.0003 where id = r;
      insert into public.referral_daily(referrer_id, referred_id, day, commission) values (r, o, current_date, 0.0003)
        on conflict (referrer_id, referred_id, day) do update set commission = referral_daily.commission + 0.0003;
    end if;
    if pf is not null then
      select f.owner_id into po from public.files f where f.id = pf;
      if po is not null and po <> o and po is distinct from v then
        select blocked into pb from public.profiles where id = po;
        if not coalesce(pb, true) then
          update public.profiles set balance = balance + 0.00015 where id = po;
          insert into public.oc_bonus_daily(owner_id, day, views, amount) values (po, current_date, 1, 0.00015)
            on conflict (owner_id, day) do update set views = oc_bonus_daily.views + 1, amount = oc_bonus_daily.amount + 0.00015;
        end if;
      end if;
    end if;
  end if;
end $function$;