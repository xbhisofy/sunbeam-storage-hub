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
  { icon: UserPlus, title: "1. Create an account", text: "Sign up free in 30 seconds with your name, email and password." },
  { icon: Upload, title: "2. Upload & share", text: "Upload videos, audio or PDFs and copy your unique share link." },
  { icon: Wallet, title: "3. Get paid", text: "Your balance grows with every genuine view and every new signup." },
];
const why = [
  { icon: Smartphone, title: "Native app playback", text: "Viewers open your videos, audio and PDFs directly in the Tanyora Android app." },
  { icon: BarChart3, title: "Real-time statistics", text: "Track views, earnings and referrals from a clean, fast dashboard." },
  { icon: ShieldCheck, title: "Secure private storage", text: "Files are stored privately and are only reachable through your share link." },
  { icon: Gift, title: "Referral commission", text: "Earn 10% of the view earnings of every user you invite." },
  { icon: Wallet, title: "Low minimum payout", text: "Withdraw from just $5 via UPI, PayPal or bank transfer." },
  { icon: Headphones, title: "Dedicated support", text: `Questions? Reach our team at ${site.supportEmail}.` },
];

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    // Installed web apps retain the existing start URL; route to the actual experience.
    if (!isInstalledApp()) return;
    currentUserId().then(uid => navigate({ to: uid ? "/dashboard" : "/auth", replace: true }));
  }, [navigate]);
  return (
    <div className="landing relative min-h-screen">
      <div className="landing-blob landing-blob-a -left-40 -top-40 h-[34rem] w-[34rem]" aria-hidden />
      <div className="landing-blob landing-blob-b -right-40 top-[42rem] h-[30rem] w-[30rem]" aria-hidden />
      <header className="sticky top-0 z-30 border-b border-transparent bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <Brand />
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#" className="hover:text-foreground">Home</a>
            <a href="#rates" className="hover:text-foreground">Rates / Earnings</a>
            <a href="#referral" className="hover:text-foreground">Referral Program</a>
            <a href="#app" className="hover:text-foreground">Why Tanyora</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" asChild className="hidden hover:bg-accent hover:text-foreground sm:inline-flex"><Link to="/auth">Log in</Link></Button>
            <Button asChild className="landing-shadow rounded-full px-5"><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-5 md:pt-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-accent-foreground"><span className="h-2 w-2 animate-pulse rounded-full bg-primary" />Upload. Share. Earn.</span>
            <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">Turn your content into <span className="landing-text block">Passive Income.</span></h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">Upload videos, audio and PDFs, share your link anywhere, and earn every time someone watches it in the Tanyora app.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="landing-shadow h-12 rounded-full px-8"><Link to="/auth" search={{ mode: "signup" }}>Get Started <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild className="h-12 rounded-full border-primary/40 bg-transparent px-8 text-accent-foreground hover:bg-accent"><a href="#rates">View Rates</a></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Free account</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />Withdraw anytime, min $5</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="landing-glass landing-float rounded-3xl p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">View-based rate</p>
                  <p className="mt-1 text-4xl font-bold">$3.00 <span className="text-base font-normal text-muted-foreground">/ 1,000 views</span></p>
                </div>
                <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">Live</span>
              </div>
              <svg viewBox="0 0 300 120" className="mt-5 h-36 w-full rounded-2xl bg-background/50 p-3" aria-hidden>
                <defs><linearGradient id="lg" x1="0" x2="1"><stop offset="0" stopColor="var(--primary)" /><stop offset="1" stopColor="oklch(0.66 0.21 300)" /></linearGradient></defs>
                <path d="M5 100 C 50 90, 70 110, 110 80 S 170 20, 200 70 S 250 110, 290 15" fill="none" stroke="url(#lg)" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="mt-5">
                <div className="flex justify-between text-xs text-muted-foreground"><span>Payout progress</span><span>$5 minimum</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/60"><div className="h-full w-4/5 rounded-full" style={{ backgroundImage: "var(--landing-text)" }} /></div>
              </div>
            </div>
            <div className="landing-glass landing-float-slow absolute -left-4 -top-6 flex items-center gap-3 rounded-2xl p-3 pr-5 shadow-xl sm:-left-10">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-accent-foreground"><Link2 className="h-5 w-5" /></span>
              <div><p className="text-sm font-semibold">Share link created</p><p className="text-[11px] uppercase tracking-wider text-muted-foreground">tanyora · /s/xy92p</p></div>
            </div>
            <div className="landing-glass landing-float-slow absolute -bottom-6 -right-2 flex items-center gap-3 rounded-2xl p-3 pr-5 shadow-xl sm:-right-8">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success"><DollarSign className="h-5 w-5" /></span>
              <div><p className="text-sm font-semibold">Payout request</p><p className="text-[11px] uppercase tracking-wider text-muted-foreground">UPI · PayPal · Bank</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-5">
        <h2 className="text-center text-3xl font-extrabold sm:text-5xl">Simple 3-Step Process</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">No friction. Start earning without any technical expertise.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((f) => (
            <div key={f.title} className="landing-card rounded-3xl p-7 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-accent-foreground"><f.icon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="rates" className="relative scroll-mt-20 py-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-3xl font-extrabold sm:text-5xl">Plans & Earnings</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">Choose the monetization model that fits your audience. Switch plans up to 3 times.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              { icon: Users, name: "Signup Referral", sub: "Maximize referral growth", price: "$0.10", unit: "per new signup", focus: "User growth" },
              { icon: Eye, name: "View-Based", sub: "Scale high-traffic links", price: "$3.00", unit: "per 1,000 views", focus: "Views & scaling" },
            ].map((p) => (
              <div key={p.name} className="landing-card rounded-3xl p-6 sm:p-7">
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
          <div id="referral" className="mt-6 scroll-mt-24 landing-card rounded-3xl p-6 sm:p-7">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><Share2 className="h-6 w-6" /></span>
              <div><h3 className="text-2xl font-bold">Referral Program</h3><p className="text-sm text-muted-foreground">Earn from the users you invite</p></div>
            </div>
            <p className="mt-5 text-3xl font-bold">10% <span className="text-base font-normal text-muted-foreground">of their view earnings</span></p>
            <p className="mt-3 text-muted-foreground">Share your permanent referral link. Whenever someone who joined through it earns from views, 10% is credited to your balance automatically, on top of their earnings, not taken from them.</p>
          </div>
        </div>
      </section>

      <section id="app" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <h2 className="text-center text-3xl font-extrabold sm:text-5xl">Why Tanyora</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">Everything you need to monetize your content, in one platform.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {why.map((f) => (
            <div key={f.title} className="landing-card rounded-2xl p-7">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground"><f.icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="landing-glow mt-12 flex flex-col items-center gap-5 rounded-3xl border p-8 sm:p-12 text-center">
          <h3 className="text-3xl font-bold">Start earning today</h3>
          <Button size="lg" asChild className="landing-shadow h-12 rounded-full px-8"><Link to="/auth" search={{ mode: "signup" }}>Create free account <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </section>
      <LegalFooter />
    </div>
  );
}
