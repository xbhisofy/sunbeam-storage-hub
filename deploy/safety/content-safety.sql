BEGIN;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS scan_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS moderation_note text;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS scanned_at timestamptz;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
CREATE INDEX IF NOT EXISTS files_safety_queue ON public.files(scan_status, moderation_status);
CREATE TABLE public.content_safety_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), file_id uuid, actor_id uuid,
 action text NOT NULL, note text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_safety_events TO authenticated;
GRANT ALL ON public.content_safety_events TO service_role;
ALTER TABLE public.content_safety_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin safety audit" ON public.content_safety_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.file_is_shareable(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (
 SELECT 1 FROM public.files f JOIN public.profiles p ON p.id=f.owner_id
 WHERE f.id=_id AND f.moderation_status='approved' AND f.scan_status='clean' AND NOT p.blocked
 AND (f.expires_at IS NULL OR f.expires_at>now()) AND f.external_url IS NULL AND f.storage_path IS NOT NULL
 AND EXISTS (SELECT 1 FROM public.files o JOIN public.profiles op ON op.id=o.owner_id
 WHERE o.storage_path=f.storage_path AND o.source='original' AND o.moderation_status='approved' AND o.scan_status='clean' AND NOT op.blocked))
$$;
REVOKE ALL ON FUNCTION public.file_is_shareable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.file_is_shareable(uuid) TO anon,authenticated,service_role;
DROP POLICY IF EXISTS "anyone reads files" ON public.files;
CREATE POLICY "approved files read" ON public.files FOR SELECT TO anon,authenticated USING (public.file_is_shareable(id));
CREATE POLICY "owner reads quarantined files" ON public.files FOR SELECT TO authenticated USING (owner_id=auth.uid());
CREATE POLICY "admin reads quarantined files" ON public.files FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.enforce_file_safety()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE parent public.files;
 privileged boolean := coalesce(current_setting('role',true),'none') IN ('service_role','none') AND auth.uid() IS NULL;
 review boolean := current_setting('tanyora.admin_review',true)=auth.uid()::text AND public.has_role(auth.uid(),'admin');
 hold boolean := current_setting('tanyora.report_hold',true)='yes';
BEGIN
 IF NEW.moderation_status NOT IN ('pending','approved','blocked') OR NEW.scan_status NOT IN ('pending','scanning','clean','infected','error','unsupported') THEN RAISE EXCEPTION 'Invalid safety status'; END IF;
 IF TG_OP='UPDATE' THEN
  IF NOT privileged AND (NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.storage_path IS DISTINCT FROM OLD.storage_path OR NEW.parent_file_id IS DISTINCT FROM OLD.parent_file_id OR NEW.source IS DISTINCT FROM OLD.source OR NEW.external_url IS DISTINCT FROM OLD.external_url OR NEW.mime IS DISTINCT FROM OLD.mime OR NEW.file_type IS DISTINCT FROM OLD.file_type OR NEW.size IS DISTINCT FROM OLD.size) THEN RAISE EXCEPTION 'File identity cannot be changed'; END IF;
  IF NOT privileged AND (NEW.scan_status IS DISTINCT FROM OLD.scan_status OR NEW.scanned_at IS DISTINCT FROM OLD.scanned_at) THEN RAISE EXCEPTION 'Scan status is server-controlled'; END IF;
  IF NOT privileged AND NOT coalesce(review,false) AND NOT (coalesce(hold,false) AND NEW.moderation_status='pending' AND OLD.moderation_status<>'blocked' AND NEW.reviewed_at IS NULL) AND (NEW.moderation_status IS DISTINCT FROM OLD.moderation_status OR NEW.moderation_note IS DISTINCT FROM OLD.moderation_note OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at) THEN RAISE EXCEPTION 'Safety status is server-controlled'; END IF;
  RETURN NEW;
 END IF;
 IF NOT privileged THEN
  IF NEW.owner_id IS DISTINCT FROM auth.uid() OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND NOT blocked) THEN RAISE EXCEPTION 'Upload not permitted'; END IF;
  NEW.moderation_status:='pending'; NEW.scan_status:='pending'; NEW.moderation_note:=NULL; NEW.scanned_at:=NULL; NEW.reviewed_at:=NULL;
  IF NEW.external_url IS NOT NULL OR NEW.storage_path IS NULL THEN RAISE EXCEPTION 'External files cannot be safety checked'; END IF;
  IF NEW.source='converted' THEN
   SELECT * INTO parent FROM public.files WHERE id=NEW.parent_file_id AND public.file_is_shareable(id);
   IF parent.id IS NULL OR parent.owner_id=NEW.owner_id OR parent.storage_path IS DISTINCT FROM NEW.storage_path THEN RAISE EXCEPTION 'Only approved files can be converted'; END IF;
   NEW.name:=parent.name; NEW.mime:=parent.mime; NEW.file_type:=parent.file_type; NEW.size:=parent.size;
   NEW.scan_status:='clean'; NEW.moderation_status:='approved'; NEW.scanned_at:=parent.scanned_at; NEW.reviewed_at:=parent.reviewed_at;
  ELSIF NEW.source='original' THEN
   IF split_part(NEW.storage_path,'/',1)<>auth.uid()::text OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='files' AND name=NEW.storage_path) OR EXISTS (SELECT 1 FROM public.files WHERE storage_path=NEW.storage_path AND source='original') THEN RAISE EXCEPTION 'Upload your own new file first'; END IF;
  ELSE RAISE EXCEPTION 'Unsupported source'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER files_enforce_safety BEFORE INSERT OR UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.enforce_file_safety();
