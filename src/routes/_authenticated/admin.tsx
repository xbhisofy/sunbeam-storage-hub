import { createFileRoute, Link } from "@tanstack/react-router";
import { currentUserId } from "@/lib/session";
import { useEffect, useState, type ComponentType } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Users, FileText, Eye, Wallet, Clock, CheckCircle2, ShieldAlert, Search, Trash2,
  RefreshCw, LayoutDashboard, CreditCard, FolderOpen, Ban, ExternalLink, Copy, ArrowUpRight, Inbox, Flag,
} from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { adminSetPassword } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { money, formatSize } from "@/lib/format";
import { ReportsTab, useOpenReports } from "@/components/AdminReports";
import { MessagesTab, useNewMessages } from "@/components/AdminMessages";
import { AdminSafety } from "@/components/AdminSafety";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => pageHead("Admin", "Tanyora admin panel.", undefined, true),
  component: Admin,
});

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const uid = await currentUserId();
      if (!uid) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      return !!data;
    },
    staleTime: 5 * 60_000,
  });
}

type Tab = "overview" | "withdrawals" | "users" | "files" | "reports" | "messages" | "safety";
type Stats = { users: number; users_today: number; files: number; files_today: number; views: number; balance_total: number; paid_total: number; pending_count: number; pending_amount: number };

const PAGE = 25;
const nf = new Intl.NumberFormat("en-US");
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function useStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_stats");
      if (error) throw error;
      return data as unknown as Stats;
    },
    refetchInterval: 30_000,
  });
}

