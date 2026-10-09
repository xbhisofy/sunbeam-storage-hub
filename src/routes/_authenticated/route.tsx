import { createFileRoute, redirect, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, FolderOpen, Wallet, Users, User, LogOut } from "lucide-react";
import { Brand } from "@/components/Brand";
import { LegalFooter } from "@/components/LegalFooter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Shell,
});

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/content", label: "My Content", icon: FolderOpen },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/referrals", label: "Referrals", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user!.id).single();
      return data;
    },
  });
}

function Shell() {
  const { data: p } = useProfile();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="flex shrink-0 flex-col border-b bg-card md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-6 py-5 font-semibold text-lg">
          <Brand />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {nav.map((n) => (<div key={n.to} className="contents">
            <Link to={n.to}
              className="flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm text-foreground hover:bg-muted"
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}>
              <n.icon className="h-5 w-5" /> {n.label}
            </Link>
            {n.to === "/content" && (
              <div className="ml-6 hidden flex-col border-l pl-3 md:flex">
                <Link to="/content" search={{ tab: "all" }} className="py-1.5 text-sm text-muted-foreground" activeOptions={{ includeSearch: true }} activeProps={{ className: "text-primary font-medium" }}>All Content</Link>
                <Link to="/content" search={{ tab: "convert" }} className="py-1.5 text-sm text-muted-foreground" activeOptions={{ includeSearch: true }} activeProps={{ className: "text-primary font-medium" }}>Convert Link</Link>
              </div>
            )}
          </div>))}
        </nav>
        <div className="mt-auto hidden items-center gap-3 border-t px-5 py-4 md:flex">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent font-medium text-accent-foreground">
            {(p?.display_name ?? "?")[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{p?.display_name}</div>
            <div className="truncate text-xs text-muted-foreground">{p?.email}</div>
          </div>
          <button aria-label="Log out" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-5 py-8 md:px-12"><Outlet /></main>
        <LegalFooter />
      </div>
    </div>
  );
}
