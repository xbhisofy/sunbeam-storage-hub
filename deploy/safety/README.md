# Self-hosted upload safety

This directory runs only on the owner's Linux VPS, never inside TanStack SSR or a Worker bundle.

## Active controls
- `content-safety.sql`: private quarantine, immutable file identity, server-controlled scan/review state, owner/admin metadata reads, approved-only sharing/conversion, blocked-account checks, serious authenticated report holds, audit events and no rewards for restricted files.
- `storage-policy-fix.sql`: already-applied correction qualifying storage object names; only needed after the first deployed version of the migration, not after the corrected main SQL.
- `service.py` and `policy.py`: one bounded antivirus worker and a loopback-only Nginx authorisation guard. Failed scans never approve a file. All clean files still require admin content review.
- `tanyora-safety.service`: restartable service; credentials in root-only `/opt/tanyora-safety/service.env`. The host database address comes from the current Docker database container. Refresh it after network changes.
- Nginx must apply `auth_request /_tanyora_safety_check` to object and render delivery paths, forward the original URI and bearer, use HTTP/1.1, and never cache file responses. Keep the existing Docker external-port firewall restrictions.
- ClamAV `MaxFileSize` and `StreamMaxLength` are 100M; `AlertExceedsMax` and `AlertEncrypted` are enabled. Definitions refresh through `clamav-freshclam`.

## Limits
Only selected images, video, audio, PDF and text formats up to 100 MiB are scanned. Other formats and oversized files remain restricted, not deleted. All previously existing uploads were quarantined too. Paid automated media moderation and specialist child-abuse hash matching are not connected. Human review is mandatory; antivirus does not classify illegal sexual material. No detection guarantee is made. Previously delivered/downloaded copies cannot be recalled.

## Verification
Run `python3 -m unittest discover -s deploy/safety -p 'test_*.py'` and the content-safety Vitest suite. Live API verification used a harmless temporary text upload: pending denied signing; self-approval denied; clean scan still pending; authorised review enabled delivery; a serious report revoked that same signed URL with 403. The standard harmless EICAR test signature was detected. Test content was removed.

Backups of database/storage metadata, Nginx and antivirus config live in `/opt/tanyora-safety/backups` on the owner server. Do not commit credentials, signed URLs, or copied user files.