import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSession } from "../_layout";
import { supabase } from "../../lib/supabase";
import { BRAND, SITE_URL } from "../../lib/config";
import { theme } from "../../lib/theme";

const LEGAL_LINKS: [string, string][] = [
  ["Privacy Policy", `${SITE_URL}/privacy`],
  ["Terms & Conditions", `${SITE_URL}/terms`],
  ["Delete Account info", `${SITE_URL}/delete-account`],
  ["Contact Support", `${SITE_URL}/contact`],
];

export default function Profile() {
  const session = useSession();
  const uid = session?.user.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", uid)
        .single();
      setName(data?.display_name ?? "");
      setEmail(data?.email ?? session?.user.email ?? "");
    })();
  }, [uid, session]);

  async function saveName() {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", uid!);
    Alert.alert(error ? "Save fail" : "Save ho gaya ✅", error ? error.message : undefined);
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function deleteAccount() {
    Alert.alert(
      "Account delete karna hai?",
      "Aapki saari files aur account PERMANENT delete ho jayenge. Yeh wapas nahi aayega.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Haan, delete karo",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const token = (await supabase.auth.getSession()).data.session?.access_token;
              const res = await fetch(`${SITE_URL}/api/public/delete-account`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? "Account deletion failed");
              }
              await supabase.auth.signOut();
              Alert.alert("Delete ho gaya", "Aapka account permanently delete ho gaya.");
              router.replace("/login");
            } catch (e) {
              Alert.alert("Delete fail", e instanceof Error ? e.message : "Dobara koshish karo");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Naam</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Aapka naam" placeholderTextColor={theme.muted} />
        <Text style={styles.label}>Email</Text>
        <Text style={styles.email}>{email || "..."}</Text>
        <Pressable style={[styles.button, saving && { opacity: 0.6 }]} onPress={saveName} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save karo</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={[styles.label, { marginBottom: 10 }]}>Legal & Support</Text>
        {LEGAL_LINKS.map(([label, url]) => (
          <Pressable key={url} style={styles.linkRow} onPress={() => Linking.openURL(url)}>
            <Text style={styles.linkText}>{label}</Text>
            <Text style={{ color: theme.muted }}>›</Text>
          </Pressable>
        ))}
        <Text style={styles.support}>Support: {BRAND.supportEmail}</Text>
      </View>

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={[styles.buttonText, { color: theme.text }]}>Sign Out</Text>
      </Pressable>
      <Pressable style={styles.delete} onPress={deleteAccount} disabled={deleting}>
        {deleting ? <ActivityIndicator color={theme.danger} /> : <Text style={[styles.buttonText, { color: theme.danger }]}>Delete Account</Text>}
      </Pressable>

      <Text style={styles.footnote}>{BRAND.name} · Website aur app dono me same account aur data.</Text>
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
    gap: 8,
  },
  label: { color: theme.muted, fontSize: 13 },
  input: {
    backgroundColor: theme.bg,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 10,
    color: theme.text,
    padding: 12,
  },
  email: { color: theme.text, fontSize: 15 },
  button: { backgroundColor: theme.primary, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontWeight: "700" },
  linkRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  linkText: { color: theme.primary, fontSize: 14 },
  support: { color: theme.muted, fontSize: 12, marginTop: 6 },
  signOut: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, alignItems: "center" },
  delete: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.danger, borderRadius: 12, padding: 14, alignItems: "center" },
  footnote: { color: theme.muted, fontSize: 12, textAlign: "center" },
});
