import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import * as ScreenOrientation from "expo-screen-orientation";
import { WebView } from "react-native-webview";
import { AdEventType, InterstitialAd } from "react-native-google-mobile-ads";
import { Screen, Button, Card } from "./ui";
import { FileIcon } from "./FileCard";
import { supabase } from "../lib/supabase";
import { ADS } from "../lib/config";
import { theme } from "../lib/theme";
import { useSession } from "../app/_layout";

type Shared = { name: string; file_type: string; mime: string | null; source: string; url: string };
type State = { kind: "loading" } | { kind: "missing" } | { kind: "expired" } | { kind: "own"; name: string } | ({ kind: "ok" } & Shared);

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
      const { data: f } = await supabase.from("files").select("owner_id,name,file_type,mime,storage_path,source,external_url,expires_at").eq("slug", slug).maybeSingle();
      if (!f) return setSt({ kind: "missing" });
      if (f.owner_id === session?.user.id) {
        const { data: me } = await supabase.from("profiles").select("premium_tier,premium_until").eq("id", f.owner_id).maybeSingle();
        if (!(me?.premium_tier && me.premium_until && new Date(me.premium_until) > new Date())) return setSt({ kind: "own", name: f.name });
      }
      if (f.expires_at && new Date(f.expires_at).getTime() < Date.now()) return setSt({ kind: "expired" });
      let url = f.external_url ?? "";
      if (f.storage_path) url = (await supabase.storage.from("files").createSignedUrl(f.storage_path, 3 * 3600)).data?.signedUrl ?? "";
      setSt({ kind: "ok", name: f.name, file_type: f.file_type, mime: f.mime, source: f.source, url });
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
        {st.kind === "own" && <Notice icon="lock-closed-outline" title="This is your file" text="Viewing your own shared files requires a Premium plan. Plans are available on app.tanyora.com." />}
        {st.kind === "ok" && !open && (
          <Card style={{ alignItems: "center", gap: 12, paddingVertical: 32 }}>
            <FileIcon type={st.file_type} size={64} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: theme.text, textAlign: "center" }} numberOfLines={2}>{st.name}</Text>
            <Button label="Open file" icon="play" busy={adBusy} onPress={() => (st.source === "converted" && st.url ? (countView(), showAdThenOpen()) : showAdThenOpen())} style={{ alignSelf: "stretch" }} />
          </Card>
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
  if (file.file_type === "video" || file.file_type === "audio") return <MediaPlayer url={file.url} audio={file.file_type === "audio"} onPlaying={onShown} />;
  if (file.source === "converted") return <Notice icon="open-outline" title="External link" text="This shared link points to another site." />;
  return <View style={{ height: 520, borderRadius: 16, overflow: "hidden" }}><WebView source={{ uri: `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(file.url)}` }} onLoadEnd={onShown} /></View>;
}

const SPEEDS = [0.5, 1, 1.25, 1.5, 2, 3];
function MediaPlayer({ url, audio, onPlaying }: { url: string; audio: boolean; onPlaying: () => void }) {
  const player = useVideoPlayer(url, (p) => { p.timeUpdateEventInterval = 0.5; p.play(); });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { currentTime } = useEvent(player, "timeUpdate", { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  const [speed, setSpeed] = useState(1);
  const [land, setLand] = useState(false);
  const view = useRef<VideoView>(null);

  useEffect(() => { if (isPlaying) onPlaying(); }, [isPlaying, onPlaying]);
  useEffect(() => () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {}); }, []);

  const seek = (d: number) => { player.currentTime = Math.max(0, player.currentTime + d); };
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  async function rotate() {
    await ScreenOrientation.lockAsync(land ? ScreenOrientation.OrientationLock.PORTRAIT_UP : ScreenOrientation.OrientationLock.LANDSCAPE);
    setLand(!land);
  }
  const nextSpeed = () => { const s = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]; player.playbackRate = s; setSpeed(s); };
  const dur = player.duration || 0;

  return (
    <View style={{ gap: 12 }}>
      {audio ? (
        <Card style={{ alignItems: "center", paddingVertical: 28 }}><Ionicons name="musical-notes" size={56} color={theme.primary} /></Card>
      ) : (
        <VideoView ref={view} player={player} nativeControls={false} contentFit="contain" allowsFullscreen style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: "#000" }} />
      )}
      <View style={ps.track}><View style={[ps.fill, { width: `${dur ? Math.min(100, (currentTime / dur) * 100) : 0}%` }]} /></View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={ps.time}>{fmt(currentTime)}</Text><Text style={ps.time}>{fmt(dur)}</Text>
      </View>
      <View style={ps.controls}>
        <Ctrl icon="play-back" label="10" on={() => seek(-10)} />
        <Pressable accessibilityLabel={isPlaying ? "Pause" : "Play"} onPress={() => (isPlaying ? player.pause() : player.play())} style={ps.play}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={30} color="#FFFFFF" />
        </Pressable>
        <Ctrl icon="play-forward" label="10" on={() => seek(10)} />
      </View>
      <View style={ps.controls}>
        <Pressable onPress={nextSpeed} style={ps.pill}><Text style={ps.pillText}>{speed}×</Text></Pressable>
        {!audio && <Pressable onPress={rotate} style={ps.pill}><Ionicons name="phone-landscape-outline" size={18} color={theme.primary} /><Text style={ps.pillText}>Rotate</Text></Pressable>}
        {!audio && <Pressable onPress={() => view.current?.enterFullscreen()} style={ps.pill}><Ionicons name="expand" size={18} color={theme.primary} /><Text style={ps.pillText}>Fullscreen</Text></Pressable>}
      </View>
    </View>
  );
}

function Ctrl({ icon, label, on }: { icon: keyof typeof Ionicons.glyphMap; label: string; on: () => void }) {
  return (
    <Pressable onPress={on} style={ps.ctrl} accessibilityLabel={`${icon === "play-back" ? "Back" : "Forward"} 10 seconds`}>
      <Ionicons name={icon} size={22} color={theme.text} /><Text style={{ fontSize: 11, color: theme.muted }}>{label}s</Text>
    </Pressable>
  );
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

const ps = StyleSheet.create({
  track: { height: 4, borderRadius: 2, backgroundColor: theme.border, overflow: "hidden" },
  fill: { height: 4, backgroundColor: theme.primary },
  time: { fontSize: 12, color: theme.muted },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 18 },
  play: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" },
  ctrl: { width: 52, height: 52, borderRadius: 26, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  pill: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 14, height: 38, borderRadius: 19, backgroundColor: theme.primarySoft },
  pillText: { color: theme.primary, fontWeight: "700" },
});
