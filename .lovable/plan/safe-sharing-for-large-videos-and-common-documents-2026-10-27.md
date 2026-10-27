# Safe sharing for large videos and common documents

## Confirmed issue
The current scanner rejects videos above 100 MiB and Word, Excel and PowerPoint files. These uploads become blocked, and even a later clean scan cannot release that automatic block. Modern Office documents also use a ZIP container that the existing signature check rejects. The website allows uploads up to 1 TB, so its accepted uploads do not match what can actually be checked and shared.

This is not safely fixed by removing the sharing check or increasing one number: the antivirus itself has matching 100M limits. Live VPS configuration and capacity are not verified in this review. No application code or production data has been changed.

## Requested result
- Support larger videos and common Word, Excel and PowerPoint documents through complete, successful antivirus checks.
- Automatically enable sharing after a successful check, without mandatory admin approval.
- Keep malware, failed checks, explicit moderation blocks, serious-report holds, expiry and account restrictions enforced.
- Keep files beyond verified scanning capacity private with an accurate explanation, rather than promising every upload up to 1 TB can be shared.

## Implementation
1. **Verify scanning capacity.** Inspect the actual VPS antivirus version/settings, available disk/memory, storage transfer limits and timeout behavior. Establish and document a tested larger-video ceiling; do not invent a safe ceiling or assume 1 TB is feasible. Back up configuration and affected metadata before separately authorized production work.
2. **Extend supported documents safely.** Add DOC/DOCX, XLS/XLSX and PPT/PPTX support. Validate expected file signatures and Office container structure with bounded inspection; do not broadly permit executable files or arbitrary archives. Let antivirus inspect the entire document including embedded content. Encrypted or incompletely scanned documents stay restricted.
3. **Coordinate larger-file scanning.** Align worker limits, antivirus settings, transfer method, temporary disk budget, scan timeout and interrupted-job recovery. Exceeded limits and partial scans must never count as clean. Do not split videos into chunks and infer a whole-file clean result.
4. **Separate retryable scan restrictions from moderation blocks.** Unsupported/error states remain unshareable but eligible for a controlled rescan when capacity/support improves. Explicit admin blocks and report holds must survive rescanning.
5. **Recover affected existing files conservatively.** Prepare a dry-run, audited recovery operation identifying only supported originals blocked by the old scanner's exact recorded reasons, excluding reviewed files and open safety reports across all copies. Ambiguous cases stay held. Requeue eligible files; never bulk-approve them. Originals and converted copies become shareable only after a full clean rescan and unchanged moderation checks.
6. **Align upload choices and messages.** Match website and native upload choices to verified supported formats and capacity. Remove ZIP from advertised supported document examples while arbitrary archives remain prohibited. Explain pending, retryable restriction and moderation hold accurately in professional English. Keep the isolated `/mobileapp` review unchanged.

## Technical boundaries
- Scanner/configuration work stays in the VPS safety service, never in the web server runtime.
- Preserve `file_is_shareable`, storage authorization and existing signed-link delivery guards. Client warnings are not security enforcement.
- Make recovery SQL idempotent, transactional and audited; do not modify generated backend files or managed schemas.
- Preserve share URL format, owner access rules, ads, earnings and playback behavior.
- Antivirus is not adult-content classification or child-abuse detection; existing report holds remain, and no complete detection guarantee is made.

## Verification
- Regression tests: 101 MiB video accepted within the verified new capacity; exact size boundary and over-limit behavior; all six Office formats; disguised executables; arbitrary archives; encrypted documents; antivirus errors/timeouts; partial transfers and interrupted scans.
- State tests: clean rescan releases only eligible scan restrictions, never explicit blocks or report holds; ambiguous historical blocks remain held; converted copies cannot bypass the original's status.
- Integration checks with harmless fixtures and isolated antivirus: full larger-video and Office scans, malware test detection and exceeded-limit behavior.
- After separate production authorization: signed-in upload → complete scan → automatic sharing → open existing/new link; serious report must revoke an already-issued link. No user uploads or live ads used as test fixtures.

## Approval and rollout
Approval of this plan authorizes source changes and isolated tests, not production deployment, production recovery or a new APK release. Those require verified VPS configuration, backups and separate authorization. The finding remains open until the implemented change is verified; live behavior remains unverified until coordinated rollout.