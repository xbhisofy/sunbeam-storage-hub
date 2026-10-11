# Tanyora Android App — 0 se Play Store tak (poora safar)

App ka poora code **`mobile/`** folder me hai (React Native + Expo). Yeh guide
aapko step-by-step le jaati hai — pehle phone par test, phir AAB file, phir
Play Store publish. Aapko coding NAHI aani chahiye — sirf copy-paste aur
buttons.

**Important:** Website aur app dono ka **database same hai** (Lovable Cloud).
Website par jo bhi account/files/earnings hain, wahi app me dikhenge.

---

## Step 0 — Pehle phone par FREE me test karo (koi computer nahi chahiye)

**Naya update:** Native Google login ab code mein hai. Iske liye
`NATIVE_GOOGLE_SETUP.md` wala owner setup aur nayi APK chahiye; Expo Go mein
ye native package nahi chalega. Purani PWABuilder APK isse update nahi hoti.

1. Apne phone me **Expo Go** app install karo (Play Store me "Expo Go" search karo).
2. Aapke phone me Android 6 ya naya hona chahiye (aajkal ke sab phones me hota hai).
3. Jab maine (ya tumne) app ka dev server chalaya hoga, tab QR code scan karke app turant chalegi.

> Yeh step optional hai — seedha Step 1 se bhi kaam chal sakta hai.

## Step 1 — Computer par 2 cheezein install karo (ek baar)

1. **Node.js** download karo: https://nodejs.org → **LTS** version → install
   (sab Next-Next karte jao).
2. Terminal/Command Prompt kholo (Windows me Start menu me "cmd" likho) aur yeh
   command chalao:
   ```
   npm install -g eas-cli
   ```
3. Free Expo account banao: https://expo.dev/signup
4. Terminal me login karo:
   ```
   eas login
   ```

## Step 2 — Project ka app wala hissa ready karo

Terminal me project ke `mobile/` folder me jao (folder jahan se code download
kiya hai):
```
cd mobile
npm install
npx expo install --fix
```

> Agar `npm install` me koi error aaye, ghabrao mat — screenshot bhejo, main
> bata dunga.

## Step 3 — Test APK banao (apne phone par chalane ke liye)

```
npm run build:apk
```

- Pehli baar yeh poochhega "project id nahi hai, create karu?" → **Yes**.
- Build **Expo ke cloud computer** par banti hai — aapke PC par kuch heavy
  nahi chalta. 10–20 minute lagte hain.
- Ready hone par ek **link milega** — usse APK download karke phone me install
  karo (phone me "Unknown sources install" allow karna padega).

## Step 4 — Play Store wali AAB file banao

```
npm run build:aab
```

Yeh **AAB** file banata hai — Play Store sirf yehi leta hai (APK nahi).

## Step 5 — Play Console par publish karo

1. **Play Console account** banao: https://play.google.com/console — one-time
   **$25** (credit/debit card).
2. **Create app** → Name: `Tanyora` → App (not game) → Free.
3. **Upload AAB**: Production → Create release → Step 4 wali AAB upload karo.
4. **Store listing** ka sab text ready hai — project me
   `PLAY_STORE_LISTING.md` file kholo aur wahi copy-paste karo.
   - App icon: `mobile/assets/icon.png`
   - Privacy Policy URL: `https://sunbeam-storage-hub.lovable.app/privacy`
5. **Data safety form** ke jawab:
   - Data collected: Email, User IDs, Files (user content)
   - Data shared: No
   - Data encrypted in transit: **Yes**
   - Account deletion: **Yes** — app me aur website par dono jagah "Delete
     Account" button hai.
6. **Content rating** questionnaire: sab questions me "No" (hamari app me
   violence/adult content nahi hai, sirf user-uploaded files hain).
7. **Target audience**: 18+ / teen allowed choose karo, ads ke sawaal me
   sach likhna.
8. **12 testers + 14 din testing**: Naye developer accounts ke liye Google ka
   rule hai — pehle "Internal testing" me app chalani padegi. Yeh rule
   PWABuilder/React Native — kisi se bhi app bane, lagega. Jaldi shuru karo
   taaki 14 din nikal jaayein.
9. Sab forms complete hone par **Submit for review**.

## Common problems aur ilaaj

| Problem | Ilaaj |
|---|---|
| `npm install` error | `npx expo install --fix` chalao, phir dobara |
| Build fail hui | Expo dashboard (expo.dev) par logs dekho ya mujhe error bhejo |
| Google sign-in setup message | `NATIVE_GOOGLE_SETUP.md` ke owner OAuth client, certificate aur build setup poore karo |
| Share link app me nahi khulta | Play Store listing ke baad "App Links" verification setup karenge (assetlinks.json) |

## Ek line me safar

**Node install → eas login → `npm run build:apk` (test) → `npm run build:aab`
→ Play Console me upload + forms → 12 testers, 14 din → Publish.**

Kisi bhi step par atko — **screenshot bhejo**, main agla button bata dunga.
