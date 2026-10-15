import { pageHead } from "@/lib/site";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, IndianRupee, Loader2, CheckCircle2, XCircle, Clock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useProfile } from "./route";
import { money } from "@/lib/format";
import { createZapupiOrder, syncZapupiDeposit } from "@/lib/zapupi.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => pageHead("Wallet", "Add money to your wallet instantly with UPI.", undefined, true),
  validateSearch: (s: Record<string, unknown>) => ({
    status: typeof s["status"] === "string" ? (s["status"] as string) : undefined,
    order_id: typeof s["order_id"] === "string" ? (s["order_id"] as string) : undefined,
  }),
  component: WalletPage,
});

const QUICK = [100, 500, 1000, 2000, 5000];

function WalletPage() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { status, order_id } = Route.useSearch();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const createOrder = useServerFn(createZapupiOrder);
  const syncDeposit = useServerFn(syncZapupiDeposit);
  const syncedRef = useRef<string | null>(null);

  const { data: deposits } = useQuery({
    queryKey: ["my-deposits"],
    queryFn: async () =>
      (await supabase.from("zapupi_deposits").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  // Returning from the payment page: verify + credit as a backup to the webhook.
  useEffect(() => {
    if (!order_id || syncedRef.current === order_id) return;
    syncedRef.current = order_id;
    (async () => {
      try {
        const { result } = await syncDeposit({ data: { order_id } });
        if (result === "credited" || result === "already") {
          toast.success("Payment successful — wallet balance updated.");
        } else if (result === "mismatch") {
          toast.error("Paid amount did not match the order. Support will review it.");
        } else if (result === "failed") {
          toast.error("Payment failed or was cancelled.");
        } else {
          toast.info("Payment is still being confirmed. It will reflect shortly.");
        }
      } catch {
        toast.error("Could not verify the payment yet. It will update automatically.");
      }
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["my-deposits"] });
      navigate({ to: "/wallet", search: { status: undefined, order_id: undefined }, replace: true });
    })();
  }, [order_id, status, syncDeposit, qc, navigate]);

  async function pay() {
    const amt = Number(amount);
    if (!amt || amt < 50 || amt > 100000) {
      toast.error("Enter an amount between ₹50 and ₹1,00,000");
      return;
    }
    setBusy(true);
    try {
      const { payment_url } = await createOrder({ data: { amount: amt } });
      // If embedded in an iframe, navigate the top window.
      if (window.top && window.top !== window.self) {
        window.top.location.href = payment_url;
      } else {
        window.location.href = payment_url;
      }
    } catch (e) {
      setBusy(false);
      toast.error(e instanceof Error ? e.message : "Could not start the payment");
    }
  }

  const bal = Number(p?.balance ?? 0);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 pb-24 lg:p-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Wallet</h1>
      <p className="mt-1 text-sm text-muted-foreground">Add money instantly with UPI and use it across Tanyora.</p>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wallet className="h-5 w-5" /></span>
          <div>
            <div className="text-sm text-muted-foreground">Current balance</div>
            <div className="text-2xl font-bold">{money(bal)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Instant UPI (GPay / PhonePe / Paytm)</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Minimum ₹50, maximum ₹1,00,000 per transaction.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${Number(amount) === q ? "border-primary bg-primary/10 text-primary" : "bg-background text-foreground/80 active:bg-accent"}`}
            >
              ₹{q.toLocaleString("en-IN")}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              inputMode="numeric"
              min={50}
              max={100000}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={pay} disabled={busy} className="shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ₹${Number(amount) > 0 ? Number(amount).toLocaleString("en-IN") : ""}`}
          </Button>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Deposit history</h2>
      <div className="mt-3 space-y-2">
        {(deposits ?? []).length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">No deposits yet.</div>
        )}
        {(deposits ?? []).map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${d.status === "success" ? "bg-primary/10 text-primary" : d.status === "pending" ? "bg-muted text-muted-foreground" : "bg-destructive/10 text-destructive"}`}>
              {d.status === "success" ? <CheckCircle2 className="h-5 w-5" /> : d.status === "pending" ? <Clock className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">₹{Number(d.amount_inr).toLocaleString("en-IN")}</div>
              <div className="truncate text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("en-IN")} · {d.order_id}</div>
            </div>
            <StatusBadge status={d.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
