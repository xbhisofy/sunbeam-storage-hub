import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { theme } from "../lib/theme";

export function Screen({ title, children, back, right }: { title?: string; children: ReactNode; back?: boolean; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}>
      {title ? (
        <View style={s.header}>
          {back ? (
            <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={() => router.back()} style={s.iconBtn}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
          ) : null}
          <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Button({ label, onPress, busy, variant = "primary", icon, style }: { label: string; onPress: () => void; busy?: boolean; variant?: "primary" | "outline" | "danger"; icon?: keyof typeof Ionicons.glyphMap; style?: ViewStyle }) {
  const fg = variant === "primary" ? "#FFFFFF" : variant === "danger" ? theme.danger : theme.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [s.btn, variant === "primary" ? s.btnPrimary : s.btnOutline, variant === "danger" && { borderColor: "#FCA5A5" }, pressed && { opacity: 0.85 }, busy && { opacity: 0.6 }, style]}
    >
      {busy ? <ActivityIndicator color={fg} /> : <>{icon ? <Ionicons name={icon} size={18} color={fg} /> : null}<Text style={[s.btnText, { color: fg }]}>{label}</Text></>}
    </Pressable>
  );
}

export function Field({ label, ...p }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#94A3B8" style={s.input} {...p} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Empty({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text?: string }) {
  return (
    <View style={{ alignItems: "center", padding: 40, gap: 8 }}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={30} color={theme.primary} /></View>
      <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text }}>{title}</Text>
      {text ? <Text style={{ color: theme.muted, textAlign: "center" }}>{text}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 56 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: theme.text },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  btn: { height: 52, borderRadius: 14, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  btnPrimary: { backgroundColor: theme.primary },
  btnOutline: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  btnText: { fontSize: 16, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", color: theme.text },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, paddingHorizontal: 14, fontSize: 16, color: theme.text },
  card: { backgroundColor: theme.card, borderRadius: theme.radius, borderWidth: 1, borderColor: theme.border, padding: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
});
