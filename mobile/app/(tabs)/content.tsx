import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { useSession } from "../_layout";
import { supabase } from "../../lib/supabase";
import { SITE_URL } from "../../lib/config";
import { theme } from "../../lib/theme";

type FileRow = {
  id: string;
  name: string;
  slug: string;
  views: number;
  file_type: string;
  source: string;
  size: number;
};

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB — same limit as the website

function typeOf(mime: string): string {
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return "other";
}

export default function Content() {
  const session = useSession();
  const uid = session?.user.id;
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | "original" | "converted">("all");
  const [convertOpen, setConvertOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const { data } = await supabase
      .from("files")
      .select("id, name, slug, views, file_type, source, size")
      .eq("owner_id", uid)
      .order("created_at", { ascending: false });
    setFiles(data ?? []);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets[0];
    if ((file.size ?? 0) > MAX_SIZE) {
      Alert.alert("File too large", "You can upload files up to 50 MB.");
      return;
    }
    setBusy(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const buffer = decode(base64);
      const mime = file.mimeType ?? "application/octet-stream";
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${uid}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("files")
        .upload(path, buffer, { contentType: mime, upsert: false });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("files").insert({
        owner_id: uid,
        name: file.name,
        file_type: typeOf(mime),
        mime,
        size: file.size ?? buffer.byteLength,
        storage_path: path,
        source: "original",
      });
      if (dbErr) throw dbErr;
      Alert.alert("Uploaded", "Your file is ready. Copy the link to share it.");
      load();
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }

  async function convertLink() {
    const url = linkUrl.trim();
    if (!/^https?:\/\//.test(url)) {
      Alert.alert("Invalid link", "The link must start with https:// or http://.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("files").insert({
        owner_id: uid,
        name: linkTitle.trim() || url,
        file_type: "link",
        mime: null,
        size: 0,
        storage_path: null,
        source: "converted",
        external_url: url,
      });
      if (error) throw error;
      setConvertOpen(false);
      setLinkUrl("");
      setLinkTitle("");
      Alert.alert("Converted", "Your share link is ready.");
      load();
    } catch (e) {
      Alert.alert("Conversion failed", e instanceof Error ? e.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(slug: string) {
    await Clipboard.setStringAsync(`${SITE_URL}/s/${slug}`);
    Alert.alert("Link copied", "Paste it anywhere to share.");
  }

  async function remove(file: FileRow) {
    Alert.alert("Delete file?", file.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("files").delete().eq("id", file.id);
          load();
        },
      },
    ]);
  }

  const shown = files.filter((f) => filter === "all" || f.source === filter);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>My Content</Text>

      <View style={styles.filters}>
        {(["all", "original", "converted"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f === "all" ? "All" : f === "original" ? "Original" : "Converted"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(f) => f.id}
          contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No files yet. Upload a file or convert a link to get started.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.fileCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {item.views} views · {item.source === "converted" ? "Converted link" : "Original"}
                </Text>
              </View>
              <Pressable style={styles.smallButton} onPress={() => copyLink(item.slug)}>
                <Text style={styles.smallButtonText}>Copy Link</Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={() => remove(item)}>
                <Text style={{ color: theme.danger }}>🗑</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <View style={styles.bottomActions}>
        <Pressable style={[styles.action, styles.half]} onPress={upload} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>⬆ Upload</Text>}
        </Pressable>
        <Pressable
          style={[styles.action, styles.half, styles.secondary]}
          onPress={() => setConvertOpen(true)}
          disabled={busy}
        >
          <Text style={[styles.actionText, { color: theme.primary }]}>🔗 Convert Link</Text>
        </Pressable>
      </View>

      <Modal visible={convertOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={[styles.title, { fontSize: 18 }]}>Convert Link</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste a video link (https://...)"
              placeholderTextColor={theme.muted}
              autoCapitalize="none"
              value={linkUrl}
              onChangeText={setLinkUrl}
            />
            <TextInput
              style={styles.input}
              placeholder="Title (optional)"
              placeholderTextColor={theme.muted}
              value={linkTitle}
              onChangeText={setLinkTitle}
            />
            <View style={styles.row}>
              <Pressable style={[styles.action, styles.half, styles.secondary]} onPress={() => setConvertOpen(false)}>
                <Text style={[styles.actionText, { color: theme.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.action, styles.half]} onPress={convertLink} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Convert</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 20, paddingTop: 60 },
  title: { color: theme.text, fontSize: 24, fontWeight: "800", marginBottom: 16 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { color: theme.muted, fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  fileName: { color: theme.text, fontWeight: "600" },
  fileMeta: { color: theme.muted, fontSize: 12, marginTop: 2 },
  smallButton: { backgroundColor: theme.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  deleteButton: { padding: 6 },
  empty: { color: theme.muted, textAlign: "center", marginTop: 40 },
  bottomActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  action: { backgroundColor: theme.primary, borderRadius: 12, padding: 14, alignItems: "center" },
  secondary: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.primary },
  actionText: { color: "#fff", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  input: {
    backgroundColor: theme.bg,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 12,
    color: theme.text,
    padding: 12,
  },
});
