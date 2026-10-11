import { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, router, useSegments } from "expo-router";
import type { Session } from "@supabase/supabase-js";
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Signed-out users always land on /login; signed-in users go to the app.
  useEffect(() => {
    if (!ready) return;
    const atLogin = segments[0] === "(auth)";
    if (!session && !atLogin) router.replace("/login");
    else if (session && atLogin) router.replace("/(tabs)");
    else if (session && segments.length === 0) router.replace("/(tabs)");
  }, [ready, session, segments]);

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
    </SessionContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
