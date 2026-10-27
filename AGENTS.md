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
- Isolate `/mobileapp` in `mobileapp-review/`; never import Expo or edit production for review. Subdirectories have their own `AGENTS.md`; read them before changing files there.
- Self-hosted upload safety uses deploy/safety SQL, a VPS-only antivirus service and an Nginx delivery guard; clean supported scans enable sharing automatically, but report holds and blocks persist because client checks cannot protect older APKs or existing signed URLs.
- Content-safety schema extensions use a narrowly typed client in src/lib/content-safety.ts; never edit generated backend client/types to add moderation fields.
- Keep splash artwork and typography scoped to SplashScreen and `.splash` styles; its installed-app detection and session timers remain unchanged so visual updates do not alter launch behavior.
- Web VideoPlayer uses wrapper fullscreen; native MediaPlayer mounts one VideoView across modal rotation, preserving custom controls and playback.
- Format file dates and app-safe file metadata through src/lib/format.ts so Home, file lists and details remain consistent without exposing website-only analytics in the app.
- Centralize brand, operator contacts and the verified public host in src/lib/site.ts; keep intended domains separate to avoid unverified canonical and app links.
- Use Brand and LegalFooter for shared branding and legal navigation; legal claims must match shipped functionality.
- Public landing visuals are scoped to .landing; use StoreBadges for centralized store destinations and WebsiteAppPreview for explicitly illustrative previews without affecting installed-app screens.
- Generate leaf metadata through pageHead with noindex on personal/share pages; sitemap lists only public editorial pages.
- Local `shared-file` loaders require guarded HTTPS storage and fail closed on query/signing/expiry errors without owner premium checks; browsers only offer installation. Native async/ad lifecycle stays in `use-shared-playback` to reject stale work.
- Android is native Expo in `mobile/`, separate from `src/`, using the website backend; keep website payment logic external and never duplicate it.
- The native app is cloud sharing only (Home, My Files, Upload, Shared, Profile); earnings, wallet, referrals, OC Bonus, plans and menu stay website-only for Play policy, and plan status is read from the profile so website upgrades reflect automatically.
- Native local notifications go through `mobile/lib/notifications.ts` with one high-importance channel bound to the bundled sound; changing the sound requires a new channel id.
- Conversion preserves parent ownership/bonus attribution; ordinary and paginated privileged account deletion must remove only original objects within the verified owner's namespace, never converted storage.
- Native account screens share `useProfile` with focus/resume refresh so externally changed subscriptions are not stale; central account rules validate profile inputs and derive plan display.
- Native tab screens use the approved HomeTabBar with explicit active destination; opt-in FileCard presentations, guarded thumbnails and screen-scoped themes isolate the website. Library behavior and shared expiry logic use pure native helpers; Profile reads existing profile/files hooks without duplicating account APIs.
- Native entrance motion uses the system Reduce Motion preference and the native animation driver to keep interactions accessible and smooth.
- Native Upload keeps its screen-specific theme/artwork isolated and retains existing consent and picker functions; unsupported sources stay disabled rather than introducing new permissions or integrations.
- The native root session gate owns post-login navigation and restores only validated `/s/<slug>` destinations so sign-in never loses shared files or accepts external redirects.
- Android assetlinks must match the shipped APK signing certificate; add the Play App Signing certificate when available because mismatches prevent verified share links from opening the installed app.
- Public API routes under `src/routes/api/public/*` must verify callers with `requireBearerUserId`; account-deletion logic lives only in `src/lib/delete-account.ts` so the web server function and the mobile-app route stay identical.
- UI uses local `currentUserId()` instead of per-click network auth; backend requests remain verified. Cross-tree hook tests use root React so the DOM renderer has one dispatcher, without changing native dependencies.

- PWABuilder uses the web screens with a responsive app shell; preserve the Expo code separately and never hide external identity-provider browser controls.
- App login is email/password only (same accounts as the website); ads use AdMob with Google test IDs until owner IDs are supplied.
- Preserve the existing distributed Android application ID when replacing the PWABuilder shell; an upgrade also requires compatible signing and a higher versionCode.

- Share links use `site.shareUrl` (main domain, opens the app) and the dashboard uses `site.webUrl` (web subdomain); installed-app detection lives in src/lib/app-mode.ts so browsers get the Play Store page while the TWA plays files.
- The installed-app website-only route guard excludes subscription plans so Home and Profile upgrade links remain usable.

- The VPS deployment uses a self-hosted backend (Docker in /opt/tanyora-backend, served at app.tanyora.com/backend) with storage on Cloudflare R2; the VPS .env overrides backend URLs at build time, so app code must keep using the generated client and never hardcode backend URLs.
- The site is self-hosted on the owner's own domains, so shipped pages, app config and store-listing docs must never reference a Lovable-hosted URL; bundle images under src/assets and build absolute links from src/lib/site.ts.
- Payout methods are declared once in `src/lib/payouts.ts` and must stay identical to the `request_withdrawal` backend whitelist; the withdrawal form, admin note and landing page all read that list so a method can never appear in the UI and be rejected by the backend.
