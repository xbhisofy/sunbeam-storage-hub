import { useState } from "react";
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Button } from "../components/ui";
import { Motion } from "../components/Motion";
import { useSession } from "./_layout";
import { formatSize, uploadFile } from "../lib/files";
import { notify } from "../lib/notifications";
import { acceptNotice, needsNotice, readNotice } from "../lib/consent";
import { WEB_URL } from "../lib/config";
import { theme } from "../lib/theme";

type Pick = { uri: string; name: string; mimeType?: string | null; size?: number | null };

export default function Uploader() {
  const session = useSession();
  const [current, setCurrent] = useState<{ name: string; size: number; step: string } | null>(null);
  const [done, setDone] = useState(0);
  const [notice, setNotice] = useState(false);

  async function upload(items: Pick[]) {
    if (!session || !items.length) return;
    let ok = 0;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      setCurrent({ name: a.name, size: a.size ?? 0, step: items.length > 1 ? `${i + 1} of ${items.length}` : "" });
      try { await uploadFile(session.user.id, a); ok++; }
      catch (e) {
        void notify("Upload failed", `${a.name} could not be uploaded. Please try again.`);
        Alert.alert("Upload failed", `${a.name}: ${e instanceof Error ? e.message : "Please try again."}`);
      }
    }
    setCurrent(null);
    setDone((d) => d + ok);
    if (ok) void notify("Upload complete", ok === 1 ? `${items[0].name} is ready to share.` : `${ok} files are ready to share.`);
  }

  async function startMedia() {
    if (needsNotice(await readNotice())) { setNotice(true); return; }
    void openPhotoPicker();
  }

  // Android system photo picker: only the items the user selects are shared with the app.
  async function openPhotoPicker() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], allowsMultipleSelection: true, selectionLimit: 20, quality: 1 });
    if (res.canceled) return;
    await upload(res.assets.map((a, i) => ({ uri: a.uri, name: a.fileName || `${a.type === "video" ? "video" : "photo"}-${Date.now()}-${i}.${a.type === "video" ? "mp4" : "jpg"}`, mimeType: a.mimeType ?? (a.type === "video" ? "video/mp4" : "image/jpeg"), size: a.fileSize })));
  }

  async function pickDocuments() {
    const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (!res.canceled) await upload(res.assets);
  }

  const Option = ({ icon, title, text, on }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; on: () => void }) => (
    <Pressable accessibilityRole="button" disabled={!!current} onPress={on} style={({ pressed }) => [s.option, pressed && { transform: [{ scale: 0.98 }], backgroundColor: theme.primarySoft }, current && { opacity: 0.5 }]}>
      <View style={s.optIcon}><Ionicons name={icon} size={24} color={theme.primary} /></View>
      <View style={{ flex: 1 }}><Text style={s.optTitle}>{title}</Text><Text style={s.muted}>{text}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={theme.muted} />
    </Pressable>
  );

  return (
    <Screen title="Upload" back>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Motion><View style={s.hero}><Ionicons name="cloud-upload-outline" size={30} color={theme.onPrimary} /><Text style={s.heroTitle}>Add to your cloud</Text><Text style={s.heroText}>Only the files you choose are uploaded. They appear on the website too.</Text></View></Motion>
        <Motion delay={60}><Option icon="images-outline" title="Photos & videos" text="Choose from your gallery" on={startMedia} /></Motion>
        <Motion delay={100}><Option icon="document-text-outline" title="Documents & files" text="PDF, music and other files" on={pickDocuments} /></Motion>
        {current && (
          <Card style={{ gap: 6 }}>
            <Text style={{ fontWeight: "600", color: theme.text }} numberOfLines={1}>Uploading {current.name}</Text>
            <Text style={{ color: theme.muted }}>{formatSize(current.size)} {current.step && `· ${current.step}`}</Text>
            <View style={s.bar}><View style={s.fill} /></View>
          </Card>
        )}
        {done > 0 && !current && (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="checkmark-circle" size={26} color={theme.success} />
            <Text style={{ flex: 1, color: theme.text, fontWeight: "600" }}>{done} file{done > 1 ? "s" : ""} uploaded</Text>
            <Text onPress={() => router.replace("/content")} style={{ color: theme.primary, fontWeight: "700" }}>View</Text>
          </Card>
        )}
      </ScrollView>

      <Modal visible={notice} transparent animationType="slide" onRequestClose={() => setNotice(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.optIcon}><Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} /></View>
          <Text style={s.sheetTitle}>Why Tanyora needs photo and video access</Text>
          <Text style={s.body}>Tanyora lets you select photos and videos to upload to your cloud storage.</Text>
          <Text style={s.body}>Only the files you choose will be uploaded. They are stored securely in our cloud storage and linked to your account, so you can view, manage and share them in the app and on the website.</Text>
          <Text style={s.body}>Your files are not used for unrelated purposes. You can cancel the selection at any time.</Text>
          <Text style={[s.body, { color: theme.primary, fontWeight: "700" }]} onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}>Read the Privacy Policy</Text>
          <Button label="Continue" icon="checkmark" onPress={async () => { await acceptNotice(); setNotice(false); void openPhotoPicker(); }} />
          <Button label="Not now" variant="outline" onPress={() => setNotice(false)} />
        </View></View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: theme.primary, borderRadius: 22, padding: 22, gap: 8 },
  heroTitle: { color: theme.onPrimary, fontSize: 22, fontWeight: "800", marginTop: 6 },
  heroText: { color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 20 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 18, padding: 16 },
  optIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  optTitle: { fontSize: 16, fontWeight: "700", color: theme.text }, muted: { color: theme.muted, fontSize: 13, marginTop: 2 },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.primarySoft, marginTop: 6, overflow: "hidden" },
  fill: { width: "60%", height: 6, backgroundColor: theme.primary, borderRadius: 3 },
  overlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: theme.text },
  body: { color: theme.text, fontSize: 14, lineHeight: 21 },
});
