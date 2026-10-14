import { pageHead } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, Clock, CheckCircle2, Eye, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useProfile } from "./route";
import { money } from "@/lib/format";
import { PAYOUT_METHODS, payoutMethod, type PayoutValue } from "@/lib/payouts";

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
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PayoutValue>("upi");
  const [details, setDetails] = useState("");
  const { data: wd } = useQuery({
    queryKey: ["my-withdrawals"],
    queryFn: async () => (await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const bal = Number(p?.balance ?? 0);
  const plan = p?.plan ?? "view";
  const switches = p?.plan_switches ?? 3;

  async function switchPlan(next: "view" | "referral") {
    if (!p || next === plan) return;
    if (switches <= 0) { toast.error("No plan switches remaining"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("switch_plan", { _plan: next });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Plan changed");
    setChanging(false);
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  const pendingAmt = (wd ?? []).filter((w) => w.status === "pending" || w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const stats = [
    { icon: Clock, label: "Pending withdrawal", value: pendingAmt },
    { icon: Wallet, label: "Available to withdraw", value: bal },
    { icon: CheckCircle2, label: "Paid", value: Number(p?.paid_total ?? 0) },
  ];

  async function withdraw(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc("request_withdrawal", { _amount: Number(amount), _method: method, _details: details.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Withdrawal request submitted");
    setAmount(""); setDetails("");
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["my-withdrawals"] });
  }
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
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={withdraw} className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold">Withdraw</div>
            <div className="text-sm text-muted-foreground">Minimum $5.00 · Paid after admin review</div>
          </div>
          <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{money(bal)} available</span>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="wd-amount" className="mb-1.5 block text-sm font-medium">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input id="wd-amount" inputMode="decimal" type="number" step="0.01" min={5} max={bal} required placeholder="5.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl pl-8 text-base" />
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Payout method</span>
            <div role="radiogroup" aria-label="Payout method" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYOUT_METHODS.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={method === o.value} onClick={() => setMethod(o.value)}
                  className={`h-12 rounded-xl border text-sm font-semibold transition-colors ${method === o.value ? "border-primary bg-primary/10 text-primary" : "bg-background text-muted-foreground"}`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="wd-details" className="mb-1.5 block text-sm font-medium">{payoutMethod(method)?.detailsLabel ?? "Payout details"}</label>
            <Input id="wd-details" required maxLength={300} className="h-12 rounded-xl text-base" placeholder={payoutMethod(method)?.placeholder ?? "Your payout details"} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <Button className="h-12 w-full rounded-xl text-base" disabled={busy || bal < 5}>{busy ? "Submitting..." : "Request withdrawal"}</Button>
          {bal < 5 && <p className="text-center text-xs text-muted-foreground">You need at least $5.00 to withdraw. Keep sharing to earn more.</p>}
        </div>
      </form>

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
      {(wd ?? []).length === 0 ? (
        <div className="mt-3 rounded-2xl border bg-card py-16 text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 font-semibold">No payouts yet</p>
        </div>
      ) : (
        <div className="mt-3 divide-y rounded-2xl border bg-card">
          {wd!.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-4 p-4 text-sm">
              <div>
                <div className="font-semibold">{money(Number(w.amount))} · {w.method.toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}{w.admin_note ? ` · ${w.admin_note}` : ""}</div>
              </div>
              <StatusBadge status={w.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
