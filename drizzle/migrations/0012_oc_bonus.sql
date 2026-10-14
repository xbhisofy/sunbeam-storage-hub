ALTER TABLE public.files ADD COLUMN IF NOT EXISTS parent_file_id uuid;

CREATE TABLE public.oc_bonus_daily (
  owner_id uuid NOT NULL,
  day date NOT NULL DEFAULT CURRENT_DATE,
  views integer NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_id, day)
);
GRANT SELECT ON public.oc_bonus_daily TO authenticated;
GRANT ALL ON public.oc_bonus_daily TO service_role;
ALTER TABLE public.oc_bonus_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner reads oc bonus" ON public.oc_bonus_daily FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.validate_parent_file()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if new.parent_file_id is not null and (tg_op = 'INSERT' or new.parent_file_id is distinct from old.parent_file_id) then
    if new.source <> 'converted' or not exists (
      select 1 from public.files f where f.id = new.parent_file_id and f.owner_id <> new.owner_id
        and f.storage_path is not distinct from new.storage_path) then
      new.parent_file_id := null;
    end if;
  end if;
  return new;
end $$;
CREATE TRIGGER files_validate_parent BEFORE INSERT OR UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.validate_parent_file();

CREATE OR REPLACE FUNCTION public.record_view(_slug text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare o uuid; fid uuid; pf uuid; po uuid; pb boolean; r uuid; p text; b boolean; v uuid := auth.uid(); n int;
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
  select plan, referred_by, blocked into p, r, b from public.profiles where id = o;
  if p = 'view' and not b then
    update public.profiles set balance = balance + 0.003 where id = o;
    if r is not null then
      update public.profiles set balance = balance + 0.0003, referral_earnings = referral_earnings + 0.0003 where id = r;
      insert into public.referral_daily(referrer_id, referred_id, day, commission) values (r, o, current_date, 0.0003)
        on conflict (referrer_id, referred_id, day) do update set commission = referral_daily.commission + 0.0003;
    end if;
    -- OC bonus: 5% to the original link owner while their link still exists
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