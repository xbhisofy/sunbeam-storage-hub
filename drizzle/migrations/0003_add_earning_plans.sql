ALTER TABLE public.profiles
  ADD COLUMN plan text NOT NULL DEFAULT 'view',
  ADD COLUMN plan_switches integer NOT NULL DEFAULT 3,
  ADD COLUMN referral_earnings numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.record_view(_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare o uuid; r uuid; p text;
begin
  update public.files set views = views + 1 where slug = _slug returning owner_id into o;
  if o is null then return; end if;
  select plan, referred_by into p, r from public.profiles where id = o;
  if p = 'view' then
    update public.profiles set balance = balance + 0.003 where id = o;
    if r is not null then
      update public.profiles set balance = balance + 0.0003, referral_earnings = referral_earnings + 0.0003 where id = r;
    end if;
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare ref uuid; ref_plan text;
begin
  select id, plan into ref, ref_plan from public.profiles where referral_code = new.raw_user_meta_data->>'ref';
  insert into public.profiles(id, email, display_name, referred_by)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), ref);
  if ref is not null and ref_plan = 'referral' then
    update public.profiles set balance = balance + 0.10, referral_earnings = referral_earnings + 0.10 where id = ref;
  end if;
  return new;
end $function$;