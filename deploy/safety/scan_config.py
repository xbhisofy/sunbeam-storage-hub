"""Verify scanner capacity; increasing an environment limit alone never enables it."""
import os
import re
from policy import MAX_SCAN_BYTES


def clam_size(value):
    match = re.fullmatch(r'(\d+)([KMG]?)', value.upper())
    if not match:
        raise ValueError('Invalid antivirus size setting')
    return int(match[1]) * (1024 ** ('', 'K', 'M', 'G').index(match[2]))


def validated_capacity(text, requested):
    settings = {}
    for line in text.splitlines():
        parts = line.split('#', 1)[0].split()
        if len(parts) == 2:
            settings[parts[0]] = parts[1]
    # No unlimited or unverified capacity. ClamAV has a 2 GiB file ceiling.
    if requested <= 0 or requested >= 2 * 1024 ** 3:
        raise ValueError('Requested capacity is outside antivirus file limits')
    for key in ('MaxFileSize', 'MaxScanSize', 'StreamMaxLength'):
        if clam_size(settings.get(key, '0')) < requested:
            raise ValueError('Antivirus capacity is lower than requested: ' + key)
    for key in ('AlertExceedsMax', 'AlertEncrypted'):
        if settings.get(key, '').lower() not in ('yes', 'true', '1'):
            raise ValueError('Required antivirus fail-closed option: ' + key)
    if settings.get('ScanArchive', '').lower() not in ('yes', 'true', '1'):
        raise ValueError('Office containers require archive scanning')
    return requested


def scan_capacity():
    requested = int(os.environ.get('SAFETY_MAX_SCAN_BYTES', str(MAX_SCAN_BYTES)))
    with open(os.environ.get('SAFETY_CLAMD_CONFIG', '/etc/clamav/clamd.conf')) as config:
        return validated_capacity(config.read(), requested)