import { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { Stack, router, usePathname, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import mobileAds from "react-native-google-mobile-ads";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";
import { sharedDestination } from "../lib/account-rules";

const SessionContext = createContext<Session | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => useContext(SessionContext);

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();
  const pathname = usePathname();
  const [pendingFile, setPendingFile] = useState<`/s/${string}` | null>(null);

  useEffect(() => {
    mobileAds().initialize().catch(() => {});
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Signed-out users start at login; shared links (/s/...) stay reachable after login.
  useEffect(() => {
    if (!ready) return;
    const atLogin = segments[0] === "(auth)";
    if (!session && !atLogin) {
      setPendingFile(sharedDestination(pathname));
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
