import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Share2, Trash2, Link2, FileText, Film, Music, Image as ImageIcon, MoreVertical, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { currentUserId } from "@/lib/session";
import { pageHead, site } from "@/lib/site";
import { formatSize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/shared")({
  head: () => pageHead("Shared files", "Files and links you have shared.", undefined, true),
  component: Shared,
});

const icons = { video: Film, audio: Music, image: ImageIcon, link: Link2 } as Record<string, typeof FileText>;
const typeStyles: Record<string, string> = {
  video: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  audio: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  image: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pdf: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  link: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  other: "bg-muted text-muted-foreground",
};

type Row = { id: string; name: string; file_type: string; size: number; created_at: string; storage_path: string | null; slug: string; source: string };

function Shared() {
  const qc = useQueryClient();
  const [active, setActive] = useState<Row | null>(null);
  const { data: files = [], isPending } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [];
      return (await supabase.from("files").select("*").eq("owner_id", uid).order("created_at", { ascending: false })).data ?? [];
    },
  });
  const link = (slug: string) => `${site.shareUrl}/s/${slug}`;

  async function shareAgain(f: Row) {
    const url = link(f.slug);
    if (navigator.share) {
      try {
        await navigator.share({ title: f.name, url });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") { /* dismissed */ }
        else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
    setActive(null);
  }
  async function stop(f: Row) {
    if (!confirm("Remove this share? The file will be deleted and the link will stop working.")) return;
    setActive(null);
    if (f.storage_path) await supabase.storage.from("files").remove([f.storage_path]);
    const { error } = await supabase.from("files").delete().eq("id", f.id);
    if (error) { toast.error("Could not remove the share"); return; }
    toast.success("Share removed");
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  const item = "flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted";

  return <div className="mx-auto w-full max-w-3xl">
    <h1 className="hidden text-2xl font-bold tracking-tight md:block">Shared Files</h1>
    {files.length === 0 ? <div className="mt-5 rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/10"><Share2 className="h-8 w-8 text-primary" /></span>
      <p className="mt-5 text-[15px] font-semibold">{isPending ? "Loading…" : "Nothing shared yet"}</p>
    </div> : <div className="mt-4 space-y-2.5">
      {(files as Row[]).map(f => {
        const Icon = icons[f.file_type] ?? FileText;
        return <button key={f.id} type="button" onClick={() => setActive(f)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-sm transition-colors hover:bg-muted/40 active:bg-muted/60">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${typeStyles[f.file_type] ?? typeStyles["other"]}`}><Icon className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{f.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{f.storage_path ? `${formatSize(f.size)} · ` : ""}{new Date(f.created_at).toLocaleDateString()}</span>
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground" aria-hidden><MoreVertical className="h-5 w-5" /></span>
        </button>;
      })}
    </div>}

    <Sheet open={!!active} onOpenChange={(o) => { if (!o) setActive(null); }}>
      <SheetContent side="bottom" className="rounded-t-3xl px-2 pb-8 pt-3">
        {active && <>
          <SheetHeader className="px-4 pb-2"><SheetTitle className="truncate text-left text-sm">{active.name}</SheetTitle></SheetHeader>
          <button type="button" className={item} onClick={() => { setActive(null); window.open(link(active.slug), "_blank"); }}><ExternalLink className="h-5 w-5 text-muted-foreground" />Open view</button>
          <button type="button" className={item} onClick={() => { navigator.clipboard.writeText(link(active.slug)); setActive(null); toast.success("Link copied"); }}><Copy className="h-5 w-5 text-muted-foreground" />Copy link</button>
          <button type="button" className={item} onClick={() => shareAgain(active)}><Share2 className="h-5 w-5 text-muted-foreground" />Share again</button>
          <button type="button" className={`${item} text-destructive hover:bg-destructive/10`} onClick={() => stop(active)}><Trash2 className="h-5 w-5" />Remove share</button>
        </>}
      </SheetContent>
    </Sheet>
  </div>;
}
