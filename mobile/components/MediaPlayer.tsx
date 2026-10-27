import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import * as Orientation from "expo-screen-orientation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { playerTheme as t } from "../lib/player-theme";
import { seekTime, timelineTime } from "../lib/playback";

const speeds = [0.5, 1, 1.25, 1.5, 2, 3];
const clock = (value: number) => `${Math.floor(Math.max(0, value) / 60)}:${String(Math.floor(Math.max(0, value) % 60)).padStart(2, "0")}`;
export function MediaPlayer({ url, title, audio, onPlaying }: { url: string; title: string; audio: boolean; onPlaying: () => void }) {
  const player = useVideoPlayer(url, p => { p.timeUpdateEventInterval = 0.25; p.play(); });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { currentTime } = useEvent(player, "timeUpdate", { currentTime: 0, currentLiveTimestamp: null, currentOffsetFromLive: null, bufferedPosition: 0 });
  const { status, error } = useEvent(player, "statusChange", { status: player.status });
  const [fullscreen, setFullscreen] = useState(false);
  const [landscape, setLandscape] = useState(false);
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [speedMenu, setSpeedMenu] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [muted, setMuted] = useState(false);
  const [width, setWidth] = useState(1);
  const rotation = useRef(0);
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const [frameW, setFrameW] = useState(win.width);
  const duration = player.duration || 0;
  useEffect(() => { if (isPlaying) onPlaying(); }, [isPlaying, onPlaying]);
  useEffect(() => () => { rotation.current++; Orientation.lockAsync(Orientation.OrientationLock.PORTRAIT_UP).catch(() => {}); }, []);
  useEffect(() => {
    if (!isPlaying || speedMenu || locked) return;
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [isPlaying, visible, speedMenu, locked]);
  async function rotate() {
    const request = ++rotation.current;
    const next = !landscape;
    setLocked(false); setVisible(true); setFullscreen(true); setLandscape(next);
    try { await Orientation.lockAsync(next ? Orientation.OrientationLock.LANDSCAPE : Orientation.OrientationLock.PORTRAIT_UP); }
    catch { if (request === rotation.current) { setLandscape(false); await Orientation.lockAsync(Orientation.OrientationLock.PORTRAIT_UP).catch(() => {}); } }
  }
  async function close() {
    rotation.current++; setFullscreen(false); setLandscape(false); setLocked(false); setVisible(true);
    await Orientation.lockAsync(Orientation.OrientationLock.PORTRAIT_UP).catch(() => {});
  }
  const skip = (delta: number) => { player.currentTime = seekTime(player.currentTime, delta, duration); setVisible(true); };
  let compact = true;
  function tool(icon: keyof typeof Ionicons.glyphMap, label: string, action: () => void, selected = false) {
    return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={action} hitSlop={6} style={s.tool}><Ionicons name={icon} size={compact ? 20 : 22} color={selected ? t.accent : t.foreground} />{!compact && <Text style={s.label} maxFontSizeMultiplier={1}>{label}</Text>}</Pressable>;
  }
  const show = !locked && (visible || !isPlaying || status === "error");
  function renderPlayer(full: boolean) {
    const w = full ? win.width : frameW;
    const h = full ? win.height : frameW * 9 / 16;
    compact = w < 520 || h < 260;
    const small = h < 200;
    const skipSize = small ? 40 : compact ? 48 : 60;
    const playSize = small ? 52 : compact ? 62 : 76;
    return <View onLayout={full ? undefined : e => setFrameW(e.nativeEvent.layout.width)} style={[s.frame, full && s.full]}>
      {full && <StatusBar hidden />}
      {audio ? <View style={s.audio}><Ionicons name="musical-notes-outline" size={70} color={t.foreground} /></View> : <VideoView player={player} nativeControls={false} contentFit="contain" style={StyleSheet.absoluteFill} />}
      <Pressable accessibilityLabel="Show video controls" style={StyleSheet.absoluteFill} onPress={() => { if (!locked) setVisible(!visible); }} />
      {status === "loading" && <ActivityIndicator color={t.foreground} size="large" style={s.loading} />}
      {status === "error" && <View style={s.failure}><Text style={s.time}>{error?.message || "This video could not be loaded."}</Text></View>}
      {show && <>
        <LinearGradient colors={t.scrim} style={[s.top, compact && { padding: 6, paddingBottom: 16 }, full && { paddingTop: Math.max(12, insets.top), paddingLeft: Math.max(12, insets.left), paddingRight: Math.max(12, insets.right) }]}>
          {full && tool("arrow-back", "Back", () => void close())}
          <View style={s.heading}><Text style={s.title} numberOfLines={1} maxFontSizeMultiplier={1.1}>{title}</Text><Text style={s.subtitle} numberOfLines={1} maxFontSizeMultiplier={1}>{audio ? "Audio" : "Tanyora Player"}</Text></View>
          {tool("lock-closed-outline", "Lock", () => { setLocked(true); setSpeedMenu(false); })}
          <Pressable accessibilityRole="button" accessibilityLabel="Playback speed" onPress={() => setSpeedMenu(!speedMenu)} style={s.tool}><Text style={s.speed} maxFontSizeMultiplier={1}>{speed}x</Text>{!compact && <Text style={s.label} maxFontSizeMultiplier={1}>Speed</Text>}</Pressable>
          {!audio && tool("sync-outline", "Rotate", () => void rotate())}
        </LinearGradient>
        {speedMenu && <View style={s.menu}>{speeds.map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value}x`} onPress={() => { player.playbackRate = value; setSpeed(value); setSpeedMenu(false); }} style={s.speedOption}><Text style={[s.time, speed === value && { color: t.accent }]}>{value}x</Text></Pressable>)}</View>}
        <View style={[s.center, { top: small ? 40 : compact ? 52 : 76, bottom: small ? 64 : compact ? 78 : 112, gap: compact ? 18 : 28 }]} pointerEvents="box-none">
          <Pressable accessibilityRole="button" accessibilityLabel="Rewind 10 seconds" onPress={() => skip(-10)} style={[s.skip, { width: skipSize, height: skipSize, borderRadius: skipSize / 2 }]}><Ionicons name="refresh-outline" size={skipSize * 0.66} color={t.foreground} /><Text style={[s.ten, { fontSize: small ? 10 : 12 }]} maxFontSizeMultiplier={1}>10</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={isPlaying ? "Pause" : "Play"} onPress={() => isPlaying ? player.pause() : player.play()} style={[s.play, { width: playSize, height: playSize, borderRadius: playSize / 2 }]}><Ionicons name={isPlaying ? "pause" : "play"} size={playSize * 0.48} color={t.foreground} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Forward 10 seconds" onPress={() => skip(10)} style={[s.skip, { width: skipSize, height: skipSize, borderRadius: skipSize / 2 }]}><Ionicons name="refresh-outline" size={skipSize * 0.66} color={t.foreground} style={{ transform: [{ scaleX: -1 }] }} /><Text style={[s.ten, { fontSize: small ? 10 : 12 }]} maxFontSizeMultiplier={1}>10</Text></Pressable>
        </View>
        <LinearGradient colors={[t.scrim[1], t.scrim[0]]} style={[s.bottom, compact && { paddingTop: 14, paddingHorizontal: 10, paddingBottom: 2 }, full && { paddingBottom: Math.max(8, insets.bottom), paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) }]}>
          <Pressable accessibilityRole="adjustable" accessibilityLabel="Seek video" accessibilityValue={{ min: 0, max: duration, now: currentTime }} accessibilityActions={[{ name: "increment" }, { name: "decrement" }]} onAccessibilityAction={e => skip(e.nativeEvent.actionName === "increment" ? 10 : -10)} onLayout={e => setWidth(e.nativeEvent.layout.width)} onPress={e => { player.currentTime = timelineTime(e.nativeEvent.locationX, width, duration); setVisible(true); }} style={s.seekTouch}><View pointerEvents="none" style={s.track}><View style={[s.progress, { width: `${duration ? Math.min(100, currentTime / duration * 100) : 0}%` }]} /></View></Pressable>
          <View style={s.tools}>
            <Text style={s.time} maxFontSizeMultiplier={1}>{clock(currentTime)} / {clock(duration)}</Text>
            <View style={{ flex: 1 }} />
            {tool(muted ? "volume-mute-outline" : "volume-high-outline", muted ? "Unmute" : "Mute", () => { player.muted = !muted; setMuted(!muted); })}
            {tool("repeat-outline", "Repeat", () => { player.loop = !repeat; setRepeat(!repeat); }, repeat)}
            {!audio && tool(full ? "contract-outline" : "expand-outline", full ? "Exit fullscreen" : "Fullscreen", () => full ? void close() : setFullscreen(true))}
          </View>
        </LinearGradient>
      </>}
      {locked && <View style={[s.unlock, { top: full ? Math.max(12, insets.top) : 12 }]}>{tool("lock-open-outline", "Unlock", () => { setLocked(false); setVisible(true); })}</View>}
    </View>;
  }
  return <>
    {fullscreen ? <View style={s.placeholder} /> : renderPlayer(false)}
    <Modal visible={fullscreen} animationType="fade" supportedOrientations={["portrait", "landscape"]} onRequestClose={() => void close()} statusBarTranslucent>{fullscreen && renderPlayer(true)}</Modal>
  </>;
}
const s = StyleSheet.create({
  frame: { width: "100%", maxWidth: "100%", aspectRatio: 16 / 9, backgroundColor: t.background, borderRadius: 12, overflow: "hidden", alignSelf: "center" },
  full: { flex: 1, width: "100%", aspectRatio: undefined, borderRadius: 0 }, placeholder: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: t.background },
  audio: { flex: 1, alignItems: "center", justifyContent: "center" }, loading: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  top: { position: "absolute", top: 0, left: 0, right: 0, padding: 12, paddingBottom: 30, flexDirection: "row", alignItems: "center", gap: 4 },
  heading: { flex: 1, minWidth: 0 }, title: { color: t.foreground, fontSize: 13, fontWeight: "600" }, subtitle: { color: t.muted, fontSize: 10, marginTop: 4 },
  tool: { minWidth: 40, minHeight: 40, alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 5 }, label: { color: t.foreground, fontSize: 9 }, speed: { color: t.foreground, fontSize: 15 },
  center: { position: "absolute", top: 76, bottom: 115, left: 12, right: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 26 },
  skip: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: t.glass, borderColor: t.border, borderWidth: 1 }, ten: { color: t.foreground, fontSize: 13, fontWeight: "700", position: "absolute" },
  play: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: t.glass, borderColor: t.border, borderWidth: 1 },
  bottom: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 8, paddingTop: 28 },
  seekTouch: { height: 28, justifyContent: "center" }, track: { height: 4, borderRadius: 2, backgroundColor: t.border, overflow: "hidden" }, progress: { height: 4, backgroundColor: t.accent },
  times: { flexDirection: "row", justifyContent: "space-between" }, time: { color: t.foreground, fontSize: 11, fontVariant: ["tabular-nums"] },
  tools: { flexDirection: "row", alignItems: "center", gap: 2 },
  menu: { position: "absolute", top: 68, right: 12, zIndex: 10, backgroundColor: t.glass, borderRadius: 8, padding: 4, flexDirection: "row", flexWrap: "wrap", width: 200 }, speedOption: { minWidth: 60, minHeight: 44, alignItems: "center", justifyContent: "center" },
  unlock: { position: "absolute", right: 16, backgroundColor: t.glass, borderRadius: 8 }, failure: { position: "absolute", top: "40%", left: 16, right: 16, alignItems: "center" },
});