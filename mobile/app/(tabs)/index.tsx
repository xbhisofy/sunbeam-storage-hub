import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { Screen, Empty, Button } from "../../components/ui";
import { Motion } from "../../components/Motion";
import { useProfile } from "../../lib/useProfile";
import { currentPlan } from "../../lib/account-rules";
import { FileCard } from "../../components/FileCard";
import { useSession } from "../_layout";
import { useFiles } from "../../lib/useFiles";
import { CATEGORIES, formatSize } from "../../lib/files";
import { ADS } from "../../lib/config";
import { theme } from "../../lib/theme";

export default function Home() {
  const session = useSession();
  const { files, loading, reload } = useFiles();
  const { profile } = useProfile();
  const plan = currentPlan(profile);
  const name = (profile?.display_name || (session?.user.user_metadata?.display_name as string | undefined))?.split(" ")[0] ?? "there";
  const used = files.reduce((n, f) => n + (f.size || 0), 0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 32 }}>
        <Motion><View style={s.brandRow}>
          <View style={s.brandRow}><Image source={require("../../assets/icon.png")} style={s.logo} /><Text style={s.brand}>Tanyora</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push("/profile")} style={s.avatar}><Text style={s.initial}>{name[0]?.toUpperCase()}</Text></Pressable>
        </View></Motion>
        <Motion delay={40}><Text style={s.muted}>{greet}, {name}</Text><Text style={s.h1}>Your cloud.\nAlways with you.</Text></Motion>
        <Motion delay={80}><View style={s.storage}>
          <View style={s.rowHead}><View style={s.brandRow}><Ionicons name="cloud-outline" size={20} color={theme.primary} /><Text style={s.h2}>Storage</Text></View><Text style={s.badge}>{plan.name}</Text></View>
          <Text style={s.used}>{formatSize(used)} <Text style={s.muted}>of {formatSize(plan.storage)} used</Text></Text>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.min(100, Math.round(used / plan.storage * 100)) }} style={s.bar}><View style={[s.fill, { width: `${Math.min(100, (used / plan.storage) * 100)}%` }]} /></View>
          <View style={[s.rowHead, { marginTop: 14 }]}><Text style={s.muted}>{files.length} files</Text><Pressable accessibilityRole="button" onPress={() => router.push("/plans")} style={s.upgrade}><Text style={s.upgradeText}>Upgrade plan</Text><Ionicons name="arrow-up-right-box" size={16} color={theme.primary} /></Pressable></View>
        </View></Motion>
        <Motion delay={120}><View style={s.cats}>
          {CATEGORIES.map((c) => {
            const col = theme.cat[c.kind];
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`${c.label}, ${files.filter((f) => f.file_type === c.kind).length} files`} key={c.kind} onPress={() => router.push({ pathname: "/content", params: { kind: c.kind } })} style={({ pressed }) => [s.cat, { backgroundColor: col.bg }, pressed && { opacity: 0.75 }]}>
                <View style={[s.catIcon, { backgroundColor: col.bg }]}><Ionicons name={c.icon} size={22} color={col.fg} /></View>
                <Text style={s.catText}>{c.label}</Text>
                <Text style={s.muted}>{files.filter((f) => f.file_type === c.kind).length}</Text>
              </Pressable>
            );
          })}
        </View></Motion>
        <Motion delay={160}><View style={s.rowHead}>
          <Text style={s.h2}>Recent files</Text>
          <Pressable onPress={() => router.push("/content")}><Text style={{ color: theme.primary, fontWeight: "600" }}>View all</Text></Pressable>
        </View>
        <View style={s.files}>
          {files.length ? files.slice(0, 5).map((f) => <FileCard key={f.id} file={f} onChange={reload} />)
            : <Empty icon="cloud-upload-outline" title={loading ? "Loading your files…" : "No files yet"} text={loading ? undefined : "Tap + to upload your first file."} />}
        </View>
        {!files.length && !loading && <Button label="Upload a file" icon="add-outline" onPress={() => router.push("/uploader")} />}</Motion>
        <View style={{ alignItems: "center" }}><BannerAd unitId={ADS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} /></View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 32, lineHeight: 40, fontWeight: "800", color: theme.text, marginTop: 8 },
  h2: { fontSize: 18, fontWeight: "700", color: theme.text },
  muted: { color: theme.muted, fontSize: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "space-between" },
  logo: { width: 32, height: 32, borderRadius: 8 }, brand: { color: theme.text, fontSize: 20, fontWeight: "800" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" }, initial: { color: theme.primary, fontWeight: "700", fontSize: 17 },
  storage: { backgroundColor: theme.card, padding: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 8 },
  badge: { color: theme.primary, backgroundColor: theme.primarySoft, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: "700", borderRadius: 6 },
  used: { color: theme.text, fontSize: 24, fontWeight: "700", marginTop: 20 },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.primaryTrack, marginTop: 14, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: theme.primary },
  upgrade: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 }, upgradeText: { color: theme.primary, fontWeight: "700", fontSize: 13 },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cat: { width: "48%", flexGrow: 1, borderRadius: 8, padding: 16, gap: 6 },
  catIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  catText: { fontSize: 12, fontWeight: "600", color: theme.text },
  rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  files: { backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border, overflow: "hidden", marginTop: 12, marginBottom: 12 },
});
