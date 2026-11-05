import { describe, expect, it } from "vitest";
import { canShowSharedDisplayAd, DISPLAY_AD_HEIGHT, DISPLAY_AD_WIDTH } from "./display-ad";

const portrait = { ready: true, width: 390, height: 844, fullscreen: false, adBusy: false, reportOpen: false };
describe("Shared-file display ad visibility", () => {
  it("allows the same bottom placement before and after opening valid portrait content", () => {
    expect(canShowSharedDisplayAd(portrait)).toBe(true);
    expect(DISPLAY_AD_WIDTH).toBe(300);
    expect(DISPLAY_AD_HEIGHT).toBe(250);
  });
  it("hides ads during rotated playback", () => {
    expect(canShowSharedDisplayAd({ ...portrait, width: 844, height: 390 })).toBe(false);
  });
  it("hides ads during fullscreen even when portrait", () => {
    expect(canShowSharedDisplayAd({ ...portrait, fullscreen: true })).toBe(false);
  });
  it("does not request ads for loading, missing or expired content", () => {
    expect(canShowSharedDisplayAd({ ...portrait, ready: false })).toBe(false);
  });
  it("does not show a display ad alongside an opening interstitial", () => {
    expect(canShowSharedDisplayAd({ ...portrait, adBusy: true })).toBe(false);
  });
  it("does not show ads behind the reporting sheet", () => {
    expect(canShowSharedDisplayAd({ ...portrait, reportOpen: true })).toBe(false);
  });
  it("requires room for the unit and screen gutters", () => {
    expect(canShowSharedDisplayAd({ ...portrait, width: 331 })).toBe(false);
    expect(canShowSharedDisplayAd({ ...portrait, width: 332 })).toBe(true);
  });
});