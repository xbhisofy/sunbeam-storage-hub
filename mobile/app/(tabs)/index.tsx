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
  const fullName = profile?.display_name || (session?.user.user_metadata?.display_name as string | undefined) || "";
  const name = fullName.split(" ")[0] || "there";
  const used = files.reduce((n, f) => n + (f.size || 0), 0);
  const pct = Math.min(100, (used / plan.storage) * 100);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 32 }}>
        <Motion><View style={s.top}>
          <View style={s.row}><Image source={require("../../assets/icon.png")} style={s.logo} /><Text style={s.brand}>Tanyora</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push("/profile")} style={s.avatar}><Text style={s.initial}>{(fullName || "T").charAt(0).toUpperCase()}</Text></Pressable>
        </View></Motion>

        <Motion delay={40}><Text style={s.muted}>{greet}, {name}</Text><Text style={s.h1}>Share files beautifully.</Text></Motion>

        <Motion delay={80}><View style={s.hero}>
          <View style={s.heroGlow} />
          <View style={s.top}><View style={s.row}><Ionicons name="cloud-outline" size={20} color={theme.onPrimary} /><Text style={s.heroLabel}>Cloud storage</Text></View><Text style={s.badge}>{plan.name}</Text></View>
          <Text style={s.heroValue}>{formatSize(used)}</Text>
          <Text style={s.heroMuted}>of {formatSize(plan.storage)} used · {files.length} files</Text>
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }} style={s.bar}><View style={[s.fill, { width: `${pct}%` }]} /></View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/uploader")} style={({ pressed }) => [s.heroBtn, pressed && { opacity: 0.85 }]}><Ionicons name="add" size={18} color={theme.primary} /><Text style={s.heroBtnText}>Upload & share</Text></Pressable>
        </View></Motion>

        <Motion delay={120}><View style={s.cats}>
          {CATEGORIES.map((c) => {
            const col = theme.cat[c.kind];
            const count = files.filter((f) => f.file_type === c.kind).length;
            return (
              <Pressable accessibilityRole="button" accessibilityLabel={`${c.label}, ${count} files`} key={c.kind} onPress={() => router.push({ pathname: "/content", params: { kind: c.kind } })} style={({ pressed }) => [s.cat, pressed && { transform: [{ scale: 0.97 }] }]}>
                <View style={[s.catIcon, { backgroundColor: col.bg }]}><Ionicons name={c.icon} size={22} color={col.fg} /></View>
                <Text style={s.catText}>{c.label}</Text>
                <Text style={s.small}>{count} files</Text>
              </Pressable>
            );
          })}
        </View></Motion>

        <Motion delay={160}><View style={s.top}>
          <Text style={s.h2}>Recent files</Text>
          <Pressable onPress={() => router.push("/content")} style={{ padding: 8 }}><Text style={{ color: theme.primary, fontWeight: "700" }}>View all</Text></Pressable>
        </View>
        <View style={s.files}>
          {files.length ? files.slice(0, 5).map((f) => <FileCard key={f.id} file={f} onChange={reload} />)
            : <Empty icon="cloud-upload-outline" title={loading ? "Loading your files…" : "No files yet"} text={loading ? undefined : "Tap + to upload your first file."} />}
        </View>
        {!files.length && !loading && <Button label="Upload a file" icon="add-outline" onPress={() => router.push("/uploader")} style={{ marginTop: 12 }} />}</Motion>
        <View style={{ alignItems: "center" }}><BannerAd unitId={ADS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} /></View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 10 }, brand: { color: theme.text, fontSize: 21, fontWeight: "800", letterSpacing: -0.3 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.card },
  initial: { color: theme.primary, fontWeight: "800", fontSize: 17 },
  h1: { fontSize: 30, lineHeight: 37, fontWeight: "800", color: theme.text, marginTop: 6, letterSpacing: -0.6 },
  h2: { fontSize: 18, fontWeight: "800", color: theme.text },
  muted: { color: theme.muted, fontSize: 15 }, small: { color: theme.muted, fontSize: 12 },
  hero: { backgroundColor: theme.primary, borderRadius: 22, padding: 22, overflow: "hidden", elevation: 8, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  heroGlow: { position: "absolute", width: 220, height: 220, borderRadius: 110, right: -70, top: -90, backgroundColor: "rgba(255,255,255,0.12)" },
  heroLabel: { color: theme.onPrimary, fontWeight: "700", fontSize: 15 },
  badge: { color: theme.onPrimary, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 5, fontSize: 12, fontWeight: "800", borderRadius: 999, overflow: "hidden" },
  heroValue: { color: theme.onPrimary, fontSize: 34, fontWeight: "800", marginTop: 22, letterSpacing: -0.5 },
  heroMuted: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  bar: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 16, overflow: "hidden" },
  fill: { height: 7, borderRadius: 4, backgroundColor: theme.onPrimary },
  heroBtn: { marginTop: 20, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.onPrimary, paddingHorizontal: 16, height: 42, borderRadius: 999 },
  heroBtnText: { color: theme.primary, fontWeight: "800" },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cat: { width: "47%", flexGrow: 1, borderRadius: 18, padding: 16, gap: 8, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
  catIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  catText: { fontSize: 15, fontWeight: "700", color: theme.text },
  files: { backgroundColor: theme.card, borderRadius: 18, borderWidth: 1, borderColor: theme.border, overflow: "hidden", marginTop: 8 },
});
