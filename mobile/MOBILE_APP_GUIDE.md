# Tanyora Android App (React Native / Expo)

Native app with its own design, using the same backend as app.tanyora.com (same login, files and share links).

## Screens
Login/Sign up · Home · Files · Upload (+) · Shared links · Profile · Contact support · Shared file player (ad → Open file → video/audio/image/PDF, Report).
Earnings, referrals, wallet and premium purchases stay on app.tanyora.com.

## Build
```
cd mobile
npm install
npx eas build -p android --profile preview      # APK for testing
npx eas build -p android --profile production   # AAB for Play Store
```

## Before release
- Replace the Google test AdMob IDs: `androidAppId` in app.json, and EXPO_PUBLIC_ADMOB_INTERSTITIAL / EXPO_PUBLIC_ADMOB_BANNER env.
- Keep the Android package name and signing key of the existing Play listing, and raise `versionCode`.
