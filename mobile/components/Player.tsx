import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { AdEventType, InterstitialAd, RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";
import { formatSize, iconFor } from "../lib/files";
import { Screen, Button, Card } from "./ui";
import { supabase } from "../lib/supabase";
import { ADS } from "../lib/config";
import { theme } from "../lib/theme";
import { useSession } from "../app/_layout";
import { Motion } from "./Motion";
import { loadSharedFile } from "../lib/shared-file";
import { MediaPlayer } from "./MediaPlayer";
import { useSharedPlayback, type PlaybackAd } from "../lib/use-shared-playback";
import { SharedDisplayAd } from "./SharedDisplayAd";
import { canShowSharedDisplayAd } from "../lib/display-ad";

type Shared = { name: string; file_type: string; mime: string | null; size: number; source: string; url: string };
function createPlaybackAd(): PlaybackAd {
  if (ADS.rewarded) {
    const rewarded = RewardedAd.createForAdRequest(ADS.rewarded);
    const ev = { loaded: RewardedAdEventType.LOADED, closed: AdEventType.CLOSED, error: AdEventType.ERROR } as const;
    return { subscribe: (event, callback) => rewarded.addAdEventListener(ev[event] as never, callback as never), load: () => rewarded.load(), show: () => rewarded.show() };
  }
  const ad = InterstitialAd.createForAdRequest(ADS.interstitial);
  const events = { loaded: AdEventType.LOADED, closed: AdEventType.CLOSED, error: AdEventType.ERROR };
  return { subscribe: (event, callback) => ad.addAdEventListener(events[event], callback), load: () => ad.load(), show: () => ad.show() };
}
function recordPlaybackView(slug: string) { void supabase.rpc("record_view", { _slug: slug }); }

const REASONS = ["Copyright infringement", "Sexual or adult content", "Child safety", "Violence or harmful content", "Spam or scam", "Other"];

export function PlayerScreen({ slug }: { slug: string }) {
  const session = useSession();
  const { st, open, adBusy, adUnavailable, showAdThenOpen, continueWithoutAd, countView } = useSharedPlayback(slug, session?.user.id, loadSharedFile, createPlaybackAd, recordPlaybackView);
  const [report, setReport] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { width, height } = useWindowDimensions();
  useEffect(() => { setReport(false); setFullscreen(false); }, [slug, session?.user.id]);
  const exitAd = useRef<InterstitialAd | null>(null);
  const exitReady = useRef(false);
  useEffect(() => {
    if (!open) return;
    const ad = InterstitialAd.createForAdRequest(ADS.interstitial);
    exitAd.current = ad; exitReady.current = false;
    const offs = [ad.addAdEventListener(AdEventType.LOADED, () => { exitReady.current = true; }), ad.addAdEventListener(AdEventType.ERROR, () => { exitReady.current = false; })];
    ad.load();
    return () => { offs.forEach(off => off()); exitAd.current = null; exitReady.current = false; };
  }, [open, slug]);
  function leave() {
    const ad = exitAd.current;
    if (!ad || !exitReady.current) return router.back();
    exitReady.current = false;
    const off = ad.addAdEventListener(AdEventType.CLOSED, () => { off(); router.back(); });
    try { ad.show(); } catch { off(); router.back(); }
  }
  useEffect(() => {
    if (!open || fullscreen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { leave(); return true; });
    return () => sub.remove();
  }, [open, fullscreen]);
  const displayAd = canShowSharedDisplayAd({ ready: st.kind === "ok", width, height, fullscreen, adBusy, reportOpen: report });
  const fileType = st.kind === "ok" ? st.file_type : "other";
  const tint = theme.cat[fileType] ?? theme.cat.other;
  const tintIcon = iconFor(fileType) as keyof typeof Ionicons.glyphMap;

  async function sendReport(reason: string, details: string) {
    const { error } = await supabase.from("reports").insert({ file_slug: slug, file_name: st.kind === "ok" ? st.name : null, reason, details: details || null, email: session?.user.email ?? null, reporter_id: session?.user.id ?? null });
    if (error) return Alert.alert("Report not sent", error.message);
    setReport(false);
    Alert.alert("Thank you", "Our team will review this file.");
  }

  return (
    <Screen title={st.kind === "ok" ? st.name : "Shared file"} back onBack={open ? leave : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {displayAd && <SharedDisplayAd compact key={`top:${slug}:${session?.user.id ?? ""}`} />}
        {st.kind === "loading" && <ActivityIndicator color={theme.primary} style={{ marginTop: 60 }} />}
        {st.kind === "missing" && <Notice icon="alert-circle-outline" title="File not found" text="This link was removed or never existed." />}
        {st.kind === "expired" && <Notice icon="time-outline" title="Link expired" text="Ask the owner for a new link." />}
        {st.kind === "ok" && !open && (
          <Motion><View style={{ gap: 12 }}>
            <View style={[pv.stage, { backgroundColor: tint.bg }]}>
              {st.file_type === "image" ? (
                <Image source={{ uri: st.url }} blurRadius={18} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
              ) : (
                <View pointerEvents="none" style={pv.fileGlance}>
                  <Ionicons name={tintIcon} size={100} color={tint.fg} />
                  <Text style={[pv.glanceName, { color: tint.fg }]} numberOfLines={2}>{st.name}</Text>
                </View>
              )}
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, pv.glass]} />
              <Pressable accessibilityRole="button" accessibilityLabel="Open file" disabled={adBusy} onPress={showAdThenOpen} style={({ pressed }) => [pv.open, pressed && pv.openPressed, adBusy && pv.openDisabled]}>
                <LinearGradient colors={theme.openGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pv.openFill}>
                  {adBusy ? <ActivityIndicator color={theme.onPrimary} /> : <Text style={pv.openText}>{adUnavailable ? "Try again" : "Open"}</Text>}
                </LinearGradient>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Report this file" onPress={() => setReport(true)} style={pv.reportLink}>
                <Text style={pv.reportText}>Report</Text>
              </Pressable>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={pv.name} numberOfLines={2}>{st.name}</Text>
              <Text style={pv.size}>{formatSize(st.size)}</Text>
            </View>
            {adUnavailable && <Text accessibilityRole="alert" style={pv.notice}>The ad could not load. Check your connection and allow ads for Tanyora, then try again.</Text>}
            {adUnavailable && <Button label="Continue" icon="play" variant="outline" onPress={continueWithoutAd} style={{ alignSelf: "stretch" }} />}
          </View></Motion>
        )}
        {st.kind === "ok" && open && <Viewer file={st} onShown={countView} onFullscreenChange={setFullscreen} />}
        {st.kind === "ok" && open && (
          <Pressable onPress={() => setReport(true)} style={{ flexDirection: "row", alignSelf: "center", alignItems: "center", gap: 6, padding: 8 }}>
            <Ionicons name="flag-outline" size={15} color={theme.muted} />
            <Text style={{ color: theme.muted }}>Report this file</Text>
          </Pressable>
        )}
        {displayAd && <SharedDisplayAd key={`${slug}:${session?.user.id ?? ""}`} />}
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

function Viewer({ file, onShown, onFullscreenChange }: { file: Shared; onShown: () => void; onFullscreenChange: (fullscreen: boolean) => void }) {
  if (file.file_type === "image") return <Image source={{ uri: file.url }} onLoad={onShown} resizeMode="contain" style={{ width: "100%", aspectRatio: 1, borderRadius: 16, backgroundColor: "#000" }} />;
  if (file.file_type === "video" || file.file_type === "audio") return <MediaPlayer url={file.url} title={file.name} audio={file.file_type === "audio"} onPlaying={onShown} onFullscreenChange={onFullscreenChange} />;
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

const pv = StyleSheet.create({
  stage: { width: "100%", aspectRatio: 1.55, borderRadius: 20, borderWidth: 1, borderColor: theme.border, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  fileGlance: { ...StyleSheet.absoluteFillObject, opacity: 0.28, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  glanceName: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  glass: { backgroundColor: theme.previewGlass },
  name: { fontSize: 18, fontWeight: "700", color: theme.text },
  size: { fontSize: 14, color: theme.placeholder },
  open: { width: 112, height: 54, borderRadius: 12, overflow: "hidden" },
  openFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  openPressed: { opacity: 0.88 },
  openDisabled: { opacity: 0.6 },
  openText: { color: theme.onPrimary, fontSize: 16, fontWeight: "700" },
  notice: { color: theme.muted, textAlign: "center", lineHeight: 21, fontSize: 13 },
  reportLink: { position: "absolute", right: 12, bottom: 12, minWidth: 82, minHeight: 44, borderRadius: 12, backgroundColor: theme.previewReport, alignItems: "center", justifyContent: "center" },
  reportText: { color: theme.muted, fontSize: 13 },
});
