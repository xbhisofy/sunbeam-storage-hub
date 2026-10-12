import { useQuery } from "@tanstack/react-query";
import { Eye, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/lib/session";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Last 7 days of views on the signed-in user's share links. */
export function ViewStats() {
  const { data } = useQuery({
    queryKey: ["view-daily"],
    staleTime: 60_000,
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [];
      const since = new Date(Date.now() - 6 * 864e5);
      return (await supabase.from("view_daily").select("day, views").eq("owner_id", uid).gte("day", iso(since))).data ?? [];
    },
  });
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    const key = iso(d);
    return { key, label: d.toLocaleDateString("en", { weekday: "short" }), views: (data ?? []).filter(r => r.day === key).reduce((s, r) => s + r.views, 0) };
  });
  const max = Math.max(1, ...days.map(d => d.views));
  const week = days.reduce((s, d) => s + d.views, 0);
  const today = days[6].views;
  return <section className="rounded-2xl border bg-card p-5">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Views · last 7 days</p><p className="mt-1 text-2xl font-bold">{week.toLocaleString()}</p></div>
      <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"><Eye className="h-3.5 w-3.5" />{today.toLocaleString()} today</div>
    </div>
    <div className="mt-5 flex h-28 items-end gap-2">
      {days.map(d => <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
        <span className="text-[10px] font-medium text-muted-foreground">{d.views || ""}</span>
        <div className="w-full rounded-md bg-primary/85 transition-all" style={{ height: `${Math.max(4, (d.views / max) * 80)}px` }} />
        <span className="text-[11px] text-muted-foreground">{d.label}</span>
      </div>)}
    </div>
    {week === 0 && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />Share your links to start getting views.</p>}
  </section>;
}
