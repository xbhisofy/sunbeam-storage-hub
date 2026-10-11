import { useEffect, useState } from "react";
import logo from "@/assets/tanyora-logo.jpg";

/**
 * App-open splash. Continues the Android launch screen: same dark background and
 * a large mark that settles upward while the TANYORA wordmark types in below.
 * Shown once per session on app screens (skipped on "/" and "/s/*").
 */
export function SplashScreen() {
  const [state, setState] = useState<"hidden" | "show" | "leave">("hidden");
  useEffect(() => {
    const p = location.pathname;
    if (p === "/" || p.startsWith("/s/") || sessionStorage.getItem("ty-splash")) return;
    sessionStorage.setItem("ty-splash", "1");
    setState("show");
    const a = setTimeout(() => setState("leave"), 1900);
    const b = setTimeout(() => setState("hidden"), 2400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (state === "hidden") return null;
  return (
    <div aria-hidden className={`splash ${state === "leave" ? "splash-leave" : ""}`}>
      <div className="splash-stack">
        <img src={logo} alt="" width={220} height={220} className="splash-logo" decoding="async" />
        <p className="splash-word">
          {"TANYORA".split("").map((c, i) => (
            <span key={i} style={{ animationDelay: `${560 + i * 70}ms` }}>{c}</span>
          ))}
        </p>
      </div>
    </div>
  );
}
