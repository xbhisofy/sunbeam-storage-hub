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
- Centralize brand, operator contacts and the verified public host in src/lib/site.ts; keep intended domains separate to avoid unverified canonical and app links.
- Use Brand and LegalFooter for shared branding and legal navigation; legal claims must match shipped functionality.
- Generate leaf metadata through pageHead with noindex on personal/share pages; sitemap lists only public editorial pages.
- Fetch shared-file details and start countdowns only inside the native app because browser share links only offer installation.
- The Android app is a separate Expo (React Native) codebase in `mobile/` sharing the same Lovable Cloud backend; keep mobile code out of `src/` and never import it into the website.
- Public API routes under `src/routes/api/public/*` must verify callers with `requireBearerUserId`; account-deletion logic lives only in `src/lib/delete-account.ts` so the web server function and the mobile-app route stay identical.
- Signed-in UI reads the local session via `currentUserId()` in src/lib/session.ts instead of `auth.getUser()`; a network auth check on every click made navigation slow, and the backend still verifies each request.

- PWABuilder uses the web screens with a responsive app shell; preserve the Expo code separately and never hide external identity-provider browser controls.
- Native Android Google login uses the platform Google Sign-In SDK and exchanges its ID token with the existing auth backend; require owner-configured OAuth clients and signing certificates rather than falling back to a browser redirect.
- Preserve the existing distributed Android application ID when replacing the PWABuilder shell; an upgrade also requires compatible signing and a higher versionCode.

- Share links use `site.shareUrl` (main domain, opens the app) and the dashboard uses `site.webUrl` (web subdomain); installed-app detection lives in src/lib/app-mode.ts so browsers get the Play Store page while the TWA plays files.
