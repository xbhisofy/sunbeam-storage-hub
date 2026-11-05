import { useEffect, useRef, useState } from "react";
import { isAdNoFill } from "./ad-error";

export type SharedPlaybackFile = { kind: "ok"; name: string; file_type: string; mime: string | null; source: string; url: string };
export type SharedPlaybackState = { kind: "loading" } | { kind: "missing" } | { kind: "expired" } | SharedPlaybackFile;
export type PlaybackAd = {
  subscribe: (event: "loaded" | "closed" | "error" | "earned", callback: (error?: unknown) => void) => () => void;
  load: () => void;
  show: () => Promise<void>;
  // Rewarded ads open the file only after the reward is earned, never on an early close.
  requiresReward?: boolean;
};

// Owns per-file async work; neither stale resolutions nor late ads unlock a new file.
export function useSharedPlayback(slug: string, viewerId: string | undefined,
  loadFile: (slug: string) => Promise<SharedPlaybackState>, createAd: () => PlaybackAd,
  recordView: (slug: string) => void) {
  const key = JSON.stringify([slug, viewerId]);
  const currentKey = useRef(key);
  currentKey.current = key;
  const generation = useRef(0);
  const cancelAd = useRef<(() => void) | null>(null);
  const counted = useRef(false);
  const busy = useRef(false);
  const [state, setState] = useState<{ key: string; file: SharedPlaybackState; open: boolean; adBusy: boolean; adUnavailable: boolean }>({ key, file: { kind: "loading" }, open: false, adBusy: false, adUnavailable: false });

  useEffect(() => {
    const version = ++generation.current;
    cancelAd.current?.();
    counted.current = false;
    busy.current = false;
    setState({ key, file: { kind: "loading" }, open: false, adBusy: false, adUnavailable: false });
    const valid = () => generation.current === version && currentKey.current === key;
    void loadFile(slug).then(file => {
      if (valid()) setState({ key, file, open: false, adBusy: false, adUnavailable: false });
    }).catch(() => {
      if (valid()) setState({ key, file: { kind: "missing" }, open: false, adBusy: false, adUnavailable: false });
    });
    return () => { ++generation.current; cancelAd.current?.(); busy.current = false; };
  }, [key, slug, loadFile]);

  const visible = state.key === key ? state : { key, file: { kind: "loading" } as SharedPlaybackState, open: false, adBusy: false, adUnavailable: false };

  function showAdThenOpen() {
    if (busy.current || visible.file.kind !== "ok" || visible.open) return;
    busy.current = true;
    const version = generation.current;
    const valid = () => generation.current === version && currentKey.current === key;
    setState(previous => ({ ...previous, adBusy: true, adUnavailable: false }));
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscriptions: (() => void)[] = [];
    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
      if (cancelAd.current === cancel) cancelAd.current = null;
    };
    const cancel = () => { finished = true; cleanup(); };
    const finish = (open: boolean) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (!valid()) return;
      busy.current = false;
      setState(previous => ({ ...previous, adBusy: false, open, adUnavailable: !open }));
    };
    cancelAd.current = cancel;
    try {
      const ad = createAd();
      let earned = false;
      if (ad.requiresReward) subscriptions.push(ad.subscribe("earned", () => { earned = true; }));
      subscriptions.push(ad.subscribe("loaded", () => {
        if (finished || !valid()) return;
        // The timeout is for no-fill/loading only, never for an already shown ad.
        if (timer !== undefined) clearTimeout(timer);
        try { void ad.show().catch(() => finish(false)); } catch { finish(false); }
      }), ad.subscribe("closed", () => {
        // A rewarded ad closed before the reward returns to the Open button without unlocking.
        if (ad.requiresReward && !earned) {
          if (finished) return;
          finished = true;
          cleanup();
          if (!valid()) return;
          busy.current = false;
          setState(previous => ({ ...previous, adBusy: false }));
          return;
        }
        finish(true);
      }), ad.subscribe("error", error => finish(isAdNoFill(error))));
      timer = setTimeout(() => finish(false), 8000);
      ad.load();
    } catch { finish(false); }
  }

  function continueWithoutAd() {
    if (currentKey.current !== key || busy.current || visible.file.kind !== "ok" || !visible.adUnavailable) return;
    setState(previous => ({ ...previous, open: true, adUnavailable: false }));
  }

  function countView() {
    if (currentKey.current !== key || visible.file.kind !== "ok" || !visible.open || counted.current) return;
    counted.current = true;
    recordView(slug);
  }
  return { st: visible.file, open: visible.open, adBusy: visible.adBusy, adUnavailable: visible.adUnavailable, showAdThenOpen, continueWithoutAd, countView };
}