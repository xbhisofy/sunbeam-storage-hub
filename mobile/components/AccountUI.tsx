import type { ReactNode } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "./ui";
import { Motion } from "./Motion";
import { theme } from "../lib/theme";
import { WEB_URL } from "../lib/config";
import { canOpenPayment } from "../lib/feature-rules";

export const accountStyles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", color: theme.text },
  section: { fontSize: 18, fontWeight: "700", color: theme.text, marginTop: 8 },
  text: { color: theme.muted, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: theme.border },
  name: { color: theme.text, fontSize: 15, fontWeight: "600", flexShrink: 1 },
  value: { color: theme.text, fontSize: 17, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});

export function AccountPage({ title, children, loading, error, reload }: { title: string; children: ReactNode; loading?: boolean; error?: string | null; reload: () => void }) {
  return <Screen title={title} back right={<Button label="Menu" icon="grid-outline" variant="outline" onPress={() => router.push("/menu")} style={{ height: 40 }} />}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 48 }}>
      {loading && <ActivityIndicator color={theme.primary} />}
      {error && <View style={{ gap: 10 }}><Text style={{ color: theme.danger }}>{error}</Text><Button label="Try again" onPress={reload} variant="outline" /></View>}
      {!loading && !error && children}
    </ScrollView>
  </Screen>;
}

export function Metric({ label, value, icon, accent = false }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; accent?: boolean }) {
  return <View style={{ flexGrow: 1, flexBasis: "44%", padding: 16, gap: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: accent ? theme.primarySoft : theme.card, borderRadius: 8 }}>
    <Ionicons name={icon} size={22} color={theme.primary} /><Text style={accountStyles.text}>{label}</Text><Text style={{ fontSize: 24, fontWeight: "800", color: theme.text }}>{value}</Text>
  </View>;
}

export function PaymentAction({ target, label }: { target: "wallet" | "plans" | "earnings"; label: string }) {
  const allowed = canOpenPayment(target, process.env.EXPO_PUBLIC_DISTRIBUTION ?? "play");
  if (!allowed) return <Text style={accountStyles.text}>In-app purchases are not available in this edition.</Text>;
  return <Button label={label} icon="open-outline" onPress={() => {
    Alert.alert("Continue in your browser", "Sign in with the same account. Your account will refresh when you return.", [
      { text: "Cancel", style: "cancel" },
      { text: "Continue", onPress: () => { void Linking.openURL(`${WEB_URL}/${target}`).catch(() => Alert.alert("Could not open browser", "Please try again.")); } },
    ]);
  }} />;
}

export function Status({ value }: { value: string }) {
  return <Text style={{ color: ["success", "paid", "completed", "approved"].includes(value) ? theme.success : ["failed", "rejected"].includes(value) ? theme.danger : theme.muted, fontSize: 12, fontWeight: "700", textTransform: "capitalize", flexShrink: 1 }}>{value.replace(/_/g, " ")}</Text>;
}

export function DailyActivity({ rows, money }: { rows: { day: string; views?: number; amount?: number | string }[]; money?: boolean }) {
  const groups = new Map<string, number>();
  rows.forEach(r => groups.set(r.day, (groups.get(r.day) ?? 0) + Number(money ? r.amount ?? 0 : r.views ?? 0)));
  const values = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const max = Math.max(1, ...values.map(v => v[1]));
  return <Motion>{values.length ? values.map(([day, amount]) => <View key={day} style={{ gap: 6, marginBottom: 14 }}><View style={accountStyles.row}><Text style={accountStyles.text}>{new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Text><Text style={accountStyles.name}>{money ? `$${amount.toFixed(4)}` : amount.toLocaleString()}</Text></View><View style={{ height: 4, backgroundColor: theme.primaryTrack }}><View style={{ height: 4, width: `${amount / max * 100}%`, backgroundColor: theme.primary }} /></View></View>) : <Text style={accountStyles.text}>No activity in this period yet.</Text>}</Motion>;
}