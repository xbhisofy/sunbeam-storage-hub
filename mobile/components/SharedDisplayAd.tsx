import { useCallback, useEffect, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import mobileAds, { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { ADS } from "../lib/config";
import { DISPLAY_AD_HEIGHT, DISPLAY_AD_WIDTH } from "../lib/display-ad";
import { theme } from "../lib/theme";

export function SharedDisplayAd({ compact = false }: { compact?: boolean } = {}) {
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  useEffect(() => {
    // Mute the advertising SDK, not the user's video/audio player.
    mobileAds().setAppMuted(true);
    setMuted(true);
    const subscription = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => subscription.remove();
  }, []);

  if (!muted || !focused || !foreground || failed) return null;
  return <View style={[styles.placement, compact && styles.compact]}>
    <Text style={styles.label}>Advertisement</Text>
    <View style={compact ? styles.banner : styles.creative}>
      <BannerAd unitId={__DEV__ ? TestIds.BANNER : ADS.banner} size={compact ? BannerAdSize.BANNER : BannerAdSize.MEDIUM_RECTANGLE} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  placement: { alignSelf: "center", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 16, maxWidth: "100%" },
  compact: { marginTop: 0, marginBottom: 8 }, banner: { width: 320, height: 50, overflow: "hidden" },
  label: { fontSize: 11, color: theme.muted, textAlign: "center" },
  creative: { width: DISPLAY_AD_WIDTH, height: DISPLAY_AD_HEIGHT, backgroundColor: theme.bg, overflow: "hidden" },
});