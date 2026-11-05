import { createElement, useEffect } from "react";
import { act, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSharedPlayback, type PlaybackAd, type SharedPlaybackState } from "./use-shared-playback";

// A rewarded playback ad must unlock the file only after the reward is earned.
type Listeners = Record<string, ((...args: any[]) => void)[]>;

function rewardedAd(listeners: Listeners, shown: { count: number }): PlaybackAd {
  return {
    requiresReward: true,
    subscribe: (event, callback) => {
      listeners[event] = [...(listeners[event] ?? []), callback];
      return () => { listeners[event] = (listeners[event] ?? []).filter(f => f !== callback); };
    },
    load: () => { (listeners.loaded ?? []).forEach(f => f()); },
    show: () => { shown.count += 1; return Promise.resolve(); },
  };
}

const okFile: SharedPlaybackState = { kind: "ok", name: "clip.mp4", file_type: "video", mime: null, source: "cloud", url: "https://storage.example/file" };

function probe(ad: PlaybackAd) {
  const value: { current?: ReturnType<typeof useSharedPlayback> } = {};
  function Probe() {
    const hook = useSharedPlayback("slug", "viewer", async () => okFile, () => ad, vi.fn());
    useEffect(() => { value.current = hook; });
    return null;
  }
  render(createElement(Probe));
  return value;
}

describe("Rewarded playback ad", () => {
  it("keeps the file closed when the ad is closed before the reward is earned", async () => {
    const listeners: Listeners = {};
    const shown = { count: 0 };
    const value = probe(rewardedAd(listeners, shown));
    await waitFor(() => expect(value.current?.st.kind).toBe("ok"));
    act(() => value.current?.showAdThenOpen());
    expect(shown.count).toBe(1);
    act(() => { (listeners.closed ?? []).forEach(f => f()); });
    expect(value.current?.open).toBe(false);
    expect(value.current?.adUnavailable).toBe(false);
    expect(value.current?.adBusy).toBe(false);
  });

  it("opens the file only after the reward is earned and the ad closes", async () => {
    const listeners: Listeners = {};
    const shown = { count: 0 };
    const value = probe(rewardedAd(listeners, shown));
    await waitFor(() => expect(value.current?.st.kind).toBe("ok"));
    act(() => value.current?.showAdThenOpen());
    act(() => { (listeners.earned ?? []).forEach(f => f()); });
    act(() => { (listeners.closed ?? []).forEach(f => f()); });
    expect(value.current?.open).toBe(true);
  });
});
