import { useEffect, useState } from "react";

/**
 * App-open splash: only the TANYORA wordmark animation, on the exact same flat
 * background as the Android launch screen (manifest background_color) so the
 * hand-off has no colour flash. Shown once per session on app screens.
 */
export function SplashScreen() {
  const [state, setState] = useState<"hidden" | "show" | "leave">("hidden");
  useEffect(() => {
    const p = location.pathname;
    if (p === "/" || p.startsWith("/s/") || sessionStorage.getItem("ty-splash")) return;
    sessionStorage.setItem("ty-splash", "1");
    setState("show");
    const a = setTimeout(() => setState("leave"), 1500);
    const b = setTimeout(() => setState("hidden"), 1950);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (state === "hidden") return null;
  return (
    <div aria-hidden className={`splash ${state === "leave" ? "splash-leave" : ""}`}>
      <p className="splash-word">
        {"TANYORA".split("").map((c, i) => (
          <span key={i} style={{ animationDelay: `${80 + i * 70}ms` }}>{c}</span>
        ))}
      </p>
    </div>
  );
}
