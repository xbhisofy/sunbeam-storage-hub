"""Malware scanning policy; clean scans enable sharing, not content certification."""
from pathlib import PurePosixPath
import zipfile
import os
import re
from xml.etree import ElementTree

MAX_SCAN_BYTES = 100 * 1024 * 1024
OFFICE_XML = {'.docx': 'word/document.xml', '.xlsx': 'xl/workbook.xml', '.pptx': 'ppt/presentation.xml'}
OFFICE_LEGACY = {'.doc', '.xls', '.ppt'}
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm', '.mkv', '.mp3', '.m4a', '.wav', '.ogg', '.pdf', '.txt'} | OFFICE_LEGACY | set(OFFICE_XML)


def restriction(name, size, max_bytes=MAX_SCAN_BYTES):
    suffix = PurePosixPath(name.lower()).suffix
    if suffix not in ALLOWED_EXTENSIONS:
        return 'File type is not supported by safety scanning'
    if size <= 0 or size > max_bytes:
        return 'File requires specialist scanning because of its size'
    return None


def dangerous_signature(data, name=''):
    # Executable magic bytes remain dangerous even with a .jpg/.txt extension.
    executable = data.startswith((b'MZ', b'\x7fELF', b'#!', b'Rar!', b'7z\xbc\xaf\x27\x1c'))
    zipped = data.startswith(b'PK\x03\x04')
    return executable or (zipped and PurePosixPath(name.lower()).suffix not in OFFICE_XML)


def document_restriction(path, name):
    """Bounded Office validation is not a replacement for scanning the whole file."""
    suffix = PurePosixPath(name.lower()).suffix
    if suffix in OFFICE_LEGACY:
        with open(path, 'rb') as source:
            if source.read(8) != b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':
                return 'Invalid Office document signature'
    if suffix not in OFFICE_XML:
        return None
    try:
        # Bound central-directory memory before ZipFile parses untrusted entries.
        size = os.path.getsize(path)
        with open(path, 'rb') as source:
            source.seek(max(0, size - 65557))
            tail = source.read()
        index = tail.rfind(b'PK\x05\x06')
        if index < 0 or len(tail) - index < 22:
            return 'Invalid Office document container'
        import struct
        disk, directory_disk, disk_entries, entries, directory_size, offset, comment = struct.unpack_from('<4H2IH', tail, index + 4)
        if disk or directory_disk or disk_entries != entries or entries > 4096 or directory_size > 2 * 1024 * 1024 or offset + directory_size != size - len(tail) + index or index + 22 + comment != len(tail):
            return 'Office document exceeds container inspection limits'
        with zipfile.ZipFile(path) as archive:
            members = archive.infolist()
            if len(members) != entries:
                return 'Ambiguous Office document container'
            names = [entry.filename for entry in members]
            if len(names) != len(set(names)) or any(entry.flag_bits & 1 for entry in members):
                return 'Encrypted or ambiguous Office document'
            if any('..' in PurePosixPath(name).parts or name.startswith('/') or '\\' in name for name in names):
                return 'Invalid Office document paths'
            if OFFICE_XML[suffix] not in names or '[Content_Types].xml' not in names:
                return 'Office document does not match its file type'
            if any(entry.is_dir() or entry.file_size <= 0 for entry in (archive.getinfo(OFFICE_XML[suffix]), archive.getinfo('[Content_Types].xml'))):
                return 'Office document main part is not a regular file'
            if any(entry.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED) for entry in members):
                return 'Unsupported Office document compression'
            types = archive.getinfo('[Content_Types].xml')
            if types.file_size > 65536:
                return 'Office document exceeds container inspection limits'
            xml = archive.read(types)
            if b'<!DOCTYPE' in xml.upper() or b'<!ENTITY' in xml.upper() or b'\x00' in xml:
                return 'Unsupported Office document metadata'
            root = ElementTree.fromstring(xml)
            if not any(item.get('PartName') == '/' + OFFICE_XML[suffix] for item in root):
                return 'Office document is missing its declared main part'
    except (OSError, ValueError, zipfile.BadZipFile, RuntimeError, NotImplementedError, ElementTree.ParseError):
        return 'Office document validation failed'
    return None


def scan_result(code, output):
    if code == 1:
        return 'infected'
    lines = [line.strip() for line in output.splitlines() if line.strip()]
    if code != 0 or len(lines) != 1 or not re.fullmatch(r'.+: OK', lines[0]):
        return 'error'
    return 'clean'

def automatic_sharing_status(scan_status, moderation_status, moderation_note):
    if moderation_status == 'blocked' or moderation_note == 'Safety report: review required':
        return moderation_status
    if scan_status == 'infected':
        return 'blocked'
    return 'approved' if scan_status == 'clean' else 'pending'
