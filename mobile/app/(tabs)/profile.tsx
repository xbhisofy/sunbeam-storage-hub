import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen, Card, Button } from "../../components/ui";
import { useSession } from "../_layout";
import { supabase } from "../../lib/supabase";
import { LEGAL, WEB_URL } from "../../lib/config";
import { theme } from "../../lib/theme";
import { Motion } from "../../components/Motion";
import { useProfile } from "../../lib/useProfile";
import { currentPlan } from "../../lib/account-rules";
import { ACCOUNT_MENU } from "../../lib/feature-rules";
import type { Href } from "expo-router";


export default function ProfileScreen() {
  const session = useSession();
  const { profile: p, error, reload } = useProfile();
  const [busy, setBusy] = useState(false);

  const name = p?.display_name || (session?.user.user_metadata?.display_name as string) || "Tanyora user";
  const email = session?.user.email || p?.email || "";
  const plan = currentPlan(p);

  function logout() {
    Alert.alert("Log out?", "You can sign in again any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => supabase.auth.signOut({ scope: "local" }) },
    ]);
  }
  function deleteAccount() {
    Alert.alert("Delete account?", "Your account, files and share links will be permanently deleted. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setBusy(true);
        try {
          const res = await fetch(`${WEB_URL}/api/public/delete-account`, { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` } });
          if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Please try again.");
          await supabase.auth.signOut({ scope: "local" });
        } catch (e) { Alert.alert("Deletion failed", e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
      } },
    ]);
  }

  const Row = ({ icon, label, on }: { icon: keyof typeof Ionicons.glyphMap; label: string; on: () => void }) => (
    <Pressable accessibilityRole="button" onPress={on} style={({ pressed }) => [s.row, pressed && { backgroundColor: theme.bg }]}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <Text style={s.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );

  return (
    <Screen title="Profile" right={<Pressable accessibilityLabel="Edit profile" accessibilityRole="button" onPress={() => router.push("/edit-profile")} style={{ padding: 12 }}><Ionicons name="create-outline" size={22} color={theme.primary} /></Pressable>}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <Motion><View style={{ alignItems: "center", gap: 8, paddingVertical: 16 }}>
          <View style={s.avatar}><Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
          <Text style={s.name}>{name}</Text>
          <Text style={{ color: theme.muted }}>{email}</Text>
          <View style={s.plan}>
            <Text style={{ color: theme.primary, fontWeight: "700" }}>{plan.name} plan</Text>
          </View>
          <Text style={{ color: theme.muted, fontSize: 13 }}>Member since {new Date(session?.user.created_at ?? Date.now()).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</Text>
        </View></Motion>
        {error && <Pressable onPress={reload}><Text style={{ color: theme.danger }}>{error}</Text></Pressable>}
        <Motion delay={60}><Card style={{ padding: 4 }}>
          <Row icon="person-outline" label="Edit profile" on={() => router.push("/edit-profile")} />
          <Row icon="sparkles-outline" label="Upgrade plan" on={() => router.push("/plans")} />
          {plan.tier !== "free" && p?.premium_until && <Text style={{ color: theme.muted, paddingHorizontal: 12, paddingBottom: 12 }}>Active until {new Date(p.premium_until).toLocaleDateString("en-GB")}</Text>}
        </Card></Motion>

        <Card style={{ padding: 4 }}>
          {ACCOUNT_MENU.filter(item => ["/earnings", "/wallet", "/oc-bonus", "/referrals"].includes(item.path)).map(item => <Row key={item.path} icon={item.icon} label={item.title} on={() => router.push(item.path as Href)} />)}
          <Row icon="grid-outline" label="All features" on={() => router.push("/menu")} />
        </Card>

        <Card style={{ padding: 4 }}>
          <Row icon="chatbubbles-outline" label="Contact support" on={() => router.push("/contact")} />
          {LEGAL.map((l) => <Row key={l.path} icon="document-text-outline" label={l.label} on={() => Linking.openURL(`${WEB_URL}${l.path}`)} />)}
        </Card>

        <Button label="Log out" icon="log-out-outline" variant="outline" onPress={logout} />
        <Button label="Delete account" icon="trash-outline" variant="danger" onPress={deleteAccount} busy={busy} />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 30, fontWeight: "800", color: theme.primary },
  name: { fontSize: 24, fontWeight: "700", color: theme.text, marginTop: 4, textAlign: "center" },
  plan: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.primarySoft },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  rowText: { flex: 1, fontSize: 15, color: theme.text, fontWeight: "500" },
});
