import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSession } from "./_layout";
import { supabase } from "../../lib/supabase";
import { RATES } from "../../lib/config";
import { theme } from "../../lib/theme";

type Profile = { balance: number; plan: string; plan_switches: number; referral_earnings: number };

export default function Earnings() {
  const session = useSession();
  const uid = session?.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("balance, plan, plan_switches, referral_earnings")
      .eq("id", uid)
      .single();
    setProfile(data ?? null);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  async function switchPlan(plan: "view" | "referral") {
    if (!profile || plan === profile.plan) return;
    if (profile.plan_switches <= 0) {
      Alert.alert("Limit ho gayi", `Sirf ${RATES.maxPlanSwitches} baar plan badal sakte ho.`);
      return;
    }
    Alert.alert("Plan badalna hai?", plan === "view" ? "View-Based Plan par jaoge" : "Referral Plan par jaoge", [
      { text: "Nahi", style: "cancel" },
      {
        text: "Haan",
        onPress: async () => {
          const { error } = await supabase.rpc("switch_plan", { _plan: plan });
          if (error) Alert.alert("Fail", error.message);
          else {
            Alert.alert("Plan badal gaya ✅");
            load();
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balance}>${(profile?.balance ?? 0).toFixed(2)}</Text>
        <Text style={styles.balanceNote}>
          Withdrawal ke liye minimum ${RATES.minWithdrawal} chahiye. Withdrawal system jald aa raha hai.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>2 Earning Plans</Text>

      <View style={[styles.planCard, profile?.plan === "view" && styles.planActive]}>
        <Text style={styles.planName}>1. View-Based Plan</Text>
        <Text style={styles.planRate}>${RATES.viewPer1000} per 1000 views</Text>
        <Text style={styles.planDesc}>
          Aapki file ka share link jitni baar khulega, utne views ginenge — har 1000 views par ${RATES.viewPer1000}.
        </Text>
        {profile?.plan === "view" ? (
          <Text style={styles.currentBadge}>Current Plan ✓</Text>
        ) : (
          <Pressable style={styles.switchButton} onPress={() => switchPlan("view")}>
            <Text style={styles.switchButtonText}>Is par switch karo</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.planCard, profile?.plan === "referral" && styles.planActive]}>
        <Text style={styles.planName}>2. Signup Referral Plan</Text>
        <Text style={styles.planRate}>${RATES.referralSignup} per signup</Text>
        <Text style={styles.planDesc}>
          Aapka referral link use karke jo naya account banega, har signup par ${RATES.referralSignup} milega.
        </Text>
        {profile?.plan === "referral" ? (
          <Text style={styles.currentBadge}>Current Plan ✓</Text>
        ) : (
          <Pressable style={styles.switchButton} onPress={() => switchPlan("referral")}>
            <Text style={styles.switchButtonText}>Is par switch karo</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.note}>
        Plan switches bache: {profile?.plan_switches ?? RATES.maxPlanSwitches} (maximum {RATES.maxPlanSwitches}).{"\n"}
        Referral commission: referred user ki view earnings ka {RATES.commission * 100}%.{"\n"}
        Earnings prototype settings par hain — yeh income ki guarantee nahi hai.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingTop: 60, gap: 14, paddingBottom: 40 },
  title: { color: theme.text, fontSize: 24, fontWeight: "800" },
  balanceCard: { backgroundColor: theme.primaryDark, borderRadius: 16, padding: 20 },
  balanceLabel: { color: "#DBEAFE", fontSize: 13 },
  balance: { color: "#fff", fontSize: 34, fontWeight: "800", marginVertical: 4 },
  balanceNote: { color: "#DBEAFE", fontSize: 12 },
  sectionTitle: { color: theme.text, fontSize: 17, fontWeight: "700", marginTop: 6 },
  planCard: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  planActive: { borderColor: theme.primary, borderWidth: 2 },
  planName: { color: theme.text, fontSize: 16, fontWeight: "700" },
  planRate: { color: theme.primary, fontSize: 15, fontWeight: "800" },
  planDesc: { color: theme.muted, fontSize: 13 },
  currentBadge: { color: theme.success, fontWeight: "700", marginTop: 4 },
  switchButton: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 6,
  },
  switchButtonText: { color: "#fff", fontWeight: "700" },
  note: { color: theme.muted, fontSize: 12, lineHeight: 18 },
});
