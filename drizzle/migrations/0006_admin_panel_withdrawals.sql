CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_total numeric NOT NULL DEFAULT 0;

-- Users may only edit their name directly; money/plan fields change through functions
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

CREATE POLICY "admin reads profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin deletes files" ON public.files FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  method text NOT NULL,
  account_details text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX withdrawals_user_idx ON public.withdrawals (user_id, created_at DESC);
CREATE INDEX withdrawals_status_idx ON public.withdrawals (status, created_at DESC);
GRANT SELECT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read withdrawals" ON public.withdrawals FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS files_created_idx ON public.files (created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_created_idx ON public.profiles (created_at DESC);

CREATE OR REPLACE FUNCTION public.switch_plan(_plan text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare cur text; left_ int;
begin
  if _plan not in ('view','referral') then raise exception 'Invalid plan'; end if;
  select plan, plan_switches into cur, left_ from public.profiles where id = auth.uid() for update;
  if cur is null then raise exception 'Not signed in'; end if;
  if cur = _plan then return; end if;
  if left_ <= 0 then raise exception 'No plan switches remaining'; end if;
  update public.profiles set plan = _plan, plan_switches = plan_switches - 1 where id = auth.uid();
end $$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_amount numeric, _method text, _details text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare bal numeric; blk boolean;
begin
  if _amount < 5 then raise exception 'Minimum withdrawal is $5'; end if;
  if _method not in ('upi','paypal','bank') then raise exception 'Invalid method'; end if;
  if length(coalesce(_details,'')) < 3 or length(_details) > 300 then raise exception 'Enter valid payment details'; end if;
  select balance, blocked into bal, blk from public.profiles where id = auth.uid() for update;
  if bal is null then raise exception 'Not signed in'; end if;
  if blk then raise exception 'Account is blocked'; end if;
  if bal < _amount then raise exception 'Not enough balance'; end if;
  update public.profiles set balance = balance - _amount where id = auth.uid();
  insert into public.withdrawals(user_id, amount, method, account_details) values (auth.uid(), _amount, _method, _details);
end $$;

-- Admin: approve / mark paid / reject (reject refunds balance)
CREATE OR REPLACE FUNCTION public.admin_set_withdrawal(_id uuid, _status text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare w public.withdrawals;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  if _status not in ('approved','paid','rejected') then raise exception 'Invalid status'; end if;
  select * into w from public.withdrawals where id = _id for update;
  if w.id is null then raise exception 'Not found'; end if;
  if w.status in ('paid','rejected') then raise exception 'Already closed'; end if;
  update public.withdrawals set status = _status, admin_note = _note, processed_at = now() where id = _id;
  if _status = 'rejected' then
    update public.profiles set balance = balance + w.amount where id = w.user_id;
  elsif _status = 'paid' then
    update public.profiles set paid_total = paid_total + w.amount where id = w.user_id;
  end if;
end $$;

CREATE OR REPLACE FUNCTION public.admin_update_user(_id uuid, _blocked boolean, _balance_delta numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  update public.profiles set blocked = coalesce(_blocked, blocked), balance = greatest(0, balance + coalesce(_balance_delta, 0)) where id = _id;
end $$;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Forbidden'; end if;
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'users_today', (select count(*) from public.profiles where created_at > now() - interval '1 day'),
    'files', (select count(*) from public.files),
    'files_today', (select count(*) from public.files where created_at > now() - interval '1 day'),
    'views', (select coalesce(sum(views),0) from public.files),
    'balance_total', (select coalesce(sum(balance),0) from public.profiles),
    'paid_total', (select coalesce(sum(paid_total),0) from public.profiles),
    'pending_count', (select count(*) from public.withdrawals where status in ('pending','approved')),
    'pending_amount', (select coalesce(sum(amount),0) from public.withdrawals where status in ('pending','approved'))
  );
end $$;

-- blocked users stop earning and uploading
CREATE OR REPLACE FUNCTION public.record_view(_slug text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare o uuid; r uuid; p text; b boolean; v uuid := auth.uid(); n int;
begin
  if v is not null then
    insert into public.view_events(file_slug, viewer_id) values (_slug, v) on conflict do nothing;
    get diagnostics n = row_count;
    if n = 0 then return; end if;
  end if;
  update public.files set views = views + 1 where slug = _slug returning owner_id into o;
  if o is null or o = v then return; end if;
  select plan, referred_by, blocked into p, r, b from public.profiles where id = o;
  if p = 'view' and not b then
    update public.profiles set balance = balance + 0.003 where id = o;
    if r is not null then
      update public.profiles set balance = balance + 0.0003, referral_earnings = referral_earnings + 0.0003 where id = r;
    end if;
  end if;
end $function$;

DROP POLICY IF EXISTS "owner inserts" ON public.files;
CREATE POLICY "owner inserts" ON public.files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND NOT exists (select 1 from public.profiles where id = auth.uid() and blocked));

REVOKE EXECUTE ON FUNCTION public.admin_stats(), public.admin_update_user(uuid,boolean,numeric), public.admin_set_withdrawal(uuid,text,text), public.request_withdrawal(numeric,text,text), public.switch_plan(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_stats(), public.admin_update_user(uuid,boolean,numeric), public.admin_set_withdrawal(uuid,text,text), public.request_withdrawal(numeric,text,text), public.switch_plan(text) TO authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'zyrofit.my@gmail.com' ON CONFLICT DO NOTHING;