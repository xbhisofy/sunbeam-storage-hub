-- Remove only the initial approval wait; never release reported or blocked files.
BEGIN;
INSERT INTO public.content_safety_events(file_id,action,note)
SELECT id,'automatic_sharing','Initial malware-clean upload released without manual approval'
FROM public.files WHERE scan_status='clean' AND moderation_status='pending'
  AND reviewed_at IS NULL AND (moderation_note IS NULL OR moderation_note='Malware scan complete; content review required')
  AND NOT EXISTS (SELECT 1 FROM public.reports r WHERE r.file_slug=files.slug AND r.status='open');
UPDATE public.files SET moderation_status='approved',moderation_note='Malware scan passed; sharing enabled automatically'
WHERE scan_status='clean' AND moderation_status='pending' AND reviewed_at IS NULL
  AND (moderation_note IS NULL OR moderation_note='Malware scan complete; content review required')
  AND NOT EXISTS (SELECT 1 FROM public.reports r WHERE r.file_slug=files.slug AND r.status='open');
COMMIT;