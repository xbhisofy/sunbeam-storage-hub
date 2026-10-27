import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { AdEventType, InterstitialAd } from "react-native-google-mobile-ads";
import { Screen, Button, Card } from "./ui";
import { FileIcon } from "./FileCard";
import { supabase } from "../lib/supabase";
import { ADS } from "../lib/config";
import { theme } from "../lib/theme";
import { useSession } from "../app/_layout";
import { Motion } from "./Motion";
import { loadSharedFile } from "../lib/shared-file";
import { MediaPlayer } from "./MediaPlayer";

type Shared = { name: string; file_type: string; mime: string | null; source: string; url: string };
type State = { kind: "loading" } | { kind: "missing" } | { kind: "expired" } | ({ kind: "ok" } & Shared);

const REASONS = ["Copyright infringement", "Sexual or adult content", "Child safety", "Violence or harmful content", "Spam or scam", "Other"];

export function PlayerScreen({ slug }: { slug: string }) {
  const session = useSession();
  const [st, setSt] = useState<State>({ kind: "loading" });
  const [open, setOpen] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [report, setReport] = useState(false);
  const counted = useRef(false);

  useEffect(() => {
    (async () => {
      const result = await loadSharedFile(slug);
      setSt(result);
    })();
  }, [slug, session?.user.id]);

  // A view counts only when the content actually plays or is shown.
  const countView = () => { if (!counted.current) { counted.current = true; supabase.rpc("record_view", { _slug: slug }); } };

  function showAdThenOpen() {
    setAdBusy(true);
    const ad = InterstitialAd.createForAdRequest(ADS.interstitial);
    let finished = false;
    const finish = () => { if (finished) return; finished = true; setAdBusy(false); setOpen(true); unsub.forEach((u) => u()); };
    const unsub = [
      ad.addAdEventListener(AdEventType.LOADED, () => ad.show().catch(finish)),
      ad.addAdEventListener(AdEventType.CLOSED, finish),
      ad.addAdEventListener(AdEventType.ERROR, finish),
    ];
    ad.load();
    setTimeout(finish, 8000); // never block the file if no ad is available
  }

  async function sendReport(reason: string, details: string) {
    const { error } = await supabase.from("reports").insert({ file_slug: slug, file_name: st.kind === "ok" ? st.name : null, reason, details: details || null, email: session?.user.email ?? null, reporter_id: session?.user.id ?? null });
    if (error) return Alert.alert("Report not sent", error.message);
    setReport(false);
    Alert.alert("Thank you", "Our team will review this file.");
  }

  return (
    <Screen title={st.kind === "ok" ? st.name : "Shared file"} back>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {st.kind === "loading" && <ActivityIndicator color={theme.primary} style={{ marginTop: 60 }} />}
        {st.kind === "missing" && <Notice icon="alert-circle-outline" title="File not found" text="This link was removed or never existed." />}
        {st.kind === "expired" && <Notice icon="time-outline" title="Link expired" text="Ask the owner for a new link." />}
        {st.kind === "ok" && !open && (
          <Motion><View style={{ alignItems: "center", gap: 18, paddingVertical: 48 }}>
            <FileIcon type={st.file_type} size={64} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: "center" }} numberOfLines={2}>{st.name}</Text>
            <Text style={{ color: theme.muted, fontSize: 13 }}>Shared with you</Text>
            <Button label="Open file" icon="play" busy={adBusy} onPress={showAdThenOpen} style={{ alignSelf: "stretch" }} />
          </View></Motion>
        )}
        {st.kind === "ok" && open && <Viewer file={st} onShown={countView} />}
        {st.kind === "ok" && (
          <Pressable onPress={() => setReport(true)} style={{ flexDirection: "row", alignSelf: "center", alignItems: "center", gap: 6, padding: 8 }}>
            <Ionicons name="flag-outline" size={15} color={theme.muted} />
            <Text style={{ color: theme.muted }}>Report this file</Text>
          </Pressable>
        )}
      </ScrollView>
      <ReportSheet visible={report} onClose={() => setReport(false)} onSend={sendReport} />
    </Screen>
  );
}

function Notice({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <Card style={{ alignItems: "center", gap: 8, paddingVertical: 32 }}>
      <Ionicons name={icon} size={40} color={theme.primary} />
      <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }}>{title}</Text>
      <Text style={{ color: theme.muted, textAlign: "center" }}>{text}</Text>
    </Card>
  );
}

function Viewer({ file, onShown }: { file: Shared; onShown: () => void }) {
  if (file.file_type === "image") return <Image source={{ uri: file.url }} onLoad={onShown} resizeMode="contain" style={{ width: "100%", aspectRatio: 1, borderRadius: 16, backgroundColor: "#000" }} />;
  if (file.file_type === "video" || file.file_type === "audio") return <MediaPlayer url={file.url} title={file.name} audio={file.file_type === "audio"} onPlaying={onShown} />;
  if (file.source === "converted") return <Button label="Open link" icon="open-outline" onPress={() => Linking.openURL(file.url)} />;
  return <View style={{ height: 520, borderRadius: 16, overflow: "hidden" }}><WebView source={{ uri: `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(file.url)}` }} onLoadEnd={onShown} /></View>;
}

function ReportSheet({ visible, onClose, onSend }: { visible: boolean; onClose: () => void; onSend: (r: string, d: string) => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.4)" }} onPress={onClose} />
      <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }}>Report this file</Text>
        {REASONS.map((r) => (
          <Pressable key={r} onPress={() => setReason(r)} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
            <Ionicons name={reason === r ? "radio-button-on" : "radio-button-off"} size={20} color={theme.primary} />
            <Text style={{ color: theme.text, fontSize: 15 }}>{r}</Text>
          </Pressable>
        ))}
        <TextInput value={details} onChangeText={setDetails} placeholder="Details (optional)" placeholderTextColor="#94A3B8" multiline style={{ minHeight: 80, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.text, textAlignVertical: "top" }} />
        <Button label="Submit report" onPress={() => onSend(reason, details.trim().slice(0, 1000))} style={{ marginTop: 6, marginBottom: 12 }} />
      </View>
    </Modal>
  );
}
