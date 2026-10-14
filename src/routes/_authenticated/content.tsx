import { pageHead, site } from "@/lib/site";
import { currentUserId } from "@/lib/session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, Trash2, Film, Music, FileText, Link2, Download, Image as ImageIcon, FolderOpen, Upload, MoreVertical, Share2, Info, Pencil, Clock, Eye, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fileKind, formatSize, formatFileDate } from "@/lib/format";
import { useInstalledApp } from "@/lib/app-mode";

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
  const app = useInstalledApp();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (upload) input.current?.click(); }, [upload]);
  const [uploading, setUploading] = useState<{ name: string; size: number; step: string; pct: number } | null>(null);
  const [active, setActive] = useState<FileRow | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [pickingExpiry, setPickingExpiry] = useState(false);
  const [showingDetails, setShowingDetails] = useState(false);
  const [makingLink, setMakingLink] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "original" | "converted">("all");

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
      if (f.size > 1024 ** 4) { toast.error("File too large", { description: `${f.name} is over the 1 TB limit` }); continue; }
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

  async function rename(f: FileRow) {
    const name = newName.trim();
    if (!name) { toast.error("Enter a file name"); return; }
    if (name.length > 120) { toast.error("Name is too long"); return; }
    setSavingName(true);
    const { error } = await supabase.from("files").update({ name }).eq("id", f.id);
    setSavingName(false);
    if (error) { toast.error("Could not rename", { description: error.message }); return; }
    toast.success("Renamed", { description: name });
    setRenaming(false);
    setActive(null);
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
    toast.success("Link copied");
  }

  const EXPIRY_OPTIONS: { label: string; hours: number | null }[] = [
    { label: "1 hour", hours: 1 },
    { label: "24 hours", hours: 24 },
    { label: "7 days", hours: 24 * 7 },
    { label: "30 days", hours: 24 * 30 },
    { label: "Never expires", hours: null },
  ];

  async function generateLink(f: FileRow, hours: number | null, label: string) {
    setMakingLink(true);
    const expires_at = hours === null ? null : new Date(Date.now() + hours * 3600_000).toISOString();
    const { error } = await supabase.from("files").update({ expires_at }).eq("id", f.id);
    setMakingLink(false);
    if (error) { toast.error("Could not create the link", { description: error.message }); return; }
    const url = `${site.shareUrl}/s/${f.slug}`;
    setPickingExpiry(false);
    setActive(null);
    qc.invalidateQueries({ queryKey: ["files"] });
    toast.success("Link ready", { description: hours === null ? "This link never expires." : `This link stops working after ${label}.` });
    if (navigator.share) {
      try {
        await navigator.share({ title: f.name, url });
        return;
      } catch (e) {
        // User closed the device share sheet — nothing more to do.
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Any other failure falls through to the copy fallback below.
      }
    }
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch { /* clipboard may be unavailable */ }
  }

  const shown = files.filter((f) => (!kind || f.file_type === kind));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="hidden items-center justify-between md:flex">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your uploaded files.</p>
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
        <div className="mt-1 rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/10"><FolderOpen className="h-8 w-8 text-primary" /></span>
          <p className="mt-5 text-[15px] font-semibold">Your folder is empty</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">Tap the + button below to upload your first video, photo or document. Once it's here, tap the ⋮ menu to copy its share link.</p>
        </div>
      ) : (
        <div className="mt-1 space-y-2.5">
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
                    {f.storage_path ? `${formatSize(f.size)} · ` : ""}{formatFileDate(f.created_at)}
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
      <Sheet open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setRenaming(false); setPickingExpiry(false); setShowingDetails(false); } }}>
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
                    <p className="text-xs text-muted-foreground">{active.storage_path ? `${formatSize(active.size)} · ` : ""}{formatFileDate(active.created_at)}</p>
                  </div>
                </div>
              </SheetHeader>
              {showingDetails ? (
                <div className="mt-1 px-4 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">File details</p>
                  <div className="mt-3 divide-y rounded-2xl border">
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="max-w-[60%] truncate text-sm font-medium">{active.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="text-sm font-medium capitalize">{active.file_type}</span>
                    </div>
                    {active.storage_path && (
                      <div className="flex items-center justify-between gap-4 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Size</span>
                        <span className="text-sm font-medium">{formatSize(active.size)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Uploaded</span>
                      <span className="text-sm font-medium">{formatFileDate(active.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Source</span>
                      <span className="text-sm font-medium capitalize">{active.storage_path ? "Uploaded file" : "Converted link"}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-3 w-full rounded-xl" onClick={() => setShowingDetails(false)}>Back</Button>
                </div>
              ) : pickingExpiry ? (
                <div className="mt-1 px-4 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How long should the link work?</p>
                  <div className="mt-2 space-y-1">
                    {EXPIRY_OPTIONS.map((o) => (
                      <button
                        key={o.label}
                        type="button"
                        disabled={makingLink}
                        onClick={() => generateLink(active, o.hours, o.label)}
                        className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted disabled:opacity-50"
                      >
                        <Clock className="h-5 w-5 text-muted-foreground" /> {o.label}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-3 w-full rounded-xl" onClick={() => setPickingExpiry(false)} disabled={makingLink}>Back</Button>
                </div>
              ) : renaming ? (
                <div className="mt-1 px-4 pb-2">
                  <label htmlFor="rename-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New name</label>
                  <input
                    id="rename-input"
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") rename(active); }}
                    maxLength={120}
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRenaming(false)} disabled={savingName}>Cancel</Button>
                    <Button className="flex-1 rounded-xl" onClick={() => rename(active)} disabled={savingName || !newName.trim()}>{savingName ? "Saving…" : "Save"}</Button>
                  </div>
                </div>
              ) : (
              <div className="mt-1">
                <button type="button" onClick={() => setShowingDetails(true)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                  <Info className="h-5 w-5 text-muted-foreground" /> Details
                </button>
                {active.storage_path && (
                  <button type="button" onClick={() => download(active)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                    <Download className="h-5 w-5 text-muted-foreground" /> Download
                  </button>
                )}
                <button type="button" onClick={() => { setNewName(active.name); setRenaming(true); }} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                  <Pencil className="h-5 w-5 text-muted-foreground" /> Rename
                </button>
                <button type="button" onClick={() => setPickingExpiry(true)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                  <Share2 className="h-5 w-5 text-muted-foreground" /> Share
                </button>
                <button type="button" onClick={() => copyLink(active)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-colors hover:bg-muted/60 active:bg-muted">
                  <Copy className="h-5 w-5 text-muted-foreground" /> Copy link
                </button>
                <button type="button" onClick={() => remove(active)} className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/15">
                  <Trash2 className="h-5 w-5" /> Move to Trash
                </button>
              </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
