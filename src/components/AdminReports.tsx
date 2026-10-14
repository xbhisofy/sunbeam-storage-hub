import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ExternalLink, Flag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { reportsTable } from "@/lib/reports";
import { reasonLabel } from "@/components/ReportFile";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

const PAGE = 25;
type RFilter = "open" | "resolved" | "dismissed" | "all";
const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function useOpenReports(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-reports-open"],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => (await reportsTable().select("id", { count: "exact", head: true }).eq("status", "open")).count ?? 0,
  });
}

export function ReportsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<RFilter>("open");
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", filter, page],
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    queryFn: async () => {
      let r = reportsTable().select("*").order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (filter !== "all") r = r.eq("status", filter);
      return (await r).data ?? [];
    },
  });
  const rows = data ?? [];

  async function setStatus(id: string, status: "resolved" | "dismissed" | "open", silent = false) {
    const { error } = await reportsTable().update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (!silent) toast.success(status === "open" ? "Report reopened" : `Report ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-reports"] });
    qc.invalidateQueries({ queryKey: ["admin-reports-open"] });
  }

  async function takeDown(id: string, slug: string) {
    const { data: f } = await supabase.from("files").select("id, storage_path").eq("slug", slug).maybeSingle();
    if (f) {
      if (f.storage_path) await supabase.storage.from("files").remove([f.storage_path]);
      const { error } = await supabase.from("files").delete().eq("id", f.id);
      if (error) { toast.error(error.message); return; }
    }
    await setStatus(id, "resolved", true);
    toast.success(f ? "File removed and report resolved" : "File was already deleted");
    qc.invalidateQueries({ queryKey: ["admin-files"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["open", "resolved", "dismissed", "all"] as RFilter[]).map((o) => (
          <button key={o} onClick={() => { setFilter(o); setPage(0); }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${filter === o ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>{o}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No reports here.</p> : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="space-y-2 p-4">
                <div className="flex items-start gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${r.reason === "child_safety" ? "bg-destructive/15 text-destructive" : "bg-accent text-accent-foreground"}`}><Flag className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{reasonLabel(r.reason)}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.file_name ?? "Unknown file"} · /s/{r.file_slug}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.email ?? "Anonymous"} · {fmt(r.created_at)}</p>
                  </div>
                  <StatusBadge status={r.status === "open" ? "pending" : r.status === "resolved" ? "paid" : "rejected"} />
                </div>
                {r.details && <p className="whitespace-pre-line rounded-xl bg-muted/50 p-3 text-xs">{r.details}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-lg"><a href={`/s/${r.file_slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Open</a></Button>
                  {r.status === "open" ? <>
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => takeDown(r.id, r.file_slug)}><Trash2 className="h-3.5 w-3.5" /> Remove file</Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus(r.id, "resolved")}>Resolve</Button>
                    <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setStatus(r.id, "dismissed")}>Dismiss</Button>
                  </> : <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setStatus(r.id, "open")}>Reopen</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(page > 0 || rows.length === PAGE) && <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <Button size="sm" variant="outline" disabled={rows.length < PAGE} onClick={() => setPage(page + 1)}>Next</Button>
      </div>}
    </div>
  );
}
