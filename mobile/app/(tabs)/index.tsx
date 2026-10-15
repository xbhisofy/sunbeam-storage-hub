import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { Screen, Card, Empty } from "../../components/ui";
import { FileCard } from "../../components/FileCard";
import { useSession } from "../_layout";
import { useFiles } from "../../lib/useFiles";
import { CATEGORIES, formatSize } from "../../lib/files";
import { ADS } from "../../lib/config";
import { theme } from "../../lib/theme";

const LIMIT = 1024 ** 3; // 1 GB shown as the free storage reference

export default function Home() {
  const session = useSession();
  const { files, loading, refreshing, reload } = useFiles();
  const name = (session?.user.user_metadata?.display_name as string | undefined)?.split(" ")[0] ?? "there";
  const used = files.reduce((n, f) => n + (f.size || 0), 0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[theme.primary]} />}>
        <View>
          <Text style={s.muted}>{greet},</Text>
          <Text style={s.h1}>{name}</Text>
        </View>

        <Card style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>
          <Text style={{ color: "#DBEAFE", fontSize: 13 }}>Storage used</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginTop: 4 }}>
            {formatSize(used)} <Text style={{ fontSize: 14, color: "#DBEAFE" }}>/ 1 GB</Text>
          </Text>
          <View style={s.bar}><View style={[s.fill, { width: `${Math.min(100, (used / LIMIT) * 100)}%` }]} /></View>
          <Text style={{ color: "#DBEAFE", fontSize: 13, marginTop: 8 }}>{files.length} files</Text>
        </Card>

        <View style={s.cats}>
          {CATEGORIES.map((c) => {
            const col = theme.cat[c.kind];
            return (
              <Pressable key={c.kind} onPress={() => router.push({ pathname: "/content", params: { kind: c.kind } })} style={s.cat}>
                <View style={[s.catIcon, { backgroundColor: col.bg }]}><Ionicons name={c.icon} size={22} color={col.fg} /></View>
                <Text style={s.catText}>{c.label}</Text>
                <Text style={s.muted}>{files.filter((f) => f.file_type === c.kind).length}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={s.rowHead}>
          <Text style={s.h2}>Recent files</Text>
          <Pressable onPress={() => router.push("/content")}><Text style={{ color: theme.primary, fontWeight: "600" }}>View all</Text></Pressable>
        </View>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {files.length ? files.slice(0, 5).map((f) => <FileCard key={f.id} file={f} onChange={reload} />)
            : <Empty icon="cloud-upload-outline" title={loading ? "Loading your files…" : "No files yet"} text={loading ? undefined : "Tap + to upload your first file."} />}
        </Card>
        <View style={{ alignItems: "center" }}><BannerAd unitId={ADS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} /></View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: "800", color: theme.text },
  h2: { fontSize: 18, fontWeight: "700", color: theme.text },
  muted: { color: theme.muted, fontSize: 14 },
  bar: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 12, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  cats: { flexDirection: "row", gap: 10 },
  cat: { flex: 1, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 12, alignItems: "center", gap: 6 },
  catIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catText: { fontSize: 12, fontWeight: "600", color: theme.text },
  rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
