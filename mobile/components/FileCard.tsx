import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { theme } from "../lib/theme";
import { shareLink } from "../lib/config";
import { EXPIRY, deleteFile, formatDate, formatSize, iconFor, renameFile, setExpiry, type FileRow } from "../lib/files";
import { Button } from "./ui";
import { homeTheme } from "../lib/home-theme";
import { HomeThumbnail } from "./HomeThumbnail";
import { libraryTheme as lt } from "../lib/library-theme";
import { fileExtension, libraryType } from "../lib/library";
import { sharedTheme as st } from "../lib/shared-theme";
import { linkExpiry } from "../lib/shared-links";

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

export function FileCard({ file, onChange, showExpiry, presentation = "default", selectionMode = false, selected = false, onToggleSelection, onStartSelection }: { file: FileRow; onChange: () => void; showExpiry?: boolean; presentation?: "default" | "home" | "library" | "shared"; selectionMode?: boolean; selected?: boolean; onToggleSelection?: () => void; onStartSelection?: () => void }) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [name, setName] = useState(file.name);
  const [busy, setBusy] = useState(false);
  const meta = `${file.storage_path ? `${formatSize(file.size)} · ` : ""}${formatDate(file.created_at)}`;
  const library = presentation === "library";
  const shared = presentation === "shared";
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!shared || !file.expires_at) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [shared, file.expires_at]);
  const expiry = linkExpiry(file.expires_at, now);
  const expired = expiry.kind === "expired" || expiry.kind === "unknown";
  const typeColor = lt.categories[file.file_type] ?? lt.categories.pdf;

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
      <View style={[s.row, presentation === "home" && s.homeRow, (library || shared) && s.libraryRow, shared && s.sharedRow, library && selected && s.selectedRow]}>
        <Pressable accessibilityRole={selectionMode ? "checkbox" : "button"} accessibilityState={selectionMode ? { checked: selected } : undefined} accessibilityLabel={`${selectionMode ? "Select" : "Open"} ${file.name}`} onLongPress={onStartSelection} delayLongPress={350} onPress={() => selectionMode ? onToggleSelection?.() : router.push({ pathname: "/s/[slug]", params: { slug: file.slug } })} style={({ pressed }) => [s.openFile, library && s.libraryOpen, pressed && { opacity: 0.7 }]}>
        {selectionMode && <Ionicons name={selected ? "checkbox" : "square-outline"} size={24} color={lt.primary} />}
        {presentation === "home" || library || shared ? <HomeThumbnail path={file.storage_path} type={file.file_type} size={shared ? 52 : library ? 48 : 36} /> : <FileIcon type={file.file_type} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.name, presentation === "home" && s.homeName, (library || shared) && s.libraryName]} numberOfLines={1}>{file.name}</Text>
          <Text style={[s.meta, presentation === "home" && s.homeMeta, (library || shared) && s.libraryMeta]} numberOfLines={1}>{shared ? meta : showExpiry ? expiryText(file) : library ? `${meta} · ${fileExtension(file.name)}` : meta}</Text>
          {shared && <View style={[s.typeBadge, { backgroundColor: expired ? st.expiredBackground : st.activeLinkBackground }]}><Ionicons name={expired ? "time-outline" : "link"} size={13} color={expired ? st.expired : st.primary} /><Text style={[s.typeLabel, { color: expired ? st.expired : st.activeLink }]}>{expiry.label}</Text></View>}
          {library && <View style={[s.typeBadge, { backgroundColor: typeColor.background }]}><Ionicons name={iconFor(file.file_type)} size={11} color={typeColor.foreground} /><Text style={[s.typeLabel, { color: typeColor.foreground }]}>{libraryType(file.file_type)}</Text></View>}
        </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Actions for ${file.name}`} hitSlop={10} onPress={() => setSheet("menu")} style={[s.more, (presentation === "home" || library || shared) && s.homeMore]}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.muted} />
        </Pressable>
      </View>

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => { if (!busy) setSheet(null); }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={s.backdrop} onPress={() => setSheet(null)} />
        <View style={s.sheet}>
          <View style={s.grab} />
          <View style={s.sheetHead}>
            <FileIcon type={file.file_type} size={40} />
            <Text style={[s.name, { flex: 1 }]} numberOfLines={1}>{file.name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close file actions" disabled={busy} onPress={() => setSheet(null)} style={s.more}><Ionicons name="close-outline" size={24} color={theme.muted} /></Pressable>
          </View>
          {sheet === "menu" && items.map((i) => (
            <Pressable key={i.label} onPress={i.on} style={({ pressed }) => [s.item, pressed && { backgroundColor: theme.bg }]}>
              <Ionicons name={i.icon} size={21} color={i.danger ? theme.danger : theme.text} />
              <Text style={[s.itemText, i.danger && { color: theme.danger }]}>{i.label}</Text>
            </Pressable>
          ))}
          {sheet === "rename" && (
            <View style={{ gap: 12 }}>
              <Text style={s.itemText}>Rename file</Text>
              <TextInput accessibilityLabel="File name" value={name} onChangeText={setName} autoFocus selectTextOnFocus maxLength={255} editable={!busy} returnKeyType="done" onSubmitEditing={saveName} style={s.input} />
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
              <Button label="Rename file" icon="create-outline" variant="outline" onPress={() => { setName(file.name); setSheet("rename"); }} />
            </View>
          )}
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  sharedRow: { shadowColor: st.shadow, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  libraryRow: { backgroundColor: lt.surface, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, gap: 0, minHeight: 86, borderWidth: 1, borderColor: lt.surface },
  selectedRow: { backgroundColor: lt.selected, borderColor: lt.selectedBorder },
  libraryOpen: { gap: 12, minHeight: 64 },
  libraryName: { color: lt.text, fontSize: 14, fontWeight: "600" },
  libraryMeta: { color: lt.muted, fontSize: 11, marginTop: 4 },
  typeBadge: { flexDirection: "row", gap: 4, alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginTop: 4 },
  typeLabel: { fontSize: 10, fontWeight: "500" },
  homeRow: { paddingHorizontal: 8, paddingVertical: 2, gap: 4, minHeight: 48, borderWidth: 1, borderColor: homeTheme.border, borderRadius: 14, backgroundColor: homeTheme.surface },
  homeName: { color: homeTheme.text, fontSize: 12 },
  homeMeta: { color: homeTheme.muted, fontSize: 10 },
  homeMore: { width: 48, height: 48 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  openFile: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, minWidth: 0 },
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
