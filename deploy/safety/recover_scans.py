"""Offline VPS operator tool. Dry run by default; never approve files without rescanning."""
import argparse
from pathlib import PurePosixPath
from policy import ALLOWED_EXTENSIONS
from scan_config import scan_capacity

LEGACY_REASONS = (
    'File type is not supported by safety scanning',
    'File requires specialist scanning because of its size',
    'File exceeds antivirus scan limit',
    'Executable or archive disguised as another file type',
)


def run(apply=False):
    from service import db
    capacity = scan_capacity()
    with db() as conn, conn.cursor() as cur:
        # Block report inserts/state edits while eligibility is evaluated and requeued.
        cur.execute('SET LOCAL lock_timeout = \'5s\'')
        cur.execute('LOCK TABLE public.files, public.reports, public.content_safety_events IN SHARE ROW EXCLUSIVE MODE')
        cur.execute("""
          SELECT f.id, f.storage_path FROM public.files f
          WHERE f.source='original' AND f.storage_path IS NOT NULL
            AND f.scan_status='unsupported' AND f.moderation_status IN ('blocked','pending')
            AND f.moderation_note=ANY(%s) AND f.reviewed_at IS NULL
            AND f.size>0 AND f.size<=%s
            AND NOT EXISTS (SELECT 1 FROM public.files sibling WHERE sibling.storage_path=f.storage_path
              AND (sibling.reviewed_at IS NOT NULL OR sibling.scan_status='infected'
                OR sibling.moderation_note='Safety report: review required'
                OR (sibling.moderation_status='blocked' AND (sibling.scan_status<>'unsupported'
                  OR sibling.moderation_note IS NULL OR NOT sibling.moderation_note=ANY(%s)))))
            AND NOT EXISTS (SELECT 1 FROM public.reports r JOIN public.files sibling ON sibling.slug=r.file_slug
              WHERE sibling.storage_path=f.storage_path AND r.status='open')
            AND NOT EXISTS (SELECT 1 FROM public.content_safety_events e JOIN public.files sibling ON sibling.id=e.file_id
              WHERE sibling.storage_path=f.storage_path AND e.action IN ('blocked','report_hold','scan_infected'))
            AND EXISTS (SELECT 1 FROM public.content_safety_events e WHERE e.file_id=f.id
              AND e.action='scan_unsupported' AND e.note=f.moderation_note)
          ORDER BY f.id
        """, (list(LEGACY_REASONS), capacity, list(LEGACY_REASONS)))
        candidates = [(fid, path) for fid, path in cur.fetchall() if PurePosixPath(path.lower()).suffix in ALLOWED_EXTENSIONS]
        # Counts only: no private filenames or URLs in operator output.
        print(('Requeue' if apply else 'Dry-run eligible originals') + ': ' + str(len(candidates)))
        if apply:
            for fid, path in candidates:
                cur.execute("INSERT INTO public.content_safety_events(file_id,action,note) VALUES (%s,'scan_requeued','Legacy scan restriction requeued; full scan required')", (fid,))
                cur.execute("UPDATE public.files SET scan_status='pending',scanned_at=NULL,moderation_status='pending',moderation_note='Full safety rescan required' WHERE storage_path=%s", (path,))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Requires operator authorization and backup; default is dry run')
    run(parser.parse_args().apply)