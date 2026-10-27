import { useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "../../components/ui";
import { useSession } from "../_layout";
import { supabase } from "../../lib/supabase";
import { LEGAL, WEB_URL } from "../../lib/config";
import { profileTheme as theme } from "../../lib/profile-theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFiles } from "../../lib/useFiles";
import { formatSize } from "../../lib/files";
import { Motion } from "../../components/Motion";
import { useProfile } from "../../lib/useProfile";
import { currentPlan } from "../../lib/account-rules";


export default function ProfileScreen() {
  const session = useSession();
  const { profile: p, error, reload } = useProfile();
  const [busy, setBusy] = useState(false);

  const name = p?.display_name || (session?.user.user_metadata?.display_name as string) || "Tanyora user";
  const email = session?.user.email || p?.email || "";
  const plan = currentPlan(p);
  const { files, loading: filesLoading, error: filesError, reload: reloadFiles } = useFiles();
  const avatar = session?.user.user_metadata?.avatar_url;
  const avatarUrl = typeof avatar === "string" && avatar.startsWith("https://") ? avatar : null;

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

  const descriptions: Record<string, { text: string; icon: keyof typeof Ionicons.glyphMap }> = {
    "/privacy": { text: "Learn how we protect your data", icon: "document-text-outline" },
    "/terms": { text: "Read our terms and conditions", icon: "document-text-outline" },
    "/community-guidelines": { text: "Rules for a safe community", icon: "shield-checkmark-outline" },
    "/copyright": { text: "Report copyright issues", icon: "at-circle-outline" },
    "/faq": { text: "Find answers to common questions", icon: "help-circle-outline" },
  };
  const Row = ({ icon, label, text, on, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; text: string; on: () => void; last?: boolean }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={on} style={({ pressed }) => [s.row, pressed && s.pressed]}>
      <View style={s.rowIcon}><Ionicons name={icon} size={23} color={theme.primary} /></View>
      <View style={[s.rowCopy, !last && s.rowBorder]}><Text style={s.rowText}>{label}</Text><Text style={s.rowDescription}>{text}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );
  const summary: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string; background: string }[] = [
    { label: "Current Plan", value: `${plan.name} Plan`, icon: "ribbon-outline", color: theme.primary, background: theme.storage },
    { label: "Total Storage", value: formatSize(plan.storage), icon: "pie-chart-outline", color: theme.categories.image.foreground, background: theme.categories.image.background },
    { label: "Your Files", value: filesLoading || filesError ? "—" : `${files.length} Files`, icon: "folder-outline", color: theme.categories.video.foreground, background: theme.categories.video.background },
    { label: "Shared Links", value: filesLoading || filesError ? "—" : `${files.length} Links`, icon: "share-social-outline", color: theme.categories.audio.foreground, background: theme.categories.audio.background },
  ];
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.header}><Text style={s.brand}>Tanyora</Text><Text style={s.tagline}>Cloud for Everyone</Text></View>
        <Motion><View style={s.profileCard}>
          <View style={s.avatarWrap}><View style={s.avatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={s.avatarImage} resizeMode="cover" /> : <Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text>}</View><Pressable accessibilityRole="button" accessibilityLabel="Edit profile" onPress={() => router.push("/edit-profile")} style={s.avatarEdit}><Ionicons name="create-outline" size={19} color={theme.onPrimary} /></Pressable></View>
          <View style={s.identity}><View style={s.plan}><Ionicons name="ribbon-outline" size={13} color={theme.gold} /><Text style={s.planText}>{plan.name} Plan</Text></View><Text style={s.name} numberOfLines={2}>{name}</Text><Text style={s.email} numberOfLines={2}>{email}</Text></View>
        </View></Motion>
        <View style={s.summary}>{summary.map(item => <View key={item.label} style={s.summaryCard}><View style={[s.summaryIcon, { backgroundColor: item.background }]}><Ionicons name={item.icon} size={22} color={item.color} /></View><Text style={s.summaryValue}>{item.value}</Text><Text style={s.summaryLabel}>{item.label}</Text></View>)}</View>
        {error && <Pressable accessibilityRole="button" onPress={reload}><Text style={s.error}>{error}</Text></Pressable>}
        {filesError && <Pressable accessibilityRole="button" onPress={reloadFiles}><Text style={s.error}>{filesError}</Text></Pressable>}
        <Motion delay={60}><View style={s.settings}>
          <Row icon="person-outline" label="Edit Profile" text="Change your name or email" on={() => router.push("/edit-profile")} />
          <Row icon="chatbubble-outline" label="Contact Support" text="Get help from our support team" on={() => router.push("/contact")} />
          {LEGAL.map((l, index) => <Row key={l.path} icon={descriptions[l.path]?.icon ?? "document-text-outline"} label={l.label} text={descriptions[l.path]?.text ?? "Read our policies"} last={index === LEGAL.length - 1} on={() => Linking.openURL(`${WEB_URL}${l.path}`)} />)}
        </View></Motion>
        <Button label="Log out" icon="log-out-outline" variant="outline" onPress={logout} style={s.logout} />
        <Button label="Delete account" icon="trash-outline" variant="danger" onPress={deleteAccount} busy={busy} style={s.delete} />
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 10, width: "100%", maxWidth: 760, alignSelf: "center" },
  header: { gap: 3, paddingHorizontal: 4, marginBottom: 4 }, brand: { fontSize: 24, fontWeight: "800", color: theme.text }, tagline: { fontSize: 13, color: theme.muted },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.surface, borderRadius: 20, padding: 16, minHeight: 116 }, avatarWrap: { width: 76, height: 80 }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: theme.storage, alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: 76, height: 76 }, avatarText: { fontSize: 34, fontWeight: "700", color: theme.primary }, avatarEdit: { position: "absolute", bottom: -4, right: -6, width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: theme.surface, alignItems: "center", justifyContent: "center", backgroundColor: theme.primary }, identity: { flex: 1, minWidth: 0, gap: 6 },
  name: { fontSize: 21, fontWeight: "700", color: theme.text }, email: { fontSize: 12, lineHeight: 18, color: theme.muted }, plan: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: theme.background }, planText: { fontSize: 11, fontWeight: "600", color: theme.primary },
  summary: { flexDirection: "row", gap: 5 }, summaryCard: { flex: 1, minWidth: 0, backgroundColor: theme.surface, borderRadius: 16, paddingHorizontal: 3, paddingVertical: 10, alignItems: "center", gap: 4 }, summaryIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, summaryValue: { fontSize: 12, color: theme.text, fontWeight: "600", textAlign: "center" }, summaryLabel: { fontSize: 10, lineHeight: 14, color: theme.muted, textAlign: "center" },
  settings: { paddingHorizontal: 12, backgroundColor: theme.surface, borderRadius: 20 }, row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 62 }, rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.storage, alignItems: "center", justifyContent: "center" }, rowCopy: { flex: 1, minWidth: 0, paddingVertical: 12, gap: 3 }, rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.border }, rowText: { fontSize: 13, fontWeight: "600", color: theme.text }, rowDescription: { fontSize: 11, lineHeight: 16, color: theme.muted },
  logout: { backgroundColor: theme.storageStart, borderColor: theme.track, borderRadius: 14 }, delete: { backgroundColor: theme.dangerBackground, borderColor: theme.dangerBorder, borderRadius: 14 }, error: { color: theme.danger, paddingVertical: 8 }, pressed: { opacity: 0.7 },
});
