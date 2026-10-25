BEGIN;
DROP POLICY "files upload own" ON storage.objects;
CREATE POLICY "files upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='files' AND (storage.foldername(name))[1]=auth.uid()::text AND EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND NOT blocked) AND NOT EXISTS (SELECT 1 FROM public.files f WHERE f.storage_path=storage.objects.name) AND lower(name) !~ '\.(exe|dll|com|bat|cmd|ps1|sh|js|mjs|vbs|scr|msi|apk|aab|jar|html|htm|svg|zip|rar|7z|tar|gz|iso)$');
COMMIT;