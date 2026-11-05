# Ad-blocking protection for the Android app

## What the review found
- Shared files currently open when an ad fails, cannot be shown, or takes more than eight seconds to load. That fallback also lets ad-blocked sessions continue.
- An ad failure does not prove AdGuard is running: poor connectivity and unavailable ads can produce the same result.
- The app cannot reliably force another app to be uninstalled. Scanning installed apps or blocking every VPN is not a dependable solution.

## Proposed first stage
- Protect the shared-file opening step, not login, uploads, the user's own-file library, or the whole app.
- Replace automatic opening after an ad-network failure, display failure or loading timeout with a recoverable retry state.
- Show neutral English copy: “The ad could not load. Check your connection and allow ads for Tanyora, then try again.” Do not falsely claim AdGuard was detected.
- Provide Retry and Back. No account bans, forced uninstall, new device permissions or VPN restrictions.
- Treat the ad provider's explicit no-ad-available response separately, preserving an appropriate no-fill fallback rather than accusing legitimate users of blocking ads.
- Preserve successful ad-close playback, stale-callback protection and existing own-file access. Do not change storage, payouts or subscription rules.

## Limitations and verification
- This reduces the current automatic bypass; it is not tamper-proof protection. A loading problem can temporarily prevent opening shared content until retry succeeds.
- Backend-issued access after provider-verified ad completion would need a separate design and approval. Existing interstitial ads do not provide a trustworthy server completion receipt.
- Add regression checks for timeout, network errors, explicit no-fill, successful ad display/close, retry and changing files.
- Android verification requires the native dependencies and a real device or emulator. A new APK is required for phone users; this stage does not build, publish or change the VPS.

## Technical scope
Keep changes in the native ad adapter, shared-playback hook, player retry state and focused tests. Normalize provider error codes in the adapter; do not infer blocking from installed packages or VPN state. Keep `/mobileapp` review and website code unchanged.