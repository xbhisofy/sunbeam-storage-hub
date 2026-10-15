import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { useProfile } from "./route";
import { useInstalledApp } from "@/lib/app-mode";
import { PREMIUM_PLANS, activePremium, type PremiumTier } from "@/lib/premium";
import { createZapupiOrder, syncZapupiDeposit } from "@/lib/zapupi.functions";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => pageHead("Premium plans", "Upgrade your Tanyora storage and features.", undefined, true),
  validateSearch: (s: Record<string, unknown>): { status?: string | undefined; order_id?: string | undefined } => ({
    status: typeof s["status"] === "string" ? (s["status"] as string) : undefined,
    order_id: typeof s["order_id"] === "string" ? (s["order_id"] as string) : undefined,
  }),
  component: Plans,
});

const plans: { id: "free" | PremiumTier; name: string; price: number; period: string; icon: typeof Zap; perks: string[]; popular?: boolean }[] = [
  { id: "free", name: "Free", price: 0, period: "forever", icon: Zap, perks: ["1 TB per file", "Share links", "Custom video player"] },
  { id: "plus", name: "Plus", price: PREMIUM_PLANS.plus.priceInr, period: "per month", icon: Sparkles, perks: ["1 TB per file", "100 GB storage", "No ads while browsing", "Priority uploads", "View your own shared files"], popular: true },
  { id: "pro", name: "Pro", price: PREMIUM_PLANS.pro.priceInr, period: "per month", icon: Crown, perks: ["1 TB per file", "1 TB storage", "No ads", "Priority support", "View your own shared files"] },
];

function Plans() {
  const { data: p } = useProfile();
  const isApp = useInstalledApp();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { order_id } = Route.useSearch();
  const createOrder = useServerFn(createZapupiOrder);
  const syncDeposit = useServerFn(syncZapupiDeposit);
  const [busy, setBusy] = useState<string | null>(null);
  const synced = useRef<string | null>(null);
  const active = activePremium(p as never);

  useEffect(() => {
    if (!order_id || synced.current === order_id) return;
    synced.current = order_id;
    (async () => {
      try {
        const { result } = await syncDeposit({ data: { order_id } });
        if (result === "credited" || result === "already") toast.success("Payment successful — your plan is now active.");
        else if (result === "failed") toast.error("Payment failed or was cancelled.");
        else if (result === "mismatch") toast.error("Paid amount did not match. Support will review it.");
        else toast.info("Payment is being confirmed. Your plan will activate shortly.");
      } catch {
        toast.error("Could not verify the payment yet. It will update automatically.");
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/plans", search: { status: undefined, order_id: undefined }, replace: true });
    })();
  }, [order_id, syncDeposit, qc, navigate]);

  async function buy(plan: PremiumTier) {
    setBusy(plan);
    try {
      const { payment_url } = await createOrder({ data: { plan } });
      if (window.top && window.top !== window.self) window.top.location.href = payment_url;
      else window.location.href = payment_url;
    } catch (e) {
      setBusy(null);
      toast.error(e instanceof Error ? e.message : "Could not start the payment");
    }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="app-hero-card rounded-2xl p-6">
      <Crown className="h-8 w-8" />
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Go Premium</h1>
      <p className="mt-1 text-sm opacity-90">More storage, bigger files and an ad-free experience.</p>
      {active && p?.premium_until && <p className="mt-3 text-sm font-semibold">{PREMIUM_PLANS[active].name} active until {new Date(p.premium_until).toLocaleDateString("en-IN")}</p>}
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map(pl => {
        const current = pl.id === "free" ? !active : active === pl.id;
        return <div key={pl.id} className={`relative rounded-2xl border bg-card p-5 ${pl.popular ? "border-primary ring-2 ring-primary/30" : ""}`}>
          {pl.popular && <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>}
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><pl.icon className="h-5 w-5" /></span><h2 className="text-lg font-bold">{pl.name}</h2></div>
          <p className="mt-4 text-3xl font-bold">₹{pl.price} <span className="text-sm font-normal text-muted-foreground">{pl.period}</span></p>
          <ul className="mt-4 space-y-2 text-sm">{pl.perks.map(k => <li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{k}</li>)}</ul>
          {pl.id === "free"
            ? <Button className="mt-5 h-12 w-full rounded-xl" variant="outline" disabled>{current ? "Current plan" : "Free plan"}</Button>
            : isApp
              ? <Button className="mt-5 h-12 w-full rounded-xl" disabled>{current ? "Current plan" : "Coming soon"}</Button>
              : <Button className="mt-5 h-12 w-full rounded-xl" disabled={!!busy} onClick={() => buy(pl.id as PremiumTier)}>
                  {busy === pl.id ? <Loader2 className="h-4 w-4 animate-spin" /> : current ? "Renew for 30 days" : `Pay ₹${pl.price} with UPI`}
                </Button>}
        </div>;
      })}
    </div>
    <p className="text-center text-xs text-muted-foreground">{isApp ? "Premium plans are not available for purchase in the app yet." : "Plans last 30 days and do not renew automatically. Pay securely with any UPI app."}</p>
  </div>;
}
