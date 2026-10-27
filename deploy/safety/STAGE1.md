# Stage 1 — prepared changes, not deployed

## Payment ACL migration

`payment-credit-access.sql` restricts the existing payment-credit function to `service_role`. It changes no rates, amounts, gateway verification, schema or user records. It has been applied only to a synthetic disposable local PostgreSQL fixture and tested for effective privileges and actual denied/allowed calls.

Do not apply it to the shared preview or owner production database without separate approval. On the approved target, first inspect the function signature/owner and effective role inheritance, preserve a fresh database/config backup, then apply the exact file through the approved migration workflow. Assert anon/authenticated EXECUTE is false and service_role EXECUTE is true. Test a synthetic paid order only in staging with a gateway stub; do not call live payment credit to prove the restriction.

## Application fixes

- Account deletion lists stable 1,000-row pages, deduplicates, validates owner path namespaces and removes only original objects. Converted references never authorize object removal.
- Shared loaders reject query/signing errors, malformed or exact-boundary expiry, absent storage paths and absent/non-HTTPS signed URLs. No external fallback or premium restriction.
- Native shared playback cancels stale file/session resolutions and ad resources, resets counting/open state, and stops late ads after no-fill timeout. A displayed ad must close/error before content unlocks.
- Trusted generated share links use a strict native parser. HTTPS filters cover the three publicly checked owner domains separately from the custom scheme; a new signed APK is required for these settings to take effect.

## Verification

Run `bunx vitest run`. The native lifecycle tests use injected fake ads only; do not initialize/request the real AdMob SDK for testing.

For the isolated PostgreSQL ACL test, initialize a fresh local PostgreSQL instance with only a Unix socket under `/tmp/tanyora-acl-*/socket`, port 55439, no TCP listening, and synthetic postgres/anon/authenticated/service_role roles. Set `TANYORA_TEST_PG_SOCKET` to that local socket and run `python3 -B -m unittest discover -s deploy/safety -p 'test_payment_access.py'`. It deliberately skips without that disposable path and does not read hosted PG credentials. Stop the instance afterwards.

Run `python3 -B -m unittest discover -s deploy/safety -p 'test_policy.py'` for existing antivirus predicates. These are not live storage/Android verification.

## Release and rollback boundary

No release or production migration has occurred. Do not use the generic VPS deployment template until its missing delivery guard configuration is addressed. Preserve effective storage guard, private R2, TLS and firewall rules. Review configuration diffs, use immutable application releases and perform authorized device/staging tests before publishing.

Rollback application code only to a verified release; retain restricted payment execution and guarded storage. Restore databases/objects only through a coordinated recovery plan that accounts for subsequent legitimate activity. Never reopen a public financial function as a troubleshooting shortcut.

## Remaining prerequisites

Actual VPS configuration/ACLs, current APK and Play signing certificate, real Android device, authenticated staging accounts, provider consent/reporting/test-mode settings, and fresh backup/restore evidence remain required. Rate limiting has no standard backend primitive; custom limits need explicit tradeoff approval. Play Integrity and official revenue reporting are not implemented. No app download/export action is present in the inspected native file/player controls; downloaded/buffered media cannot be made perfectly uncopiable by hiding controls. The remote document viewer remains unchanged pending a separate local-viewing decision.