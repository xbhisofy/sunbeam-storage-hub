import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

// Cap system font scaling so large display/font settings do not blow up buttons and layouts.
type Scalable = { defaultProps?: { maxFontSizeMultiplier?: number } };
for (const C of [Text, TextInput] as unknown as Scalable[]) C.defaultProps = { ...(C.defaultProps ?? {}), maxFontSizeMultiplier: 1.15 };
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
import { Stack, router, usePathname, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import type { Session } from "@supabase/supabase-js";
import mobileAds from "react-native-google-mobile-ads";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";
import { sharedDestination } from "../lib/account-rules";
import { setupNotifications } from "../lib/notifications";
import { shareDestinationFromUrl } from "../lib/share-navigation";

const SessionContext = createContext<Session | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => useContext(SessionContext);

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();
  const pathname = usePathname();
  const [pendingFile, setPendingFile] = useState<`/s/${string}` | null>(null);
  const sessionRef = useRef<Session | null>(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    mobileAds().initialize().catch(() => {});
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Ask for notification permission once the user is signed in.
  useEffect(() => { if (session) void setupNotifications().catch(() => {}); }, [session?.user.id]);

  // Shared links (https://tanyora.com/s/<slug> or tanyora://s/<slug>) must open
  // the shared file itself — never just the app home. Handles both a cold start
  // from a link and a link tapped while the app is already open.
  useEffect(() => {
    const openShared = (url: string | null) => {
      if (!url) return;
      const destination = shareDestinationFromUrl(url);
      if (!destination) return;
      if (sessionRef.current) router.push({ pathname: "/s/[slug]", params: { slug: destination.slice(3) } });
      else setPendingFile(destination);
    };
    Linking.getInitialURL().then(openShared).catch(() => {});
    const sub = Linking.addEventListener("url", ({ url }) => openShared(url));
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signed-out users start at login; shared links (/s/...) stay reachable after login.
  useEffect(() => {
    if (!ready) return;
    const atLogin = segments[0] === "(auth)";
    if (!session && !atLogin) {
      const destination = sharedDestination(pathname);
      if (destination) setPendingFile(destination);
      router.replace("/login");
    } else if (session && atLogin) {
      const destination = pendingFile;
      setPendingFile(null);
      if (destination) router.replace({ pathname: "/s/[slug]", params: { slug: destination.slice(3) } });
      else router.replace("/(tabs)");
    }
  }, [ready, session, segments, pathname, pendingFile]);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Image source={require("../assets/icon.png")} style={styles.logo} />
        <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg }, animation: "slide_from_right", animationDuration: 250 }} />
    </SessionContext.Provider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.card },
  logo: { width: 96, height: 96, borderRadius: 24 },
});
