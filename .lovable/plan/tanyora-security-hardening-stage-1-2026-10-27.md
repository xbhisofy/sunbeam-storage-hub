# Tanyora security hardening — Stage 1

## Audit result
The current Android source is native Expo/React Native. The app-link association files are publicly served, but the installed APK certificate and Android verification remain untested. The current share format is `/s/<slug>`, not a profile-name path. Native uses AdMob; the installed website has a timer rather than an implemented ad placement.

Read-only checks of the managed preview backend confirm publicly executable payment-credit and view-credit functions, broad file/storage read policies and four-decimal balances. These checks do not establish the owner VPS configuration.

## First approved stage
1. Add a narrowly scoped migration that restricts payment-credit execution to privileged server operations. Keep gateway verification and deposit amounts unchanged.
2. Correct account deletion so converted rows cannot delete another uploader's storage. Add paginated enumeration, deduplication and concrete ownership tests.
3. Make native and installed-web shared-file loaders fail safely on metadata/signing errors, invalid expiry or absent guarded URLs. Storage-backed files must never fall back to an external URL. Preserve owners' subscription-free access.
4. Reset native viewer state when the shared file changes, ignore stale results, and clean up ad listeners/timeouts without changing ad units or placement.
5. Test these changes with mocks and an isolated test backend where available. Produce a clear migration/deployment checklist and updated audit report.

## Not included in this approval
- No deployment, DNS/server changes, live ad changes or production database migration.
- No change to earning rates, anonymous earning eligibility, referral rules, ad placement, consent configuration or payout ledger; those need a separate reviewed stage.
- No new profile-name share URL format or application ID change.
- No removal of document support: the remote document viewer disclosure requires a separate viewing decision.
- No claim of installed Android verification, working Play Integrity, complete fraud prevention or current VPS security.

## Next stages
- Resolve shared-link enumeration and share-bound expiry, then durable rate limits and trusted content-event accounting.
- Separate internal payout credits from official ad-provider reporting; fix decimal precision and ledger reconciliation without changing agreed rates.
- Review AdMob test-mode/consent/frequency controls using provider policies.
- Strict cold/warm app-link parsing and separate intent filters, certificate verification, secure session storage and Play Integrity where appropriate.
- Make VPS safety configuration reproducible, establish encrypted backups/object recovery and run restore/rollback drills before production deployment.

## Technical boundaries
Use the existing backend, clients and account-deletion helper. New schema changes require explicit GRANT/RLS/function ACL rules and regression tests. Keep native code in `mobile/` and website code in `src/`. Do not change generated integration files or the review UI.

## Prerequisites for production verification
Read-only access to the actual VPS database and effective Nginx/storage settings; currently distributed APK/Play signing certificate; an Android device or emulator; provider reporting/consent settings; isolated staging accounts and storage. Create a fresh coordinated database/configuration/object backup before any approved production change.