ALTER TABLE public.files SET (fillfactor = 85);
ALTER TABLE public.profiles SET (fillfactor = 85);

CREATE TABLE IF NOT EXISTS public.view_events (
  file_slug text NOT NULL,
  viewer_id uuid NOT NULL,
  day date NOT NULL DEFAULT current_date,
  PRIMARY KEY (file_slug, viewer_id, day)
);
GRANT ALL ON public.view_events TO service_role;
ALTER TABLE public.view_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.record_view(_slug text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare o uuid; r uuid; p text; v uuid := auth.uid(); n int;
begin
  if v is not null then
    insert into public.view_events(file_slug, viewer_id) values (_slug, v) on conflict do nothing;
    get diagnostics n = row_count;
    if n = 0 then return; end if;
  end if;
  update public.files set views = views + 1 where slug = _slug returning owner_id into o;
  if o is null or o = v then return; end if;
  select plan, referred_by into p, r from public.profiles where id = o;
  if p = 'view' then
    update public.profiles set balance = balance + 0.003 where id = o;
    if r is not null then
      update public.profiles set balance = balance + 0.0003, referral_earnings = referral_earnings + 0.0003 where id = r;
    end if;
  end if;
end $function$;