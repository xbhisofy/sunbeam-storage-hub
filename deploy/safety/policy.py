"""Malware scanning policy; clean scans enable sharing, not content certification."""
from pathlib import PurePosixPath

MAX_SCAN_BYTES = 100 * 1024 * 1024
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm', '.mkv', '.mp3', '.m4a', '.wav', '.ogg', '.pdf', '.txt'}


def restriction(name, size):
    suffix = PurePosixPath(name.lower()).suffix
    if suffix not in ALLOWED_EXTENSIONS:
        return 'File type is not supported by safety scanning'
    if size <= 0 or size > MAX_SCAN_BYTES:
        return 'File requires specialist scanning because of its size'
    return None


def dangerous_signature(data):
    # Executable magic bytes remain dangerous even with a .jpg/.txt extension.
    return data.startswith((b'MZ', b'\x7fELF', b'#!', b'PK\x03\x04', b'Rar!', b'7z\xbc\xaf\x27\x1c'))


def scan_result(code, output):
    if code == 1:
        return 'infected'
    if code != 0 or 'OK' not in output:
        return 'error'
    return 'clean'

def automatic_sharing_status(scan_status, moderation_status, moderation_note):
    if scan_status != 'clean':
        return 'blocked'
    if moderation_status == 'blocked' or moderation_note == 'Safety report: review required':
        return moderation_status
    return 'approved'
