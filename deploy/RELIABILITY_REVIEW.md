# Website and native reliability review

## Verified in source tests
- Native file loading has one initial focus path instead of effect-plus-focus duplicate requests.
- Concurrent native file/profile reads share an in-flight request per account. Settled reads are not cached permanently; focus/resume still refreshes website subscription changes.
- File/profile/avatar state rejects old account/path completions and does not display a previous user's state during account switching.
- Website Home, Content and Shared use one user-scoped query and cancel interrupted requests. Profile data is user-scoped.
- Website and native file reads use stable creation-time/id ordering and 200-row backend pages, continuing until complete. This fixes backend response-cap truncation without pretending a first page is complete storage/category totals.
- File/profile failures no longer become successful empty results. Content, Shared and Home recent files expose retry.
- Dashboard withdrawal reads request only pending/approved statuses; recently watched keeps bounded event reads and narrow file fields.

## Limits of this stage
These changes reduce duplicate requests and improve correctness. Full libraries are still collected in memory to preserve existing search, totals and counts; paging bounds individual responses, not total library memory. No benchmark of 100,000 registered or simultaneous users was performed. No production server, database, DNS, auth setting or ad unit was changed. No APK was built.

Authenticated preview verification was unavailable: session minting found no requesting-user account. Public website/auth/share routes were checked in Chromium without runtime errors. Account-flow tests use isolated mocks, not production accounts. Native Android playback/account behavior needs a device.

## Separate staging and approved production rollout
1. Measure the actual VPS CPU/RAM, Docker database pool, connection count and existing backend proxy; the checked-in HTTP Nginx template does not establish live routing or upload capacity.
2. Build an isolated staging copy using synthetic accounts/files. Measure registration-count growth separately from concurrent logins, uploads, file reads and popular-file views. Never load-test live ads or production users.
3. Add verified owner-scoped server aggregates for storage/category totals and genuinely lazy paginated search/lists before claiming large-library constant-memory performance. Preserve moderation fields, complete totals and existing view/earning rules.
4. Replace native full-file base64 buffering with a supported file-backed/resumable upload design. Verify exact storage and ClamAV limits first; do not silently reduce product limits or skip scanning. Coordinate orphan-upload recovery and report/admin holds with the existing safety design.
5. Inspect actual database indexes/query plans before changes. Checked-in files owner/created and daily owner/day indexes already exist; possible duplicate referral indexes need catalog verification. Popular-file view and balance updates can contend; accounting redesign requires separate approval and regression tests.
6. Verify avatar bucket/schema support on the actual self-hosted backend, not just the managed preview backend.
7. Before rollout, take source/config/database backups, stage changes, preserve app signing/application ID, use a higher versionCode, and verify signed-in website/app uploads, reads, share expiry, profile refresh and account switching on Android.

Production tuning, backend aggregates/upload changes and rollout require actual staging evidence and owner approval. Unit tests alone do not establish throughput or zero future failures.