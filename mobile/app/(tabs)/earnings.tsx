import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSession } from "../_layout";
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
      Alert.alert("Limit reached", `You can switch plans only ${RATES.maxPlanSwitches} times.`);
      return;
    }
    Alert.alert("Switch plan?", plan === "view" ? "You will move to the View-Based plan." : "You will move to the Referral plan.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          const { error } = await supabase.rpc("switch_plan", { _plan: plan });
          if (error) Alert.alert("Fail", error.message);
          else {
            Alert.alert("Plan updated");
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
          Minimum withdrawal is ${RATES.minWithdrawal}. Request payouts from the website dashboard.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>2 Earning Plans</Text>

      <View style={[styles.planCard, profile?.plan === "view" && styles.planActive]}>
        <Text style={styles.planName}>1. View-Based Plan</Text>
        <Text style={styles.planRate}>${RATES.viewPer1000} per 1000 views</Text>
        <Text style={styles.planDesc}>
          Earn ${RATES.viewPer1000} for every 1,000 views on your share links.
        </Text>
        {profile?.plan === "view" ? (
          <Text style={styles.currentBadge}>Current Plan ✓</Text>
        ) : (
          <Pressable style={styles.switchButton} onPress={() => switchPlan("view")}>
            <Text style={styles.switchButtonText}>Switch to this plan</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.planCard, profile?.plan === "referral" && styles.planActive]}>
        <Text style={styles.planName}>2. Signup Referral Plan</Text>
        <Text style={styles.planRate}>${RATES.referralSignup} per signup</Text>
        <Text style={styles.planDesc}>
          Earn ${RATES.referralSignup} for every new account created with your referral link.
        </Text>
        {profile?.plan === "referral" ? (
          <Text style={styles.currentBadge}>Current Plan ✓</Text>
        ) : (
          <Pressable style={styles.switchButton} onPress={() => switchPlan("referral")}>
            <Text style={styles.switchButtonText}>Switch to this plan</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.note}>
        Plan switches bache: {profile?.plan_switches ?? RATES.maxPlanSwitches} (maximum {RATES.maxPlanSwitches}).{"\n"}
        Referral commission: {RATES.commission * 100}% of referred users' view earnings.{"\n"}
        Earnings are not guaranteed and depend on genuine views.
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
