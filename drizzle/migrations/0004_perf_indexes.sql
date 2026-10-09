CREATE INDEX IF NOT EXISTS files_owner_created_idx ON public.files (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles (referred_by);