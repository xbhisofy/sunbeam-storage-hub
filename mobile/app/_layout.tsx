import { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import mobileAds from "react-native-google-mobile-ads";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";

const SessionContext = createContext<Session | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => useContext(SessionContext);

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();

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
    if (!session && !atLogin) router.replace("/login");
    else if (session && atLogin) router.replace("/(tabs)");
  }, [ready, session, segments]);

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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg }, animation: "slide_from_right" }} />
    </SessionContext.Provider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.card },
  logo: { width: 96, height: 96, borderRadius: 24 },
});
