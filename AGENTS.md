<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Keep splash artwork and typography scoped to SplashScreen and `.splash` styles; its installed-app detection and session timers remain unchanged so visual updates do not alter launch behavior.
- Shared videos use the reusable VideoPlayer with browser media controls disabled; fullscreen targets its wrapper to preserve custom controls.
- Format file dates and app-safe file metadata through src/lib/format.ts so Home, file lists and details remain consistent without exposing website-only analytics in the app.
- Centralize brand, operator contacts and the verified public host in src/lib/site.ts; keep intended domains separate to avoid unverified canonical and app links.
- Use Brand and LegalFooter for shared branding and legal navigation; legal claims must match shipped functionality.
- Public landing visuals are scoped to .landing; use StoreBadges for centralized store destinations and WebsiteAppPreview for explicitly illustrative previews without affecting installed-app screens.
- Generate leaf metadata through pageHead with noindex on personal/share pages; sitemap lists only public editorial pages.
- Fetch shared-file details and start countdowns only inside the native app because browser share links only offer installation.
- The Android app is a separate native Expo (React Native) codebase in `mobile/` talking directly to the same backend as app.tanyora.com; keep mobile code out of `src/` and provide native account/content/earnings screens, with checkout and payouts on the external website to avoid duplicating payment logic.
- The native app is cloud sharing only (Home, My Files, Upload, Shared, Profile); earnings, wallet, referrals, OC Bonus, plans and menu stay website-only for Play policy, and plan status is read from the profile so website upgrades reflect automatically.
- Native local notifications go through `mobile/lib/notifications.ts` with one high-importance channel bound to the bundled sound; changing the sound requires a new channel id.
- Native conversion preserves the parent file reference and never deletes shared storage when removing a converted row, so conversions retain original ownership and bonus attribution.
- Native account screens share `useProfile` with focus/resume refresh so externally changed subscriptions are not stale; central account rules validate profile inputs and derive plan display.
- Native entrance motion uses the system Reduce Motion preference and the native animation driver to keep interactions accessible and smooth.
- The native root session gate owns post-login navigation and restores only validated `/s/<slug>` destinations so sign-in never loses shared files or accepts external redirects.
- Android assetlinks must match the shipped APK signing certificate; add the Play App Signing certificate when available because mismatches prevent verified share links from opening the installed app.
- Public API routes under `src/routes/api/public/*` must verify callers with `requireBearerUserId`; account-deletion logic lives only in `src/lib/delete-account.ts` so the web server function and the mobile-app route stay identical.
- Signed-in UI reads the local session via `currentUserId()` in src/lib/session.ts instead of `auth.getUser()`; a network auth check on every click made navigation slow, and the backend still verifies each request.

- PWABuilder uses the web screens with a responsive app shell; preserve the Expo code separately and never hide external identity-provider browser controls.
- App login is email/password only (same accounts as the website); ads use AdMob with Google test IDs until owner IDs are supplied.
- Preserve the existing distributed Android application ID when replacing the PWABuilder shell; an upgrade also requires compatible signing and a higher versionCode.

- Share links use `site.shareUrl` (main domain, opens the app) and the dashboard uses `site.webUrl` (web subdomain); installed-app detection lives in src/lib/app-mode.ts so browsers get the Play Store page while the TWA plays files.
- The installed-app website-only route guard excludes subscription plans so Home and Profile upgrade links remain usable.

- The VPS deployment uses a self-hosted backend (Docker in /opt/tanyora-backend, served at app.tanyora.com/backend) with storage on Cloudflare R2; the VPS .env overrides backend URLs at build time, so app code must keep using the generated client and never hardcode backend URLs.
- The site is self-hosted on the owner's own domains, so shipped pages, app config and store-listing docs must never reference a Lovable-hosted URL; bundle images under src/assets and build absolute links from src/lib/site.ts.
- Payout methods are declared once in `src/lib/payouts.ts` and must stay identical to the `request_withdrawal` backend whitelist; the withdrawal form, admin note and landing page all read that list so a method can never appear in the UI and be rejected by the backend.
