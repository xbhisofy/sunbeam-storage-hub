import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Share2, Trash2, Link2, FileText, Film, Music, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { currentUserId } from "@/lib/session";
import { pageHead, site } from "@/lib/site";
import { formatSize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/shared")({
  head: () => pageHead("Shared files", "Files and links you have shared.", undefined, true),
  component: Shared,
});

const icons = { video: Film, audio: Music, image: ImageIcon, link: Link2 } as Record<string, typeof FileText>;

function Shared() {
  const qc = useQueryClient();
  const { data: files = [], isPending } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [];
      return (await supabase.from("files").select("*").eq("owner_id", uid).order("created_at", { ascending: false })).data ?? [];
    },
  });
  const link = (slug: string) => `${site.shareUrl}/s/${slug}`;

  async function shareAgain(name: string, slug: string) {
    const url = link(slug);
    if (navigator.share) { try { await navigator.share({ title: name, url }); } catch { /* dismissed */ } }
    else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
  }
  async function stop(id: string, path: string | null) {
    if (!confirm("Delete this shared link? The file will be removed and the link will stop working.")) return;
    if (path) await supabase.storage.from("files").remove([path]);
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) { toast.error("Could not delete the link"); return; }
    toast.success("Link deleted");
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  return <div className="mx-auto max-w-2xl">
    <h1 className="hidden text-3xl font-bold md:block">Shared files</h1>
    <p className="mb-4 text-sm text-muted-foreground md:mt-1">Everything you have shared. Deleting a link removes the file for everyone.</p>
    {files.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center">
      <Share2 className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 font-semibold">{isPending ? "Loading…" : "Nothing shared yet"}</p>
    </div> : <ul className="space-y-2.5">{files.map(f => {
      const Icon = icons[f.file_type] ?? FileText;
      return <li key={f.id} className="rounded-2xl border bg-card p-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{f.name}</p>
            <p className="truncate text-xs text-muted-foreground">{f.source === "converted" ? "Link" : formatSize(f.size)} · {f.views} views</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => { navigator.clipboard.writeText(link(f.slug)); toast.success("Link copied"); }}><Copy className="h-4 w-4" />Copy</Button>
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => shareAgain(f.name, f.slug)}><Share2 className="h-4 w-4" />Share again</Button>
          <Button variant="secondary" size="sm" className="rounded-xl text-destructive" onClick={() => stop(f.id, f.storage_path)}><Trash2 className="h-4 w-4" />Delete</Button>
        </div>
      </li>;
    })}</ul>}
  </div>;
}
