import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase";
import { nativeGoogleFlow } from "./native-google-flow";

export async function signInWithNativeGoogle() {
  try {
    return await nativeGoogleFlow({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      configure: options => GoogleSignin.configure(options),
      hasPlayServices: () => GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true }),
      signIn: () => GoogleSignin.signIn(),
      exchange: async token => {
        // Auth validates Google's ID token; this is not a browser OAuth redirect.
        const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token });
        return { error, hasSession: Boolean(data.session) };
      },
    });
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return "cancelled";
      if (error.code === statusCodes.IN_PROGRESS) throw new Error("Google sign-in is already in progress.");
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new Error("Please update Google Play Services on your phone.");
    }
    throw error;
  }
}