import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

// Opens tenbox://s/<slug> and https://.../s/<slug> links inside the app.
export function setupDeepLinks(go: (path: string) => void) {
  if (!Capacitor.isNativePlatform()) return;
  App.addListener("appUrlOpen", ({ url }) => {
    const m = url.match(/\/s\/([^/?#]+)/) ?? url.match(/^tenbox:\/\/s\/([^/?#]+)/);
    if (m) go(`/s/${m[1]}`);
  });
}
