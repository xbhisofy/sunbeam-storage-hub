import { pageHead } from "@/lib/site";
import { ViewStats } from "@/components/ViewStats";
import { useInstalledApp } from "@/lib/app-mode";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cloud, FileText, Film, Music, Image, ArrowUpRight, Wallet, Users, FolderOpen, Crown } from "lucide-react";
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
  const used = files.reduce((s, f) => s + Number(f.size ?? 0), 0);
  const categories = [
    { label: "Documents", kind: "pdf", icon: FileText, tone: "category-document" },
    { label: "Images", kind: "image", icon: Image, tone: "category-image" },
    { label: "Videos", kind: "video", icon: Film, tone: "category-video" },
    { label: "Music", kind: "audio", icon: Music, tone: "category-audio" },
  ] as const;
  return <div className="space-y-7">
    <div className="hidden md:block"><h1 className="text-3xl font-bold">Your cloud</h1><p className="mt-1 text-muted-foreground">{p?.display_name ? `Welcome back, ${p.display_name}` : "Welcome to Tanyora"}</p></div>
    <section className="app-hero-card rounded-2xl p-5"><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/20"><Cloud className="h-6 w-6" /></span><div className="min-w-0 flex-1"><h2 className="font-semibold">Storage · Free plan</h2><p className="mt-0.5 truncate text-sm opacity-90">{isPending ? "Loading…" : `${formatSize(used)} stored · ${files.length} files`}</p></div></div><div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs opacity-90">50 MB per file</span><Button size="sm" variant="secondary" asChild className="rounded-full"><Link to="/plans"><Crown className="h-4 w-4" />Upgrade</Link></Button></div></section>
    {!app && <ViewStats />}
    <section><h2 className="mb-4 text-lg font-semibold">Categories</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{categories.map(c => <Button key={c.kind} variant="ghost" asChild className={`category-tile ${c.tone} h-auto items-start justify-start rounded-lg p-5`}><Link to="/content" search={{ kind: c.kind }}><span className="flex min-h-32 w-full flex-col items-start"><span className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-card/70"><c.icon className="h-6 w-6" /></span><span className="text-base font-semibold">{c.label}</span><span className="mt-1 text-sm">{files.filter(f => f.file_type === c.kind).length} files</span></span></Link></Button>)}</div></section>
    {!app && <section className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-5"><div className="min-w-0"><p className="text-sm text-muted-foreground">Available balance</p><p className="mt-1 text-2xl font-bold">{money(Number(p?.balance ?? 0))}</p></div><Button variant="outline" asChild><Link to="/earnings"><Wallet className="h-4 w-4" />Earnings</Link></Button></section>}
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent files</h2><Button variant="link" asChild><Link to="/content">View all</Link></Button></div>{files.length ? <div className="divide-y">{files.slice(0, 4).map(f => <Link key={f.id} to="/content" className="flex items-center gap-3 py-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent text-primary"><FileText className="h-6 w-6" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{f.name}</p><p className="text-xs leading-relaxed text-muted-foreground">{fileMetadata(f, app)}</p></div><ArrowUpRight className="h-5 w-5 text-muted-foreground" /></Link>)}</div> : <div className="py-8 text-center"><FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" /><p className="mt-3 font-medium">{isPending ? "Loading your files…" : "No files yet"}</p><Button variant="link" asChild className="mt-2"><Link to="/content" search={{ upload: "document" }}>Upload a file</Link></Button></div>}</section>
    {!app && <Button variant="ghost" asChild className="h-14 w-full justify-between border-t"><Link to="/referrals"><span className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" />Referrals</span><ArrowUpRight className="h-5 w-5" /></Link></Button>}
  </div>;
}
