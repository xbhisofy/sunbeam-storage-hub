import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Mail, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { contactTable, topicLabel } from "@/lib/contact";
import { Button } from "@/components/ui/button";

const PAGE = 25;
type MFilter = "new" | "replied" | "closed" | "all";
const fmt = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function useNewMessages(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-messages-new"],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => (await contactTable().select("id", { count: "exact", head: true }).eq("status", "new")).count ?? 0,
  });
}

export function MessagesTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<MFilter>("new");
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-messages", filter, page],
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    queryFn: async () => {
      let r = contactTable().select("*").order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (filter !== "all") r = r.eq("status", filter);
      return (await r).data ?? [];
    },
  });
  const rows = data ?? [];
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-messages"] }); qc.invalidateQueries({ queryKey: ["admin-messages-new"] }); };

  async function setStatus(id: string, status: "new" | "replied" | "closed") {
    const { error } = await contactTable().update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`); refresh();
  }
  async function remove(id: string) {
    const { error } = await contactTable().delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Message deleted"); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["new", "replied", "closed", "all"] as MFilter[]).map((o) => (
          <button key={o} onClick={() => { setFilter(o); setPage(0); }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${filter === o ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>{o}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No messages here.</p> : (
          <ul className="divide-y">
            {rows.map((m) => (
              <li key={m.id} className="space-y-2 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Mail className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name} <span className="font-normal text-muted-foreground">· {topicLabel(m.topic)}</span></p>
                    <p className="truncate text-xs text-muted-foreground">{m.email} · {fmt(m.created_at)}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize text-secondary-foreground">{m.status}</span>
                </div>
                <p className="whitespace-pre-line rounded-xl bg-muted/50 p-3 text-sm">{m.message}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-lg"><a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: Tanyora support")}`} onClick={() => m.status === "new" && setStatus(m.id, "replied")}><Reply className="h-3.5 w-3.5" /> Reply by email</a></Button>
                  {m.status !== "closed" && <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStatus(m.id, "closed")}>Close</Button>}
                  {m.status !== "new" && <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setStatus(m.id, "new")}>Mark new</Button>}
                  <Button size="sm" variant="ghost" className="rounded-lg" aria-label="Delete" onClick={() => remove(m.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
