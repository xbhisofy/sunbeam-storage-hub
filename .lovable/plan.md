# Tanyora Android App (React Native) — Full Plan

Goal: Ek asli native app banana (website ko andar load NAHI karna). Apna custom design, seedha same database/login se juda, fast aur smooth. Phir APK + AAB file, apna logo, AdMob ads, aur private GitHub repository.

Project me pehle se ek shuruaati React Native (Expo) app ka code `mobile/` folder me hai. Use naye design ke saath poora dobara banayenge aur pura karenge.

## 1. App me kya-kya hoga (screens)

```text
Splash (Tanyora logo + animation)
  -> Login / Sign up (name, email, password)
  -> Main app (bottom bar: Home | Files | + Upload | Shared | Profile)
       Home      : greeting, storage bar, 4 categories, recent files
       Files     : saari files, category filter, search, 3-dot menu
                   (Details, Rename, Copy link, Share, Move to Trash)
       Upload    : phone se file chuno, progress card, success message
       Shared    : jo links share kiye, expiry dikhegi, link delete
       Profile   : naam/email, storage, plan, support, legal pages,
                   Contact support, Logout, Delete account
  -> Share link khulna (tanyora.com/s/xxxx): ad -> "Open file"
       -> custom video player (10s aage/peeche, speed, rotate/fullscreen),
          photo, audio, PDF viewer, Report button
  -> Drawer menu: logo box, links, logout neeche
```

- Share karte waqt expiry: 1 ghanta / 24 ghante / 7 din / 30 din / kabhi nahi, phir phone ka share menu.
- Download ka option nahi hoga (website jaisa hi).
- Website par jo upload karo wo app me dikhega, aur app wala website par (same database).

## 2. Jo app me NAHI hoga (Play Store ke rules ki wajah se)

- Earnings, Referrals, OC Bonus, Wallet, Withdrawal: sirf website par rahenge. Ye pehle aapne hi kaha tha, aur paise kamane wali screens se Play Store review me dikkat aati hai.
- UPI se Premium kharidna: app me "Coming soon" ya "Website par upgrade karo" dikhega. App ke andar UPI se plan bechne par Google app reject kar deta hai.
- Agar aap ye sab app me bhi chahte ho to batao, lekin rejection ka risk rahega.

## 3. Design

- Saaf light design, website ke Tanyora blue rang ke saath, bade buttons, saaf font.
- Skeleton loading, smooth animations, pull-to-refresh sirf lists par (website wala refresh gol icon nahi).
- Har phone size par sahi dikhega. Saara text professional English me.
- App icon aur splash: Tanyora ka asli "T" logo (rounded, Android ke gol icon ke liye bhi sahi).

## 4. AdMob ads

- Share link kholne par file se pehle ek ad (Interstitial ya Rewarded).
- Files/Home par neeche chhota Banner ad (optional).
- Testing ke dauraan Google ke test ads chalenge, taaki aapka AdMob account block na ho. Release build me aapke asli ads.

## 5. Aapse mujhe kya chahiye

**AdMob (admob.google.com):**
1. AdMob account banao, "Add app" -> Android -> app abhi Play Store par nahi hai bolo.
2. **App ID** (aisa dikhta hai: `ca-app-pub-1234567890123456~1234567890`)
3. Ad units banao aur unke **Ad unit ID** do (`ca-app-pub-...../.....`):
   - Interstitial (share link wala ad) — zaroori
   - Banner — agar chahiye
   - Rewarded — agar "ad dekho phir file" wala chahiye
4. Batao kahan-kahan ad chahiye aur kitni baar.

**App build ke liye (Expo account, free):**
5. expo.dev par account banao -> Settings -> Access Tokens -> naya token banao. Wo main secure form se lunga. Iske bina APK/AAB main yahan nahi bana sakta.

**GitHub:**
6. GitHub account connect karna hoga (ya ek Personal Access Token, "repo" permission ke saath). Naya private repository banakar code push kar dunga.

**Play Store ka purana app (bahut zaroori):**
7. Kya aapki PWABuilder wali app Play Store par already live/testing me hai? Agar haan:
   - Uska exact package name (jaise `com.tanyora.twa`)
   - Uski **signing key** file (`.keystore`) aur uske passwords — PWABuilder zip ke andar milti hai
   - Aakhri versionCode
   Bina same package name + same key ke, naya app purane app ko update nahi kar payega; Play Console me naya app banana padega.

**Baaki:**
8. Asli support email (tanyora@support.com aapka hai ya nahi?).
9. Privacy policy URL: app.tanyora.com/privacy (pehle se bana hai). AdMob ki wajah se usme ads wala hissa jodna padega — main kar dunga.

## 6. Kaam ka order (jab aap "build karo" bolo)

1. App ka naya design aur saari screens banana (`mobile/` folder me).
2. Database se login, files, upload, share, report, contact, delete account jodna.
3. Logo, icon, splash lagana.
4. AdMob lagana (pehle test ads).
5. Private GitHub repository banakar push.
6. Expo ke cloud par APK (phone par test ke liye) banana, link aapko dunga.
7. Aap phone par test karo, jo theek karna ho batao.
8. Phir AAB (Play Store ke liye) banana, asli ad IDs ke saath.

Time: Pehle APK tak kaafi bada kaam hai, thode rounds lagenge. Har build Expo ke cloud par 10-20 minute leta hai.

## 7. Dhyan rakhne wali baatein

- Website par koi badlav nahi hoga.
- Video rotate, ads aur file upload asli phone par hi poori tarah check honge — main yahan sirf code aur build check kar sakta hoon.
- Play Store par naye account ke liye 12 testers x 14 din wala Google rule lagega.

## Technical details

- Expo SDK 54 + expo-router, TypeScript, existing `mobile/` codebase (separate from `src/`, never imported into the website).
- Data: Supabase JS client with AsyncStorage session against the self-hosted VPS backend (app.tanyora.com/backend); URL/key via EXPO_PUBLIC_* env in eas.json, no hardcoded URLs. Same RLS-protected tables as web (files, reports, contact_messages, profiles). Uploads to Cloudflare R2 via the existing upload path; account deletion via `/api/public/delete-account` (bearer auth).
- Shared fetching only via existing APIs; view counting on actual play/load, owner excluded, same as web.
- Libraries: expo-video (custom controls, no native download), expo-document-picker, expo-sharing/Share API, expo-clipboard, expo-screen-orientation, react-native-google-mobile-ads (config plugin with App ID), @tanstack/react-query for caching, expo-image.
- Android: intent filter only for `https://tanyora.com/s/*`; package name and versionCode set from the existing Play listing; upload keystore supplied to EAS credentials.
- Builds: `eas build -p android --profile preview` (APK) and `--profile production` (AAB) using EXPO_TOKEN secret; GitHub push via connector/token to a new private repo containing only `mobile/` (or full repo — to confirm).
- Remove the old Capacitor config and Google Sign-In package from the mobile app (login is email/password only).
