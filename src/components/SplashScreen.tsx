import { useEffect, useState } from "react";
import { isInstalledApp } from "@/lib/app-mode";
import logoImg from "@/assets/tanyora-logo.jpg";

/**
 * App-open splash: Tanyora logo with a stylish tagline — on a flat light
 * background matching the Android launch screen so the hand-off has no
 * colour flash. Shown once per session on app screens.
 */
export function SplashScreen() {
  const [state, setState] = useState<"hidden" | "show" | "leave">("hidden");
  useEffect(() => {
    const p = location.pathname;
    if (!isInstalledApp() || p === "/" || p.startsWith("/s/") || sessionStorage.getItem("ty-splash")) return;
    sessionStorage.setItem("ty-splash", "1");
    setState("show");
    const a = setTimeout(() => setState("leave"), 1900);
    const b = setTimeout(() => setState("hidden"), 2400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (state === "hidden") return null;
  return (
    <div aria-hidden className={`splash ${state === "leave" ? "splash-leave" : ""}`}>
      <div className="splash-center">
        <img src={logoImg} alt="" className="splash-logo" />
        <p className="splash-tagline">Cloud Sharing, Made Simple</p>
      </div>
    </div>
  );
}
