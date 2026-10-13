import { useEffect, useState } from "react";
// True inside the installed Android app (TWA/standalone/Capacitor). Remembered for the session.
export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  const yes = !!w.Capacitor?.isNativePlatform?.()
    || document.referrer.startsWith("android-app://")
    || ["standalone", "fullscreen", "minimal-ui"].some((m) => window.matchMedia(`(display-mode: ${m})`).matches)
    || new URLSearchParams(location.search).has("app")
    || sessionStorage.getItem("tanyora_app") === "1";
  if (yes) sessionStorage.setItem("tanyora_app", "1");
  return yes;
}

const MAIN_ONLY = ["/privacy", "/terms", "/community-guidelines", "/copyright", "/contact", "/delete-account"];
/** Where a path belongs when main (landing + share links) and web (login/dashboard) hosts differ. null = stay. */
export function hostRedirect(host: string, path: string, mainUrl: string, webUrl: string): string | null {
  const main = new URL(mainUrl).host, web = new URL(webUrl).host;
  if (main === web) return null;
  const mainPath = path === "/" || path.startsWith("/s/") || MAIN_ONLY.includes(path);
  if (host === main && !mainPath) return webUrl + path;
  if (host === web && path.startsWith("/s/")) return mainUrl + path;
  if (host === web && path === "/") return webUrl + "/dashboard";
  return null;
}

/** Earnings, referrals and premium live only on the website; the installed app hides them. */
export const WEB_ONLY_PATHS = ["/earnings", "/referrals", "/plans"];
export function useInstalledApp() {
  const [app, setApp] = useState(false);
  useEffect(() => setApp(isInstalledApp()), []);
  return app;
}
