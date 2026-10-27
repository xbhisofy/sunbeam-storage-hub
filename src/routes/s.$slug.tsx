import { loadSharedFile } from "@/lib/shared-file";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { LegalFooter } from "@/components/LegalFooter";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ReportFile } from "@/components/ReportFile";
import { pageHead, site } from "@/lib/site";

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

  // Android browsers jump straight into the app, or to the Play Store when it isn't installed.
  useEffect(() => {
    if (isApp || !/Android/i.test(navigator.userAgent)) return;
    window.location.href = `intent://${new URL(site.shareUrl).host}/s/${encodeURIComponent(slug)}#Intent;scheme=https;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_URL(slug))};end`;
  }, [isApp, slug]);

  const { data, isLoading } = useQuery({
    queryKey: ["share", slug],
    enabled: isApp,
    staleTime: 60_000,
    queryFn: () => loadSharedFile(slug),
  });

  useEffect(() => {
    if (!isApp || left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, isApp]);

  // A view counts only once the content actually starts playing or is shown.
  const counted = useRef(false);
  function countView() {
    if (counted.current) return;
    counted.current = true;
    supabase.rpc("record_view", { _slug: slug });
  }

  function play() {
    if (!data || "expired" in data) return;
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
              <Button size="lg" variant="outline" asChild><a href={`intent://${new URL(site.shareUrl).host}/s/${encodeURIComponent(slug)}#Intent;scheme=https;package=${APP_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_URL(slug))};end`}>Already installed? Open app</a></Button>
            </div>
          </div>
        ) : isLoading ? <p className="text-muted-foreground">Loading…</p> : !data ? (
          <p className="text-center text-muted-foreground">This file doesn't exist or was deleted.</p>
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
            {data.file_type === "video" && <VideoPlayer src={data.url} title={data.name} onStart={countView} />}
            {data.file_type === "image" && <img onLoad={countView} src={data.url} alt={data.name} draggable={false} onContextMenu={(e) => e.preventDefault()} className="max-h-[80vh] w-full rounded-xl object-contain" />}
            {data.file_type === "audio" && <audio onPlaying={countView} src={data.url} controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} autoPlay className="w-full" />}
            {data.file_type === "other" && <p className="rounded-xl border bg-card p-6 text-muted-foreground">Preview is not available for this file type.</p>}
            {data.file_type === "pdf" && <iframe onLoad={countView} src={`${data.url}#toolbar=0`} title={data.name} className="h-[80vh] w-full rounded-xl border" />}
            <ReportFile slug={slug} name={data.name} />
          </div>
        )}
        {!isApp && <p className="mt-6 text-center text-sm"><Link className="text-primary underline" to="/copyright">Copyright & safety complaints</Link></p>}
      </main>
      {!isApp && <LegalFooter />}
    </div>
  );
}
