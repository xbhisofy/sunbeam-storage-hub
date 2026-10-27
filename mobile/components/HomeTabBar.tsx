import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { homeTheme as t } from "../lib/home-theme";

type Destination = "index" | "content" | "shared" | "profile";
export function HomeTabBar({ onNavigate, onUpload, active = "index" }: { onNavigate: (name: Destination) => void; onUpload: () => void; active?: Destination }) {
  const insets = useSafeAreaInsets();
  const item = (name: Destination, label: string, icon: keyof typeof Ionicons.glyphMap) => <Pressable key={name} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: name === active }} onPress={() => onNavigate(name)} style={({ pressed }) => [s.item, pressed && s.pressed]}><Ionicons name={name === "content" && active === name ? "folder" : icon} size={25} color={name === active ? t.primary : t.muted} /><Text style={[s.label, name === active && s.active]}>{label}</Text>{name === active && <View style={s.dot} />}</Pressable>;
  return <View style={[s.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}><View style={s.bar}>
    {item("index", "Home", "home")}{item("content", "Files", "folder-outline")}
    <Pressable accessibilityRole="button" accessibilityLabel="Upload a file" onPress={onUpload} style={({ pressed }) => [s.plusWrap, pressed && s.pressed]}><View style={s.plusHalo}><LinearGradient colors={[t.primaryLight, t.primary, t.primaryDeep]} style={s.diamond}><Ionicons name="add" size={35} color={t.onPrimary} /></LinearGradient></View></Pressable>
    {item("shared", "Shared", "share-social-outline")}{item("profile", "Profile", "person-outline")}
  </View></View>;
}
const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 10, backgroundColor: t.background },
  bar: { minHeight: 58, borderRadius: 32, backgroundColor: t.surface, flexDirection: "row", alignItems: "center", shadowColor: t.shadow, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  item: { flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center", gap: 2, paddingVertical: 6 },
  label: { fontSize: 10, color: t.muted }, active: { color: t.primary }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: t.primary },
  plusWrap: { flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center" },
  plusHalo: { width: 62, height: 62, borderRadius: 24, marginTop: -16, alignItems: "center", justifyContent: "center", backgroundColor: t.storageStart },
  diamond: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: t.primaryLight },
  pressed: { opacity: 0.7 },
});