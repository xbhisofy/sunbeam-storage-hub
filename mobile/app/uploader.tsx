import { useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/ui";
import { Motion } from "../components/Motion";
import { useSession } from "./_layout";
import { formatSize, uploadFile } from "../lib/files";
import { notify } from "../lib/notifications";
import { acceptNotice, needsNotice, readNotice } from "../lib/consent";
import { WEB_URL } from "../lib/config";
import { uploadTheme as theme } from "../lib/upload-theme";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import uploadCloud from "../assets/upload-cloud.png";

type Pick = { uri: string; name: string; mimeType?: string | null; size?: number | null };

export default function Uploader() {
  const session = useSession();
  const insets = useSafeAreaInsets();
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

  const Option = ({ icon, title, text, types, on }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; types: string[]; on: () => void }) => (
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!current }} disabled={!!current} onPress={on} style={({ pressed }) => [s.option, pressed && s.pressed, current && s.disabled]}>
      <View style={s.optionTop}><View style={s.optIcon}><Ionicons name={icon} size={32} color={theme.primary} /></View><View style={s.optionCopy}><Text style={s.optTitle}>{title}</Text><Text style={s.muted}>{text}</Text></View><View style={s.arrow}><Ionicons name="chevron-forward" size={22} color={theme.text} /></View></View>
      <View style={s.types}>{types.map((type, index) => <View key={type} style={s.type}><Ionicons name={icon === "images" ? index < 2 ? "image" : "play-circle" : "document-text"} size={13} color={theme.primary} /><Text style={s.typeText}>{type}</Text></View>)}</View>
    </Pressable>
  );
  const Source = ({ icon, title, description, on }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string; on?: () => void }) => <Pressable accessibilityRole="button" accessibilityLabel={`${title}${on ? "" : ", unavailable"}`} accessibilityState={{ disabled: !on || !!current }} disabled={!on || !!current} onPress={on} style={({ pressed }) => [s.source, !on && s.disabled, pressed && s.pressed]}><View style={s.sourceIcon}><Ionicons name={icon} size={30} color={theme.primary} /></View><Text style={s.sourceTitle}>{title}</Text><Text style={s.sourceText}>{description}</Text></Pressable>;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={s.back}><Ionicons name="chevron-back" size={26} color={theme.text} /></Pressable><View style={{ flex: 1 }}><Text style={s.headerTitle}>Upload</Text><Text style={s.headerSubtitle}>Choose what you want to upload</Text></View></View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        <Motion><View style={s.hero}><View style={s.heroCopy}><Text style={s.eyebrow}>UPLOAD TO TANYORA</Text><Text style={s.heroTitle}>Add to your<Text style={s.blue}> cloud storage</Text></Text><Text style={s.heroText}>Your files are accessible everywhere and also available on the website.</Text></View><Image source={uploadCloud} resizeMode="contain" accessible={false} style={s.art} /></View></Motion>
        <View style={s.benefits}>{["Secure Upload", "Access Anywhere", "Sync to Website"].map(label => <View key={label} style={s.benefit}><Ionicons name="checkmark-circle" size={16} color={theme.primary} /><Text style={s.benefitText}>{label}</Text></View>)}</View>
        <Motion delay={60}><Option icon="images" title="Photos & Videos" text="Choose from your gallery" types={["JPG", "PNG", "MP4", "MOV", "HEIC"]} on={startMedia} /></Motion>
        <Motion delay={100}><Option icon="document-text" title="Documents & Files" text="PDF, music and other files" types={["PDF", "DOC", "XLS", "MP3", "ZIP"]} on={pickDocuments} /></Motion>
        <View style={s.divider}><View style={s.line} /><Text style={s.or}>OR UPLOAD FROM</Text><View style={s.line} /></View>
        <View style={s.sources}><Source icon="camera" title="Camera" description="Not available" /><Source icon="folder" title="Browse Files" description="Choose from your device" on={pickDocuments} /><Source icon="cloud-outline" title="Drive" description="Not connected" /></View>
        <View style={s.info}><View style={s.infoIcon}><Ionicons name="shield-checkmark" size={25} color={theme.primary} /></View><Text style={s.infoText}>Only the files you choose are uploaded. They appear on the website too.</Text><Ionicons name="cloud" size={42} color={theme.track} /></View>
        {current && <View style={s.status} accessibilityLiveRegion="polite"><ActivityIndicator color={theme.primary} /><View style={{ flex: 1 }}><Text style={s.statusTitle} numberOfLines={1}>Uploading {current.name}</Text><Text style={s.muted}>{formatSize(current.size)} {current.step && `· ${current.step}`}</Text></View></View>}
        {done > 0 && !current && <View style={s.status} accessibilityLiveRegion="polite"><Ionicons name="checkmark-circle" size={26} color={theme.success} /><Text style={[s.statusTitle, { flex: 1 }]}>{done} file{done > 1 ? "s" : ""} uploaded</Text><Pressable accessibilityRole="button" accessibilityLabel="View uploaded files" onPress={() => router.replace("/content")} style={s.back}><Text style={s.blue}>View</Text></Pressable></View>}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
  back: { minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" }, headerTitle: { fontSize: 22, fontWeight: "800", color: theme.text }, headerSubtitle: { fontSize: 12, lineHeight: 18, color: theme.muted, marginTop: 2 },
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 14, maxWidth: 760, width: "100%", alignSelf: "center" },
  hero: { flexDirection: "row", alignItems: "center", minHeight: 170, gap: 2 }, heroCopy: { flex: 1.15, minWidth: 0 }, art: { flex: 1, width: "44%", height: 164 },
  eyebrow: { color: theme.muted, fontSize: 10, fontWeight: "600", marginBottom: 8 }, heroTitle: { color: theme.text, fontSize: 25, lineHeight: 30, fontWeight: "800" }, blue: { color: theme.primary }, heroText: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  benefits: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.surface, backgroundColor: theme.storageStart }, benefit: { flexDirection: "row", alignItems: "center", gap: 3, flex: 1 }, benefitText: { color: theme.muted, fontSize: 9, fontWeight: "600", flexShrink: 1 },
  option: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 22, padding: 12, gap: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  optionTop: { flexDirection: "row", alignItems: "center", gap: 12 }, optionCopy: { flex: 1, minWidth: 0 }, optIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: theme.storage, alignItems: "center", justifyContent: "center" }, optTitle: { fontSize: 17, fontWeight: "700", color: theme.text }, muted: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  arrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" },
  types: { flexDirection: "row", flexWrap: "wrap", gap: 5, paddingLeft: 66 }, type: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 5, borderRadius: 12, backgroundColor: theme.background }, typeText: { fontSize: 9, color: theme.muted },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 2 }, line: { flex: 1, height: 1, backgroundColor: theme.track }, or: { fontSize: 10, fontWeight: "600", color: theme.muted },
  sources: { flexDirection: "row", gap: 8 }, source: { flex: 1, minWidth: 0, alignItems: "center", paddingHorizontal: 6, paddingVertical: 12, borderRadius: 18, backgroundColor: theme.surface, gap: 6 }, sourceIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: theme.background, alignItems: "center", justifyContent: "center" }, sourceTitle: { color: theme.text, fontSize: 12, fontWeight: "700", textAlign: "center" }, sourceText: { color: theme.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  info: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 16, backgroundColor: theme.storage, borderWidth: 1, borderColor: theme.surface }, infoIcon: { width: 36, height: 40, alignItems: "center", justifyContent: "center" }, infoText: { color: theme.muted, fontSize: 12, lineHeight: 18, flex: 1 },
  status: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: theme.surface }, statusTitle: { color: theme.text, fontSize: 14, fontWeight: "600" },
  pressed: { opacity: 0.7 }, disabled: { opacity: 0.55 }, overlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 }, sheetTitle: { fontSize: 20, fontWeight: "800", color: theme.text }, body: { color: theme.text, fontSize: 14, lineHeight: 21 },
});
