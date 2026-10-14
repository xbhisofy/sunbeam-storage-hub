import { pageHead, site } from "@/lib/site";
import { currentUserId } from "@/lib/session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Link2, Loader2, Copy, Film, Music, FileText, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatSize, formatFileDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/content/convert")({
  head: () => pageHead("Convert Link", "Turn any Tanyora share link into your own.", undefined, true),
  component: ConvertLink,
});

const icons = { video: Film, audio: Music, image: ImageIcon } as const;

type ConvertedRow = {
  id: string;
  name: string;
  file_type: string;
  size: number;
  views: number;
  created_at: string;
  slug: string;
};

function ConvertLink() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: conversions = [] } = useQuery({
    queryKey: ["files", "converted"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [] as ConvertedRow[];
      const { data } = await supabase.from("files").select("*").eq("owner_id", uid).eq("source", "converted").order("created_at", { ascending: false });
      return (data ?? []) as ConvertedRow[];
    },
  });

  async function convert() {
    const input = url.trim();
    const match = input.match(/\/s\/([A-Za-z0-9_-]+)/);
    const slug = match?.[1];
    if (!slug) { toast.error("Paste a valid Tanyora share link", { description: "It should look like https://tanyora.com/s/…" }); return; }
    setBusy(true);
    const uid = await currentUserId();
    if (!uid) { setBusy(false); return; }
    const { data: source, error } = await supabase.from("files").select("*").eq("slug", slug).maybeSingle();
    if (error || !source) { setBusy(false); toast.error("Link not found", { description: "This share link does not exist or has expired." }); return; }
    if (source.owner_id === uid) { setBusy(false); toast.error("This is your own file", { description: "You already have a share link for it." }); return; }
    const { data: existing } = await supabase.from("files").select("id").eq("owner_id", uid).eq("storage_path", source.storage_path ?? "").eq("source", "converted").maybeSingle();
    if (existing) { setBusy(false); toast.error("Already converted", { description: "This link is already in your conversions below." }); return; }
    const { error: e2 } = await supabase.from("files").insert({
      owner_id: uid,
      name: source.name,
      file_type: source.file_type,
      mime: source.mime,
      size: source.size,
      storage_path: source.storage_path,
      source: "converted",
    });
    setBusy(false);
    if (e2) { toast.error("Could not convert", { description: e2.message }); return; }
    setUrl("");
    qc.invalidateQueries({ queryKey: ["files"] });
    toast.success("Link converted", { description: "Your own share link is ready below." });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Convert Link</h1>
        <p className="mt-1 text-sm text-muted-foreground">Paste someone else's Tanyora share link and get your own share link to the same file.</p>
      </div>

      <div className="mt-4 flex w-fit rounded-xl border bg-card p-1">
        <Button variant="ghost" size="sm" asChild className="rounded-lg"><Link to="/content">All Content</Link></Button>
        <Button size="sm" className="rounded-lg">Convert Link</Button>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl border bg-card p-3 shadow-sm sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") convert(); }}
          placeholder="Paste a Tanyora share link"
          className="h-11 flex-1 rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button className="h-11 gap-2 rounded-xl" onClick={convert} disabled={busy || !url.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Convert
        </Button>
      </div>

      <h2 className="mt-8 font-semibold">Recent Conversions</h2>
      {conversions.length === 0 ? (
        <div className="mt-3 rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
          <Link2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-semibold">No conversions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Links you convert above will show up here.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          {conversions.map((f) => {
            const Icon = icons[f.file_type as keyof typeof icons] ?? FileText;
            return (
              <div key={f.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{f.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{formatSize(f.size)} · {formatFileDate(f.created_at)}</span>
                </span>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => { navigator.clipboard.writeText(`${site.shareUrl}/s/${f.slug}`); toast.success("Link copied"); }}>
                  <Copy className="h-3.5 w-3.5" />Copy Link
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
