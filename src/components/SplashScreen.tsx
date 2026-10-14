import { useEffect, useState } from "react";
import { isInstalledApp } from "@/lib/app-mode";
import logoImg from "@/assets/tanyora-logo.jpg";
import cloudWaves from "@/assets/splash-cloud-waves.jpg";

/**
 * App-open splash: static brand above a softly illustrated tagline.
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
        <p className="splash-word">Tany<span className="splash-word-accent">ora</span></p>
        <svg className="splash-underline" viewBox="0 0 320 32" fill="none">
          <defs><linearGradient id="splash-line"><stop stopColor="var(--splash-sky)" stopOpacity="0"/><stop offset=".3" stopColor="var(--splash-blue)"/><stop offset=".75" stopColor="var(--splash-sky)"/><stop offset="1" stopColor="var(--splash-sky)" stopOpacity="0"/></linearGradient></defs>
          <path d="M8 14 C95 -12 185 48 312 10" stroke="url(#splash-line)" strokeWidth="3.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="splash-bottom">
        <img src={cloudWaves} alt="" width={1536} height={1024} className="splash-clouds" />
        <p className="splash-tagline"><span className="splash-tagline-title">Cloud Sharing,</span><span className="splash-tagline-second">Made <strong>Simple</strong></span></p>
      </div>
    </div>
  );
}
