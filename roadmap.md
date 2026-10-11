# Tanyora project status

## Website
- [x] Restyle PWABuilder phone screens using supplied TenBox references; visual fixture checks cover home, bottom navigation, upload menu, convert link, drawer and profile editing; six existing tests pass.
- [x] Diagnose app address bar separately from external Google login; published app-link association returns HTTP 200 JSON matching the supplied APK package and certificate.
- [ ] Verify redesigned screens on the installed APK after website publication — waiting on user publication and device check; external Google login browser controls remain visible by design.
- [ ] Verify real authenticated upload and profile save — requesting user has no matching app account for automated sign-in; needs user preview sign-in.
- [x] Replace prior branding with Tanyora and the supplied blue T logo; derive favicon.
- [x] Rewrite privacy, terms and deletion information using supplied operator/contact details; add linked community/copyright/contact pages.
- [x] Update route metadata, crawl discovery and Android/listing documentation without claiming the custom domain is connected.
- [x] Reduce unnecessary shared-link requests; validate public website pages and deletion safety tests.
- [x] PWA support (manifest + root links) so PWABuilder can package the site.
- [x] Public bearer-verified API route for account deletion so the mobile app can delete accounts.
- [ ] Finalise operator contact particulars — waiting on full postal address, grievance officer designation and mailbox verification from the operator.
- [ ] Connect intended domain — waiting on domain ownership and connection.

## Mobile app (React Native / Expo — `mobile/`)
- [x] Add native Google account chooser and shared-backend login code; five isolated flow tests cover token exchange, cancellation, missing configuration/token and backend rejection; Expo configuration validates.
- [ ] Configure owner's Google OAuth clients and native signing certificates — waiting on owner Google setup and signing identity.
- [x] Full Expo app: login/signup, Home, My Content (upload + convert link + copy share link), Earnings (2 plans + switching), Referrals, Profile (edit name, sign out, delete account), share-link player with 5s countdown.
- [x] Same Lovable Cloud backend (database + auth) as the website.
- [x] App icon + splash assets, deep-link scheme (tanyora://), https /s/ intent filter, eas.json (preview APK + production AAB).
- [x] 0-to-hero setup and Play Store publishing guide (mobile/MOBILE_APP_GUIDE.md).
- [ ] First successful build — waiting on user to run `npm install` + `eas build` per the guide.
- [ ] Play Console publishing ($25 account, forms, 12 testers / 14 days) — user steps.
- [ ] Native Google sign-in on a real device — waiting on owner OAuth configuration, compatible signing and first native APK build.
- [ ] App Links verification (assetlinks.json on the site) after Play Store listing.
- [x] Test main/subdomain split using two Lovable addresses until tanyora.com is bought
