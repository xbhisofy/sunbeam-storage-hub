import { useMemo, useRef, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "../../components/ui";
import { FileCard } from "../../components/FileCard";
import { useFiles } from "../../lib/useFiles";
import { libraryFiles } from "../../lib/library";
import { sharedTheme as t } from "../../lib/shared-theme";
import sharedFolders from "../../assets/shared-folders.png";

const filters = [
  { kind: "all", label: "All", icon: "layers" },
  { kind: "image", label: "Images", icon: "image" },
  { kind: "video", label: "Videos", icon: "play-circle" },
  { kind: "pdf", label: "Documents", icon: "document-text" },
  { kind: "audio", label: "Music", icon: "musical-notes" },
] as const;

// Every existing file already has a share link; preserve the current record source.
export default function Shared() {
  const { files, loading, refreshing, reload, error } = useFiles();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const categories = useRef<ScrollView>(null);
  const list = useMemo(() => libraryFiles(files, kind, query, "recent"), [files, kind, query]);
  return <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
    <FlatList data={list} keyExtractor={f => f.id} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[t.primary]} />}
      ListHeaderComponent={<View style={s.header}>
        <View style={s.heading}><View style={s.headingCopy}><Text style={s.eyebrow}>TANYORA</Text><Text style={s.title}>Shared <Text style={s.blue}>Links</Text></Text></View><Image source={sharedFolders} resizeMode="contain" accessible={false} style={s.art} /></View>
        <Text style={s.subtitle}>Manage all the files you’ve shared with others.</Text>
        <View style={s.searchRow}><View style={s.search}><Ionicons name="search-outline" size={22} color={t.muted} /><TextInput accessibilityLabel="Search shared files" value={query} onChangeText={setQuery} placeholder="Search shared files..." placeholderTextColor={t.muted} style={s.input} />{query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery("")} style={s.clear}><Ionicons name="close-circle" size={20} color={t.muted} /></Pressable>}</View><Pressable accessibilityRole="button" accessibilityLabel="Show all shared file types" onPress={() => { setKind("all"); categories.current?.scrollTo({ x: 0, animated: true }); }} style={({ pressed }) => [s.filter, pressed && s.pressed]}><Ionicons name="options-outline" size={24} color={t.muted} /></Pressable></View>
        <ScrollView ref={categories} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{filters.map(c => { const colors = t.categories[c.kind]; const count = c.kind === "all" ? files.length : files.filter(f => f.file_type === c.kind).length; const active = kind === c.kind; return <Pressable key={c.kind} accessibilityRole="button" accessibilityLabel={`${c.label}, ${count} shared files`} accessibilityState={{ selected: active }} onPress={() => setKind(c.kind)} style={({ pressed }) => [s.category, active && s.categoryOn, pressed && s.pressed]}><View style={[s.categoryIcon, { backgroundColor: active ? t.primaryLight : colors?.background ?? t.storage }]}><Ionicons name={c.icon} size={22} color={active ? t.onPrimary : colors?.foreground ?? t.primary} /></View><View><Text style={[s.categoryLabel, active && s.onPrimary]}>{c.label}</Text><Text style={[s.count, active && s.onPrimary]}>{count}</Text></View></Pressable>; })}</ScrollView>
        {error && <View style={s.error}><Text style={s.subtitle}>{error}</Text><Button label="Try again" onPress={reload} variant="outline" /></View>}
      </View>}
      renderItem={({ item }) => <FileCard file={item} onChange={reload} presentation="shared" />}
      ItemSeparatorComponent={() => <View style={s.separator} />}
      ListEmptyComponent={loading ? <Text style={s.emptyText}>Loading…</Text> : error ? null : files.length === 0 ? <View style={s.empty}><Image source={sharedFolders} resizeMode="contain" accessible={false} style={s.emptyArt} /><Text style={s.emptyTitle}>No shared links yet</Text><Text style={s.emptyText}>When you share a file, it will appear here.</Text><Button label="Share a File" icon="share-social-outline" onPress={() => router.push("/content")} /></View> : <View style={s.empty}><Ionicons name="search-outline" size={32} color={t.muted} /><Text style={s.emptyTitle}>No matching shared files</Text><Pressable accessibilityRole="button" onPress={() => { setQuery(""); setKind("all"); }} style={s.reset}><Text style={s.blue}>Clear filters</Text></Pressable></View>}
    />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background }, content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, maxWidth: 760, width: "100%", alignSelf: "center" }, header: { gap: 12, paddingBottom: 12 },
  heading: { minHeight: 64, flexDirection: "row", alignItems: "center" }, headingCopy: { flex: 1 }, eyebrow: { fontSize: 11, fontWeight: "600", color: t.muted, marginBottom: 4 }, title: { fontSize: 27, fontWeight: "800", color: t.text }, blue: { color: t.primary }, art: { width: 80, height: 70 }, subtitle: { fontSize: 12, lineHeight: 18, color: t.muted },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 }, search: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 52, paddingHorizontal: 12, backgroundColor: t.surface, borderRadius: 18 }, input: { flex: 1, minWidth: 0, color: t.text, fontSize: 14, paddingVertical: 14 }, clear: { width: 36, height: 48, alignItems: "center", justifyContent: "center" }, filter: { width: 48, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: t.surface },
  categories: { gap: 4 }, category: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4, backgroundColor: t.surface, borderRadius: 12 }, categoryOn: { backgroundColor: t.primary }, categoryIcon: { width: 24, height: 30, borderRadius: 7, alignItems: "center", justifyContent: "center" }, categoryLabel: { fontSize: 10, color: t.text }, count: { fontSize: 11, color: t.muted, marginTop: 2 }, onPrimary: { color: t.onPrimary }, separator: { height: 8 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 12 }, emptyArt: { width: 140, height: 110 }, emptyTitle: { fontSize: 18, fontWeight: "700", color: t.text, textAlign: "center" }, emptyText: { fontSize: 13, lineHeight: 20, color: t.muted, textAlign: "center" }, reset: { minHeight: 48, justifyContent: "center", paddingHorizontal: 16 }, error: { gap: 8, padding: 12 }, pressed: { opacity: 0.7 },
});
