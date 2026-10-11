import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "../_layout";
import { supabase } from "../../lib/supabase";
import { RATES } from "../../lib/config";
import { theme } from "../../lib/theme";

type Profile = { display_name: string | null; balance: number; plan: string; referral_earnings: number };

export default function Home() {
  const session = useSession();
  const uid = session?.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ files: 0, views: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data: p } = await supabase
      .from("profiles")
      .select("display_name, balance, plan, referral_earnings")
      .eq("id", uid)
      .single();
    setProfile(p ?? null);
    const { data: files } = await supabase.from("files").select("views").eq("owner_id", uid);
    setStats({
      files: files?.length ?? 0,
      views: (files ?? []).reduce((sum, f) => sum + (f.views ?? 0), 0),
    });
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <Text style={styles.hello}>
        Namaste, {profile?.display_name ?? session?.user.email ?? "dost"} 👋
      </Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balance}>${(profile?.balance ?? 0).toFixed(2)}</Text>
        <Text style={styles.plan}>Plan: {profile?.plan === "referral" ? "Referral ($0.10/signup)" : "View-Based ($3/1000 views)"}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats.files}</Text>
          <Text style={styles.cardLabel}>Files</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats.views}</Text>
          <Text style={styles.cardLabel}>Total Views</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>${(profile?.referral_earnings ?? 0).toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Referral Earnings</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>${RATES.minWithdrawal}</Text>
          <Text style={styles.cardLabel}>Min. Withdrawal</Text>
        </View>
      </View>

      <Pressable style={styles.action} onPress={() => router.push("/(tabs)/content")}>
        <Text style={styles.actionText}>＋ Upload ya Convert Link</Text>
      </Pressable>
      <Pressable style={[styles.action, styles.secondary]} onPress={() => router.push("/(tabs)/earnings")}>
        <Text style={[styles.actionText, { color: theme.primary }]}>View earnings</Text>
      </Pressable>

      <Text style={styles.note}>
        Earn from every view on your share links. Your account works on both the website and the app.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingTop: 60, gap: 14 },
  hello: { color: theme.text, fontSize: 22, fontWeight: "800" },
  balanceCard: {
    backgroundColor: theme.primaryDark,
    borderRadius: 16,
    padding: 20,
  },
  balanceLabel: { color: "#DBEAFE", fontSize: 13 },
  balance: { color: "#fff", fontSize: 34, fontWeight: "800", marginVertical: 4 },
  plan: { color: "#DBEAFE", fontSize: 12 },
  row: { flexDirection: "row", gap: 14 },
  card: {
    flex: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardValue: { color: theme.text, fontSize: 20, fontWeight: "800" },
  cardLabel: { color: theme.muted, fontSize: 12, marginTop: 4 },
  action: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  secondary: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.primary },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  note: { color: theme.muted, fontSize: 12, textAlign: "center", marginTop: 8 },
});
