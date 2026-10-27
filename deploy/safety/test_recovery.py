"""Recovery SQL integration test against an explicitly disposable local database."""
import os
import unittest
from unittest.mock import patch
import recover_scans


class RecoverySafety(unittest.TestCase):
    def test_only_audited_unreported_scan_restrictions_requeue(self):
        socket = os.environ.get('TANYORA_TEST_PG_SOCKET', '')
        if not socket.startswith('/tmp/tanyora-acl-'):
            self.skipTest('requires isolated local PostgreSQL')
        import psycopg2
        import service
        def connect():
            return psycopg2.connect(host=socket, port=55439, user='postgres', dbname='postgres')
        with connect() as conn, conn.cursor() as cur:
            cur.execute('''
              CREATE TABLE public.files(id text PRIMARY KEY, storage_path text, source text DEFAULT 'original',
                slug text, scan_status text DEFAULT 'unsupported', moderation_status text DEFAULT 'blocked',
                moderation_note text DEFAULT 'File type is not supported by safety scanning',
                reviewed_at timestamptz, scanned_at timestamptz, size bigint DEFAULT 4096);
              CREATE TABLE public.reports(file_slug text, status text);
              CREATE TABLE public.content_safety_events(file_id text, action text, note text);
            ''')
            for fid in ('eligible', 'reported', 'admin', 'ambiguous', 'infected', 'archive', 'too-big', 'copyhold'):
                path = fid + ('.zip' if fid == 'archive' else '.docx')
                cur.execute('INSERT INTO files(id,slug,storage_path) VALUES (%s,%s,%s)', (fid, fid, path))
                if fid != 'ambiguous':
                    cur.execute("INSERT INTO content_safety_events VALUES (%s,'scan_unsupported','File type is not supported by safety scanning')", (fid,))
            cur.execute("INSERT INTO reports VALUES ('reported','open'); UPDATE files SET reviewed_at=now() WHERE id='admin'; UPDATE files SET scan_status='infected' WHERE id='infected'; UPDATE files SET size=300*1024*1024 WHERE id='too-big'; INSERT INTO files(id,slug,storage_path,source,moderation_note) VALUES ('heldcopy','heldcopy','copyhold.docx','converted','Safety report: review required')")
        with patch.object(service, 'db', side_effect=connect), patch.object(recover_scans, 'scan_capacity', return_value=256 * 1024 * 1024):
            recover_scans.run(False)
            with connect() as conn, conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM files WHERE scan_status='pending'")
                self.assertEqual(cur.fetchone()[0], 0)
            recover_scans.run(True)
            recover_scans.run(True)  # Idempotent: no duplicate audit or requeue.
        with connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT id,moderation_status FROM files WHERE scan_status='pending'")
            self.assertEqual(cur.fetchall(), [('eligible', 'pending')])
            cur.execute("SELECT count(*) FROM content_safety_events WHERE action='scan_requeued'")
            self.assertEqual(cur.fetchone()[0], 1)


if __name__ == '__main__':
    unittest.main()