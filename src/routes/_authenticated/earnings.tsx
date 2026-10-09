import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "./route";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/earnings")({
  head: () => ({ meta: [{ title: "Earnings — TenBox" }, { name: "description", content: "Your balance and payouts." }] }),
  component: Earnings,
});

function Earnings() {
  const { data: p } = useProfile();
  const bal = Number(p?.balance ?? 0);
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
      <h2 className="mt-8 font-semibold">Payout history</h2>
      <div className="mt-3 rounded-2xl border bg-card py-16 text-center">
        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-3 font-semibold">No payouts yet</p>
      </div>
    </div>
  );
}
