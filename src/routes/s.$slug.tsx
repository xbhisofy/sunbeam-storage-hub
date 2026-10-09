import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Cloud, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatSize } from "@/lib/format";

const AD_SECONDS = 5;

export const Route = createFileRoute("/s/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shared file — TenBox" },
      { name: "description", content: "Watch or open this shared file on TenBox." },
      { property: "og:title", content: "Shared file — TenBox" },
      { property: "og:description", content: "Watch or open this shared file on TenBox." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { slug } = Route.useParams();
  const [left, setLeft] = useState(AD_SECONDS);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["share", slug],
    queryFn: async () => {
      const { data: f } = await supabase.from("files").select("name,file_type,mime,size,storage_path,views").eq("slug", slug).maybeSingle();
      if (!f) return null;
      const { data: s } = await supabase.storage.from("files").createSignedUrl(f.storage_path, 60 * 60 * 3);
      return { ...f, url: s?.signedUrl ?? "" };
    },
  });

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  function play() {
    setOpen(true);
    supabase.rpc("record_view", { _slug: slug });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-card px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Cloud className="h-4 w-4" /></span> TenBox
        </Link>
        <Button size="sm" asChild><Link to="/auth" search={{ mode: "signup" }}>Share & earn</Link></Button>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : !data ? (
          <p className="text-center text-muted-foreground">This file doesn't exist or was deleted.</p>
        ) : !open ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Advertisement</div>
            <div className="mt-3 grid aspect-video place-items-center rounded-xl bg-muted text-muted-foreground">
              Your ad appears here
            </div>
            <h1 className="mt-6 truncate text-xl font-semibold">{data.name}</h1>
            <p className="text-sm text-muted-foreground">{formatSize(data.size)} · {data.views} views</p>
            <Button size="lg" className="mt-5" disabled={left > 0} onClick={play}>
              {left > 0 ? `Open in ${left}s` : "Open file"}
            </Button>
          </div>
        ) : (
          <div>
            <h1 className="mb-4 truncate text-xl font-semibold">{data.name}</h1>
            {data.file_type === "video" && <video src={data.url} controls autoPlay className="w-full rounded-xl bg-foreground" />}
            {data.file_type === "audio" && <audio src={data.url} controls autoPlay className="w-full" />}
            {data.file_type === "pdf" && <iframe src={data.url} title={data.name} className="h-[80vh] w-full rounded-xl border" />}
            <Button variant="outline" className="mt-4" asChild>
              <a href={data.url} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /> Download</a>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
