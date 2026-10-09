create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  referral_code text unique not null default substr(md5(random()::text),1,8),
  referred_by uuid,
  balance numeric(12,4) not null default 0,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  file_type text not null,
  mime text,
  size bigint not null default 0,
  storage_path text not null,
  slug text unique not null default substr(md5(random()::text || clock_timestamp()::text),1,10),
  views integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.files to authenticated;
grant select on public.files to anon;
grant all on public.files to service_role;
alter table public.files enable row level security;
create policy "anyone reads files" on public.files for select to anon, authenticated using (true);
create policy "owner inserts" on public.files for insert to authenticated with check (auth.uid() = owner_id);
create policy "owner deletes" on public.files for delete to authenticated using (auth.uid() = owner_id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ref uuid;
begin
  select id into ref from public.profiles where referral_code = new.raw_user_meta_data->>'ref';
  insert into public.profiles(id, email, display_name, referred_by)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), ref);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.record_view(_slug text) returns void
language plpgsql security definer set search_path = public as $$
declare o uuid; r uuid;
begin
  update public.files set views = views + 1 where slug = _slug returning owner_id into o;
  if o is null then return; end if;
  update public.profiles set balance = balance + 0.001 where id = o returning referred_by into r;
  if r is not null then update public.profiles set balance = balance + 0.0001 where id = r; end if;
end $$;
grant execute on function public.record_view(text) to anon, authenticated;

create or replace function public.my_referral_count() returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles where referred_by = auth.uid()
$$;
grant execute on function public.my_referral_count() to authenticated;