REVOKE ALL ON FUNCTION public.enforce_file_safety() FROM PUBLIC;
REVOKE UPDATE ON public.files FROM authenticated;
GRANT UPDATE(name,expires_at,header_text,footer_text) ON public.files TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_review_file(_id uuid,_decision text,_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE f public.files;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF _decision NOT IN ('approved','blocked') OR length(trim(coalesce(_note,'')))<3 OR length(_note)>1000 THEN RAISE EXCEPTION 'Choose a decision and enter a review reason'; END IF;
 SELECT * INTO f FROM public.files WHERE id=_id FOR UPDATE;
 IF f.id IS NULL THEN RAISE EXCEPTION 'File not found'; END IF;
 IF _decision='approved' AND (f.scan_status<>'clean' OR f.storage_path IS NULL OR f.external_url IS NOT NULL OR f.source<>'original') THEN RAISE EXCEPTION 'A clean scan of the original file is required'; END IF;
 PERFORM set_config('tanyora.admin_review',auth.uid()::text,true);
 UPDATE public.files SET moderation_status=_decision,moderation_note=trim(_note),reviewed_at=now() WHERE storage_path=f.storage_path;
 INSERT INTO public.content_safety_events(file_id,actor_id,action,note) VALUES (_id,auth.uid(),_decision,trim(_note));
END $$;
REVOKE ALL ON FUNCTION public.admin_review_file(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_file(uuid,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.quarantine_reported_file()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.reason IN ('sexual','child_safety','violence','illegal','malware','Sexual or adult content','Child safety','Violence or harmful content','Malware or virus') AND NEW.reporter_id IS NOT NULL AND NEW.reporter_id=auth.uid() THEN
  PERFORM set_config('tanyora.report_hold','yes',true);
  UPDATE public.files SET moderation_status='pending',moderation_note='Safety report: review required',reviewed_at=NULL WHERE storage_path IN (SELECT storage_path FROM public.files WHERE slug=NEW.file_slug) AND moderation_status<>'blocked';
  INSERT INTO public.content_safety_events(file_id,actor_id,action,note) SELECT id,NEW.reporter_id,'report_hold',NEW.reason FROM public.files WHERE slug=NEW.file_slug;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER reports_safety_hold AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.quarantine_reported_file();
REVOKE ALL ON FUNCTION public.quarantine_reported_file() FROM PUBLIC;
DROP POLICY IF EXISTS "files read all" ON storage.objects;
CREATE POLICY "files approved read" ON storage.objects FOR SELECT TO anon,authenticated USING (bucket_id='files' AND EXISTS (SELECT 1 FROM public.files f WHERE f.storage_path=storage.objects.name AND public.file_is_shareable(f.id)));
CREATE POLICY "admin clean review read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='files' AND public.has_role(auth.uid(),'admin') AND EXISTS (SELECT 1 FROM public.files f WHERE f.storage_path=storage.objects.name AND f.scan_status='clean' AND f.moderation_status<>'blocked'));
DROP POLICY IF EXISTS "files upload own" ON storage.objects;
CREATE POLICY "files upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='files' AND (storage.foldername(name))[1]=auth.uid()::text AND EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND NOT blocked) AND NOT EXISTS (SELECT 1 FROM public.files f WHERE f.storage_path=storage.objects.name) AND lower(name) !~ '\.(exe|dll|com|bat|cmd|ps1|sh|js|mjs|vbs|scr|msi|apk|aab|jar|html|htm|svg|zip|rar|7z|tar|gz|iso)$');
DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND cmd='UPDATE' LOOP EXECUTE format('DROP POLICY %I ON storage.objects',p.policyname); END LOOP;
END $$;
-- Earnings must not be credited for quarantined or blocked content.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('public.record_view(text)'::regprocedure) INTO definition;
 definition := replace(definition, E'begin\n', E'begin\n  if not exists (select 1 from public.files where slug = _slug and public.file_is_shareable(id)) then return; end if;\n');
 EXECUTE definition;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
