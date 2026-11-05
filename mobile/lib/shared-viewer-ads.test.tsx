import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ open: false, width: 390, height: 844, kind: "ok", type: "video", shown: vi.fn() }));
vi.mock("../node_modules/react-native/index.js", () => {
  const box = ({ children }: any) => createElement("div", null, children);
  return {
    View: box, ScrollView: box, Text: ({ children }: any) => createElement("span", null, children),
    Image: () => createElement("div", { "data-testid": "photo" }),
    Pressable: ({ children, onPress }: any) => createElement("button", { onClick: onPress }, children),
    Modal: () => null, TextInput: () => null, ActivityIndicator: () => null,
    StyleSheet: { create: (styles: any) => styles, absoluteFill: {}, absoluteFillObject: {} }, BackHandler: { addEventListener: () => ({ remove: () => {} }) }, Alert: { alert: vi.fn() },
    useWindowDimensions: () => ({ width: state.width, height: state.height }),
  };
});
vi.mock("../node_modules/@expo/vector-icons/build/Icons.js", () => ({ Ionicons: () => null }));
vi.mock("../node_modules/@expo/vector-icons/build/IconsLazy.js", () => ({ Ionicons: () => null }));
vi.mock("../node_modules/react-native-webview/index.js", () => ({ WebView: () => createElement("div", { "data-testid": "document" }) }));
vi.mock("../node_modules/expo-router/build/index.js", () => ({ router: { back: vi.fn() } }));
vi.mock("../node_modules/react-native-google-mobile-ads/lib/module/index.js", () => ({ AdEventType: {}, InterstitialAd: { createForAdRequest: () => ({ addAdEventListener: () => () => {}, load: () => {}, show: () => {} }) }, RewardedAd: {}, RewardedAdEventType: {} }));
vi.mock("../node_modules/react-native-google-mobile-ads/lib/commonjs/index.js", () => ({ AdEventType: {}, InterstitialAd: { createForAdRequest: () => ({ addAdEventListener: () => () => {}, load: () => {}, show: () => {} }) }, RewardedAd: {}, RewardedAdEventType: {} }));
vi.mock("../components/ui", () => ({ Screen: ({ children }: any) => createElement("main", null, children), Card: ({ children }: any) => createElement("div", null, children), Button: ({ label }: any) => createElement("button", null, label) }));
vi.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => createElement("div", null, children) }));
vi.mock("./files", () => ({ formatSize: () => "1 KB", iconFor: () => "film-outline" }));
vi.mock("../components/FileCard", () => ({ FileIcon: () => null }));
vi.mock("../components/Motion", () => ({ Motion: ({ children }: any) => createElement("div", null, children) }));
vi.mock("../components/SharedDisplayAd", () => ({ SharedDisplayAd: () => createElement("div", { "data-testid": "ad" }) }));
vi.mock("../components/MediaPlayer", () => ({ MediaPlayer: ({ onFullscreenChange }: any) => createElement("button", { onClick: () => onFullscreenChange(true) }, "Rotate video") }));
vi.mock("../app/_layout", () => ({ useSession: () => ({ user: { id: "viewer" } }) }));
vi.mock("./supabase", () => ({ supabase: {} }));
vi.mock("./shared-file", () => ({ loadSharedFile: vi.fn() }));
vi.mock("./use-shared-playback", () => ({ useSharedPlayback: () => ({ st: { kind: state.kind, name: "Shared file", file_type: state.type, url: "https://storage.example/file" }, open: state.open, adBusy: false, adUnavailable: false, countView: state.shown, showAdThenOpen: vi.fn() }) }));
import { PlayerScreen } from "../components/Player";

describe("Shared viewer bottom ad integration", () => {
  beforeEach(() => { state.open = false; state.width = 390; state.height = 844; state.kind = "ok"; state.type = "video"; });
  it("shows a top and a bottom display ad around the unopened shared file", () => {
    render(<PlayerScreen slug="shared" />);
    expect(screen.getAllByTestId("ad")).toHaveLength(2);
  });
  it.each(["video", "image", "document"])("keeps both ads around an opened portrait %s", type => {
    state.open = true; state.type = type;
    render(<PlayerScreen slug="shared" />);
    expect(screen.getAllByTestId("ad")).toHaveLength(2);
  });
  it("removes both ads when video enters fullscreen", () => {
    state.open = true;
    render(<PlayerScreen slug="shared" />);
    fireEvent.click(screen.getByRole("button", { name: "Rotate video" }));
    expect(screen.queryByTestId("ad")).toBeNull();
  });
  it("shows the clean open-file card with a full-width Open file button", () => {
    render(<PlayerScreen slug="shared" />);
    expect(screen.getByText("Open file")).toBeTruthy();
    expect(screen.getByText("Shared with you")).toBeTruthy();
    expect(screen.getByText("1 KB")).toBeTruthy();
    expect(screen.getByText("Report this file")).toBeTruthy();
  });
  it("does not show ads on expired shared files", () => {
    state.kind = "expired";
    render(<PlayerScreen slug="shared" />);
    expect(screen.queryByTestId("ad")).toBeNull();
  });
});