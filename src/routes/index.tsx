import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { currentUserId } from "@/lib/session";
import { Upload, Share2, Wallet, Users, Film } from "lucide-react";
import { Brand } from "@/components/Brand";
import { LegalFooter } from "@/components/LegalFooter";
import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tanyora — Upload, share & earn from your videos" },
      { name: "description", content: "Upload videos, audio and PDFs, get a share link, and track your content." },
      { property: "og:title", content: "Tanyora — Upload, share & earn" },
      { property: "og:description", content: "Upload files, share links and manage your content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: site.publicUrl + "/" },
    ],
    links: [{ rel: "canonical", href: site.publicUrl + "/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Tanyora",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web, Android",
        description: "Upload videos, audio and PDFs, get a share link, and track your content.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }),
    }],
  }),
  component: Home,
});

const features = [
  { icon: Upload, title: "Upload anything", text: "Videos, audio and PDF files up to 50 MB each." },
  { icon: Share2, title: "Instant share link", text: "Every file gets its own link you can share anywhere." },
  { icon: Wallet, title: "Earn per view", text: "Each view of your shared link adds money to your balance." },
  { icon: Users, title: "Referral bonus", text: "Invite friends and earn a bonus on their views too." },
];

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    // Installed web apps retain the existing start URL; route to the actual experience.
    if (!window.matchMedia("(display-mode: standalone)").matches && !document.referrer.startsWith("android-app://")) return;
    currentUserId().then(uid => navigate({ to: uid ? "/dashboard" : "/auth", replace: true }));
  }, [navigate]);
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Brand />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Log in</Link></Button>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Get started</Link></Button>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm text-accent-foreground">
          <Film className="h-4 w-4" /> Share videos, earn money
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Tanyora <span className="text-primary">File Sharing</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Store videos, audio and PDFs in the cloud and share your content through links.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild><Link to="/auth" search={{ mode: "signup" }}>Start uploading free</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground"><f.icon className="h-5 w-5" /></span>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <LegalFooter />
    </div>
  );
}
