import { createFileRoute, redirect, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useInstalledApp, WEB_ONLY_PATHS } from "@/lib/app-mode";
import { currentUserId } from "@/lib/session";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, FolderOpen, Wallet, Users, User, LogOut, Shield, Loader2, Menu, Plus, Cloud, Upload, Crown, Video, Music, FileText, Image as ImageIcon, Share2 } from "lucide-react";
import { useIsAdmin } from "./admin";
import { Brand } from "@/components/Brand";
import { LegalFooter } from "@/components/LegalFooter";
import logo from "@/assets/tanyora-logo.jpg";
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
// Inside the installed app, earnings features are replaced by Shared files.
const appNav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/content", label: "My Files", icon: FolderOpen },
  { to: "/shared", label: "Shared", icon: Share2 },
  { to: "/profile", label: "Profile", icon: User },
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
  const app = useInstalledApp();
  const items = app ? appNav : nav;
  useEffect(() => { if (app && WEB_ONLY_PATHS.includes(pathname)) navigate({ to: "/dashboard", replace: true }); }, [app, pathname, navigate]);
  async function signOut() {
    setLeaving(true);
    await qc.cancelQueries(); qc.clear();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) { setLeaving(false); return; }
    navigate({ to: "/auth", replace: true });
  }
  const title = [...nav, ...appNav].find(n => n.to === pathname)?.label ?? "Admin";
  const row = "group relative flex h-12 w-full items-center gap-3 rounded-xl px-2 text-[15px] font-medium text-foreground/85 outline-none transition-colors active:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:hover:bg-accent/50";
  const active = "data-[status=active]:bg-primary/10 data-[status=active]:font-semibold data-[status=active]:text-primary";
  const tile = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-data-[status=active]:bg-primary group-data-[status=active]:text-primary-foreground";
  const menu = <nav className="flex flex-1 flex-col p-3" aria-label="Account navigation">
    <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
    <div className="space-y-1">
      {items.map(n => <Link key={n.to} to={n.to} activeOptions={{ includeSearch: false }} onClick={() => setDrawer(false)} className={`${row} ${active}`}><span className={tile}><n.icon className="h-[18px] w-[18px]" strokeWidth={2.2} /></span>{n.label}</Link>)}
    </div>
    {(!app || isAdmin) && <>
      <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tools</p>
      <div className="space-y-1">
        {isAdmin && <Link to="/admin" onClick={() => setDrawer(false)} className={`${row} ${active}`}><span className={tile}><Shield className="h-[18px] w-[18px]" strokeWidth={2.2} /></span>Admin</Link>}
      </div>
    </>}
    <div className="mt-auto border-t pt-3"><button type="button" className={`${row} text-destructive`} onClick={signOut} disabled={leaving}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">{leaving ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <LogOut className="h-[18px] w-[18px]" strokeWidth={2.2} />}</span>Log out</button></div>
  </nav>;
  return <div className="app-shell flex min-h-dvh bg-background">
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card md:flex"><div className="p-6"><Brand /></div>{menu}<div className="mt-auto border-t p-5"><p className="truncate font-medium">{p?.display_name}</p><p className="truncate text-sm text-muted-foreground">{p?.email}</p></div></aside>
    <div className="min-w-0 flex-1">
      <header className="app-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden"><Button size="icon" variant="ghost" className="h-12 w-12" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu className="h-6 w-6" /></Button><span className="text-lg font-bold">{pathname === "/dashboard" ? "Tanyora" : title}</span><Button size="icon" variant="ghost" className="h-12 w-12 text-primary" aria-label="Upload menu" onClick={() => setUpload(true)}><Cloud className="h-6 w-6" /></Button></header>
      <main className="app-main mx-auto max-w-6xl px-5 pb-32 pt-6 md:px-10 md:py-10"><Outlet /></main>
      <div className="hidden md:block"><LegalFooter /></div>
      <nav aria-label="Bottom navigation" className="app-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t bg-card px-3 pt-2 md:hidden">
        {items.filter(n => n.to !== "/referrals" && n.to !== "/plans").map((n, i) => <Link key={n.to} to={n.to} style={{ gridColumnStart: i < 2 ? i + 1 : i + 2, gridRowStart: 1 }} className="flex h-14 w-full select-none flex-col items-center justify-center gap-1 rounded-xl text-foreground transition-colors duration-150 [-webkit-tap-highlight-color:transparent] data-[status=active]:text-primary"><n.icon className="h-6 w-6 shrink-0" strokeWidth={2.4} /><span className="text-[11px] font-semibold leading-none">{n.label}</span></Link>)}
        <button type="button" aria-label="Add files" onClick={() => setUpload(true)} className="app-fab absolute -top-3 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full text-primary-foreground outline-none transition-transform duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Plus className="h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]" strokeWidth={3} /></button>
      </nav>
    </div>
    <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" onOpenAutoFocus={(e) => e.preventDefault()} className="flex w-[80vw] max-w-[300px] flex-col overflow-y-auto p-0"><div className="flex items-center gap-2.5 border-b bg-accent/40 px-3.5 py-3 pr-11"><img src={logo} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg object-cover" decoding="async" /><div className="min-w-0"><SheetTitle className="truncate text-[15px] font-semibold leading-tight">{p?.display_name ?? "Tanyora"}</SheetTitle><SheetDescription className="truncate text-[11px] leading-tight text-muted-foreground">{p?.email}</SheetDescription></div></div>{menu}</SheetContent></Sheet>
    <Sheet open={upload} onOpenChange={setUpload}><SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 px-5 pb-8 pt-3">
      <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
      <SheetTitle className="text-lg font-bold">Add to your files</SheetTitle>
      <SheetDescription className="text-sm">Choose what you want to upload · up to 50 MB per file</SheetDescription>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {([{ label: "Videos", hint: "MP4, MOV, MKV", kind: "video", icon: Video }, { label: "Images", hint: "JPG, PNG, WEBP", kind: "image", icon: ImageIcon }, { label: "Audio", hint: "MP3, WAV, M4A", kind: "audio", icon: Music }, { label: "Documents", hint: "PDF, DOC, ZIP", kind: "document", icon: FileText }] as const).map(item =>
          <button key={item.kind} type="button" onClick={() => { setUpload(false); navigate({ to: "/content", search: { upload: item.kind } }); }} className="flex flex-col items-start gap-3 rounded-2xl bg-accent/50 p-4 text-left transition-colors active:bg-accent">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><item.icon className="h-5 w-5" /></span>
            <span><span className="block text-[15px] font-semibold">{item.label}</span><span className="block text-xs text-muted-foreground">{item.hint}</span></span>
          </button>)}
      </div>
    </SheetContent></Sheet>
  </div>;
}
