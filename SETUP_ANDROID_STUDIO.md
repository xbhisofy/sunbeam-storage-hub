# Android Studio — download aur pehli baar setup (step by step)

Yeh guide un logon ke liye hai jinhone kabhi Android Studio nahi chalaya.
Har step chhota hai. Ek-ek karke karo, atko to screenshot bhejo.

## 0. Pehle PC/laptop check karo (2 minute)

Android Studio chalaane ke liye chahiye:

- Windows 10/11 (64-bit), ya Mac, ya Linux
- RAM: 8 GB (16 GB ho to bahut achha)
- Khali jagah: 20 GB (SSD ho to speed achhi)
- Internet: download kareeb 1.2 GB ka hai, setup me aur download honge (total 3-4 GB)

Check kaise karein (Windows):
- `Win + Pause/Break` dabao, ya Settings → System → About — wahan "64-bit operating system" aur RAM likha hoga.

## 1. Download (sirf official site se)

1. Browser me kholo: **https://developer.android.com/studio/install**
   (Doosri kisi bhi site se mat lo — virus/old version ka risk.)
2. Page par bada **"Download Android Studio"** button dikhega.
3. Neeche "Terms and conditions" box hoga — **"I have read and agree..."** wala box tick karo.
4. Phir button dabao — file download hogi:
   - Windows: `android-studio-....exe` (kareeb 1.2 GB)
   - Mac: `.dmg` (Apple silicon / Intel apne chip ke hisaab se chuno)
5. Download hone me internet speed ke hisaab se 10 minute se 1 ghanta lag sakta hai. Ruko mat, chalta rahega.

## 2. Install (Windows)

1. Download hui `.exe` file par double-click karo.
2. "Android Studio Setup Wizard" khulega → **Next** dabao.
3. Components screen: **Android Virtual Device** tick rakho → Next.
4. Location: default hi rakho → Next → **Install**.
5. Kuch der chalega (kuch minutes se aadha ghanta). Ho jaye to **Next** → **Finish**.
   (Studio khud khul jayega.)

Mac ho to: `.dmg` kholo, Android Studio icon ko **Applications** folder me drag karo, phir Applications se kholo.
Pehli baar "downloaded from internet" ka warning aaye to: right-click → **Open**.

## 3. Pehla setup (Studio khulte hi)

1. "Would you like to send usage statistics?" → **No** chuno → **Continue**.
2. Setup Wizard → **Standard** chuno → **Continue**.
3. Theme: **Darcula** (dark) ya **IntelliJ Light** (white) — jo pasand ho → **Continue**.
4. Ab Android SDK aur extra components download honge — yeh **sabse lamba step** hai
   (10-40 minute). Neeche progress bar dikhega. Laptop mat band karo.
5. Ho jaye to **Finish** dabao — Android Studio ka home screen dikh jayega.

## 4. Ho gaya? Yeh check karo

Studio ke home screen par ye dikhna chahiye:
- **"Welcome to Android Studio"** ya "Open" / "New Project" ke options.

Agar yeh dikh raha hai, to Studio taiyar hai. Aage ka kaam (project kholna, AAB banana)
`ANDROID_APP_GUIDE.md` me likha hai.

## 5. Common problems

| Problem | Kya karein |
|---|---|
| Download bahut slow | Download resume karo, ya raat me chhod do |
| "This PC can't run Android Studio" | RAM 8 GB se kam hai — 16 GB lagao, ya kisi achhe PC par kaam karo |
| Install atak gaya | Antivirus kuch der band karo, phir dobara chalao |
| SDK download fail | Internet stable karo, Studio restart karo, setup dobara chalao |
| Disk full | 20 GB khali karo (SSD best) |

## 6. Zaroori baatein

- Android Studio **free** hai — koi paisa nahi lagta.
- Play Store par app daalne ke liye **Google Play Developer account** chahiye — $25 ek baar.
  Wo account alag se banana hai: https://play.google.com/console
- App ki file (AAB) **sirf aapke computer par** banegi. Main yahan se bana nahi sakta —
  mere paas woh button nahi hai. Main sirf code aur steps ready rakhta hoon.
- Har step ke baad screenshot bhejo — main samjha dunga ki aage kya dabana hai.
