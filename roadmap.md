# Tanyora project status

## Website
- [x] Replace prior branding with Tanyora and the supplied blue T logo; derive favicon.
- [x] Rewrite privacy, terms and deletion information using supplied operator/contact details; add linked community/copyright/contact pages.
- [x] Update route metadata, crawl discovery and Android/listing documentation without claiming the custom domain is connected.
- [x] Reduce unnecessary shared-link requests; validate public website pages and deletion safety tests.
- [x] PWA support (manifest + root links) so PWABuilder can package the site.
- [x] Public bearer-verified API route for account deletion so the mobile app can delete accounts.
- [ ] Finalise operator contact particulars — waiting on full postal address, grievance officer designation and mailbox verification from the operator.
- [ ] Connect intended domain — waiting on domain ownership and connection.

## Mobile app (React Native / Expo — `mobile/`)
- [x] Full Expo app: login/signup, Home, My Content (upload + convert link + copy share link), Earnings (2 plans + switching), Referrals, Profile (edit name, sign out, delete account), share-link player with 5s countdown.
- [x] Same Lovable Cloud backend (database + auth) as the website.
- [x] App icon + splash assets, deep-link scheme (tanyora://), https /s/ intent filter, eas.json (preview APK + production AAB).
- [x] 0-to-hero setup and Play Store publishing guide (mobile/MOBILE_APP_GUIDE.md).
- [ ] First successful build — waiting on user to run `npm install` + `eas build` per the guide.
- [ ] Play Console publishing ($25 account, forms, 12 testers / 14 days) — user steps.
- [ ] Google sign-in inside the app — deferred until first build succeeds.
- [ ] App Links verification (assetlinks.json on the site) after Play Store listing.
