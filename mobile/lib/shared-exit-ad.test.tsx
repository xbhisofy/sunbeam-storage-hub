import { createElement } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The viewer must earn one full-screen ad before it is allowed to leave the file.
const state = vi.hoisted(() => ({
  open: true,
  adsShown: 0,
  backHandler: null as null | (() => boolean),
  routerBack: vi.fn(),
  listeners: {} as Record<string, ((...args: any[]) => void)[]>,
}));

vi.mock("../node_modules/react-native/index.js", () => {
  const box = ({ children }: any) => createElement("div", null, children);
  return {
    View: box, ScrollView: box, Text: ({ children }: any) => createElement("span", null, children),
    Image: () => createElement("div"), Pressable: ({ children }: any) => createElement("div", null, children),
    Modal: () => null, TextInput: () => null, ActivityIndicator: () => null,
    StyleSheet: { create: (styles: any) => styles, absoluteFill: {}, absoluteFillObject: {} },
    BackHandler: {
      addEventListener: (_event: string, callback: () => boolean) => {
        state.backHandler = callback;
        return { remove: () => { state.backHandler = null; } };
      },
    },
    Alert: { alert: vi.fn() },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});
vi.mock("../node_modules/@expo/vector-icons/build/Icons.js", () => ({ Ionicons: () => null }));
vi.mock("../node_modules/@expo/vector-icons/build/IconsLazy.js", () => ({ Ionicons: () => null }));
vi.mock("../node_modules/react-native-webview/index.js", () => ({ WebView: () => createElement("div") }));
vi.mock("../node_modules/expo-router/build/index.js", () => ({ router: { back: () => state.routerBack() } }));
vi.mock("../node_modules/react-native-google-mobile-ads/lib/module/index.js", () => ({
  AdEventType: { LOADED: "loaded", CLOSED: "closed", ERROR: "error" },
  InterstitialAd: { createForAdRequest: () => ({
    addAdEventListener: (event: string, callback: (...args: any[]) => void) => {
      state.listeners[event] = [...(state.listeners[event] ?? []), callback];
      return () => { state.listeners[event] = (state.listeners[event] ?? []).filter(f => f !== callback); };
    },
    load: () => { (state.listeners.loaded ?? []).forEach(f => f()); },
    show: () => { state.adsShown += 1; },
  }) },
  RewardedAd: {}, RewardedAdEventType: {},
}));
vi.mock("../node_modules/react-native-google-mobile-ads/lib/commonjs/index.js", () => ({
  AdEventType: { LOADED: "loaded", CLOSED: "closed", ERROR: "error" },
  InterstitialAd: { createForAdRequest: () => ({
    addAdEventListener: (event: string, callback: (...args: any[]) => void) => {
      state.listeners[event] = [...(state.listeners[event] ?? []), callback];
      return () => { state.listeners[event] = (state.listeners[event] ?? []).filter(f => f !== callback); };
    },
    load: () => { (state.listeners.loaded ?? []).forEach(f => f()); },
    show: () => { state.adsShown += 1; },
  }) },
  RewardedAd: {}, RewardedAdEventType: {},
}));
vi.mock("../components/ui", () => ({ Screen: ({ children }: any) => createElement("main", null, children), Card: ({ children }: any) => createElement("div", null, children), Button: ({ label }: any) => createElement("button", null, label) }));
vi.mock("./files", () => ({ formatSize: () => "1 KB", iconFor: () => "film-outline" }));
vi.mock("../components/Motion", () => ({ Motion: ({ children }: any) => createElement("div", null, children) }));
vi.mock("../components/SharedDisplayAd", () => ({ SharedDisplayAd: () => createElement("div", { "data-testid": "ad" }) }));
vi.mock("../components/MediaPlayer", () => ({ MediaPlayer: () => createElement("div", null, "player") }));
vi.mock("../app/_layout", () => ({ useSession: () => ({ user: { id: "viewer" } }) }));
vi.mock("./supabase", () => ({ supabase: { rpc: vi.fn() } }));
vi.mock("./shared-file", () => ({ loadSharedFile: vi.fn() }));
vi.mock("./use-shared-playback", () => ({ useSharedPlayback: () => ({ st: { kind: "ok", name: "clip.mp4", file_type: "video", mime: null, size: 1024, source: "cloud", url: "https://storage.example/file" }, open: state.open, adBusy: false, adUnavailable: false, countView: vi.fn(), showAdThenOpen: vi.fn(), continueWithoutAd: vi.fn() }) }));

import { PlayerScreen } from "../components/Player";

describe("Shared viewer exit ad", () => {
  beforeEach(() => {
    state.open = true;
    state.adsShown = 0;
    state.backHandler = null;
    state.routerBack.mockClear();
    state.listeners = {};
  });

  it("plays an ad and keeps the viewer on the file when leaving", () => {
    render(<PlayerScreen slug="shared" />);
    expect(state.backHandler).toBeTruthy();
    expect(state.backHandler!()).toBe(true);
    expect(state.adsShown).toBe(1);
    expect(state.routerBack).not.toHaveBeenCalled();
  });

  it("leaves only after the ad closes", () => {
    render(<PlayerScreen slug="shared" />);
    state.backHandler!();
    (state.listeners.closed ?? []).forEach(f => f());
    expect(state.routerBack).toHaveBeenCalledTimes(1);
  });
});
