import { pageHead, site } from "@/lib/site";
import { currentUserId } from "@/lib/session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, Search, FolderOpen, Copy, Trash2, Film, Music, FileText, Eye, Link2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { fileKind, formatSize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/content")({
  validateSearch: z.object({ tab: z.enum(["all", "convert"]).optional(), kind: z.enum(["pdf", "video", "audio", "image", "link"]).optional(), upload: z.enum(["video", "audio", "image", "document"]).optional() }),
  head: () => pageHead("My Content", "Upload and manage your shared files.", undefined, true),
  component: Content,
});

const icons = { video: Film, audio: Music, pdf: FileText, other: FileText, link: Link2 };

function ago(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const urlSchema = z.string().trim().url().max(2000);

function Content() {
  const { tab = "all", kind, upload } = Route.useSearch();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (upload) input.current?.click(); }, [upload]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "original" | "converted">("all");
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");

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

  async function convert(e: React.FormEvent) {
    e.preventDefault();
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) { toast.error("Enter a valid link starting with https://"); return; }
    const uid = await currentUserId();
    if (!uid) return;
    const { error } = await supabase.from("files").insert({
      owner_id: uid, name: title.trim().slice(0, 200) || parsed.data, file_type: "link", size: 0,
      source: "converted", external_url: parsed.data,
      header_text: header.trim().slice(0, 500) || null, footer_text: footer.trim().slice(0, 500) || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Share link created", { description: "Copy it from your files below." });
    setUrl(""); setTitle(""); setHeader(""); setFooter("");
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

  const shown = files.filter((f) => (filter === "all" || f.source === filter) && (!kind || f.file_type === kind) && f.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-6xl">
      <h1 className="hidden text-3xl font-bold md:block">My Files</h1>
      {kind && <div className="flex items-center justify-between"><h2 className="font-semibold capitalize">{kind === "pdf" ? "Documents" : kind}</h2><Button variant="link" asChild><Link to="/content">All files</Link></Button></div>}

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border bg-card p-1.5">
        <Link to="/content" search={{ tab: "all" }} className={`rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-colors ${tab === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}>All Content</Link>
        <Link to="/content" search={{ tab: "convert" }} className={`rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-colors ${tab === "convert" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}>Convert Link</Link>
      </div>

      {tab === "convert" ? (
        <form onSubmit={convert} className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b bg-muted/40 px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Link2 className="h-4 w-4" /></span>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight">Convert a link</div>
              <p className="text-xs text-muted-foreground">Create a monetized share link in seconds</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <label htmlFor="conv-url" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destination URL</label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="conv-url" type="url" required placeholder="https://example.com/video" value={url} onChange={(e) => setUrl(e.target.value)} className="h-11 rounded-xl bg-background pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="conv-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
              <Input id="conv-title" placeholder="Give your link a name" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl bg-background" />
            </div>
            <details className="group rounded-xl border bg-background">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                <span>Customize share page <span className="font-normal text-muted-foreground">· optional</span></span>
                <span className="text-muted-foreground transition-transform group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <div className="space-y-3 border-t px-4 py-4">
                <div className="space-y-1.5">
                  <label htmlFor="conv-header" className="text-xs font-medium text-muted-foreground">Header text</label>
                  <Textarea id="conv-header" rows={2} placeholder="Shown above your content" value={header} onChange={(e) => setHeader(e.target.value)} className="min-h-0 resize-none rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="conv-footer" className="text-xs font-medium text-muted-foreground">Footer text</label>
                  <Textarea id="conv-footer" rows={2} placeholder="Shown below your content" value={footer} onChange={(e) => setFooter(e.target.value)} className="min-h-0 resize-none rounded-lg" />
                </div>
              </div>
            </details>
            <Button className="h-11 w-full rounded-xl text-[15px] font-semibold shadow-sm">Create share link</Button>
          </div>
        </form>
      ) : (
        <div className="mt-5">
          <input ref={input} type="file" accept={upload === "video" ? "video/*" : upload === "audio" ? "audio/*" : upload === "image" ? "image/*" : upload === "document" ? ".pdf,.doc,.docx,.txt,.zip,application/*" : "video/*,audio/*,image/*,application/*"} multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <button type="button" onClick={() => input.current?.click()} disabled={!!uploading}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed bg-card p-5 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 disabled:opacity-60">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Upload className="h-5 w-5" /></span>
            <span className="min-w-0">
              <span className="block font-semibold">Upload files</span>
              <span className="block text-xs text-muted-foreground">Videos, audio, images and documents</span>
            </span>
          </button>
          {uploading && <div className="mt-3 space-y-2 rounded-xl border bg-card p-4 text-sm"><div className="flex justify-between"><span className="truncate">{uploading.name}</span><span className="text-muted-foreground">{Math.round(uploading.pct)}%</span></div><Progress value={uploading.pct} /></div>}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-11 rounded-xl pl-10" placeholder="Search by file name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 rounded-xl border bg-card p-1">
          {(["all", "original", "converted"] as const).map((k) => (
            <button type="button" key={k} onClick={() => setFilter(k)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${filter === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{k}</button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{shown.length} {shown.length === 1 ? "item" : "items"}</p>
      <div className="mt-2 overflow-hidden rounded-2xl border bg-card">
        {shown.length === 0 ? (
          <div className="py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent"><FolderOpen className="h-7 w-7 text-muted-foreground" /></span>
            <p className="mt-4 font-semibold">No content yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload a file or convert a link to get started.</p>
          </div>
        ) : <ul className="divide-y">{shown.map((f) => {
          const Icon = icons[f.file_type as keyof typeof icons] ?? FileText;
          return (
            <li key={f.id} className="flex items-center gap-3 p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="capitalize">{f.source}</span><span>·</span>
                  <span>{f.source === "converted" ? "Link" : formatSize(f.size)}</span><span>·</span>
                  <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" />{f.views}</span><span>·</span>
                  <span className="truncate">{ago(f.created_at)}</span>
                </div>
              </div>
              {f.storage_path && <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" aria-label="Download" onClick={() => download(f.storage_path!, f.name)}><Download className="h-4 w-4" /></Button>}
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" aria-label="Copy share link" onClick={() => { navigator.clipboard.writeText(`${site.shareUrl}/s/${f.slug}`); toast.success("Link copied"); }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" aria-label="Delete" onClick={() => remove(f.id, f.storage_path)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          );
        })}</ul>}
      </div>
    </div>
  );
}
