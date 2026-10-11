import { createFileRoute, redirect, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { currentUserId } from "@/lib/session";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, FolderOpen, Wallet, Users, User, LogOut, Shield, Loader2, Menu, Plus, Cloud, Upload, Link2, Crown } from "lucide-react";
import { useIsAdmin } from "./admin";
import { Brand } from "@/components/Brand";
import { LegalFooter } from "@/components/LegalFooter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => { if (!(await currentUserId())) throw redirect({ to: "/auth" }); },
  component: Shell,
});
const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/content", label: "My Files", icon: FolderOpen },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/plans", label: "Premium", icon: Crown },
] as const;
export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: async () => {
    const uid = await currentUserId();
    if (!uid) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    return data;
  } });
}
function Shell() {
  const { data: p } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const [leaving, setLeaving] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [upload, setUpload] = useState(false);
  async function signOut() {
    setLeaving(true);
    await qc.cancelQueries(); qc.clear();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) { setLeaving(false); return; }
    navigate({ to: "/auth", replace: true });
  }
  const title = nav.find(n => n.to === pathname)?.label ?? "Admin";
  const menu = <nav className="space-y-0.5 p-3" aria-label="Account navigation">
    {nav.map(n => <Button key={n.to} variant="ghost" asChild className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium"><Link to={n.to} onClick={() => setDrawer(false)} activeProps={{ className: "bg-accent text-accent-foreground" }}><n.icon className="h-5 w-5" />{n.label}</Link></Button>)}
    <Button variant="ghost" asChild className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium"><Link to="/content" search={{ tab: "convert" }} onClick={() => setDrawer(false)}><Link2 className="h-5 w-5" />Convert Link</Link></Button>
    {isAdmin && <Button variant="ghost" asChild className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium"><Link to="/admin" onClick={() => setDrawer(false)}><Shield className="h-5 w-5" />Admin</Link></Button>}
    <div className="mt-2 border-t pt-2"><Button variant="ghost" className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium text-destructive" onClick={signOut} disabled={leaving}>{leaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}Log out</Button></div>
  </nav>;
  return <div className="app-shell flex min-h-dvh bg-background">
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card md:flex"><div className="p-6"><Brand /></div>{menu}<div className="mt-auto border-t p-5"><p className="truncate font-medium">{p?.display_name}</p><p className="truncate text-sm text-muted-foreground">{p?.email}</p></div></aside>
    <div className="min-w-0 flex-1">
      <header className="app-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden"><Button size="icon" variant="ghost" className="h-12 w-12" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu className="h-6 w-6" /></Button><span className="text-lg font-bold">{pathname === "/dashboard" ? "Tanyora" : title}</span><Button size="icon" variant="ghost" className="h-12 w-12 text-primary" aria-label="Upload menu" onClick={() => setUpload(true)}><Cloud className="h-6 w-6" /></Button></header>
      <main className="app-main mx-auto max-w-6xl px-5 py-6 md:px-10 md:py-10"><Outlet /></main>
      <div className="hidden md:block"><LegalFooter /></div>
      <nav aria-label="Bottom navigation" className="app-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t bg-card px-3 pt-2 md:hidden">
        {nav.filter(n => n.to !== "/referrals" && n.to !== "/plans").map((n, i) => <div key={n.to} className={i === 2 ? "col-start-4" : undefined}><Button variant="ghost" asChild className="h-14 w-full flex-col gap-1 px-0 text-muted-foreground"><Link to={n.to} activeProps={{ className: "text-primary" }}><n.icon className="h-6 w-6" /><span className="text-[11px]">{n.label}</span></Link></Button></div>)}
        <Button className="absolute left-1/2 top-2 h-14 w-14 -translate-x-1/2 rounded-full" size="icon" aria-label="Add files" onClick={() => setUpload(true)}><Plus className="h-7 w-7" /></Button>
      </nav>
    </div>
    <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" onOpenAutoFocus={(e) => e.preventDefault()} className="w-[80vw] max-w-[300px] overflow-y-auto p-0"><div className="border-b px-4 pb-4 pt-5"><div className="mb-4 pr-8"><Brand /></div><div className="flex min-w-0 items-center gap-3 rounded-xl bg-accent/60 p-2.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground">{p?.display_name?.[0]?.toUpperCase() ?? "T"}</span><div className="min-w-0"><SheetTitle className="truncate text-sm">{p?.display_name ?? "Tanyora"}</SheetTitle><SheetDescription className="truncate text-xs">{p?.email}</SheetDescription></div></div></div>{menu}</SheetContent></Sheet>
    <Sheet open={upload} onOpenChange={setUpload}><SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-xl"><SheetTitle>Add to your files</SheetTitle><SheetDescription>50 MB per file</SheetDescription><div className="mt-5 space-y-2">{[{ label: "Upload videos", kind: "video", icon: Upload }, { label: "Upload audio", kind: "audio", icon: Upload }, { label: "Upload documents", kind: "document", icon: FolderOpen }].map(item => <Button key={item.kind} variant="ghost" className="h-14 w-full justify-start gap-4" onClick={() => { setUpload(false); navigate({ to: "/content", search: { upload: item.kind as "video" | "audio" | "document" } }); }}><item.icon className="h-5 w-5 text-primary" />{item.label}</Button>)}<Button variant="ghost" asChild className="h-14 w-full justify-start gap-4"><Link to="/content" search={{ tab: "convert" }} onClick={() => setUpload(false)}><Link2 className="h-5 w-5 text-primary" />Convert link</Link></Button></div></SheetContent></Sheet>
  </div>;
}
