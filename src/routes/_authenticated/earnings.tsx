import { pageHead } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Clock, CheckCircle2, Eye, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "./route";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/earnings")({
  head: () => pageHead("Earnings", "Your balance and payouts.", undefined, true),
  component: Earnings,
});

const plans = [
  {
    id: "referral" as const,
    icon: UserPlus,
    name: "Signup Referral Plan",
    desc: "Earn a fixed $0.10 reward for every new user who signs up using your referral link.",
  },
  {
    id: "view" as const,
    icon: Eye,
    name: "View-Based Plan",
    desc: "Earn revenue each time your shared files receive eligible views.",
  },
];

function Earnings() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const bal = Number(p?.balance ?? 0);
  const plan = p?.plan ?? "view";
  const switches = p?.plan_switches ?? 3;

  async function switchPlan(next: "view" | "referral") {
    if (!p || next === plan) return;
    if (switches <= 0) { toast.error("No plan switches remaining"); return; }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ plan: next, plan_switches: switches - 1 })
      .eq("id", p.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Plan changed");
    setChanging(false);
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  const stats = [
    { icon: Clock, label: "On hold", value: 0, note: "Released after 3 days" },
    { icon: Wallet, label: "Available to withdraw", value: bal },
    { icon: CheckCircle2, label: "Paid", value: 0 },
  ];
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold">Earnings</h1>
      <h2 className="mt-6 font-semibold">Current balance</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex gap-4 rounded-2xl border bg-card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground"><s.icon className="h-5 w-5" /></span>
            <div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold">{money(s.value)}</div>
              {s.note && <div className="text-xs text-muted-foreground">{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="font-semibold">Withdraw</div>
        <div className="text-sm text-muted-foreground">Minimum withdrawal is $5.00</div>
        <Button className="mt-4" disabled={bal < 5}>Request Withdrawal</Button>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Your earning plan</div>
            <div className="mt-1 text-lg font-bold">{plan === "view" ? "View-Based Plan" : "Signup Referral Plan"}</div>
            <div className="text-sm text-muted-foreground">
              {plan === "view" ? "3.00 USD per 1,000 views" : "0.10 USD per signup"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{switches} of 3 switches remaining</div>
          </div>
          <Button variant="outline" onClick={() => setChanging(!changing)}>Change</Button>
        </div>
        {changing && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {plans.map((pl) => (
              <button
                key={pl.id}
                disabled={busy || (pl.id !== plan && switches <= 0)}
                onClick={() => switchPlan(pl.id)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
                  pl.id === plan ? "border-primary bg-accent" : "hover:bg-muted"
                }`}
              >
                <div>
                  <div className="font-semibold">{pl.name}</div>
                  <div className="text-sm text-muted-foreground">{pl.desc}</div>
                </div>
                {pl.id === plan && (
                  <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <h2 className="mt-8 font-semibold">Payout history</h2>
      <div className="mt-3 rounded-2xl border bg-card py-16 text-center">
        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-3 font-semibold">No payouts yet</p>
      </div>
    </div>
  );
}
