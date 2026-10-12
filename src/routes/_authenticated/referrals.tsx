import { pageHead, site } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Link2, Wallet, CalendarDays, Users, Sun, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const cards = [
    { icon: Wallet, label: "Total earned", value: money(Number(p?.referral_earnings ?? 0)) },
    { icon: Sun, label: "Today", value: money(sumDay(today)) },
    { icon: CalendarDays, label: "Yesterday", value: money(sumDay(yesterday)) },
    { icon: Users, label: "People invited", value: String(people.length), note: joinedToday ? `+${joinedToday} today` : undefined },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold md:text-3xl">Referral Program</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {p?.plan === "referral" ? "You earn $0.10 for every new signup with your link, plus 10% of their view earnings." : "You earn 10% of the view earnings of everyone who joins with your link."}
      </p>

      <div className="mt-5 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground"><Link2 className="h-5 w-5" /></span>
          <div><div className="font-semibold">Your referral link</div><div className="text-sm text-muted-foreground">Share it to start earning.</div></div>
        </div>
        <div className="mt-4 flex gap-2">
          <Input readOnly value={link} className="font-mono text-sm" />
          <Button variant="outline" aria-label="Copy referral link" onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copied"); }}><Copy className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4">
            <c.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-xs text-muted-foreground">{c.label}</div>
            <div className="text-xl font-bold">{c.value}</div>
            {c.note && <div className="text-xs font-medium text-primary">{c.note}</div>}
          </div>
        ))}
      </div>

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
