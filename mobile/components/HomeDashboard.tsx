import type { ReactNode } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Empty } from "./ui";
import { homeTheme as t } from "../lib/home-theme";

type Category = { kind: string; label: string; icon: keyof typeof Ionicons.glyphMap; count: number };
type Props = {
  name: string; greeting: string; used: string; capacity: string; percent: number; plan: string;
  categories: Category[]; loading: boolean; refreshing: boolean; error: string | null;
  recentFiles: ReactNode; hasFiles: boolean; ad: ReactNode;
  onUpload: () => void; onFiles: () => void; onProfile: () => void;
  onCategory: (kind: string) => void; onRefresh: () => void;
};

export function HomeDashboard(p: Props) {
  const { width, fontScale } = useWindowDimensions();
  const fourColumns = width >= 370 && fontScale <= 1.2;
  const showArt = width >= 370 && fontScale <= 1.2;
  return <ScrollView
    showsVerticalScrollIndicator={false}
    refreshControl={<RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} colors={[t.primary]} />}
    style={s.scroll}
    contentContainerStyle={s.content}
  >
    <View style={s.header}>
      <View style={s.brandGroup}>
        <Image source={require("../assets/icon.png")} style={s.logo} accessibilityIgnoresInvertColors />
        <View style={s.brandWords}><Text style={s.brand}>Tanyora</Text><Text style={s.tagline}>Cloud for Everyone</Text></View>
      </View>
      <View style={s.headerActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Search files" onPress={p.onFiles} style={({ pressed }) => [s.iconButton, pressed && s.pressed]}><Ionicons name="search-outline" size={23} color={t.muted} /></Pressable>
        <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Notifications unavailable" style={s.iconButton}><Ionicons name="notifications-outline" size={21} color={t.muted} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={p.onProfile} style={({ pressed }) => [s.avatar, pressed && s.pressed]}><Text style={s.initial}>{(p.name || "T").charAt(0).toUpperCase()}</Text></Pressable>
      </View>
    </View>

    <View style={s.intro}>
      {showArt && <Image source={require("../assets/home-cloud.png")} style={s.art} resizeMode="contain" accessible={false} />}
      <View style={[s.greeting, showArt && s.greetingWithArt]}><Text style={s.greetingText}>{p.greeting}, {p.name}</Text><Ionicons accessible={false} name="sunny-outline" size={20} color={t.gold} /></View>
      <Text accessibilityRole="header" style={[s.headline, showArt && s.introText]}>Your files, <Text style={s.blue}>your space.</Text></Text>
      <Text style={[s.subtitle, showArt && s.introText]}>Upload, manage, and share everything easily.</Text>
    </View>

    <LinearGradient colors={[t.storageStart, t.storageEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.storage}>
      <View pointerEvents="none" style={s.storageSheen} />
      <View style={s.storageHeader}>
        <View style={s.storageTitle}><Ionicons accessible={false} name="cloud-outline" size={25} color={t.text} /><Text style={s.sectionLabel}>Cloud Storage</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`View profile, ${p.plan} plan`} onPress={p.onProfile} style={({ pressed }) => [s.plan, pressed && s.pressed]}><Ionicons accessible={false} name="ribbon-outline" size={16} color={t.gold} /><Text style={s.planLabel}>{p.plan} Plan</Text><Ionicons accessible={false} name="chevron-forward" size={16} color={t.primary} /></Pressable>
      </View>
      <Text style={s.used}>{p.used}</Text><Text style={s.capacity}>of {p.capacity} used</Text>
      <View style={s.progressRow}>
        <View accessibilityRole="progressbar" accessibilityLabel="Cloud storage used" accessibilityValue={{ min: 0, max: 100, now: Math.round(p.percent) }} style={s.track}><View style={[s.fill, { width: `${p.percent}%` }]} /></View><Text style={s.percent}>{Math.round(p.percent)}%</Text>
      </View>
      <View style={s.storageActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Upload & Share" onPress={p.onUpload} style={({ pressed }) => [s.uploadWrap, pressed && s.pressed]}><LinearGradient colors={[t.primaryLight, t.primary, t.primaryDeep]} style={s.upload}><Ionicons accessible={false} name="cloud-upload-outline" size={24} color={t.onPrimary} /><Text style={s.uploadLabel}>Upload & Share</Text><Ionicons accessible={false} name="chevron-forward" size={18} color={t.onPrimary} /></LinearGradient></Pressable>
        <Pressable disabled accessibilityRole="button" accessibilityLabel="New Folder unavailable" accessibilityState={{ disabled: true }} style={s.utility}><Ionicons name="folder-outline" size={23} color={t.disabled} /><Text style={s.utilityLabel}>New Folder</Text></Pressable>
        <Pressable disabled accessibilityRole="button" accessibilityLabel="Scan unavailable" accessibilityState={{ disabled: true }} style={s.utility}><Ionicons name="scan-outline" size={23} color={t.disabled} /><Text style={s.utilityLabel}>Scan</Text></Pressable>
      </View>
    </LinearGradient>

    <View style={s.categories}>
      {p.categories.map(c => {
        const color = t.categories[c.kind];
        return <Pressable key={c.kind} accessibilityRole="button" accessibilityLabel={`${c.label}, ${c.count} files`} onPress={() => p.onCategory(c.kind)} style={({ pressed }) => [s.category, { width: fourColumns ? "23%" : "48%" }, pressed && s.pressed]}>
          <View style={[s.categoryIcon, { backgroundColor: color?.background }]}><Ionicons accessible={false} name={c.icon} size={26} color={color?.foreground} /></View>
          <Text style={s.categoryLabel}>{c.label}</Text><View style={s.categoryBottom}><Text style={s.count}>{c.count} {c.count === 1 ? "file" : "files"}</Text><Ionicons accessible={false} name="chevron-forward" size={16} color={t.muted} /></View>
        </Pressable>;
      })}
    </View>

    <View style={s.recent}>
      <View style={s.recentHeader}><Text accessibilityRole="header" style={s.recentTitle}>Recent Files</Text><Pressable accessibilityRole="button" accessibilityLabel="View all files" onPress={p.onFiles} style={({ pressed }) => [s.viewAll, pressed && s.pressed]}><Text style={s.viewAllText}>View all</Text><Ionicons accessible={false} name="chevron-forward" size={18} color={t.primary} /></Pressable></View>
      {p.error ? <View style={s.error}><Text style={s.subtitle}>{p.error}</Text><Button label="Try again" variant="outline" onPress={p.onRefresh} /></View> : p.hasFiles ? <View style={s.fileList}>{p.recentFiles}</View> : <Empty icon="cloud-upload-outline" title={p.loading ? "Loading your files…" : "No files yet"} />}
      {!p.hasFiles && !p.loading && !p.error && <Button label="Upload a file" icon="add-outline" onPress={p.onUpload} style={s.emptyUpload} />}
    </View>
    <View style={s.ad}>{p.ad}</View>
  </ScrollView>;
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: t.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  brandGroup: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  brandWords: { flexShrink: 1 }, logo: { width: 34, height: 34, borderRadius: 9 },
  brand: { color: t.text, fontSize: 19, fontWeight: "800", letterSpacing: 0 },
  tagline: { color: t.muted, fontSize: 10, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 0 },
  iconButton: { width: 44, height: 48, backgroundColor: t.storageStart, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  avatar: { width: 44, height: 48, borderRadius: 24, borderWidth: 2, borderColor: t.surface, justifyContent: "center", alignItems: "center", backgroundColor: t.storage },
  initial: { color: t.primary, fontSize: 21, fontWeight: "700" }, pressed: { opacity: 0.7 },
  intro: { paddingTop: 12, paddingBottom: 6, minHeight: 104, position: "relative" },
  art: { position: "absolute", right: -8, bottom: -2, width: 112, height: 112 },
  introText: { paddingRight: 92 },
  greeting: { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 6 }, greetingWithArt: { paddingRight: 90 },
  greetingText: { color: t.muted, fontSize: 13, flexShrink: 1 },
  headline: { color: t.text, fontSize: 22, lineHeight: 27, fontWeight: "800", letterSpacing: 0 },
  blue: { color: t.primary }, subtitle: { color: t.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  storage: { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: t.surface, overflow: "hidden", shadowColor: t.shadow, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  storageSheen: { position: "absolute", width: 210, height: 210, borderRadius: 105, right: -38, top: -132, backgroundColor: t.sheen },
  storageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" },
  storageTitle: { flexDirection: "row", gap: 8, alignItems: "center" }, sectionLabel: { color: t.text, fontWeight: "700", fontSize: 16 },
  plan: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, paddingHorizontal: 8, borderRadius: 24, backgroundColor: t.storageStart },
  planLabel: { color: t.primary, fontWeight: "600", fontSize: 13 },
  used: { color: t.text, fontSize: 32, fontWeight: "800", marginTop: 6, letterSpacing: 0 }, capacity: { color: t.muted, fontSize: 13, marginTop: 2 },
  progressRow: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 14, marginBottom: 18 },
  track: { flex: 1, height: 8, backgroundColor: t.track, borderRadius: 4, overflow: "hidden" }, fill: { height: 8, backgroundColor: t.primary, borderRadius: 4 }, percent: { color: t.muted, fontSize: 14 },
  storageActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "stretch" },
  uploadWrap: { flex: 1, minWidth: 140, borderRadius: 24, overflow: "hidden", shadowColor: t.primary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  upload: { flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", alignItems: "center", minHeight: 48, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 24 },
  uploadLabel: { color: t.onPrimary, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  utility: { backgroundColor: t.storageStart, minWidth: 44, minHeight: 48, borderRadius: 14, padding: 5, alignItems: "center", justifyContent: "center", gap: 3 },
  utilityLabel: { color: t.disabled, fontSize: 8 },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" },
  category: { backgroundColor: t.surface, borderRadius: 16, paddingHorizontal: 6, paddingVertical: 10, gap: 6, flexGrow: 1 },
  categoryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  categoryLabel: { color: t.text, fontSize: 11, fontWeight: "600" }, categoryBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }, count: { color: t.muted, fontSize: 10 },
  recent: { padding: 12, borderRadius: 22, backgroundColor: t.surface },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", paddingHorizontal: 4, marginBottom: 4 },
  recentTitle: { color: t.text, fontSize: 18, fontWeight: "800" }, viewAll: { flexDirection: "row", gap: 4, alignItems: "center", minHeight: 44 }, viewAllText: { color: t.primary, fontSize: 12, fontWeight: "600" },
  fileList: { gap: 6 }, error: { padding: 12, gap: 12 }, emptyUpload: { margin: 8 }, ad: { alignItems: "center", overflow: "hidden" },
});