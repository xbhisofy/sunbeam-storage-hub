import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, Eye, Wallet, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/site";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/oc-bonus")({
  head: () => pageHead("OC Bonus", "Earn a 5% bonus when others convert your shared links.", undefined, true),
  component: OcBonus,
});

const DAYS = 15;

function OcBonus() {
  const { data: rows = [] } = useQuery({
    queryKey: ["oc-bonus"],
    queryFn: async () => (await supabase.from("oc_bonus_daily").select("day, views, amount").order("day", { ascending: true })).data ?? [],
  });
  const since = new Date(); since.setDate(since.getDate() - (DAYS - 1));
  const sinceKey = since.toISOString().slice(0, 10);
  const series = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since); d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const r = rows.find((x) => x.day === key);
    return { key, label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }), views: r?.views ?? 0, amount: Number(r?.amount ?? 0) };
  });
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const recent = rows.filter((r) => r.day >= sinceKey);
  const recentAmt = recent.reduce((s, r) => s + Number(r.amount), 0);
  const recentViews = recent.reduce((s, r) => s + r.views, 0);

  const stats = [
    { icon: Wallet, label: "Total bonus earned", value: money(total), note: "Added to your available balance", tone: "bg-emerald-500/10 text-emerald-600" },
    { icon: CalendarDays, label: `Last ${DAYS} days`, value: money(recentAmt), tone: "bg-amber-500/10 text-amber-500" },
    { icon: Eye, label: "Bonus-earning views", value: recentViews.toLocaleString(), note: `Last ${DAYS} days`, tone: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold">OC Bonus</h1>
      <p className="mt-1 text-muted-foreground">If someone converts your shared link into their own and it gets views, you earn a 5% bonus on top of what they earn, for as long as you keep your own link active.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex gap-4 rounded-2xl border bg-card p-5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${s.tone}`}><s.icon className="h-5 w-5" /></span>
            <div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              {s.note && <div className="text-sm text-muted-foreground">{s.note}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">OC Bonus trend</h2>
          <Gift className="h-5 w-5 text-muted-foreground" />
        </div>
        <Trend title="Bonus-earning views" value={recentViews.toLocaleString()} data={series.map((d) => ({ label: d.label, v: d.views }))} />
        <div className="mt-6 border-t pt-6">
          <Trend title="OC Bonus earnings" value={money(recentAmt)} suffix={`last ${DAYS} days`} data={series.map((d) => ({ label: d.label, v: d.amount }))} />
        </div>
      </div>
    </div>
  );
}

function Trend({ title, value, suffix, data }: { title: string; value: string; suffix?: string; data: { label: string; v: number }[] }) {
  const max = Math.max(...data.map((d) => d.v), 0);
  return (
    <div className="mt-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">{value} {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}</div>
      {max === 0 ? (
        <div className="grid h-40 place-items-center text-sm text-muted-foreground">No activity in this period yet.</div>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-1.5">
          {data.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.v}`}>
              <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max((d.v / max) * 100, d.v > 0 ? 4 : 0)}%` }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
