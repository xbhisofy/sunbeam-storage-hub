import unittest
from policy import MAX_SCAN_BYTES, dangerous_signature, restriction, scan_result

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

if __name__ == '__main__':
    unittest.main()