function Admin() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("overview");
  const qc = useQueryClient();
  const { data: s } = useStats();
  const { data: openReports } = useOpenReports(!!isAdmin);
  const { data: newMessages } = useNewMessages(!!isAdmin);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 w-full rounded-2xl" /></div>;
  if (!isAdmin) return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-10 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
      <p className="mt-3 text-lg font-semibold">Restricted area</p>
      <p className="mt-1 text-sm text-muted-foreground">This section is available to administrators only.</p>
      <Button asChild className="mt-5 rounded-xl"><Link to="/dashboard">Back to dashboard</Link></Button>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: ComponentType<{ className?: string }>; badge?: number | undefined }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "withdrawals", label: "Payouts", icon: CreditCard, badge: s?.pending_count },
    { id: "users", label: "Users", icon: Users },
    { id: "files", label: "Content", icon: FolderOpen },
    { id: "safety", label: "Safety", icon: ShieldAlert },
    { id: "reports", label: "Reports", icon: Flag, badge: openReports },
    { id: "messages", label: "Messages", icon: Inbox, badge: newMessages },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Control center</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Admin panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor growth, process payouts and moderate users and content.</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => { qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("admin-") }); toast.success("Data refreshed"); }}>
          <RefreshCw className="h-4 w-4" /><span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-1 sm:grid-cols-6 rounded-2xl border bg-card p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors sm:flex-row sm:gap-2 sm:text-sm ${tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
            <t.icon className="h-4 w-4" />
            <span className="truncate">{t.label}</span>
            {!!t.badge && <span className={`absolute right-1.5 top-1.5 min-w-5 rounded-full px-1.5 text-[10px] font-bold leading-5 sm:static ${tab === t.id ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"}`}>{t.badge}</span>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "overview" && <Overview s={s} goto={setTab} />}
        {tab === "withdrawals" && <Withdrawals />}
        {tab === "users" && <UsersTab />}
        {tab === "files" && <FilesTab />}
        {tab === "safety" && <AdminSafety />}
        {tab === "reports" && <ReportsTab />}
        {tab === "messages" && <MessagesTab />}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, loading }: { icon: ComponentType<{ className?: string }>; label: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground"><Icon className="h-4 w-4" /></span>
      </div>
      {loading ? <Skeleton className="mt-3 h-7 w-20" /> : <div className="mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl">{value}</div>}
      {sub && <div className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Overview({ s, goto }: { s: Stats | undefined; goto: (t: Tab) => void }) {
  const loading = !s;
  const liability = (s?.balance_total ?? 0) + (s?.pending_amount ?? 0);
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Growth</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Kpi loading={loading} icon={Users} label="Total users" value={nf.format(s?.users ?? 0)} sub={`+${nf.format(s?.users_today ?? 0)} today`} />
          <Kpi loading={loading} icon={FileText} label="Total content" value={nf.format(s?.files ?? 0)} sub={`+${nf.format(s?.files_today ?? 0)} today`} />
          <Kpi loading={loading} icon={Eye} label="Total views" value={nf.format(s?.views ?? 0)} sub="Unique daily viewers" />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Finance</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Kpi loading={loading} icon={Clock} label="Pending payouts" value={money(s?.pending_amount ?? 0)} sub={`${s?.pending_count ?? 0} requests`} />
          <Kpi loading={loading} icon={Wallet} label="User balances" value={money(s?.balance_total ?? 0)} sub="Not yet requested" />
          <Kpi loading={loading} icon={CheckCircle2} label="Total paid out" value={money(s?.paid_total ?? 0)} sub="All time" />
        </div>
      </section>
      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total outstanding liability</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{money(liability)}</p>
          <p className="mt-1 text-xs text-muted-foreground">User balances plus pending payout requests.</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm font-semibold">Quick actions</p>
          <div className="mt-3 grid gap-2">
            <QuickAction label="Review payout requests" hint={`${s?.pending_count ?? 0} waiting`} onClick={() => goto("withdrawals")} />
            <QuickAction label="Manage users" hint="Block, adjust balance" onClick={() => goto("users")} />
            <QuickAction label="Moderate content" hint="Latest uploads" onClick={() => goto("files")} />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickAction({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors hover:bg-muted">
      <span><span className="block text-sm font-medium">{label}</span><span className="text-xs text-muted-foreground">{hint}</span></span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function useProfilesMap(ids: string[]) {
  const key = [...ids].sort().join(",");
  return useQuery({
    queryKey: ["admin-profiles-map", key],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, email, display_name").in("id", ids);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
    },
  });
}

function Chips<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors ${value === o ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>{o}</button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="h-11 rounded-xl pl-10" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
      <Inbox className="h-8 w-8" /><p className="text-sm">{text}</p>
    </div>
  );
}

function ListSkeleton() {
  return <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>;
}

type WStatus = "pending" | "approved" | "paid" | "rejected" | "all";

function Withdrawals() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<WStatus>("pending");
  const [page, setPage] = useState(0);
  const [reject, setReject] = useState<{ id: string; note: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-withdrawals", status, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      if (status !== "all") q = q.eq("status", status);
      return (await q).data ?? [];
    },
  });
  const rows = data ?? [];
  const { data: who } = useProfilesMap([...new Set(rows.map((w) => w.user_id))]);

  async function act(id: string, s: "approved" | "paid" | "rejected", note = "") {
    setBusy(id);
    const { error } = await supabase.rpc("admin_set_withdrawal", { _id: id, _status: s, _note: note });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(s === "paid" ? "Marked as paid" : s === "approved" ? "Request approved" : "Request rejected and refunded");
    qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return (
    <div className="space-y-4">
      <Chips value={status} options={["pending", "approved", "paid", "rejected", "all"] as WStatus[]} onChange={(v) => { setStatus(v); setPage(0); }} />
      <div className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? <ListSkeleton /> : rows.length === 0 ? <Empty text="No payout requests in this category." /> : (
          <ul className="divide-y">
            {rows.map((w) => {
              const p = who?.[w.user_id];
              return (
                <li key={w.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-bold">{money(Number(w.amount))}</span>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold uppercase">{w.method}</span>
                        <StatusBadge status={w.status} />
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{p?.display_name || p?.email || w.user_id}</p>
                      <p className="truncate text-xs text-muted-foreground">{p?.email} · {fmtDateTime(w.created_at)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2">
                    <code className="min-w-0 flex-1 break-all text-xs">{w.account_details}</code>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label="Copy account details"
                      onClick={() => { navigator.clipboard.writeText(w.account_details); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                  {w.admin_note && <p className="mt-2 text-xs text-muted-foreground">Note: {w.admin_note}</p>}
                  {(w.status === "pending" || w.status === "approved") && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:flex sm:justify-end">
                      {w.status === "pending" ? <Button size="sm" variant="outline" className="rounded-lg" disabled={busy === w.id} onClick={() => act(w.id, "approved")}>Approve</Button> : <span />}
                      <Button size="sm" className="rounded-lg" disabled={busy === w.id} onClick={() => act(w.id, "paid")}>Mark paid</Button>
                      <Button size="sm" variant="destructive" className="rounded-lg" disabled={busy === w.id} onClick={() => setReject({ id: w.id, note: "" })}>Reject</Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Pager page={page} setPage={setPage} more={rows.length === PAGE} />
      <p className="text-xs text-muted-foreground">Send the payment using the method shown on the request first, then select "Mark paid". Rejected requests are refunded to the user's balance.</p>

      <Dialog open={!!reject} onOpenChange={(o) => !o && setReject(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject payout request</DialogTitle>
            <DialogDescription>The amount will be refunded to the user's balance. The reason is shown to the user.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for rejection" value={reject?.note ?? ""} onChange={(e) => setReject((r) => r && { ...r, note: e.target.value })} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!reject?.note.trim()} onClick={() => { if (reject) { act(reject.id, "rejected", reject.note.trim()); setReject(null); } }}>Reject request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type UFilter = "all" | "active" | "blocked";

function UsersTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [filter, setFilter] = useState<UFilter>("all");
  const [page, setPage] = useState(0);
  const [adjust, setAdjust] = useState<{ id: string; name: string; amount: string } | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string; blocked: boolean } | null>(null);
  const [pwTarget, setPwTarget] = useState<{ id: string; name: string; password: string } | null>(null);
  const setPassword = useServerFn(adminSetPassword);
  async function savePassword() {
    if (!pwTarget || pwTarget.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    try { await setPassword({ data: { userId: pwTarget.id, password: pwTarget.password } }); toast.success("Password updated"); setPwTarget(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not update password"); }
  }
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", dq, filter, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let r = supabase.from("profiles").select("id, display_name, email, referral_code, plan, balance, paid_total, blocked, created_at")
        .order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      const t = dq.trim().replace(/[%,()]/g, "");
      if (t) r = r.or(`email.ilike.%${t}%,display_name.ilike.%${t}%,referral_code.eq.${t}`);
      if (filter !== "all") r = r.eq("blocked", filter === "blocked");
      return (await r).data ?? [];
    },
  });
  const rows = data ?? [];

  async function update(id: string, blocked: boolean | null, delta: number | null, msg: string) {
    const { error } = await supabase.rpc("admin_update_user", { _id: id, _blocked: blocked as boolean, _balance_delta: delta as number });
    if (error) { toast.error(error.message); return; }
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }
  const amt = Number(adjust?.amount);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search name, email or referral code" />
        <Chips value={filter} options={["all", "active", "blocked"] as UFilter[]} onChange={(v) => { setFilter(v); setPage(0); }} />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? <ListSkeleton /> : rows.length === 0 ? <Empty text="No users match your search." /> : (
          <ul className="divide-y">
            {rows.map((u) => {
              const name = u.display_name || u.email || "User";
              return (
                <li key={u.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold uppercase text-accent-foreground">{name.slice(0, 1)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold">{name}</span>
                        {u.blocked && <span className="shrink-0 rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">Blocked</span>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{u.email} · Joined {fmtDate(u.created_at)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center md:w-80">
                    
                    <Stat label="Balance" value={money(Number(u.balance))} />
                    <Stat label="Paid" value={money(Number(u.paid_total))} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:w-72">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAdjust({ id: u.id, name, amount: "" })}>Adjust</Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setPwTarget({ id: u.id, name, password: "" })}>Password</Button>
                    <Button size="sm" variant={u.blocked ? "outline" : "destructive"} className="rounded-lg" onClick={() => setBlockTarget({ id: u.id, name, blocked: u.blocked })}>
                      {!u.blocked && <Ban className="h-3.5 w-3.5" />}{u.blocked ? "Unblock" : "Block"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Pager page={page} setPage={setPage} more={rows.length === PAGE} />

      <Dialog open={!!adjust} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust balance</DialogTitle>
            <DialogDescription>{adjust?.name} — enter a positive amount to credit or a negative amount to deduct.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input type="number" step="0.01" inputMode="decimal" className="h-11 rounded-xl pl-8" placeholder="e.g. 2.50 or -1.00"
              value={adjust?.amount ?? ""} onChange={(e) => setAdjust((a) => a && { ...a, amount: e.target.value })} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAdjust(null)}>Cancel</Button>
            <Button disabled={!adjust?.amount || Number.isNaN(amt) || amt === 0}
              onClick={() => { if (adjust) { update(adjust.id, null, amt, amt > 0 ? "Balance credited" : "Balance deducted"); setAdjust(null); } }}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Set new password</DialogTitle>
            <DialogDescription>Set a new sign-in password for {pwTarget?.name}. Share it with the user privately.</DialogDescription>
          </DialogHeader>
          <Input type="text" autoComplete="off" placeholder="Minimum 8 characters" value={pwTarget?.password ?? ""}
            onChange={(e) => setPwTarget((t) => (t ? { ...t, password: e.target.value } : t))} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>Cancel</Button>
            <Button onClick={savePassword}>Save password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!blockTarget} onOpenChange={(o) => !o && setBlockTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{blockTarget?.blocked ? "Unblock user" : "Block user"}</DialogTitle>
            <DialogDescription>
              {blockTarget?.blocked ? `${blockTarget?.name} will be able to upload content again.` : `${blockTarget?.name} will no longer be able to upload new content.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlockTarget(null)}>Cancel</Button>
            <Button variant={blockTarget?.blocked ? "default" : "destructive"}
              onClick={() => { if (blockTarget) { update(blockTarget.id, !blockTarget.blocked, null, blockTarget.blocked ? "User unblocked" : "User blocked"); setBlockTarget(null); } }}>
              {blockTarget?.blocked ? "Unblock" : "Block user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-1.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

type FFilter = "all" | "original" | "converted";

function FilesTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [filter, setFilter] = useState<FFilter>("all");
  const [page, setPage] = useState(0);
  const [del, setDel] = useState<{ id: string; name: string; path: string | null } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-files", dq, filter, page],
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    queryFn: async () => {
      let r = supabase.from("files").select("id, name, slug, file_type, size, views, created_at, owner_id, storage_path, source")
        .order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
      const t = dq.trim().replace(/[%,()]/g, "");
      if (t) r = r.ilike("name", `%${t}%`);
      if (filter !== "all") r = r.eq("source", filter);
      return (await r).data ?? [];
    },
  });
  const rows = data ?? [];
  const { data: who } = useProfilesMap([...new Set(rows.map((f) => f.owner_id))]);

  async function remove(id: string, path: string | null) {
    if (path) await supabase.storage.from("files").remove([path]);
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Content deleted");
    qc.invalidateQueries({ queryKey: ["admin-files"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search by file name" />
        <Chips value={filter} options={["all", "original", "converted"] as FFilter[]} onChange={(v) => { setFilter(v); setPage(0); }} />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        {isLoading ? <ListSkeleton /> : rows.length === 0 ? <Empty text="No content found." /> : (
          <ul className="divide-y">
            {rows.map((f) => (
              <li key={f.id} className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><FileText className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{who?.[f.owner_id]?.email ?? "Unknown owner"}</p>
                  <p className="truncate text-xs text-muted-foreground">{f.file_type} · {formatSize(f.size)} · {nf.format(f.views)} views · {fmtDate(f.created_at)}</p>
                </div>
                <Button asChild size="icon" variant="ghost" aria-label="Open share page"><a href={`/s/${f.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setDel({ id: f.id, name: f.name, path: f.storage_path })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Pager page={page} setPage={setPage} more={rows.length === PAGE} />

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete content</DialogTitle>
            <DialogDescription>"{del?.name}" and its share link will be permanently removed. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (del) { remove(del.id, del.path); setDel(null); } }}>Delete permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pager({ page, setPage, more }: { page: number; setPage: (n: number) => void; more: boolean }) {
  if (page === 0 && !more) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">Page {page + 1}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="rounded-lg" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
        <Button size="sm" variant="outline" className="rounded-lg" disabled={!more} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
