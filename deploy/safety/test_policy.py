import unittest
import tempfile
import zipfile
import struct
from policy import MAX_SCAN_BYTES, OFFICE_XML, dangerous_signature, document_restriction, restriction, scan_result, automatic_sharing_status
from scan_config import validated_capacity

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
        self.assertEqual(automatic_sharing_status('error', 'pending', None), 'pending')
    def test_existing_block_is_not_overridden(self):
        self.assertEqual(automatic_sharing_status('clean', 'blocked', 'Blocked by admin'), 'blocked')
    def test_safety_report_hold_is_not_overridden(self):
        self.assertEqual(automatic_sharing_status('clean', 'pending', 'Safety report: review required'), 'pending')

    def test_supported_office_extensions(self):
        for ext in ('.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'):
            with self.subTest(ext=ext):
                self.assertIsNone(restriction('report' + ext, 4096))

    def test_verified_larger_capacity(self):
        # Test capacity only, not a claim that the production VPS supports it.
        capacity = validated_capacity('MaxFileSize 256M\nMaxScanSize 512M\nStreamMaxLength 256M\nAlertExceedsMax yes\nAlertEncrypted yes\nScanArchive yes', 256 * 1024 * 1024)
        self.assertIsNone(restriction('video.mp4', 101 * 1024 * 1024, capacity))
        self.assertIsNone(restriction('video.mp4', capacity, capacity))
        self.assertIsNotNone(restriction('video.mp4', capacity + 1, capacity))

    def test_unverified_larger_capacity_denied(self):
        with self.assertRaises(ValueError):
            validated_capacity('MaxFileSize 100M\nMaxScanSize 100M\nStreamMaxLength 100M', 256 * 1024 * 1024)

    def test_required_antivirus_options(self):
        text = 'MaxFileSize 256M\nMaxScanSize 512M\nStreamMaxLength 256M\nAlertExceedsMax yes\nAlertEncrypted yes\nScanArchive yes'
        for setting in ('AlertExceedsMax', 'AlertEncrypted', 'ScanArchive'):
            with self.subTest(setting=setting), self.assertRaises(ValueError):
                validated_capacity(text.replace(setting + ' yes', setting + ' no'), 101 * 1024 * 1024)

    def test_antivirus_hard_ceiling(self):
        with self.assertRaises(ValueError):
            validated_capacity('', 2 * 1024 ** 3)

    def test_scan_error_output_never_clean(self):
        self.assertEqual(scan_result(0, 'file: OK\nERROR partial scan'), 'error')
        self.assertEqual(scan_result(0, 'NOT OK'), 'error')

    def test_unsupported_retry_can_pass(self):
        state = automatic_sharing_status('unsupported', 'pending', None)
        self.assertEqual(state, 'pending')
        self.assertEqual(automatic_sharing_status('clean', state, None), 'approved')

    def test_infected_file_stays_blocked_after_retry(self):
        state = automatic_sharing_status('infected', 'pending', None)
        self.assertEqual(state, 'blocked')
        self.assertEqual(automatic_sharing_status('clean', state, 'Malware detected'), 'blocked')

    def test_office_legacy_signature(self):
        for ext in ('.doc', '.xls', '.ppt'):
            with self.subTest(ext=ext), tempfile.NamedTemporaryFile() as file:
                file.write(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1' + b'fixture'); file.flush()
                self.assertIsNone(document_restriction(file.name, 'report' + ext))
                file.seek(0); file.write(b'MZmalware'); file.flush()
                self.assertIsNotNone(document_restriction(file.name, 'report' + ext))

    def office(self, path, main, extra=None):
        with zipfile.ZipFile(path, 'w') as archive:
            archive.writestr(main, '<main/>')
            archive.writestr('[Content_Types].xml', '<Types><Override PartName="/' + main + '"/></Types>')
            if extra:
                archive.writestr(extra, 'fixture')

    def test_office_xml_valid_containers(self):
        for ext, main in OFFICE_XML.items():
            with self.subTest(ext=ext), tempfile.NamedTemporaryFile() as file:
                self.office(file.name, main)
                self.assertFalse(dangerous_signature(b'PK\x03\x04', 'report' + ext))
                self.assertIsNone(document_restriction(file.name, 'report' + ext))

    def test_office_wrong_container(self):
        with tempfile.NamedTemporaryFile() as file:
            self.office(file.name, 'xl/workbook.xml')
            self.assertIsNotNone(document_restriction(file.name, 'report.docx'))

    def test_office_traversal(self):
        with tempfile.NamedTemporaryFile() as file:
            self.office(file.name, 'word/document.xml', '../bad')
            self.assertIsNotNone(document_restriction(file.name, 'report.docx'))

    def test_office_encrypted_members(self):
        with tempfile.NamedTemporaryFile() as file:
            self.office(file.name, 'word/document.xml')
            data = bytearray(open(file.name, 'rb').read())
            index = data.index(b'PK\x01\x02')
            struct.pack_into('<H', data, index + 8, 1)
            file.seek(0); file.write(data); file.flush()
            self.assertIsNotNone(document_restriction(file.name, 'report.docx'))

    def test_disguised_office_executable(self):
        self.assertTrue(dangerous_signature(b'MZfake', 'report.docx'))
        self.assertTrue(dangerous_signature(b'PK\x03\x04', 'photo.jpg'))

if __name__ == '__main__':
    unittest.main()
