CREATE POLICY "admin deletes stored files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'files' AND public.has_role(auth.uid(), 'admin'));