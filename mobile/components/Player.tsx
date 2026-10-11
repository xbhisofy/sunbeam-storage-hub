import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { supabase } from "../lib/supabase";
import { theme } from "../lib/theme";

type FileRow = {
  name: string;
  file_type: string;
  storage_path: string | null;
  external_url: string | null;
  header_text: string | null;
  footer_text: string | null;
};

// Share-link player. Inside the Tanyora app a link opens the actual file
// after a 5-second countdown (browser links only offer the Play Store).
export function PlayerScreen({ slug }: { slug: string }) {
  const [file, setFile] = useState<FileRow | null>(null);
  const [missing, setMissing] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const [url, setUrl] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  // Created unconditionally (hooks can never be conditional); source is
  // swapped in once the signed URL resolves.
  const player = useVideoPlayer(url, (p) => {
    if (url) p.play();
  });

  useEffect(() => {
    if (url && player) {
      player.replace(url);
      player.play();
    }
  }, [url, player]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("files").select("*").eq("slug", slug).maybeSingle();
      if (!data) setMissing(true);
      else setFile(data as FileRow);
    })();
  }, [slug]);

  useEffect(() => {
    if (!file || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, file]);

  const beginPlayback = useCallback(async () => {
    if (!file || started) return;
    setStarted(true);
    try {
      // One view counted per open — same record_view the website calls.
      await supabase.rpc("record_view", { _slug: slug });
    } catch {
      // view counting must never block playback
    }
    if (file.storage_path) {
      const { data } = await supabase.storage.from("files").createSignedUrl(file.storage_path, 3600);
      setUrl(data?.signedUrl ?? null);
    } else if (file.external_url) {
      setUrl(file.external_url);
    }
  }, [file, slug, started]);

  useEffect(() => {
    if (seconds === 0 && file) beginPlayback();
  }, [seconds, file, beginPlayback]);

  if (missing) {
    return (
      <View style={[styles.center, styles.screen]}>
        <Text style={styles.title}>Link nahi mila</Text>
        <Text style={styles.muted}>Yeh share link delete ho chuka hai ya galat hai.</Text>
      </View>
    );
  }

  if (!file) {
    return (
      <View style={[styles.center, styles.screen]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {file.header_text ? <Text style={styles.headerFooter}>{file.header_text}</Text> : null}

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={2}>
          {file.name}
        </Text>

        {!started ? (
          <>
            <Text style={styles.countdown}>{seconds}</Text>
            <Text style={styles.muted}>File {seconds} second me khulegi…</Text>
          </>
        ) : !url ? (
          <Text style={styles.muted}>File load nahi ho payi — dobara kholo.</Text>
        ) : file.file_type === "video" && player ? (
          <VideoView player={player} style={styles.video} contentFit="contain" />
        ) : (
          <Pressable style={styles.button} onPress={() => Linking.openURL(url)}>
            <Text style={styles.buttonText}>File kholo</Text>
          </Pressable>
        )}
      </View>

      {file.footer_text ? <Text style={styles.headerFooter}>{file.footer_text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 20, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { color: theme.text, fontSize: 20, fontWeight: "800", textAlign: "center" },
  countdown: { color: theme.primary, fontSize: 56, fontWeight: "800" },
  muted: { color: theme.muted, textAlign: "center" },
  headerFooter: { color: theme.muted, fontSize: 12, textAlign: "center", paddingVertical: 6 },
  video: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12 },
  button: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 30, paddingVertical: 14 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
