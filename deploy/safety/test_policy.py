import unittest
from policy import MAX_SCAN_BYTES, dangerous_signature, restriction, scan_result, automatic_sharing_status

class SafetyRules(unittest.TestCase):
    def test_executables_blocked(self):
        self.assertIsNotNone(restriction('virus.exe', 20))
    def test_archives_blocked(self):
        self.assertIsNotNone(restriction('hidden.zip', 20))
    def test_executable_disguised_as_image(self):
        self.assertTrue(dangerous_signature(b'MZfake image'))
    def test_oversized_files_not_cleared(self):
        self.assertIsNotNone(restriction('video.mp4', MAX_SCAN_BYTES + 1))
    def test_antivirus_failure_not_clean(self):
        self.assertEqual(scan_result(2, 'Connection failed'), 'error')
    def test_virus_detected(self):
        self.assertEqual(scan_result(1, 'Eicar FOUND'), 'infected')
    def test_clean_scan_still_only_scan_result(self):
        self.assertEqual(scan_result(0, 'file: OK'), 'clean')
    def test_clean_scan_automatically_enables_sharing(self):
        self.assertEqual(automatic_sharing_status('clean', 'pending', None), 'approved')
    def test_scan_failure_never_enables_sharing(self):
        self.assertEqual(automatic_sharing_status('error', 'pending', None), 'blocked')
    def test_existing_block_is_not_overridden(self):
        self.assertEqual(automatic_sharing_status('clean', 'blocked', 'Blocked by admin'), 'blocked')
    def test_safety_report_hold_is_not_overridden(self):
        self.assertEqual(automatic_sharing_status('clean', 'pending', 'Safety report: review required'), 'pending')

if __name__ == '__main__':
    unittest.main()
