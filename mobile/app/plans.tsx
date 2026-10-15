import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "../components/ui";
import { Motion } from "../components/Motion";
import { useProfile } from "../lib/useProfile";
import { currentPlan } from "../lib/account-rules";
import { EXTERNAL_UPGRADES, WEB_URL } from "../lib/config";
import { theme } from "../lib/theme";
import { PaymentAction } from "../components/AccountUI";

export default function Plans() {
  const { profile } = useProfile();
  const active = currentPlan(profile);
  return <Screen title="Premium" back><ScrollView contentContainerStyle={s.wrap}>
    <Motion><Text style={s.title}>Room for more.</Text><Text style={s.sub}>Your files, all in one place.</Text></Motion>
    {[
      { name: "Free", storage: "1 GB storage", icon: "cloud-outline" as const },
      { name: "Plus", storage: "100 GB storage", icon: "sparkles-outline" as const },
      { name: "Pro", storage: "1 TB storage", icon: "diamond-outline" as const },
    ].map((plan, i) => <Motion key={plan.name} delay={i * 60}><View style={[s.plan, plan.name === active.name && s.selected]}>
      <Ionicons name={plan.icon} size={26} color={theme.primary} />
      <View style={{ flex: 1 }}><Text style={s.name}>{plan.name}</Text><Text style={s.sub}>{plan.storage}</Text></View>
      {plan.name === active.name && <Text style={s.current}>Current</Text>}
    </View></Motion>)}
    {active.tier !== "free" && profile?.premium_until && <Text style={s.note}>Active until {new Date(profile.premium_until).toLocaleDateString("en-GB")}</Text>}
    <PaymentAction target="plans" label="Upgrade plan on website" />
    {!EXTERNAL_UPGRADES && <Text style={s.note}>Existing plans sync automatically.</Text>}
  </ScrollView></Screen>;
}
const s = StyleSheet.create({
  wrap: { padding: 20, gap: 16 }, title: { fontSize: 30, fontWeight: "800", color: theme.text }, sub: { color: theme.muted, fontSize: 14, marginTop: 5 },
  plan: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 8 },
  selected: { borderColor: theme.primary }, name: { color: theme.text, fontSize: 20, fontWeight: "700" }, current: { color: theme.primary, fontSize: 12, fontWeight: "700" }, note: { color: theme.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
});