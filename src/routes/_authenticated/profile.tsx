import { pageHead } from "@/lib/site";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Cloud, Wallet, Users, ShieldCheck, HelpCircle, ChevronRight, LogOut, Trash2, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "./route";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
export const Route = createFileRoute("/_authenticated/profile")({ head: () => pageHead("Profile", "Your Tanyora account settings.", undefined, true), component: Profile });
function Profile() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
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
  const account = [{ to: "/content", title: "Storage", icon: Cloud }, { to: "/earnings", title: "Earnings", icon: Wallet }, { to: "/referrals", title: "Referrals", icon: Users }] as const;
  const preferences = [{ to: "/contact", title: "Help & support", icon: HelpCircle }, { to: "/privacy", title: "Privacy policy", icon: ShieldCheck }, { to: "/terms", title: "Terms of service", icon: ShieldCheck }] as const;
  return <div className="mx-auto max-w-2xl space-y-6">
    <h1 className="hidden text-3xl font-bold md:block">Profile</h1>
    <section className="app-hero-card rounded-2xl p-5 text-primary-foreground"><div className="flex items-center gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-foreground/20 text-2xl font-semibold">{p?.display_name?.[0]?.toUpperCase() ?? "T"}</span><div className="min-w-0 flex-1"><h2 className="truncate text-xl font-semibold">{p?.display_name ?? "Your account"}</h2><p className="mt-1 truncate text-sm text-primary-foreground/90">{p?.email}</p></div><Button size="icon" variant="ghost" aria-label="Edit profile" onClick={() => setEditing(true)} className="shrink-0 text-primary-foreground hover:bg-primary-foreground/20"><Pencil className="h-5 w-5" /></Button></div><p className="mt-5 border-t border-primary-foreground/20 pt-4 text-sm font-medium">{p?.plan === "referral" ? "Signup Referral Plan" : "View-Based Plan"}</p></section>
    <section><h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h2><div className="divide-y overflow-hidden rounded-2xl border bg-card">{account.map(item => <Button key={item.to} variant="ghost" asChild className="h-16 w-full justify-between rounded-none px-4"><Link to={item.to}><span className="flex items-center gap-4"><span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary"><item.icon className="h-5 w-5" /></span>{item.title}</span><ChevronRight className="h-5 w-5 text-muted-foreground" /></Link></Button>)}</div></section>
    <section><h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferences</h2><div className="divide-y overflow-hidden rounded-2xl border bg-card">{preferences.map(item => <Button key={item.to} variant="ghost" asChild className="h-16 w-full justify-between rounded-none px-4"><Link to={item.to}><span className="flex items-center gap-4"><item.icon className="h-5 w-5 text-primary" />{item.title}</span><ChevronRight className="h-5 w-5 text-muted-foreground" /></Link></Button>)}</div></section>
    <section><h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account actions</h2><div className="divide-y overflow-hidden rounded-2xl border border-destructive/20 bg-card"><Button variant="ghost" disabled={busy} className="h-16 w-full justify-start gap-4 rounded-none px-4 text-destructive" onClick={signOut}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}Log out</Button><Button variant="ghost" disabled={busy} className="h-16 w-full justify-start gap-4 rounded-none px-4 text-destructive" onClick={removeAccount}><Trash2 className="h-5 w-5" />Delete account</Button></div></section>
    <Sheet open={editing} onOpenChange={setEditing}><SheetContent side="bottom" className="mx-auto max-w-lg"><SheetTitle>Edit profile</SheetTitle><SheetDescription>Account details</SheetDescription><label htmlFor="display-name" className="mb-2 mt-6 block text-sm font-medium">Display name</label><Input id="display-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} /><Button className="mt-5 w-full" disabled={busy || !name.trim()} onClick={save}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save changes</Button></SheetContent></Sheet>
  </div>;
}
