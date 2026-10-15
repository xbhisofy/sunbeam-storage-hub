import { useState } from "react";
import { Alert, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { theme } from "../lib/theme";
import { shareLink } from "../lib/config";
import { EXPIRY, deleteFile, formatDate, formatSize, iconFor, renameFile, setExpiry, type FileRow } from "../lib/files";
import { Button } from "./ui";

type Sheet = null | "menu" | "rename" | "expiry" | "details";

export function FileIcon({ type, size = 46 }: { type: string; size?: number }) {
  const c = theme.cat[type] ?? theme.cat.other;
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={iconFor(type) as keyof typeof Ionicons.glyphMap} size={size * 0.48} color={c.fg} />
    </View>
  );
}

export function expiryText(f: FileRow) {
  if (!f.expires_at) return "Never expires";
  const t = new Date(f.expires_at).getTime();
  return t < Date.now() ? "Link expired" : `Expires ${formatDate(f.expires_at)}`;
}

export function FileCard({ file, onChange, showExpiry }: { file: FileRow; onChange: () => void; showExpiry?: boolean }) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [name, setName] = useState(file.name);
  const [busy, setBusy] = useState(false);
  const meta = `${file.storage_path ? `${formatSize(file.size)} · ` : ""}${formatDate(file.created_at)}`;

  async function copy() {
    await Clipboard.setStringAsync(shareLink(file.slug));
    setSheet(null);
    Alert.alert("Link copied", "The share link is on your clipboard.");
  }
  async function share(hours: number | null) {
    setBusy(true);
    try {
      await setExpiry(file.id, hours);
      setSheet(null);
      onChange();
      await Share.share({ message: `${file.name}\n${shareLink(file.slug)}` });
    } catch (e) { Alert.alert("Unable to share", e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }
  async function saveName() {
    if (!name.trim()) return;
    setBusy(true);
    try { await renameFile(file.id, name.trim()); setSheet(null); onChange(); }
    catch (e) { Alert.alert("Rename failed", e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }
  function trash() {
    setSheet(null);
    Alert.alert("Move to Trash?", "This file and its share link will be permanently removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await deleteFile(file); onChange(); } catch (e) { Alert.alert("Delete failed", e instanceof Error ? e.message : ""); } } },
    ]);
  }

  const items: { icon: keyof typeof Ionicons.glyphMap; label: string; on: () => void; danger?: boolean }[] = [
    { icon: "information-circle-outline", label: "Details", on: () => setSheet("details") },
    { icon: "create-outline", label: "Rename", on: () => { setName(file.name); setSheet("rename"); } },
    { icon: "link-outline", label: "Copy link", on: copy },
    { icon: "share-social-outline", label: "Share", on: () => setSheet("expiry") },
    { icon: "trash-outline", label: "Move to Trash", on: trash, danger: true },
  ];

  return (
    <>
      <Pressable onPress={() => router.push(`/s/${file.slug}`)} style={({ pressed }) => [s.row, pressed && { backgroundColor: "#F8FAFD" }]}>
        <FileIcon type={file.file_type} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.name} numberOfLines={1}>{file.name}</Text>
          <Text style={s.meta} numberOfLines={1}>{showExpiry ? expiryText(file) : meta}</Text>
        </View>
        <Pressable accessibilityLabel={`Actions for ${file.name}`} hitSlop={10} onPress={() => setSheet("menu")} style={s.more}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.muted} />
        </Pressable>
      </Pressable>

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={s.backdrop} onPress={() => setSheet(null)} />
        <View style={s.sheet}>
          <View style={s.grab} />
          <View style={s.sheetHead}>
            <FileIcon type={file.file_type} size={40} />
            <Text style={[s.name, { flex: 1 }]} numberOfLines={1}>{file.name}</Text>
          </View>
          {sheet === "menu" && items.map((i) => (
            <Pressable key={i.label} onPress={i.on} style={({ pressed }) => [s.item, pressed && { backgroundColor: theme.bg }]}>
              <Ionicons name={i.icon} size={21} color={i.danger ? theme.danger : theme.text} />
              <Text style={[s.itemText, i.danger && { color: theme.danger }]}>{i.label}</Text>
            </Pressable>
          ))}
          {sheet === "rename" && (
            <View style={{ gap: 12 }}>
              <TextInput value={name} onChangeText={setName} autoFocus selectTextOnFocus onSubmitEditing={saveName} style={s.input} />
              <Button label="Save" onPress={saveName} busy={busy} />
            </View>
          )}
          {sheet === "expiry" && (
            <View style={{ gap: 8 }}>
              <Text style={s.meta}>How long should this link work?</Text>
              {EXPIRY.map((e) => (
                <Pressable key={e.label} disabled={busy} onPress={() => share(e.hours)} style={({ pressed }) => [s.item, pressed && { backgroundColor: theme.bg }]}>
                  <Ionicons name="time-outline" size={20} color={theme.primary} />
                  <Text style={s.itemText}>{e.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {sheet === "details" && (
            <View style={{ gap: 10 }}>
              {[
                ["Type", file.file_type === "pdf" ? "Document" : file.file_type],
                ["Size", file.storage_path ? formatSize(file.size) : "Converted link"],
                ["Uploaded", formatDate(file.created_at)],
                ["Link", expiryText(file)],
              ].map(([k, v]) => (
                <View key={k} style={s.detail}><Text style={s.meta}>{k}</Text><Text style={[s.itemText, { textTransform: "capitalize" }]}>{v}</Text></View>
              ))}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  name: { fontSize: 15, fontWeight: "600", color: theme.text },
  meta: { fontSize: 13, color: theme.muted, marginTop: 2 },
  more: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.4)" },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32, gap: 4 },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, marginBottom: 12 },
  sheetHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 12, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.border },
  item: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  itemText: { fontSize: 16, color: theme.text, fontWeight: "500" },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 14, fontSize: 16, color: theme.text },
  detail: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
});
