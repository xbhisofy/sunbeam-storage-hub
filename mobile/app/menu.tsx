import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Screen } from "../components/ui";
import { Motion } from "../components/Motion";
import { ACCOUNT_MENU } from "../lib/feature-rules";
import { useProfile } from "../lib/useProfile";
import { currentPlan } from "../lib/account-rules";
import { theme } from "../lib/theme";

export default function Menu() {
  const { profile } = useProfile();
  return <Screen title="Menu" back><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
    <View style={s.account}><Image source={require("../assets/icon.png")} style={{ height: 48, width: 48, borderRadius: 8 }} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={s.name}>{profile?.display_name || "Your account"}</Text><Text style={s.muted}>{currentPlan(profile).name} plan</Text></View></View>
    {["Workspace", "Account"].map((group, i) => <Motion key={group} delay={i * 60}><Text style={s.group}>{group}</Text>{ACCOUNT_MENU.filter(item => item.group === group).map(item => <Pressable accessibilityRole="button" key={item.title} onPress={() => router.push(item.path as Href)} style={({ pressed }) => [s.row, pressed && { backgroundColor: theme.primarySoft }]}><View style={s.icon}><Ionicons name={item.icon} size={21} color={theme.primary} /></View><Text style={s.label}>{item.title}</Text><Ionicons name="chevron-forward" size={17} color={theme.muted} /></Pressable>)}</Motion>)}
    <Pressable accessibilityRole="button" onPress={() => router.push("/shared")} style={s.row}><View style={s.icon}><Ionicons name="share-social-outline" size={21} color={theme.primary} /></View><Text style={s.label}>Shared links</Text><Ionicons name="chevron-forward" size={17} color={theme.muted} /></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push("/contact")} style={s.row}><View style={s.icon}><Ionicons name="chatbubbles-outline" size={21} color={theme.primary} /></View><Text style={s.label}>Contact support</Text><Ionicons name="chevron-forward" size={17} color={theme.muted} /></Pressable>
  </ScrollView></Screen>;
}
const s = StyleSheet.create({
  account: { flexDirection: "row", gap: 14, alignItems: "center", borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 24 },
  name: { color: theme.text, fontSize: 20, fontWeight: "700" }, muted: { color: theme.muted, fontSize: 13, marginTop: 5 },
  group: { color: theme.muted, fontSize: 12, textTransform: "uppercase", fontWeight: "700", marginTop: 24, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 58, borderBottomWidth: 1, borderColor: theme.border },
  icon: { width: 36, height: 36, borderRadius: 8, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  label: { flex: 1, color: theme.text, fontSize: 16, fontWeight: "600" },
});