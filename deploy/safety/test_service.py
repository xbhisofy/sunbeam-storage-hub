"""Isolated scanner orchestration tests; no hosted DB, storage or daemon requests."""
import importlib.util
import sys
import types
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

if importlib.util.find_spec('psycopg2') is None:
    sys.modules['psycopg2'] = types.SimpleNamespace(connect=lambda **kwargs: None)
import service


class ScannerFlow(unittest.TestCase):
    def cursor(self, row):
        connection = MagicMock()
        connection.__enter__.return_value = connection
        cursor = MagicMock()
        connection.cursor.return_value.__enter__.return_value = cursor
        cursor.fetchone.side_effect = [row, (datetime.now(timezone.utc),)]
        return connection, cursor

    def exercise(self, size, chunks, code=0, stdout='fixture: OK', stderr='', timeout=False):
        connection, cursor = self.cursor(('original', 'owner/video.mp4', 'renamed.exe', size))
        response = MagicMock()
        response.__enter__.return_value = response
        response.iter_content.return_value = iter(chunks)
        result = types.SimpleNamespace(returncode=code, stdout=stdout, stderr=stderr)
        with patch.object(service, 'db', return_value=connection), patch.object(service, 'scan_capacity', return_value=256 * 1024 * 1024), patch.object(service, 'decide') as decision, patch.object(service.requests, 'get', return_value=response), patch.object(service.subprocess, 'run', return_value=result, side_effect=service.subprocess.TimeoutExpired('clamdscan', 180) if timeout else None) as scan, patch.dict(service.os.environ, {'SERVICE_ROLE_KEY': 'isolated-test-only'}):
            self.assertTrue(service.scan_one())
            self.assertTrue(decision.called)
            self.assertEqual(len(decision.call_args.args), 4)
            return decision.call_args.args[1], scan.called

    def test_entire_101_mib_video_scanned(self):
        # Real streamed temporary file, mocked daemon; not a production capacity claim.
        chunk = b'\x00' * 65536
        status, scanned = self.exercise(101 * 1024 * 1024, (chunk for _ in range(1616)))
        self.assertEqual(status, 'clean')
        self.assertTrue(scanned)

    def test_partial_transfer_not_scanned_or_cleared(self):
        self.assertEqual(self.exercise(100, [b'123']), ('error', False))

    def test_scan_timeout_private(self):
        self.assertEqual(self.exercise(3, [b'123'], timeout=True), ('error', True))

    def test_scan_warning_private(self):
        self.assertEqual(self.exercise(3, [b'123'], stderr='file skipped'), ('error', True))

    def test_malware_private(self):
        self.assertEqual(self.exercise(3, [b'123'], code=1, stdout='Eicar FOUND'), ('infected', True))

    def test_stale_claim_cannot_update(self):
        connection, cursor = self.cursor(None)
        with patch.object(service, 'db', return_value=connection):
            service.decide('owner/video.mp4', 'clean', 'fixture', ('original', datetime.now(timezone.utc)))
        self.assertEqual(cursor.execute.call_count, 1)

    def test_related_report_hold_survives_scan(self):
        connection, cursor = self.cursor(('original',))
        cursor.fetchall.return_value = [('original', 'pending', None), ('copy', 'pending', 'Safety report: review required')]
        with patch.object(service, 'db', return_value=connection):
            service.decide('owner/video.mp4', 'clean', 'passed', ('original', datetime.now(timezone.utc)))
        updates = [call.args[1] for call in cursor.execute.call_args_list if call.args[0].startswith('UPDATE')]
        self.assertEqual(len(updates), 2)
        for update in updates:
            self.assertEqual(update[1:3], ('pending', 'Safety report: review required'))

    def test_related_block_survives_scan(self):
        connection, cursor = self.cursor(('original',))
        cursor.fetchall.return_value = [('original', 'pending', None), ('copy', 'blocked', 'Blocked by admin')]
        with patch.object(service, 'db', return_value=connection):
            service.decide('owner/video.mp4', 'clean', 'passed', ('original', datetime.now(timezone.utc)))
        updates = [call.args[1] for call in cursor.execute.call_args_list if call.args[0].startswith('UPDATE')]
        self.assertEqual([update[1] for update in updates], ['blocked', 'blocked'])


if __name__ == '__main__':
    unittest.main()