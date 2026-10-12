import { createFileRoute, redirect, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useInstalledApp, WEB_ONLY_PATHS } from "@/lib/app-mode";
import { currentUserId } from "@/lib/session";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, FolderOpen, Wallet, Users, User, LogOut, Shield, Loader2, Menu, Plus, Cloud, Upload, Link2, Crown, Video, Music, FileText, Image as ImageIcon, Share2 } from "lucide-react";
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
  const menu = <nav className="space-y-0.5 p-3" aria-label="Account navigation">
    {items.map(n => <Button key={n.to} variant="ghost" asChild className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium"><Link to={n.to} onClick={() => setDrawer(false)} className="data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"><n.icon className="h-5 w-5" />{n.label}</Link></Button>)}
    <Button variant="ghost" asChild className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium"><Link to="/content" search={{ tab: "convert" }} onClick={() => setDrawer(false)}><Link2 className="h-5 w-5" />Convert Link</Link></Button>
    {isAdmin && <Button variant="ghost" asChild className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium"><Link to="/admin" onClick={() => setDrawer(false)}><Shield className="h-5 w-5" />Admin</Link></Button>}
    <div className="mt-2 border-t pt-2"><Button variant="ghost" className="h-11 w-full justify-start gap-3 rounded-xl px-3 text-[15px] font-medium text-destructive" onClick={signOut} disabled={leaving}>{leaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}Log out</Button></div>
  </nav>;
  return <div className="app-shell flex min-h-dvh bg-background">
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card md:flex"><div className="p-6"><Brand /></div>{menu}<div className="mt-auto border-t p-5"><p className="truncate font-medium">{p?.display_name}</p><p className="truncate text-sm text-muted-foreground">{p?.email}</p></div></aside>
    <div className="min-w-0 flex-1">
      <header className="app-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden"><Button size="icon" variant="ghost" className="h-12 w-12" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu className="h-6 w-6" /></Button><span className="text-lg font-bold">{pathname === "/dashboard" ? "Tanyora" : title}</span><Button size="icon" variant="ghost" className="h-12 w-12 text-primary" aria-label="Upload menu" onClick={() => setUpload(true)}><Cloud className="h-6 w-6" /></Button></header>
      <main className="app-main mx-auto max-w-6xl px-5 pb-32 pt-6 md:px-10 md:py-10"><Outlet /></main>
      <div className="hidden md:block"><LegalFooter /></div>
      <nav aria-label="Bottom navigation" className="app-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t bg-card px-3 pt-2 md:hidden">
        {items.filter(n => n.to !== "/referrals" && n.to !== "/plans").map((n, i) => <Link key={n.to} to={n.to} style={{ gridColumnStart: i < 2 ? i + 1 : i + 2, gridRowStart: 1 }} className="flex h-14 w-full select-none flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors duration-150 [-webkit-tap-highlight-color:transparent] data-[status=active]:text-primary"><n.icon className="h-6 w-6 shrink-0" /><span className="text-[11px] font-medium leading-none">{n.label}</span></Link>)}
        <Button className="absolute left-1/2 top-2 h-14 w-14 -translate-x-1/2 rounded-full" size="icon" aria-label="Add files" onClick={() => setUpload(true)}><Plus className="h-7 w-7" /></Button>
      </nav>
    </div>
    <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" onOpenAutoFocus={(e) => e.preventDefault()} className="w-[80vw] max-w-[300px] overflow-y-auto p-0"><div className="border-b px-4 pb-4 pt-5"><div className="mb-4 pr-8"><Brand /></div><div className="flex min-w-0 items-center gap-3 rounded-xl bg-accent/60 p-2.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground">{p?.display_name?.[0]?.toUpperCase() ?? "T"}</span><div className="min-w-0"><SheetTitle className="truncate text-sm">{p?.display_name ?? "Tanyora"}</SheetTitle><SheetDescription className="truncate text-xs">{p?.email}</SheetDescription></div></div></div>{menu}</SheetContent></Sheet>
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
      <Link to="/content" search={{ tab: "convert" }} onClick={() => setUpload(false)} className="mt-3 flex items-center gap-3 rounded-2xl bg-accent/50 p-4 active:bg-accent">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Link2 className="h-5 w-5" /></span>
        <span className="min-w-0"><span className="block text-[15px] font-semibold">Convert a link</span><span className="block text-xs text-muted-foreground">Turn any URL into a share link</span></span>
      </Link>
    </SheetContent></Sheet>
  </div>;
}
