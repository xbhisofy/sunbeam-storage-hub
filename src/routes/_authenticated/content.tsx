import { pageHead, site } from "@/lib/site";
import { currentUserId } from "@/lib/session";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, Search, FolderOpen, Copy, Trash2, Film, Music, FileText, Eye, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { fileKind, formatSize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/content")({
  validateSearch: z.object({ tab: z.enum(["all", "convert"]).optional(), kind: z.enum(["pdf", "video", "audio", "link"]).optional(), upload: z.enum(["video", "audio", "document"]).optional() }),
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
      if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name} is bigger than 50 MB`); continue; }
      setUploading({ name: f.name, pct: Math.round((i / arr.length) * 100) + 10 });
      const path = `${uid}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("files").upload(path, f, { contentType: f.type || "application/octet-stream" });
      if (error) { toast.error(error.message); continue; }
      const { error: e2 } = await supabase.from("files").insert({
        owner_id: uid, name: f.name, file_type: fileKind(f.type), mime: f.type, size: f.size, storage_path: path, source: "original",
      });
      if (e2) toast.error(e2.message); else toast.success(`${f.name} uploaded`);
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
    toast.success("Link converted");
    setUrl(""); setTitle(""); setHeader(""); setFooter("");
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  async function remove(id: string, path: string | null) {
    if (path) await supabase.storage.from("files").remove([path]);
    await supabase.from("files").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["files"] });
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
        <form onSubmit={convert} className="mt-5 space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Link2 className="h-5 w-5" /></span>
            <div className="min-w-0">
              <div className="font-semibold">Convert any link</div>
              <p className="mt-0.5 text-sm text-muted-foreground">Paste a link and get your own share link with an ad screen and custom header/footer.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="conv-url" className="text-sm font-medium">Link</label>
            <Input id="conv-url" required placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="conv-title" className="text-sm font-medium">Title <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Input id="conv-title" placeholder="My awesome video" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="conv-header" className="text-sm font-medium">Header text <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Textarea id="conv-header" placeholder="Shown at the top of your share page" value={header} onChange={(e) => setHeader(e.target.value)} className="min-h-20 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="conv-footer" className="text-sm font-medium">Footer text <span className="font-normal text-muted-foreground">(optional)</span></label>
            <Textarea id="conv-footer" placeholder="Shown at the bottom of your share page" value={footer} onChange={(e) => setFooter(e.target.value)} className="min-h-20 rounded-xl" />
          </div>
          <Button className="h-11 w-full rounded-xl text-[15px] font-semibold"><Link2 className="h-4 w-4" /> Convert link</Button>
        </form>
      ) : (
        <div className="mt-5 border-b pb-5">
          <input ref={input} type="file" accept={upload === "video" ? "video/*" : upload === "audio" ? "audio/*" : undefined} multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <Button size="lg" onClick={() => input.current?.click()} disabled={!!uploading}>
            <Upload className="h-4 w-4" /> Upload files
          </Button>
          {uploading && <div className="mt-4 space-y-2 text-sm text-muted-foreground">Uploading {uploading.name}…<Progress value={uploading.pct} /></div>}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by file name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex rounded-xl border bg-card p-1">
          {(["all", "original", "converted"] as const).map((k) => (
            <Button variant="ghost" key={k} onClick={() => setFilter(k)}
              className={`rounded-lg px-4 py-1.5 text-sm capitalize ${filter === k ? "bg-primary text-primary-foreground" : ""}`}>{k}</Button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{shown.length} items</p>
      <div className="mt-3 space-y-3">
        {shown.length === 0 ? (
          <div className="rounded-lg border bg-card py-20 text-center">
            <FolderOpen className="mx-auto h-14 w-14 text-muted-foreground" />
            <p className="mt-3 font-semibold">No content yet</p>

          </div>
        ) : shown.map((f) => {
          const Icon = icons[f.file_type as keyof typeof icons] ?? FileText;
          return (
            <div key={f.id} className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.name}</p>
                <div className="text-xs text-muted-foreground">
                  {f.source === "converted" ? "Link" : formatSize(f.size)} · {ago(f.created_at)}
                </div>
              </div>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="h-4 w-4" />{f.views}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">{f.source}</span>
              <Button aria-label="Copy share link" variant="outline" onClick={() => { navigator.clipboard.writeText(`${site.shareUrl}/s/${f.slug}`); toast.success("Link copied"); }}>
                <Copy className="h-4 w-4" /><span className="hidden sm:inline">Copy Link</span>
              </Button>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(f.id, f.storage_path)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
