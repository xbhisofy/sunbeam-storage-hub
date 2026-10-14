import { pageHead, site } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Link2, Wallet, CalendarDays, Users, UserPlus, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./route";
import { money } from "@/lib/format";
import { currentUserId } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => pageHead("Referrals", "Invite friends and earn.", undefined, true),
  component: Referrals,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Referrals() {
  const { data: p } = useProfile();
  const { data: people = [], isPending } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: async () => (await supabase.rpc("my_referrals")).data ?? [],
  });
  const { data: daily = [] } = useQuery({
    queryKey: ["referral-daily"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [];
      return (await supabase.from("referral_daily").select("day, signup_bonus, commission").eq("referrer_id", uid).gte("day", iso(new Date(Date.now() - 864e5)))).data ?? [];
    },
  });
  const sumDay = (day: string) => daily.filter(d => d.day === day).reduce((s, d) => s + Number(d.signup_bonus) + Number(d.commission), 0);
  const today = iso(new Date()), yesterday = iso(new Date(Date.now() - 864e5));
  const joinedToday = people.filter(x => x.joined.slice(0, 10) === today).length;
  const link = p ? `${site.publicUrl}/auth?mode=signup&ref=${p.referral_code}` : "";

  const { data: wd = [] } = useQuery({
    queryKey: ["my-withdrawals"],
    queryFn: async () => (await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });
  const onHold = wd.filter(w => w.status === "pending" || w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);

  const cards = [
    { icon: Wallet, label: "Total earnings", value: money(Number(p?.referral_earnings ?? 0)), tone: "bg-emerald-500/10 text-emerald-600" },
    { icon: CalendarDays, label: "Yesterday's earnings", value: money(sumDay(yesterday)), tone: "bg-amber-500/10 text-amber-500" },
    { icon: Users, label: "Successfully invited", value: String(people.length), note: joinedToday ? `+${joinedToday} today` : undefined, tone: "bg-primary/10 text-primary" },
  ];
  const status = [
    { icon: Clock, label: "On hold", value: money(onHold), note: "Pending admin review", tone: "bg-amber-500/10 text-amber-500" },
    { icon: Wallet, label: "Available to withdraw", value: money(Number(p?.balance ?? 0)), tone: "bg-emerald-500/10 text-emerald-600" },
    { icon: CheckCircle2, label: "Paid", value: money(Number(p?.paid_total ?? 0)), tone: "bg-primary/10 text-primary" },
  ];
  type StatT = { icon: typeof Wallet; label: string; value: string; note?: string | undefined; tone: string };
  const Stat = ({ c }: { c: StatT }) => (
    <div className="flex gap-4 rounded-2xl border bg-card p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${c.tone}`}><c.icon className="h-5 w-5" /></span>
      <div><div className="text-sm text-muted-foreground">{c.label}</div><div className="text-2xl font-bold">{c.value}</div>{c.note && <div className="text-sm text-muted-foreground">{c.note}</div>}</div>
    </div>
  );

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold">Referral Program</h1>
      <p className="mt-1 text-muted-foreground">
        {p?.plan === "referral" ? "Share your referral link. You earn $0.10 for every new user who signs up with it, plus 10% of their view earnings, credited automatically." : "Share your referral link. Whenever someone you invite earns from approved views, you're automatically credited 10% of it, with no cost to them."}
      </p>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><Link2 className="h-5 w-5" /></span>
          <div><div className="font-semibold">Your referral link</div><div className="text-sm text-muted-foreground">Share it to start earning from your referrals.</div></div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-4 py-3">
          <code className="min-w-0 flex-1 truncate font-mono text-sm">{link}</code>
          <button aria-label="Copy referral link" className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground" onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copied"); }}><Copy className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map((c) => <Stat key={c.label} c={c} />)}</div>
      <h2 className="mt-8 text-lg font-semibold">Commission status</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{status.map((c) => <Stat key={c.label} c={c} />)}</div>

      <h2 className="mt-8 font-semibold">People you invited</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border bg-card">
        {people.length === 0 ? <div className="p-8 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">{isPending ? "Loading…" : "No one has joined yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Invited people will appear here as soon as they sign up.</p>
        </div> : <ul className="divide-y">{people.map((x, i) => (
          <li key={i} className="flex items-center gap-3 p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{x.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{x.name}</p><p className="text-xs text-muted-foreground">Joined {new Date(x.joined).toLocaleDateString()}</p></div>
            <span className="text-sm font-semibold">{money(Number(x.earned))}</span>
          </li>))}</ul>}
      </div>
    </div>
  );
}
