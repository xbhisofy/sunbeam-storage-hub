import { pageHead, site } from "@/lib/site";
import { currentUserId } from "@/lib/session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, Trash2, Film, Music, FileText, Eye, Link2, Download, Image as ImageIcon, FolderOpen, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

function Content() {
  const { kind, upload } = Route.useSearch();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (upload) input.current?.click(); }, [upload]);
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);

  const { data: files = [] } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return [];
      const { data } = await supabase.from("files").select("*").eq("owner_id", uid).order("created_at", { ascending: false });
      return data ?? [];
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
      setUploading({ name: arr.length > 1 ? `${f.name} (${i + 1}/${arr.length})` : f.name, pct: Math.round((i / arr.length) * 100) + 10 });
      const tid = toast.loading(`Uploading ${f.name}`, { description: `${formatSize(f.size)} · please keep the app open` });
      const path = `${uid}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("files").upload(path, f, { contentType: f.type || "application/octet-stream" });
      if (error) { toast.error("Upload failed", { id: tid, description: error.message }); continue; }
      const { error: e2 } = await supabase.from("files").insert({
        owner_id: uid, name: f.name, file_type: fileKind(f.type), mime: f.type, size: f.size, storage_path: path, source: "original",
      });
      if (e2) toast.error("Upload failed", { id: tid, description: e2.message });
      else toast.success("Upload complete", { id: tid, description: `${f.name} is ready to share` });
    }
    setUploading(null);
    if (input.current) input.current.value = "";
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  async function remove(id: string, path: string | null) {
    if (path) await supabase.storage.from("files").remove([path]);
    await supabase.from("files").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  async function download(path: string, name: string) {
    const { data, error } = await supabase.storage.from("files").createSignedUrl(path, 300, { download: name });
    if (error || !data) { toast.error("Could not download the file"); return; }
    window.location.href = data.signedUrl;
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
      {uploading && <div className="mt-5 space-y-2 rounded-xl border bg-card p-4 text-sm shadow-sm"><div className="flex justify-between"><span className="truncate font-medium">{uploading.name}</span><span className="tabular-nums text-muted-foreground">{Math.round(uploading.pct)}%</span></div><Progress value={uploading.pct} /></div>}

      {/* File list */}
      <div className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm">
        {shown.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/10"><FolderOpen className="h-8 w-8 text-primary" /></span>
            <p className="mt-5 text-[15px] font-semibold">Your folder is empty</p>
            <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">Tap the + button below to upload your first video, photo or document. Once it's here, tap copy to get a share link you can send to anyone.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{shown.length} {shown.length === 1 ? "item" : "items"}</p>
            </div>
            <ul className="divide-y">{shown.map((f) => {
              const Icon = icons[f.file_type as keyof typeof icons] ?? FileText;
              const style = typeStyles[f.file_type] ?? typeStyles["other"];
              return (
                <li key={f.id} className="flex items-center gap-3 p-3.5 transition-colors hover:bg-muted/40">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${style}`}><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{f.name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${f.source === "converted" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"}`}>{f.source === "converted" ? "Link" : "File"}</span>
                      {f.source !== "converted" && <><span>·</span><span>{formatSize(f.size)}</span></>}
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5 tabular-nums"><Eye className="h-3 w-3" />{f.views}</span>
                      <span>·</span>
                      <span className="truncate">{ago(f.created_at)}</span>
                    </div>
                  </div>
                  {f.storage_path && <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-lg" aria-label="Download" onClick={() => download(f.storage_path!, f.name)}><Download className="h-4 w-4" /></Button>}
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-lg" aria-label="Copy share link" onClick={() => { navigator.clipboard.writeText(`${site.shareUrl}/s/${f.slug}`); toast.success("Link copied"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-destructive" aria-label="Delete" onClick={() => remove(f.id, f.storage_path)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              );
            })}</ul>
          </>
        )}
      </div>
    </div>
  );
}
