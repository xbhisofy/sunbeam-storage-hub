import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSession } from "../_layout";
import { supabase } from "../../lib/supabase";
import { SITE_URL } from "../../lib/config";
import { theme } from "../../lib/theme";

export default function Referrals() {
  const session = useSession();
  const uid = session?.user.id;
  const [code, setCode] = useState("");
  const [invited, setInvited] = useState(0);
  const [earnings, setEarnings] = useState(0);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data: p } = await supabase
      .from("profiles")
      .select("referral_code, referral_earnings")
      .eq("id", uid)
      .single();
    if (p) {
      setCode(p.referral_code);
      setEarnings(Number(p.referral_earnings));
    }
    const { data: count } = await supabase.rpc("my_referral_count");
    if (typeof count === "number") setInvited(count);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  const link = `${SITE_URL}/?ref=${code}`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Referrals</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Aapka Referral Code</Text>
        <Text style={styles.code}>{code || "..."}</Text>
        <Pressable
          style={styles.button}
          onPress={async () => {
            await Clipboard.setStringAsync(link);
          }}
        >
          <Text style={styles.buttonText}>📋 Referral Link Copy karo</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.statValue}>${earnings.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Referral Earnings</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.statValue}>{invited}</Text>
          <Text style={styles.cardLabel}>Successfully Invited</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.label, { marginBottom: 8 }]}>Kaise kaam karta hai</Text>
        <Text style={styles.desc}>
          1. Apna referral link dosto ko bhejo.{"\n"}
          2. Woh link kholke naya account banayenge.{"\n"}
          3. Har successful signup par aapko reward milega (agar aapka plan Referral hai).{"\n"}
          4. Aapke referred users ki view earnings ka 10% commission bhi milta hai.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingTop: 60, gap: 14, paddingBottom: 40 },
  title: { color: theme.text, fontSize: 24, fontWeight: "800" },
  card: {
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  label: { color: theme.muted, fontSize: 13 },
  code: {
    color: theme.primary,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 3,
    marginVertical: 8,
    textAlign: "center",
  },
  button: { backgroundColor: theme.primary, borderRadius: 10, padding: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", gap: 14 },
  statValue: { color: theme.text, fontSize: 22, fontWeight: "800" },
  cardLabel: { color: theme.muted, fontSize: 12, marginTop: 4 },
  desc: { color: theme.muted, fontSize: 13, lineHeight: 20 },
});
