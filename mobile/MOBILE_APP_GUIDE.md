# Tanyora Android App (React Native / Expo)

Native app with its own design, using the same backend as app.tanyora.com (same login, files and share links).

## Screens
Login/Sign up · Home account overview · My Content (All Content / Convert Link) · Upload (+) · Shared links · Earnings · Wallet · OC Bonus · Referrals · Profile / Edit Profile · Premium · Contact support · Shared file player (ad → Open file → video/audio/image/PDF, Report).
Home, bottom navigation and Profile expose the complete Menu. Earnings, payout/deposit history, referrals, bonuses and converted links are native screens backed by the same account as the website.
Payments and withdrawal requests open app.tanyora.com in the external browser. Users sign in there independently; account data refreshes on app resume. Direct APKs expose add-funds/upgrade links; Play builds do not steer to external digital purchases without an eligible billing program. Withdrawal requests remain website-only for both distributions.

## Build
```
cd mobile
npm install
npx eas build -p android --profile preview      # APK for testing
npx eas build -p android --profile production   # AAB for Play Store
```

## Before release
- Owner AdMob IDs are configured. Never click your own live ads during testing.
- Keep the Android package name and signing key of the existing Play listing, and raise `versionCode`.
