import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Screen, Empty } from "../../components/ui";
import { FileCard } from "../../components/FileCard";
import { useFiles } from "../../lib/useFiles";
import { CATEGORIES } from "../../lib/files";
import { theme } from "../../lib/theme";

export default function Files() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<string>("all");
  const [q, setQ] = useState("");
  const { files, loading, refreshing, reload } = useFiles();
  useEffect(() => { if (params.kind) setKind(params.kind); }, [params.kind]);

  const list = useMemo(
    () => files.filter((f) => (kind === "all" || f.file_type === kind) && f.name.toLowerCase().includes(q.trim().toLowerCase())),
    [files, kind, q],
  );
  const chips = [{ kind: "all", label: "All" }, ...CATEGORIES];

  return (
    <Screen title="My Files">
      <View style={s.search}>
        <Ionicons name="search" size={18} color={theme.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search files" placeholderTextColor="#94A3B8" style={{ flex: 1, fontSize: 15, color: theme.text }} />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
          {chips.map((c) => (
            <Pressable key={c.kind} onPress={() => setKind(c.kind)} style={[s.chip, kind === c.kind && s.chipOn]}>
              <Text style={[s.chipText, kind === c.kind && { color: "#FFFFFF" }]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={list}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => <FileCard file={item} onChange={reload} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 74 }} />}
        style={{ backgroundColor: theme.card }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[theme.primary]} />}
        ListEmptyComponent={<Empty icon="folder-open-outline" title={loading ? "Loading…" : "No files here"} text={loading ? undefined : "Tap + to upload a file."} />}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, height: 46, borderRadius: 14, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14 },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, justifyContent: "center" },
  chipOn: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontSize: 14, fontWeight: "600", color: theme.text },
});
