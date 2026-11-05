import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, BackHandler, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { AdEventType, InterstitialAd, RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";
import { LinearGradient } from "expo-linear-gradient";
import { formatSize } from "../lib/files";
import { Screen, Button, Card } from "./ui";
import { FileIcon } from "./FileCard";
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
          <Motion><View style={{ gap: 14 }}>
            <View style={pv.card}>
              {st.file_type === "image"
                ? <Image source={{ uri: st.url }} blurRadius={25} resizeMode="cover" style={StyleSheet.absoluteFill} />
                : <LinearGradient colors={["#E0E7FF", "#F1F5F9", "#DBEAFE"]} style={StyleSheet.absoluteFill}><View style={pv.ghost}><FileIcon type={st.file_type} size={72} /></View></LinearGradient>}
              <View style={pv.veil} />
              <Pressable accessibilityRole="button" disabled={adBusy} onPress={showAdThenOpen} style={pv.openWrap}>
                <LinearGradient colors={["#0EA5E9", "#4F46E5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={pv.open}>
                  {adBusy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={pv.openText}>{adUnavailable ? "Retry" : "Open"}</Text>}
                </LinearGradient>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setReport(true)} style={pv.report}><Text style={pv.reportText}>Report</Text></Pressable>
            </View>
            <View style={{ gap: 4, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }} numberOfLines={2}>{st.name}</Text>
              <Text style={{ color: theme.muted, fontSize: 14 }}>{formatSize(st.size)}</Text>
            </View>
            {adUnavailable && <Text accessibilityRole="alert" style={{ color: theme.muted, textAlign: "center", lineHeight: 21 }}>The ad could not load. Check your connection and allow ads for Tanyora, then try again.</Text>}
            {adUnavailable && <>
              <Button label="Continue" icon="play" variant="outline" onPress={continueWithoutAd} style={{ alignSelf: "stretch" }} />
              <Button label="Back" icon="arrow-back" variant="outline" onPress={() => router.back()} style={{ alignSelf: "stretch" }} />
            </>}
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
  card: { height: 320, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: theme.border, backgroundColor: "#F1F5F9" },
  ghost: { flex: 1, alignItems: "center", justifyContent: "center", opacity: 0.35 },
  veil: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.35)" },
  openWrap: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -62 }, { translateY: -28 }], borderRadius: 14, overflow: "hidden", elevation: 6 },
  open: { width: 124, height: 56, alignItems: "center", justifyContent: "center" },
  openText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  report: { position: "absolute", right: 16, bottom: 16, backgroundColor: "rgba(148,163,184,0.55)", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
  reportText: { color: "#DC2626", fontSize: 15, fontWeight: "600" },
});
