import { useEffect, useRef, useState } from "react";

export type SharedPlaybackFile = { kind: "ok"; name: string; file_type: string; mime: string | null; source: string; url: string };
export type SharedPlaybackState = { kind: "loading" } | { kind: "missing" } | { kind: "expired" } | SharedPlaybackFile;
export type PlaybackAd = {
  subscribe: (event: "loaded" | "closed" | "error", callback: () => void) => () => void;
  load: () => void;
  show: () => Promise<void>;
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
  const [state, setState] = useState<{ key: string; file: SharedPlaybackState; open: boolean; adBusy: boolean }>({ key, file: { kind: "loading" }, open: false, adBusy: false });

  useEffect(() => {
    const version = ++generation.current;
    cancelAd.current?.();
    counted.current = false;
    busy.current = false;
    setState({ key, file: { kind: "loading" }, open: false, adBusy: false });
    const valid = () => generation.current === version && currentKey.current === key;
    void loadFile(slug).then(file => {
      if (valid()) setState({ key, file, open: false, adBusy: false });
    }).catch(() => {
      if (valid()) setState({ key, file: { kind: "missing" }, open: false, adBusy: false });
    });
    return () => { ++generation.current; cancelAd.current?.(); busy.current = false; };
  }, [key, slug, loadFile]);

  const visible = state.key === key ? state : { key, file: { kind: "loading" } as SharedPlaybackState, open: false, adBusy: false };

  function showAdThenOpen() {
    if (busy.current || visible.file.kind !== "ok" || visible.open) return;
    busy.current = true;
    const version = generation.current;
    const valid = () => generation.current === version && currentKey.current === key;
    setState(previous => ({ ...previous, adBusy: true }));
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscriptions: (() => void)[] = [];
    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
      if (cancelAd.current === cancel) cancelAd.current = null;
    };
    const cancel = () => { finished = true; cleanup(); };
    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      if (!valid()) return;
      busy.current = false;
      setState(previous => ({ ...previous, adBusy: false, open: true }));
    };
    cancelAd.current = cancel;
    try {
      const ad = createAd();
      subscriptions.push(ad.subscribe("loaded", () => {
        if (finished || !valid()) return;
        // The timeout is for no-fill/loading only, never for an already shown ad.
        if (timer !== undefined) clearTimeout(timer);
        try { void ad.show().catch(finish); } catch { finish(); }
      }), ad.subscribe("closed", finish), ad.subscribe("error", finish));
      timer = setTimeout(finish, 8000);
      ad.load();
    } catch { finish(); }
  }

  function countView() {
    if (currentKey.current !== key || visible.file.kind !== "ok" || !visible.open || counted.current) return;
    counted.current = true;
    recordView(slug);
  }
  return { st: visible.file, open: visible.open, adBusy: visible.adBusy, showAdThenOpen, countView };
}