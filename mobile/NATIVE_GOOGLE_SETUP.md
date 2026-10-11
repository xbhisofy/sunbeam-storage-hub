# Tanyora: native Android Google login

## What is prepared

The Android app uses Google's native account chooser, not a browser OAuth page.
It exchanges the Google ID token with the same authentication backend as the
website. The backend must accept the owner's Web OAuth client ID before login
can work. The current website Google login is unchanged.

Native login cannot be tested in Expo Go or the existing PWABuilder APK. A new
Android build and real device test are required. No APK or AAB has been built
by these code changes.

## Owner setup required

1. Create a Google Cloud project and configure its OAuth consent details for
   Tanyora. Request only basic identity: openid, email and profile.
2. Create a Web OAuth client. In Lovable Cloud → Users → Authentication
   settings → Google, use the owner-credentials option and its displayed
   callback URL. Set the Web client ID and secret there, not in chat or source.
   Changing provider credentials also affects website login: retest both.
3. Set the non-secret Web client ID as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in
   the Expo build environment. Do not put a Google client secret in the app.
4. Register an Android OAuth client for
   `app.lovable.sunbeam_storage_hub.twa` and the actual APK signing certificate
   SHA-1. Register the Play App Signing SHA-1 separately for store releases if
   it differs. The supplied assetlinks SHA-256 is not the required SHA-1.
5. Link the project to the owner's Expo account, then build on Expo's cloud
   using the existing preview (APK) or production (AAB) build profiles.
   EAS performs native generation; local Android Studio is not necessary.
6. Test account chooser success, cancel, offline failure, returning users,
   website/app account ID equality, profile and files, and sign-out on a phone.

## Keep the existing app identity

The Android package matches the supplied PWABuilder app to preserve the option
of an update instead of creating another app. An update additionally needs the
correct signing/upload key and a versionCode above the existing release (2 is
only a starting value). Never share the keystore/password in chat. Configure
signing securely in the owner's build service.

Do not replace the site's existing assetlinks certificate with an invented
native certificate. After building, verify the actual certificate. Keep
relevant existing fingerprints when adding a new approved signing certificate.

## Important boundaries

The native login flow does not open a browser, but links deliberately opened
outside the app (for example legal pages) can still show browser addresses.
The installed native app is separate from the website presentation. Existing
native screens have not all been redesigned to match the new web app shell.
Google may ask for additional consent or account verification; do not suppress
Google's security screens or disable validation to avoid them.