import { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Empty, Button } from "../../components/ui";
import { FileCard } from "../../components/FileCard";
import { useFiles } from "../../lib/useFiles";
import { CATEGORIES } from "../../lib/files";
import { libraryTheme as t } from "../../lib/library-theme";
import { libraryFiles, toggleSelected, type LibrarySort } from "../../lib/library";

const sorts: { key: LibrarySort; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "recent", label: "Recent", icon: "time-outline" },
  { key: "name", label: "Name", icon: "swap-vertical" },
  { key: "size", label: "Size", icon: "document-text-outline" },
  { key: "date", label: "Date", icon: "calendar-outline" },
];
export default function Files() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<LibrarySort>("recent");
  const [ascending, setAscending] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const input = useRef<TextInput>(null);
  const categories = useRef<ScrollView>(null);
  const { files, loading, refreshing, error, reload } = useFiles();
  useEffect(() => { if (params.kind && ["all", ...CATEGORIES.map(c => c.kind)].includes(params.kind)) setKind(params.kind); }, [params.kind]);
  useEffect(() => { setSelected(ids => ids.filter(id => files.some(f => f.id === id))); }, [files]);
  function exitSelection() { setSelectionMode(false); setSelected([]); }
  useEffect(() => {
    if (!selectionMode) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => { setSelectionMode(false); setSelected([]); return true; });
    return () => subscription.remove();
  }, [selectionMode]);
  const list = useMemo(() => libraryFiles(files, kind, q, sort, ascending), [files, kind, q, sort, ascending]);
  const chips = [{ kind: "all", label: "All", icon: "folder" as const }, ...CATEGORIES];
  function changeSort(key: LibrarySort) {
    if (key === sort) setAscending(value => !value);
    else { setSort(key); setAscending(false); }
  }
  return <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
    <FlatList
      data={list} keyExtractor={f => f.id} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[t.primary]} />}
      ListHeaderComponent={<View style={s.header}>
        <View style={s.headingRow}><View style={s.headingCopy}><Text style={s.eyebrow}>MY LIBRARY</Text><Text style={s.title}>My <Text style={s.blue}>Files</Text></Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Search files" onPress={() => input.current?.focus()} style={({ pressed }) => [s.roundButton, pressed && s.pressed]}><Ionicons name="search-outline" size={24} color={t.primary} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Show all file categories" onPress={() => { setKind("all"); categories.current?.scrollTo({ x: 0, animated: true }); }} style={({ pressed }) => [s.roundButton, pressed && s.pressed]}><Ionicons name="options-outline" size={24} color={t.primary} /></Pressable>
        </View>
        <Text style={s.subtitle}>Manage and access all your files in one place.</Text>
        <View style={s.search}><Ionicons name="search-outline" size={22} color={t.muted} /><TextInput ref={input} accessibilityLabel="Search files" value={q} onChangeText={setQ} placeholder="Search files..." placeholderTextColor={t.muted} style={s.searchInput} returnKeyType="search" />{q.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQ("")} style={s.clear}><Ionicons name="close-circle" size={20} color={t.muted} /></Pressable>}</View>
        <ScrollView ref={categories} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>
          {chips.map(c => { const colors = t.categories[c.kind]; return <Pressable key={c.kind} accessibilityRole="button" accessibilityLabel={`${c.label}, ${c.kind === "all" ? files.length : files.filter(f => f.file_type === c.kind).length} files`} accessibilityState={{ selected: c.kind === kind }} onPress={() => setKind(c.kind)} style={({ pressed }) => [s.category, kind === c.kind && s.categoryOn, pressed && s.pressed]}><View style={[s.categoryIcon, { backgroundColor: colors?.background ?? t.storage }]}><Ionicons name={c.icon} size={22} color={colors?.foreground ?? t.primary} /></View><View><Text style={s.categoryLabel}>{c.label}</Text><Text style={s.count}>{c.kind === "all" ? files.length : files.filter(f => f.file_type === c.kind).length}</Text></View></Pressable>; })}
        </ScrollView>
        <View style={s.sortBar}>{sorts.map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityLabel={`Sort by ${item.label}${sort === item.key ? ascending ? ", reversed" : ", default order" : ""}`} accessibilityState={{ selected: sort === item.key }} onPress={() => changeSort(item.key)} style={({ pressed }) => [s.sort, sort === item.key && s.sortOn, pressed && s.pressed]}><Ionicons name={item.icon} size={17} color={sort === item.key ? t.onPrimary : t.muted} /><Text style={[s.sortLabel, sort === item.key && s.sortLabelOn]}>{item.label}</Text>{sort === item.key && ascending && <Ionicons name="arrow-up" size={12} color={t.onPrimary} />}</Pressable>)}</View>
        {selectionMode && <View style={s.selectionBar}><Pressable accessibilityRole="button" accessibilityLabel="Exit selection" onPress={exitSelection} style={s.clear}><Ionicons name="close" size={24} color={t.primary} /></Pressable><Text accessibilityLiveRegion="polite" style={s.selectionText}>{selected.length} selected</Text><Pressable accessibilityRole="button" onPress={() => setSelected(list.map(f => f.id))} style={s.selectAll}><Text style={s.blue}>Select all</Text></Pressable></View>}
        {error && <View style={s.error}><Text style={s.errorText}>{error}</Text><Button label="Try again" onPress={reload} variant="outline" /></View>}
      </View>}
      renderItem={({ item }) => <FileCard file={item} onChange={reload} presentation="library" selectionMode={selectionMode} selected={selected.includes(item.id)} onToggleSelection={() => setSelected(ids => toggleSelected(ids, item.id))} onStartSelection={() => { setSelectionMode(true); setSelected(ids => ids.includes(item.id) ? ids : [...ids, item.id]); }} />}
      ItemSeparatorComponent={() => <View style={s.separator} />}
      ListEmptyComponent={<Empty icon="folder-open-outline" title={loading ? "Loading…" : "No files found"} />}
    />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, width: "100%", maxWidth: 760, alignSelf: "center" },
  header: { gap: 12, paddingBottom: 12 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 8 }, headingCopy: { flex: 1 },
  eyebrow: { fontSize: 12, fontWeight: "500", color: t.muted }, title: { fontSize: 30, fontWeight: "800", color: t.text, marginTop: 2 }, blue: { color: t.primary },
  subtitle: { fontSize: 12, lineHeight: 18, color: t.muted, marginTop: -8 },
  roundButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: t.surface, alignItems: "center", justifyContent: "center" },
  search: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: t.surface, borderRadius: 18, minHeight: 54, paddingHorizontal: 14, marginTop: 2 },
  searchInput: { flex: 1, minWidth: 0, color: t.text, fontSize: 14, paddingVertical: 12 }, clear: { width: 48, height: 48, justifyContent: "center", alignItems: "center" },
  categories: { gap: 8, paddingVertical: 2 }, category: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 52, paddingHorizontal: 9, borderRadius: 14, backgroundColor: t.surface }, categoryOn: { backgroundColor: t.selected },
  categoryIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" }, categoryLabel: { fontSize: 10, color: t.text }, count: { fontSize: 11, color: t.muted, marginTop: 2 },
  sortBar: { flexDirection: "row", padding: 3, borderWidth: 1, borderColor: t.surface, borderRadius: 28 }, sort: { flex: 1, minHeight: 48, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, sortOn: { backgroundColor: t.primary, shadowColor: t.shadow, shadowOpacity: 0.3, shadowRadius: 5, elevation: 2 }, sortLabel: { fontSize: 12, color: t.muted, fontWeight: "500" }, sortLabelOn: { color: t.onPrimary },
  separator: { height: 8 }, selectionBar: { flexDirection: "row", alignItems: "center", backgroundColor: t.selected, borderRadius: 12 }, selectionText: { flex: 1, color: t.text, fontWeight: "600" }, selectAll: { minHeight: 48, paddingHorizontal: 12, justifyContent: "center" },
  error: { gap: 8, padding: 12 }, errorText: { color: t.text }, pressed: { opacity: 0.7 },
});
