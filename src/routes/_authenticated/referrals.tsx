import { pageHead, site } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Link2, Wallet, CalendarDays, Users, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "./route";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => pageHead("Referrals", "Invite friends and earn.", undefined, true),
  component: Referrals,
});

function Referrals() {
  const { data: p } = useProfile();
  const { data: count = 0 } = useQuery({
    queryKey: ["refcount"],
    queryFn: async () => (await supabase.rpc("my_referral_count")).data ?? 0,
  });
  const link = p ? `${site.publicUrl}/auth?mode=signup&ref=${p.referral_code}` : "";
  const refEarn = Number(p?.referral_earnings ?? 0);

  const cards = [
    { icon: Wallet, label: "Total earnings", value: money(refEarn) },
    { icon: CalendarDays, label: "Yesterday's earnings", value: money(0) },
    { icon: Users, label: "Successfully invited", value: String(count) },
  ];
  const commission = [
    { icon: Clock, label: "On hold", value: money(0), note: "Released after 3 days" },
    { icon: Wallet, label: "Available to withdraw", value: money(refEarn) },
    { icon: CheckCircle2, label: "Paid", value: money(0) },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold">Referral Program</h1>
      <p className="mt-1 text-muted-foreground">
        Share your referral link. When someone you invite gets an approved view, you're automatically credited 10% of it.
      </p>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground"><Link2 className="h-5 w-5" /></span>
          <div>
            <div className="font-semibold">Your referral link</div>
            <div className="text-sm text-muted-foreground">Share it to start earning from your referrals.</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Input readOnly value={link} className="font-mono text-sm" />
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="flex gap-4 rounded-2xl border bg-card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground"><c.icon className="h-5 w-5" /></span>
            <div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div className="text-2xl font-bold">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-semibold">Commission status</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {commission.map((c) => (
          <div key={c.label} className="flex gap-4 rounded-2xl border bg-card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground"><c.icon className="h-5 w-5" /></span>
            <div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div className="text-2xl font-bold">{c.value}</div>
              {c.note && <div className="text-xs text-muted-foreground">{c.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
