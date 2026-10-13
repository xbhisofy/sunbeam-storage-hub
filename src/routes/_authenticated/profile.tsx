import { pageHead } from "@/lib/site";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Share2, Star, Info } from "lucide-react";
import { useInstalledApp } from "@/lib/app-mode";
import { Cloud, Wallet, Users, ShieldCheck, HelpCircle, ChevronRight, LogOut, Trash2, Pencil, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "./route";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/profile")({ head: () => pageHead("Profile", "Your Tanyora account settings.", undefined, true), component: Profile });

type Item = { to?: string; title: string; sub: string; icon: typeof Cloud; action?: () => void };

function MenuList({ items }: { items: readonly Item[] }) {
  return <div className="divide-y overflow-hidden rounded-2xl border bg-card">
    {items.map(item => {
      const inner = <>
        <span className="flex min-w-0 items-center gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><item.icon className="h-5 w-5" /></span>
          <span className="min-w-0 text-left"><span className="block truncate font-medium">{item.title}</span><span className="block truncate text-xs font-normal text-muted-foreground">{item.sub}</span></span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </>;
      const cls = "h-auto min-h-16 w-full justify-between rounded-none px-4 py-3";
      return item.to
        ? <Button key={item.title} variant="ghost" asChild className={cls}><Link to={item.to}>{inner}</Link></Button>
        : <Button key={item.title} variant="ghost" className={cls} onClick={item.action}>{inner}</Button>;
    })}
  </div>;
}

function Profile() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [sheet, setSheet] = useState<"plan" | "about" | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (p?.display_name) setName(p.display_name); }, [p?.display_name]);
  async function save() {
    const v = name.trim().slice(0, 60); if (!v || !p) return;
    setBusy(true);
    try { const { error } = await supabase.from("profiles").update({ display_name: v }).eq("id", p.id); if (error) throw error; toast.success("Saved"); qc.invalidateQueries({ queryKey: ["profile"] }); setEditing(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  }
  const del = useServerFn(deleteMyAccount);
  async function signOut() {
    setBusy(true); await qc.cancelQueries();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) { toast.error(error.message); setBusy(false); return; }
    qc.clear(); navigate({ to: "/auth", replace: true });
  }
  async function removeAccount() {
    if (!confirm("Delete your account and all files permanently?")) return;
    setBusy(true);
    try { await del(); await supabase.auth.signOut({ scope: "local" }); qc.clear(); toast.success("Account deleted"); navigate({ to: "/auth", replace: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete account"); setBusy(false); }
  }
  const app = useInstalledApp();
  const account: Item[] = app
    ? [
      { to: "/content", title: "Storage", sub: "Manage your files", icon: Cloud },
      { to: "/shared", title: "Shared files", sub: "Links you have shared", icon: Share2 },
      { title: "Free Plan", sub: "Upgrade to unlock all features", icon: Star, action: () => setSheet("plan") },
    ]
    : [
      { to: "/content", title: "Storage", sub: "Manage your storage", icon: Cloud },
      { to: "/earnings", title: "Earnings", sub: "Track your balance and payouts", icon: Wallet },
      { to: "/referrals", title: "Referrals", sub: "Invite friends and earn", icon: Users },
      { title: "Free Plan", sub: "Upgrade to unlock all features", icon: Star, action: () => setSheet("plan") },
    ];
  const preferences: Item[] = [
    { to: "/contact", title: "Help & support", sub: "Get help with the app", icon: HelpCircle },
    { to: "/privacy", title: "Privacy policy", sub: "Read our privacy policy", icon: ShieldCheck },
    { to: "/terms", title: "Terms of service", sub: "Read our terms of service", icon: ShieldCheck },
    { title: "About", sub: "Learn more about the app", icon: Info, action: () => setSheet("about") },
  ];
  return <div className="mx-auto max-w-2xl space-y-6">
    <h1 className="hidden text-3xl font-bold md:block">Profile</h1>
    <section className="app-hero-card rounded-2xl p-5 text-primary-foreground"><div className="flex items-center gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-foreground/20 text-2xl font-semibold">{p?.display_name?.[0]?.toUpperCase() ?? "T"}</span><div className="min-w-0 flex-1"><h2 className="truncate text-xl font-semibold">{p?.display_name ?? "Your account"}</h2><p className="mt-1 truncate text-sm text-primary-foreground/90">{p?.email}</p></div><Button size="icon" variant="ghost" aria-label="Edit profile" onClick={() => setEditing(true)} className="shrink-0 text-primary-foreground hover:bg-primary-foreground/20"><Pencil className="h-5 w-5" /></Button></div><div className="mt-5 flex items-center justify-between gap-3 border-t border-primary-foreground/20 pt-4"><p className="flex min-w-0 items-center gap-2 text-sm font-semibold"><Crown className="h-4 w-4 shrink-0" />Free Plan</p><Button size="sm" variant="secondary" asChild className="shrink-0 rounded-full"><Link to="/plans">Upgrade</Link></Button></div></section>
    <section><h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h2><MenuList items={account} /></section>
    <section><h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferences</h2><MenuList items={preferences} /></section>
    <section><h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Danger zone</h2><div className="divide-y overflow-hidden rounded-2xl border border-destructive/20 bg-card"><Button variant="ghost" disabled={busy} className="h-16 w-full justify-start gap-4 rounded-none px-4 text-destructive" onClick={signOut}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}Log out</Button><Button variant="ghost" disabled={busy} className="h-16 w-full justify-start gap-4 rounded-none px-4 text-destructive" onClick={removeAccount}><Trash2 className="h-5 w-5" />Delete account</Button></div></section>

    <Sheet open={editing} onOpenChange={setEditing}><SheetContent side="bottom" className="mx-auto max-w-lg"><SheetTitle>Edit profile</SheetTitle><SheetDescription>Account details</SheetDescription><label htmlFor="display-name" className="mb-2 mt-6 block text-sm font-medium">Display name</label><Input id="display-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} /><Button className="mt-5 w-full" disabled={busy || !name.trim()} onClick={save}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save changes</Button></SheetContent></Sheet>

    <Sheet open={sheet === "plan"} onOpenChange={o => !o && setSheet(null)}><SheetContent side="bottom" className="mx-auto max-w-lg">
      <SheetTitle>Free Plan</SheetTitle><SheetDescription>Your current subscription</SheetDescription>
      <div className="mt-6 rounded-2xl border bg-accent/50 p-5">
        <p className="flex items-center gap-2 font-semibold"><Star className="h-5 w-5 text-primary" />You are on the Free Plan</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Upload videos, photos, audio and documents</li>
          <li>• Share files with a link</li>
          <li>• Up to 50 MB per file</li>
        </ul>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Premium plans with more storage and bigger uploads are coming soon.</p>
    </SheetContent></Sheet>

    <Sheet open={sheet === "about"} onOpenChange={o => !o && setSheet(null)}><SheetContent side="bottom" className="mx-auto max-w-lg">
      <SheetTitle>About Tanyora</SheetTitle><SheetDescription>Learn more about the app</SheetDescription>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">Tanyora lets you upload videos, photos, audio and documents, and share them with anyone through a simple link. Your files are stored securely and you can manage them from the website or the Android app.</p>
      <div className="mt-5 space-y-2 text-sm">
        <p className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">1.0</span></p>
        <p className="flex justify-between"><span className="text-muted-foreground">Website</span><span className="font-medium">tanyora.com</span></p>
        <p className="flex justify-between"><span className="text-muted-foreground">Support</span><span className="font-medium">Help & support page</span></p>
      </div>
    </SheetContent></Sheet>
  </div>;
}
