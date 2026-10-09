import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Search, FolderOpen, Copy, Trash2, Film, Music, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { fileKind, formatSize } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/content")({
  head: () => ({ meta: [{ title: "My Content — TenBox" }, { name: "description", content: "Upload and manage your shared files." }] }),
  component: Content,
});

const icons = { video: Film, audio: Music, pdf: FileText, other: FileText };

function Content() {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "video" | "audio" | "pdf">("all");
  const [uploading, setUploading] = useState<string | null>(null);

  const { data: files = [] } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("files").select("*").eq("owner_id", u.user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function onFiles(list: FileList | null) {
    if (!list) return;
    const { data: u } = await supabase.auth.getUser();
    for (const f of Array.from(list)) {
      const kind = fileKind(f.type);
      if (kind === "other") { toast.error(`${f.name}: only video, audio or PDF allowed`); continue; }
      if (f.size > 50 * 1024 * 1024) { toast.error(`${f.name} is bigger than 50 MB`); continue; }
      setUploading(f.name);
      const path = `${u.user!.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("files").upload(path, f, { contentType: f.type });
      if (error) { toast.error(error.message); continue; }
      const { error: e2 } = await supabase.from("files").insert({
        owner_id: u.user!.id, name: f.name, file_type: kind, mime: f.type, size: f.size, storage_path: path,
      });
      if (e2) toast.error(e2.message); else toast.success(`${f.name} uploaded`);
    }
    setUploading(null);
    if (input.current) input.current.value = "";
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  function link(slug: string) { return `${window.location.origin}/s/${slug}`; }

  async function remove(id: string, path: string) {
    await supabase.storage.from("files").remove([path]);
    await supabase.from("files").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["files"] });
  }

  const shown = files.filter((f) => (filter === "all" || f.file_type === filter) && f.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold">My Content</h1>
      <p className="mt-1 text-muted-foreground">Upload a file and get a shareable link back instantly.</p>
      <div className="mt-6 rounded-2xl border bg-card p-5">
        <input ref={input} type="file" multiple accept="video/*,audio/*,application/pdf" className="hidden" onChange={(e) => onFiles(e.target.files)} />
        <Button size="lg" onClick={() => input.current?.click()} disabled={!!uploading}>
          <Upload className="h-4 w-4" /> Upload files
        </Button>
        {uploading && <div className="mt-4 space-y-2 text-sm text-muted-foreground">Uploading {uploading}…<Progress value={60} className="animate-pulse" /></div>}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by file name" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex rounded-xl border bg-card p-1">
          {(["all", "video", "audio", "pdf"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-lg px-4 py-1.5 text-sm capitalize ${filter === k ? "bg-primary text-primary-foreground" : ""}`}>{k}</button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{shown.length} items</p>
      <div className="mt-3 rounded-2xl border bg-card">
        {shown.length === 0 ? (
          <div className="py-20 text-center">
            <FolderOpen className="mx-auto h-14 w-14 text-muted-foreground" />
            <p className="mt-3 font-semibold">No content yet</p>
            <p className="text-sm text-muted-foreground">Upload a file above to get your first shareable link.</p>
          </div>
        ) : shown.map((f) => {
          const Icon = icons[f.file_type as keyof typeof icons] ?? FileText;
          return (
            <div key={f.id} className="flex items-center gap-4 border-b p-4 last:border-b-0">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <Link to="/s/$slug" params={{ slug: f.slug }} className="block truncate font-medium hover:text-primary">{f.name}</Link>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{formatSize(f.size)}</span><span className="flex items-center gap-1"><Eye className="h-3 w-3" />{f.views}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link(f.slug)); toast.success("Link copied"); }}>
                <Copy className="h-4 w-4" /> Copy link
              </Button>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(f.id, f.storage_path)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
