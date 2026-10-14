import { pageHead } from "@/lib/site";
import { ViewStats } from "@/components/ViewStats";
import { useInstalledApp } from "@/lib/app-mode";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cloud, FileText, Film, Music, Image, ArrowUpRight, Wallet, Users, FolderOpen, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { useProfile } from "./route";
import { money, formatSize, fileMetadata } from "@/lib/format";
export const Route = createFileRoute("/_authenticated/dashboard")({ head: () => pageHead("Home", "Your Tanyora files and storage.", undefined, true), component: Dashboard });
function Dashboard() {
  const { data: p } = useProfile();
  const app = useInstalledApp();
  const { data: files = [], isPending } = useQuery({ queryKey: ["files"], queryFn: async () => {
    const uid = await currentUserId(); if (!uid) return [];
    return (await supabase.from("files").select("*").eq("owner_id", uid).order("created_at", { ascending: false })).data ?? [];
  } });
  const { data: watched = [] } = useQuery({ queryKey: ["recently-watched"], queryFn: async () => {
    const uid = await currentUserId(); if (!uid) return [];
    const { data: events } = await supabase.from("view_events").select("file_slug, day").eq("viewer_id", uid).order("day", { ascending: false }).limit(10);
    const slugs = [...new Set((events ?? []).map(e => e.file_slug))].slice(0, 5);
    if (!slugs.length) return [];
    return (await supabase.from("files").select("*").in("slug", slugs)).data ?? [];
  } });
  const { data: wd = [] } = useQuery({ queryKey: ["withdrawals"], enabled: !app, queryFn: async () => {
    const uid = await currentUserId(); if (!uid) return [];
    return (await supabase.from("withdrawals").select("amount, status").eq("user_id", uid)).data ?? [];
  } });
  const { data: trend = [] } = useQuery({ queryKey: ["view-daily-14"], enabled: !app, staleTime: 60_000, queryFn: async () => {
    const uid = await currentUserId(); if (!uid) return [];
    const since = new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10);
    return (await supabase.from("view_daily").select("day, views").eq("owner_id", uid).gte("day", since)).data ?? [];
  } });
  const used = files.reduce((s, f) => s + Number(f.size ?? 0), 0);
  const categories = [
    { label: "Documents", kind: "pdf", icon: FileText, tone: "category-document" },
    { label: "Images", kind: "image", icon: Image, tone: "category-image" },
    { label: "Videos", kind: "video", icon: Film, tone: "category-video" },
    { label: "Music", kind: "audio", icon: Music, tone: "category-audio" },
  ] as const;
  const recentSection = <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent files</h2><Button variant="link" asChild><Link to="/content">View all</Link></Button></div>{(() => {
    const ownIds = new Set(files.map(f => f.id));
    const recent = [
      ...files.map(f => ({ ...f, kind: "yours" as const })),
      ...watched.filter(w => !ownIds.has(w.id)).map(w => ({ ...w, kind: "watched" as const })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
    return recent.length ? <div className="divide-y">{recent.map(f => <Link key={`${f.kind}-${f.id}`} to={f.kind === "yours" ? "/content" : "/s/$slug"} params={f.kind === "watched" ? { slug: f.slug } : {}} className="flex items-center gap-3 py-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent text-primary">{f.file_type === "video" ? <Film className="h-6 w-6" /> : f.file_type === "image" ? <Image className="h-6 w-6" /> : f.file_type === "audio" ? <Music className="h-6 w-6" /> : <FileText className="h-6 w-6" />}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{f.name}</p><p className="text-xs leading-relaxed text-muted-foreground">{f.kind === "watched" ? "Watched · " : ""}{fileMetadata(f, app)}</p></div><ArrowUpRight className="h-5 w-5 text-muted-foreground" /></Link>)}</div> : <div className="py-8 text-center"><FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-3 font-medium">{isPending ? "Loading your files…" : "No files yet"}</p><Button variant="link" asChild className="mt-2"><Link to="/content" search={{ upload: "document" }}>Upload a file</Link></Button></div>;
  })()}</section>;
  if (app) return <div className="space-y-7">
    <div className="hidden md:block"><h1 className="text-3xl font-bold">Your cloud</h1><p className="mt-1 text-muted-foreground">{p?.display_name ? `Welcome back, ${p.display_name}` : "Welcome to Tanyora"}</p></div>
    <section className="app-storage-card rounded-2xl border p-5 shadow-sm">{(() => {
      const total = 1024 * 1024 * 1024; // Free plan: 1 GB
      const pct = Math.min(100, Math.round((used / total) * 100));
      return <>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="order-first rounded-full border-primary/25 bg-card/70 text-primary"><Link to="/plans"><Sparkles className="h-3.5 w-3.5" />Go Ad Free</Link></Button>
          <div className="ml-auto flex items-center gap-3"><h2 className="font-semibold">Storage</h2><span className="grid h-11 w-11 place-items-center rounded-xl bg-card text-primary shadow-sm"><Cloud className="h-5 w-5" /></span></div>
        </div>
        <div className="app-storage-track mt-5 h-2 overflow-hidden rounded-full"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(pct, 2)}%` }} /></div>
        <div className="mt-3 flex items-center justify-between text-sm"><span className="font-semibold text-primary">{pct}%</span><span className="text-muted-foreground">{isPending ? "Loading…" : `${formatSize(used)} of 1 GB used`}</span></div>
      </>;
    })()}</section>
    <section><h2 className="mb-4 text-lg font-semibold">Categories</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{categories.map(c => <Button key={c.kind} variant="ghost" asChild className={`category-tile ${c.tone} h-auto items-start justify-start rounded-lg p-5`}><Link to="/content" search={{ kind: c.kind }}><span className="flex min-h-32 w-full flex-col items-start"><span className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-card/70"><c.icon className="h-6 w-6" /></span><span className="text-base font-semibold">{c.label}</span><span className="mt-1 text-sm">{files.filter(f => f.file_type === c.kind).length} files</span></span></Link></Button>)}</div></section>
    {recentSection}
  </div>;
  // Website home — earnings overview (TenBox-style)
  const plan = p?.plan ?? "view";
  const onHold = wd.filter(w => w.status === "pending" || w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const balance = Number(p?.balance ?? 0);
  const paid = Number(p?.paid_total ?? 0);
  const views14 = trend.reduce((s, r) => s + r.views, 0);
  const earnings14 = plan === "view" ? (views14 / 1000) * 3 : 0;
  const stats = [
    { icon: Clock, label: "On hold", hint: "Released after review", value: onHold, tone: "bg-amber-100 text-amber-600" },
    { icon: Wallet, label: "Available to withdraw", hint: "Ready for payout", value: balance, tone: "bg-emerald-100 text-emerald-600" },
    { icon: CheckCircle2, label: "Paid", hint: "Total paid out", value: paid, tone: "bg-blue-100 text-blue-600" },
  ] as const;
  return <div className="space-y-7">
    <div><h1 className="text-2xl font-bold md:text-3xl">Hi, {p?.display_name ?? "there"}</h1><p className="mt-1 text-muted-foreground">Here's how your content is performing.</p></div>
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-semibold">{plan === "view" ? "View-Based Plan" : "Signup Referral Plan"}</h2>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{plan === "view" ? "View-based" : "Referral"}</span>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">{stats.map(s => <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${s.tone}`}><s.icon className="h-5 w-5" /></span><p className="text-sm font-medium text-muted-foreground">{s.label}</p></div>
      <p className="mt-3 text-2xl font-bold">{money(s.value)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>
    </div>)}</div>
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Earnings trend</h2><span className="text-muted-foreground">$</span></div>
      <div className="mt-4 border-b pb-6">
        <p className="text-sm text-muted-foreground">View Trend</p>
        <p className="mt-1 text-xl font-bold">{views14.toLocaleString()}</p>
        {views14 === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No activity in this period yet.</p>}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">Earnings</p>
        <p className="mt-1 text-xl font-bold">{money(earnings14)} <span className="text-sm font-normal text-muted-foreground">last 14 days</span></p>
        {earnings14 === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No activity in this period yet.</p>}
      </div>
    </section>
    <ViewStats />
    <section><h2 className="mb-4 text-lg font-semibold">Categories</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{categories.map(c => <Button key={c.kind} variant="ghost" asChild className={`category-tile ${c.tone} h-auto items-start justify-start rounded-lg p-5`}><Link to="/content" search={{ kind: c.kind }}><span className="flex min-h-32 w-full flex-col items-start"><span className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-card/70"><c.icon className="h-6 w-6" /></span><span className="text-base font-semibold">{c.label}</span><span className="mt-1 text-sm">{files.filter(f => f.file_type === c.kind).length} files</span></span></Link></Button>)}</div></section>
    {recentSection}
    <Button variant="ghost" asChild className="h-14 w-full justify-between border-t"><Link to="/referrals"><span className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" />Referrals</span><ArrowUpRight className="h-5 w-5" /></Link></Button>
  </div>;
}
