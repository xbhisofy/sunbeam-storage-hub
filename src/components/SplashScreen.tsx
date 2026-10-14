import { useEffect, useState } from "react";
import { isInstalledApp } from "@/lib/app-mode";
import logoImg from "@/assets/tanyora-logo.jpg";

/**
 * App-open splash, Terabox style: logo on top, the TANYORA wordmark sitting
 * still beneath it (no letter-by-letter typing), then the tagline rising in
 * below — on a flat white background matching the Android launch screen.
 * Shown once per session on app screens.
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
        <p className="splash-word">Tanyo<span className="splash-word-accent">ra</span></p>
        <p className="splash-tagline">Cloud Sharing, Made Simple</p>
      </div>
      <p className="splash-footer">from Tanyora</p>
    </div>
  );
}
