import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { currentUserId } from "@/lib/session";
import { isInstalledApp } from "@/lib/app-mode";
import { Upload, Share2, Wallet, Users, UserPlus, Smartphone, BarChart3, ShieldCheck, Gift, Headphones, ArrowRight, CheckCircle2, Link2, DollarSign, Eye, Zap } from "lucide-react";
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

const steps = [
  { icon: UserPlus, title: "1. Account banao", text: "Naam, email aur password se 30 second me free account." },
  { icon: Upload, title: "2. Upload & share", text: "Video, audio ya PDF upload karo aur apna share link copy karo." },
  { icon: Wallet, title: "3. Earn karo", text: "Har view aur har naye user par balance badhta hai." },
];
const why = [
  { icon: Smartphone, title: "App me hi play", text: "Share link kholne wale ko Tanyora app me hi video, audio aur PDF dikhta hai." },
  { icon: BarChart3, title: "Live stats", text: "Dashboard par views, earnings aur referrals turant dekho." },
  { icon: ShieldCheck, title: "Private storage", text: "Aapki files secure storage me rehti hain, sirf share link se khulti hain." },
  { icon: Gift, title: "Referral commission", text: "Aapke invite kiye users ki view earnings ka 10% aapko." },
  { icon: Wallet, title: "Low minimum payout", text: "Sirf $5 se withdrawal — UPI, PayPal ya bank." },
  { icon: Headphones, title: "Support", text: `Koi sawal? ${site.supportEmail} par likho.` },
];

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    // Installed web apps retain the existing start URL; route to the actual experience.
    if (!isInstalledApp()) return;
    currentUserId().then(uid => navigate({ to: uid ? "/dashboard" : "/auth", replace: true }));
  }, [navigate]);
  return (
    <div className="landing min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Brand />
          <nav className="hidden gap-8 text-sm font-medium md:flex">
            <a href="#rates">Rates / Earnings</a><a href="#referral">Referral</a><a href="#app">App</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" asChild className="hover:bg-accent hover:text-foreground"><Link to="/auth">Log in</Link></Button>
            <Button asChild className="landing-shadow rounded-full"><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
          </div>
        </div>
      </header>

      <section className="landing-glow">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Upload karo, share karo, kamao</span>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">Apni files ko banao <span className="landing-text">Passive Income.</span></h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">Video, audio aur PDF upload karo, link share karo. Dekhne wale Tanyora app me content kholte hain aur aapko har view ka paisa milta hai.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="landing-shadow h-12 rounded-full px-7"><Link to="/auth" search={{ mode: "signup" }}>Get Started <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild className="h-12 rounded-full border-primary/50 bg-transparent px-7 text-accent-foreground hover:bg-accent"><a href="#rates">View Rates</a></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Free account</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />Min withdrawal $5</span>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl border bg-card/70 p-6 backdrop-blur">
              <div className="flex items-center gap-3 rounded-2xl border bg-background/60 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground"><Link2 className="h-5 w-5" /></span>
                <div><p className="font-semibold">Share link ready</p><p className="text-xs uppercase tracking-wide text-muted-foreground">tanyora · /s/xy92p</p></div>
              </div>
              <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">Example earning</p>
              <p className="text-4xl font-bold">$3.00 <span className="text-base font-normal text-muted-foreground">/ 1,000 views</span></p>
              <svg viewBox="0 0 300 120" className="mt-4 h-32 w-full rounded-2xl bg-background/60 p-3" aria-hidden><path d="M5 100 C 50 90, 70 110, 110 80 S 170 20, 200 70 S 250 110, 290 15" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round"/></svg>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border bg-background/60 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><DollarSign className="h-5 w-5" /></span>
                <p className="text-sm"><b>Payout request</b><br /><span className="text-muted-foreground">UPI · PayPal · Bank</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 text-center md:grid-cols-3">
          {steps.map((f) => (
            <div key={f.title}>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-accent-foreground"><f.icon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="rates" className="landing-glow scroll-mt-20 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-4xl font-extrabold md:text-5xl">Plans & Earnings</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">Apne traffic ke hisaab se plan chuno. Plan baad me 3 baar badal sakte ho.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { icon: Users, name: "Signup Referral", sub: "Naye users lao", price: "$0.10", unit: "per new signup", focus: "User growth" },
              { icon: Eye, name: "View-Based", sub: "High traffic links", price: "$3.00", unit: "per 1,000 views", focus: "Views & scaling" },
            ].map((p) => (
              <div key={p.name} className="rounded-3xl border bg-card/80 p-7">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><p.icon className="h-6 w-6" /></span>
                  <div><h3 className="text-2xl font-bold">Plan: {p.name}</h3><p className="text-sm text-muted-foreground">{p.sub}</p></div>
                </div>
                <div className="mt-6 rounded-2xl border bg-background/60 p-5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><Zap className="h-4 w-4 text-primary" />Earnings</p>
                  <p className="mt-1 text-3xl font-bold">{p.price} <span className="text-base font-normal text-muted-foreground">{p.unit}</span></p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5 text-sm">
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Payout</p><p className="mt-1 font-semibold">On-demand, min $5</p></div>
                  <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Focus</p><p className="mt-1 font-semibold">{p.focus}</p></div>
                </div>
              </div>
            ))}
          </div>
          <div id="referral" className="mt-6 scroll-mt-24 rounded-3xl border bg-card/80 p-7">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><Share2 className="h-6 w-6" /></span>
              <div><h3 className="text-2xl font-bold">Referral Program</h3><p className="text-sm text-muted-foreground">Apne invite kiye users ki kamai ka hissa</p></div>
            </div>
            <p className="mt-5 text-3xl font-bold">10% <span className="text-base font-normal text-muted-foreground">of their view earnings</span></p>
            <p className="mt-3 text-muted-foreground">Apna referral link share karo. Jo bhi us link se join karega, uski view earnings ka 10% aapke balance me automatically judega — unki kamai se kuch nahi katega.</p>
          </div>
        </div>
      </section>

      <section id="app" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <h2 className="text-center text-4xl font-extrabold md:text-5xl">Why Tanyora</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">Website par aap upload aur earnings manage karte ho. Dekhne wale app me content chalate hain.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {why.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-7">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground"><f.icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="landing-glow mt-12 flex flex-col items-center gap-5 rounded-3xl border p-10 text-center">
          <h3 className="text-3xl font-bold">Aaj hi shuru karo</h3>
          <Button size="lg" asChild className="landing-shadow h-12 rounded-full px-8"><Link to="/auth" search={{ mode: "signup" }}>Free account banao <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </section>
      <LegalFooter />
    </div>
  );
}
