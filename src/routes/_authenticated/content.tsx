import { pageHead, site } from "@/lib/site";
import { currentUserId } from "@/lib/session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, Trash2, Film, Music, FileText, Link2, Download, Image as ImageIcon, FolderOpen, Upload, MoreVertical, Share2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fileKind, formatSize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/content")({
  validateSearch: z.object({ kind: z.enum(["pdf", "video", "audio", "image", "link"]).optional(), upload: z.enum(["video", "audio", "image", "document"]).optional() }),
  head: () => pageHead("My Content", "Upload and manage your shared files.", undefined, true),
  component: Content,
});

const icons = { video: Film, audio: Music, pdf: FileText, other: FileText, link: Link2, image: ImageIcon };

const typeStyles: Record<string, string> = {
  video: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  audio: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  image: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pdf: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  link: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  other: "bg-muted text-muted-foreground",
};

function ago(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type FileRow = {
  id: string;
  name: string;
  file_type: string;
  size: number;
  views: number;
  created_at: string;
  storage_path: string | null;
  slug: string;
  source: string;
};

function Content() {
  const { kind, upload } = Route.useSearch();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (upload) input.current?.click(); }, [upload]);
  const [uploading, setUploading] = useState<{ name: string; size: number; step: string; pct: number } | null>(null);
  const [active, setActive] = useState<FileRow | null>(null);

  const { data: files = [] } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [] as FileRow[];
      const { data } = await supabase.from("files").select("*").eq("owner_id", uid).order("created_at", { ascending: false });
      return (data ?? []) as FileRow[];
    },
  });

  async function onFiles(list: FileList | null) {
    if (!list) return;
    const uid = await currentUserId();
    if (!uid) return;
    const arr = Array.from(list);
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i];
      if (!f) continue;
      if (f.size > 50 * 1024 * 1024) { toast.error("File too large", { description: `${f.name} is over the 50 MB limit` }); continue; }
      setUploading({ name: f.name, size: f.size, step: arr.length > 1 ? `${i + 1} of ${arr.length}` : "", pct: 5 });
      const tick = setInterval(() => setUploading((u) => (u ? { ...u, pct: Math.min(92, u.pct + (95 - u.pct) * 0.08) } : u)), 300);
      const path = `${uid}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("files").upload(path, f, { contentType: f.type || "application/octet-stream" });
      clearInterval(tick);
      if (error) { toast.error("Upload failed", { description: error.message }); continue; }
      setUploading((u) => (u ? { ...u, pct: 100 } : u));
      const { error: e2 } = await supabase.from("files").insert({
        owner_id: uid, name: f.name, file_type: fileKind(f.type), mime: f.type, size: f.size, storage_path: path, source: "original",
      });
      if (e2) toast.error("Upload failed", { description: e2.message });
      else toast.success(`${f.name} uploaded`);
    }
    setUploading(null);
    if (input.current) input.current.value = "";
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  async function remove(f: FileRow) {
    setActive(null);
    if (f.storage_path) await supabase.storage.from("files").remove([f.storage_path]);
    await supabase.from("files").delete().eq("id", f.id);
    qc.invalidateQueries({ queryKey: ["files"] });
    toast.success("Moved to trash", { description: f.name });
  }

  async function download(f: FileRow) {
    setActive(null);
    if (!f.storage_path) return;
    const { data, error } = await supabase.storage.from("files").createSignedUrl(f.storage_path, 300, { download: f.name });
    if (error || !data) { toast.error("Could not download the file"); return; }
    window.location.href = data.signedUrl;
  }

  function copyLink(f: FileRow) {
    setActive(null);
    navigator.clipboard.writeText(`${site.shareUrl}/s/${f.slug}`);
    toast.success("Link copied", { description: "Share it anywhere to get views" });
  }

  async function share(f: FileRow) {
    const url = `${site.shareUrl}/s/${f.slug}`;
    setActive(null);
    if (navigator.share) {
      try { await navigator.share({ title: f.name, url }); return; } catch { /* user cancelled */ }
    }
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  const shown = files.filter((f) => (!kind || f.file_type === kind));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload, share and track your content.</p>
        </div>
        <Button className="gap-2" onClick={() => input.current?.click()} disabled={!!uploading}><Upload className="h-4 w-4" />Upload files</Button>
      </div>
      {kind && <div className="flex items-center justify-between"><h2 className="font-semibold capitalize">{kind === "pdf" ? "Documents" : kind}</h2><Button variant="link" asChild><Link to="/content">All files</Link></Button></div>}

      {/* Upload (hidden input — triggered by the + button or the desktop Upload button) */}
      <input ref={input} type="file" accept={upload === "video" ? "video/*" : upload === "audio" ? "audio/*" : upload === "image" ? "image/*" : upload === "document" ? ".pdf,.doc,.docx,.txt,.zip,application/*" : "video/*,audio/*,image/*,application/*"} multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      {uploading && (
        <div role="status" aria-live="polite" className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md rounded-2xl border bg-card p-4 shadow-xl md:bottom-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold">{uploading.name}</p>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{Math.round(uploading.pct)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatSize(uploading.size)}{uploading.step ? ` · File ${uploading.step}` : ""} · {uploading.pct >= 100 ? "Finishing up" : "Uploading"}</p>
            </div>
          </div>
          <Progress value={uploading.pct} className="mt-3 h-1.5" />
        </div>
      )}

      {/* File list — TeraBox-style cards */}
      {shown.length === 0 ? (
        <div className="mt-5 rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/10"><FolderOpen className="h-8 w-8 text-primary" /></span>
          <p className="mt-5 text-[15px] font-semibold">Your folder is empty</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">Tap the + button below to upload your first video, photo or document. Once it's here, tap the ⋮ menu to copy its share link.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{shown.length} {shown.length === 1 ? "item" : "items"}</p>
          {shown.map((f) => {
            const Icon = icons[f.file_type as keyof typeof icons] ?? FileText;
            const style = typeStyles[f.file_type] ?? typeStyles["other"];
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActive(f)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left shadow-sm transition-colors hover:bg-muted/40 active:bg-muted/60"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${style}`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{f.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {f.storage_path ? `${formatSize(f.size)} · ` : ""}{ago(f.created_at)}
                  </span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground" aria-hidden>
                  <MoreVertical className="h-5 w-5" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* File actions — bottom sheet */}
      <Sheet open={!!active} onOpenChange={(o) => { if (!o) setActive(null); }}>
        <SheetContent side="bottom" className="rounded-t-3xl px-2 pb-8 pt-3">
          {active && (
            <>
              <SheetHeader className="px-4 pb-2">
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${typeStyles[active.file_type] ?? typeStyles["other"]}`}>
                    {(() => { const I = icons[active.file_type as keyof typeof icons] ?? FileText; return <I className="h-5 w-5" />; })()}
                  </span>
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-left text-sm">{active.name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{active.storage_path ? `${formatSize(active.size)} · ` : ""}{ago(active.created_at)}</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-1">
                <button type="button" onClick={() => { setActive(null); toast.info("Details", { description: `${active.name} · ${formatSize(active.size)} · ${active.views} views · uploaded ${new Date(active.created_at).toLocaleDateString()}` }); }} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                  <Info className="h-5 w-5 text-muted-foreground" /> Details
                </button>
                {active.storage_path && (
                  <button type="button" onClick={() => download(active)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                    <Download className="h-5 w-5 text-muted-foreground" /> Download
                  </button>
                )}
                <button type="button" onClick={() => copyLink(active)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                  <Copy className="h-5 w-5 text-muted-foreground" /> Copy link
                </button>
                <button type="button" onClick={() => share(active)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                  <Share2 className="h-5 w-5 text-muted-foreground" /> Share
                </button>
                <button type="button" onClick={() => remove(active)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/15">
                  <Trash2 className="h-5 w-5" /> Move to Trash
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
