import { createElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ads = vi.hoisted(() => ({ mute: vi.fn(), request: vi.fn(), focus: undefined as undefined | (() => void), appChange: undefined as undefined | ((state: string) => void) }));
vi.mock("../node_modules/react-native/index.js", () => ({
  View: ({ children }: any) => createElement("div", null, children),
  Text: ({ children }: any) => createElement("span", null, children),
  StyleSheet: { create: (styles: any) => styles },
  AppState: { currentState: "active", addEventListener: (_: string, callback: any) => { ads.appChange = callback; return { remove: vi.fn() }; } },
}));
vi.mock("../node_modules/expo-router/build/index.js", () => ({
  useFocusEffect: (callback: any) => { ads.focus = callback; },
}));
vi.mock("../node_modules/react-native-google-mobile-ads/lib/module/index.js", () => ({
  default: () => ({ setAppMuted: ads.mute }),
  TestIds: { BANNER: "official-test-banner" }, BannerAdSize: { MEDIUM_RECTANGLE: "MEDIUM_RECTANGLE" },
  BannerAd: (props: any) => { ads.request(props); return createElement("div", { "data-testid": "display-ad" }); },
}));
vi.mock("../node_modules/react-native-google-mobile-ads/lib/commonjs/index.js", () => ({
  default: () => ({ setAppMuted: ads.mute }),
  TestIds: { BANNER: "official-test-banner" }, BannerAdSize: { MEDIUM_RECTANGLE: "MEDIUM_RECTANGLE" },
  BannerAd: (props: any) => { ads.request(props); return createElement("div", { "data-testid": "display-ad" }); },
}));
vi.mock("./config", () => ({ ADS: { banner: "owner-banner" } }));
import { SharedDisplayAd } from "../components/SharedDisplayAd";

describe("Quiet shared-viewer display ads", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("__DEV__", true); });
  it("mutes the ad SDK before requesting an official test banner", async () => {
    render(<SharedDisplayAd />);
    expect(ads.request).not.toHaveBeenCalled();
    let blur: (() => void) | undefined;
    act(() => { blur = ads.focus?.(); });
    await screen.findByTestId("display-ad");
    expect(ads.mute).toHaveBeenCalledWith(true);
    expect(ads.mute.mock.invocationCallOrder[0]).toBeLessThan(ads.request.mock.invocationCallOrder[0]);
    expect(ads.request.mock.calls[0][0]).toMatchObject({ unitId: "official-test-banner", size: "MEDIUM_RECTANGLE" });
    act(() => blur?.());
    expect(screen.queryByTestId("display-ad")).toBeNull();
  });
  it("unmounts ads when the app leaves foreground and restores on return", async () => {
    render(<SharedDisplayAd />);
    act(() => { ads.focus?.(); });
    await screen.findByTestId("display-ad");
    act(() => ads.appChange?.("background"));
    expect(screen.queryByTestId("display-ad")).toBeNull();
    act(() => ads.appChange?.("active"));
    await screen.findByTestId("display-ad");
  });
  it("removes failed inventory without retry loops or blocking the file", async () => {
    render(<SharedDisplayAd />);
    act(() => { ads.focus?.(); });
    await screen.findByTestId("display-ad");
    act(() => ads.request.mock.calls.at(-1)?.[0].onAdFailedToLoad());
    await waitFor(() => expect(screen.queryByTestId("display-ad")).toBeNull());
    const requests = ads.request.mock.calls.length;
    act(() => { ads.appChange?.("background"); ads.appChange?.("active"); });
    expect(ads.request.mock.calls.length).toBe(requests);
  });
});