# TenBox Android App (Capacitor)

App ID: `com.tenbox.app` — the app loads the live website (`server.url` in capacitor.config.ts), so website and app share one database.

1. Export project to GitHub, clone it, run `npm install`.
2. Publish the website and put the published URL in `capacitor.config.ts` → `server.url`.
3. `npx cap add android` then `npx cap sync android`.
4. In `android/app/src/main/AndroidManifest.xml`, inside the main `<activity>`, add:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="tenbox" android:host="s" />
</intent-filter>
```
5. `npx cap open android` → Android Studio → Build → Generate Signed Bundle (AAB) → upload to Play Console.
