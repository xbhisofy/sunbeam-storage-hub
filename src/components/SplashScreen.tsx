import { useEffect, useState } from "react";
import logo from "@/assets/tanyora-logo.jpg";

/** App-open splash: logo + animated wordmark, "from Tanyora" footer. Shown once per session on app screens. */
export function SplashScreen() {
  const [state, setState] = useState<"hidden" | "show" | "leave">("hidden");
  useEffect(() => {
    const p = location.pathname;
    if (p === "/" || p.startsWith("/s/") || sessionStorage.getItem("ty-splash")) return;
    sessionStorage.setItem("ty-splash", "1");
    setState("show");
    const a = setTimeout(() => setState("leave"), 1700);
    const b = setTimeout(() => setState("hidden"), 2150);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (state === "hidden") return null;
  return (
    <div aria-hidden className={`splash landing ${state === "leave" ? "splash-leave" : ""}`}>
      <div className="flex flex-1 flex-col items-center justify-center">
        <img src={logo} alt="" width={96} height={96} className="splash-logo h-24 w-24 rounded-[1.6rem] object-cover" />
        <p className="splash-word mt-6 text-3xl font-extrabold tracking-[0.18em]">
          {"TANYORA".split("").map((c, i) => <span key={i} style={{ animationDelay: `${350 + i * 70}ms` }}>{c}</span>)}
        </p>
      </div>
      <div className="splash-from pb-10 text-center">
        <p className="text-xs text-muted-foreground">from</p>
        <p className="landing-text text-base font-bold tracking-wide">Tanyora</p>
      </div>
    </div>
  );
}
