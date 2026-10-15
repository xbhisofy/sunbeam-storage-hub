import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Button } from "../components/ui";
import { useSession } from "./_layout";
import { formatSize, uploadFile } from "../lib/files";
import { theme } from "../lib/theme";

export default function Uploader() {
  const session = useSession();
  const [current, setCurrent] = useState<{ name: string; size: number; step: string } | null>(null);
  const [done, setDone] = useState(0);

  async function pick() {
    if (!session) return;
    const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (res.canceled) return;
    let ok = 0;
    for (let i = 0; i < res.assets.length; i++) {
      const a = res.assets[i];
      setCurrent({ name: a.name, size: a.size ?? 0, step: res.assets.length > 1 ? `${i + 1} of ${res.assets.length}` : "" });
      try { await uploadFile(session.user.id, a); ok++; }
      catch (e) {
        void notify("Upload failed", `${a.name} could not be uploaded. Please try again.`);
        Alert.alert("Upload failed", `${a.name}: ${e instanceof Error ? e.message : "Please try again."}`);
      }
    }
    setCurrent(null);
    setDone((d) => d + ok);
    if (ok) void notify("Upload complete", ok === 1 ? `${res.assets.find(Boolean)?.name ?? "Your file"} is ready to share.` : `${ok} files are ready to share.`);
  }

  return (
    <Screen title="Upload" back>
      <View style={{ padding: 16, gap: 16 }}>
        <Card style={{ alignItems: "center", gap: 10, paddingVertical: 32 }}>
          <View style={s.icon}><Ionicons name="cloud-upload-outline" size={34} color={theme.primary} /></View>
          <Text style={s.h}>Upload files</Text>
          <Text style={{ color: theme.muted, textAlign: "center" }}>Documents, images, videos and music. Files appear on the website too.</Text>
          <Button label="Choose files" icon="add" onPress={pick} busy={!!current} style={{ alignSelf: "stretch", marginTop: 8 }} />
        </Card>
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
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" },
  h: { fontSize: 20, fontWeight: "700", color: theme.text },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.primarySoft, marginTop: 6, overflow: "hidden" },
  fill: { width: "60%", height: 6, backgroundColor: theme.primary, borderRadius: 3 },
});
