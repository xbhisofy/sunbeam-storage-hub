import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lock, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { LegalFooter } from "@/components/LegalFooter";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ReportFile } from "@/components/ReportFile";
import { pageHead, site } from "@/lib/site";
import { currentUserId } from "@/lib/session";

const AD_SECONDS = 5;
const APP_ID = site.androidPackage;
const PLAY_URL = (slug: string) => `https://play.google.com/store/apps/details?id=${APP_ID}&referrer=${encodeURIComponent("slug=" + slug)}`;
import { isInstalledApp as isNativeApp } from "@/lib/app-mode";

export const Route = createFileRoute("/s/$slug")({
  ssr: false,
  head: () => pageHead("Shared file", "Open shared Tanyora content in the Android app.", undefined, true),
  component: SharePage,
});

function SharePage() {
  const { slug } = Route.useParams();
  const [left, setLeft] = useState(AD_SECONDS);
  const [open, setOpen] = useState(false);
  const [isApp] = useState(isNativeApp);

  const { data, isLoading } = useQuery({
    queryKey: ["share", slug],
    enabled: isApp,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: f } = await supabase.from("files").select("owner_id,name,file_type,mime,size,storage_path,views,source,external_url,header_text,footer_text,expires_at").eq("slug", slug).maybeSingle();
      if (!f) return null;
      // Owners cannot preview their own uploads without a subscription.
      if (f.owner_id && f.owner_id === (await currentUserId())) return { ownFile: true as const, name: f.name };
      if (f.expires_at && new Date(f.expires_at).getTime() < Date.now()) return { expired: true as const };
      if (!f.storage_path) return { ...f, url: f.external_url ?? "" };
      const { data: s } = await supabase.storage.from("files").createSignedUrl(f.storage_path, 60 * 60 * 3);
      return { ...f, url: s?.signedUrl ?? "" };
    },
  });

  useEffect(() => {
    if (!isApp || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, isApp]);

  function play() {
    supabase.rpc("record_view", { _slug: slug });
    if (data && !("expired" in data) && !("ownFile" in data) && data.source === "converted" && data.url) { window.location.href = data.url; return; }
    setOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-card px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Brand />
        </Link>
        {!isApp && <Button size="sm" asChild><Link to="/auth" search={{ mode: "signup" }}>Share & earn</Link></Button>}
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {!isApp ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <Smartphone className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-xl font-semibold">Open this file in the Tanyora app</h1>
            <p className="mt-2 text-sm text-muted-foreground">Videos, audio and files open only in our Android app.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild><a href={PLAY_URL(slug)}>Get it on Play Store</a></Button>
              <Button size="lg" variant="outline" asChild><a href={`intent://${new URL(site.shareUrl).host}/s/${slug}#Intent;scheme=https;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_URL(slug))};end`}>Already installed? Open app</a></Button>
            </div>
          </div>
        ) : isLoading ? <p className="text-muted-foreground">Loading…</p> : !data ? (
          <p className="text-center text-muted-foreground">This file doesn't exist or was deleted.</p>
        ) : "ownFile" in data ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <Lock className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 truncate text-xl font-semibold">{data.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">This is your own upload. Viewing your own files requires a subscription.</p>
            <Button className="mt-5" asChild><Link to="/plans">View plans</Link></Button>
          </div>
        ) : "expired" in data ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <h1 className="text-xl font-semibold">This link has expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">The owner set a time limit on this share link, and it has run out. Ask them to generate a new link.</p>
          </div>
        ) : !open ? (
          <div className="rounded-2xl border bg-card p-6 text-center">
            {data.header_text && <p className="mb-4 whitespace-pre-line text-sm">{data.header_text}</p>}
            <div className="grid aspect-video place-items-center rounded-xl bg-muted">
              <div className="text-center">
                <Smartphone className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">{left > 0 ? "Preparing your file…" : "Your file is ready"}</p>
              </div>
            </div>
            <h1 className="mt-6 truncate text-xl font-semibold">{data.name}</h1>
            <Button size="lg" className="mt-5" disabled={left > 0} onClick={play}>
              {left > 0 ? `Open in ${left}s` : "Open file"}
            </Button>
            {data.footer_text && <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{data.footer_text}</p>}
          </div>
        ) : (
          <div>
            <h1 className="mb-4 truncate text-xl font-semibold">{data.name}</h1>
            {data.file_type === "video" && <VideoPlayer src={data.url} title={data.name} />}
            {data.file_type === "image" && <img src={data.url} alt={data.name} draggable={false} onContextMenu={(e) => e.preventDefault()} className="max-h-[80vh] w-full rounded-xl object-contain" />}
            {data.file_type === "audio" && <audio src={data.url} controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} autoPlay className="w-full" />}
            {data.file_type === "other" && <p className="rounded-xl border bg-card p-6 text-muted-foreground">Preview is not available for this file type.</p>}
            {data.file_type === "pdf" && <iframe src={`${data.url}#toolbar=0`} title={data.name} className="h-[80vh] w-full rounded-xl border" />}
            <ReportFile slug={slug} name={data.name} />
          </div>
        )}
        {!isApp && <p className="mt-6 text-center text-sm"><Link className="text-primary underline" to="/copyright">Copyright & safety complaints</Link></p>}
      </main>
      {!isApp && <LegalFooter />}
    </div>
  );
}
