BEGIN;
DROP POLICY "files approved read" ON storage.objects;
DROP POLICY "admin clean review read" ON storage.objects;
CREATE POLICY "files approved read" ON storage.objects FOR SELECT TO anon,authenticated USING (bucket_id='files' AND EXISTS (SELECT 1 FROM public.files f WHERE f.storage_path=storage.objects.name AND public.file_is_shareable(f.id)));
CREATE POLICY "admin clean review read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='files' AND public.has_role(auth.uid(),'admin') AND EXISTS (SELECT 1 FROM public.files f WHERE f.storage_path=storage.objects.name AND f.scan_status='clean' AND f.moderation_status<>'blocked'));
COMMIT;