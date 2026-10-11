// True inside the installed Android app (TWA/standalone/Capacitor). Remembered for the session.
export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  const yes = !!w.Capacitor?.isNativePlatform?.()
    || document.referrer.startsWith("android-app://")
    || window.matchMedia("(display-mode: standalone)").matches
    || sessionStorage.getItem("tanyora_app") === "1";
  if (yes) sessionStorage.setItem("tanyora_app", "1");
  return yes;
}
