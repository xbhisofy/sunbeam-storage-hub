import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { pageHead } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => pageHead("Premium plans", "Upgrade your Tanyora storage and features.", undefined, true),
  component: Plans,
});

// Placeholder pricing until Google Play subscription products are created.
const plans = [
  { id: "free", name: "Free", price: "$0", period: "forever", icon: Zap, perks: ["1 TB per file", "Share links", "Custom video player"], current: true },
  { id: "plus", name: "Plus", price: "$1.99", period: "per month", icon: Sparkles, perks: ["1 TB per file", "100 GB storage", "No ads while browsing", "Priority uploads"], popular: true },
  { id: "pro", name: "Pro", price: "$4.99", period: "per month", icon: Crown, perks: ["1 TB per file", "1 TB storage", "No ads", "Priority support"] },
];

function Plans() {
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="app-hero-card rounded-2xl p-6">
      <Crown className="h-8 w-8" />
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Go Premium</h1>
      <p className="mt-1 text-sm opacity-90">More storage, bigger files and an ad-free experience.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map(p => <div key={p.id} className={`relative rounded-2xl border bg-card p-5 ${p.popular ? "border-primary ring-2 ring-primary/30" : ""}`}>
        {p.popular && <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>}
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><p.icon className="h-5 w-5" /></span><h2 className="text-lg font-bold">{p.name}</h2></div>
        <p className="mt-4 text-3xl font-bold">{p.price} <span className="text-sm font-normal text-muted-foreground">{p.period}</span></p>
        <ul className="mt-4 space-y-2 text-sm">{p.perks.map(k => <li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{k}</li>)}</ul>
        <Button className="mt-5 h-12 w-full rounded-xl" variant={p.current ? "outline" : "default"} disabled>{p.current ? "Current plan" : "Coming soon"}</Button>
      </div>)}
    </div>
    <p className="text-center text-xs text-muted-foreground">Premium plans are not available for purchase yet. When they launch, they will be billed through Google Play.</p>
  </div>;
}
