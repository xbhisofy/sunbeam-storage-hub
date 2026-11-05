// A fixed 300 × 250 display unit stays separate from file/player actions.
export const DISPLAY_AD_WIDTH = 300;
export const DISPLAY_AD_HEIGHT = 250;

export function canShowSharedDisplayAd({ ready, width, height, fullscreen, adBusy, reportOpen }: {
  ready: boolean; width: number; height: number; fullscreen: boolean; adBusy: boolean; reportOpen: boolean;
}) {
  return ready && height > width && width - 32 >= DISPLAY_AD_WIDTH && !fullscreen && !adBusy && !reportOpen;
}