import { createFileRoute, Link } from "@tanstack/react-router";
import { currentUserId } from "@/lib/session";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, FileText, Eye, Wallet, Clock, CheckCircle2, ShieldAlert, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { money, formatSize } from "@/lib/format";

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

type Tab = "overview" | "withdrawals" | "users" | "files";

function Admin() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("overview");
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!isAdmin) return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
      <p className="mt-3 font-semibold">Sirf admin ke liye</p>
      <Link to="/dashboard" className="mt-2 inline-block text-sm text-primary">Dashboard par jao</Link>
    </div>
  );
  const tabs: [Tab, string][] = [["overview", "Overview"], ["withdrawals", "Payments"], ["users", "Users"], ["files", "Activity / Files"]];
  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold">Admin panel</h1>
      <div className="mt-5 flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{label}</button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "overview" && <Overview />}
        {tab === "withdrawals" && <Withdrawals />}
        {tab === "users" && <UsersTab />}
        {tab === "files" && <FilesTab />}
      </div>
    </div>
  );
}

type Stats = { users: number; users_today: number; files: number; files_today: number; views: number; balance_total: number; paid_total: number; pending_count: number; pending_amount: number };

function Overview() {
  const { data: s } = useQuery({ queryKey: ["admin-stats"], queryFn: async () => (await supabase.rpc("admin_stats")).data as unknown as Stats, refetchInterval: 30_000 });
  const cards = [
    { icon: Users, label: "Total users", value: s?.users ?? 0, sub: `+${s?.users_today ?? 0} aaj` },
    { icon: FileText, label: "Total files", value: s?.files ?? 0, sub: `+${s?.files_today ?? 0} aaj` },
    { icon: Eye, label: "Total views", value: s?.views ?? 0 },
    { icon: Clock, label: "Pending payments", value: money(s?.pending_amount ?? 0), sub: `${s?.pending_count ?? 0} requests` },
    { icon: Wallet, label: "Users ka total balance", value: money(s?.balance_total ?? 0) },
    { icon: CheckCircle2, label: "Total paid", value: money(s?.paid_total ?? 0) },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border bg-card p-5">
          <c.icon className="h-5 w-5 text-primary" />
          <div className="mt-3 text-sm text-muted-foreground">{c.label}</div>
          <div className="text-2xl font-bold">{c.value}</div>
          {c.sub && <div className="text-xs text-muted-foreground">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function useProfilesMap(ids: string[]) {
  return useQuery({
    queryKey: ["admin-profiles-map", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, email, display_name").in("id", ids);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
    },
  });
}

function Withdrawals() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const { data } = useQuery({
    queryKey: ["admin-withdrawals", status],
    queryFn: async () => {
      let q = supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(200);
      if (status !== "all") q = q.eq("status", status);
      return (await q).data ?? [];
    },
  });
  const { data: who } = useProfilesMap([...new Set((data ?? []).map((w) => w.user_id))]);
  async function act(id: string, s: "approved" | "paid" | "rejected") {
    const note = s === "rejected" ? (prompt("Reject karne ka reason (user ko dikhega):") ?? "") : null;
    if (s === "rejected" && note === "") return;
    const { error } = await supabase.rpc("admin_set_withdrawal", { _id: id, _status: s, _note: note ?? "" });
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${s}`);
    qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {["pending", "approved", "paid", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-4 py-1.5 text-sm capitalize ${status === s ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{s}</button>
        ))}
      </div>
      <div className="mt-4 divide-y rounded-2xl border bg-card">
        {(data ?? []).length === 0 && <p className="p-10 text-center text-muted-foreground">Koi request nahi</p>}
        {(data ?? []).map((w) => (
          <div key={w.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="font-semibold">{money(Number(w.amount))} · {w.method.toUpperCase()} <StatusBadge status={w.status} /></div>
              <div className="break-all text-sm">{w.account_details}</div>
              <div className="text-xs text-muted-foreground">{who?.[w.user_id]?.email ?? w.user_id} · {new Date(w.created_at).toLocaleString()}{w.admin_note ? ` · ${w.admin_note}` : ""}</div>
            </div>
            {(w.status === "pending" || w.status === "approved") && (
              <div className="flex shrink-0 gap-2">
                {w.status === "pending" && <Button size="sm" variant="outline" onClick={() => act(w.id, "approved")}>Accept</Button>}
                <Button size="sm" onClick={() => act(w.id, "paid")}>Mark paid</Button>
                <Button size="sm" variant="destructive" onClick={() => act(w.id, "rejected")}>Cancel</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Cancel karne par paisa user ke balance me wapas aa jata hai. Payment UPI/PayPal/Bank se aap khud bhejte ho, phir "Mark paid".</p>
    </div>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const size = 50;
  const { data } = useQuery({
    queryKey: ["admin-users", q, page],
    queryFn: async () => {
      let r = supabase.from("profiles").select("*").order("created_at", { ascending: false }).range(page * size, page * size + size - 1);
      const t = q.trim().replace(/[%,()]/g, "");
      if (t) r = r.or(`email.ilike.%${t}%,display_name.ilike.%${t}%,referral_code.eq.${t}`);
      return (await r).data ?? [];
    },
  });
  async function update(id: string, blocked: boolean | null, delta: number | null) {
    const { error } = await supabase.rpc("admin_update_user", { _id: id, _blocked: blocked as boolean, _balance_delta: delta as number });
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }
  return (
    <div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Email, naam ya referral code se dhundo" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr><th className="p-3">User</th><th className="p-3">Plan</th><th className="p-3">Balance</th><th className="p-3">Paid</th><th className="p-3">Joined</th><th className="p-3">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((u) => (
              <tr key={u.id} className={u.blocked ? "opacity-60" : ""}>
                <td className="p-3"><div className="font-medium">{u.display_name}{u.blocked && <span className="ml-2 text-xs text-destructive">Blocked</span>}</div><div className="text-xs text-muted-foreground">{u.email} · {u.referral_code}</div></td>
                <td className="p-3 capitalize">{u.plan}</td>
                <td className="p-3">{money(Number(u.balance))}</td>
                <td className="p-3">{money(Number(u.paid_total))}</td>
                <td className="p-3 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      const v = prompt("Balance me kitna add karna hai? (minus ke liye -1.5 jaisa likho)");
                      const n = Number(v); if (v && !Number.isNaN(n)) update(u.id, null, n);
                    }}>Balance</Button>
                    <Button size="sm" variant={u.blocked ? "outline" : "destructive"} onClick={() => update(u.id, !u.blocked, null)}>{u.blocked ? "Unblock" : "Block"}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} setPage={setPage} more={(data ?? []).length === size} />
    </div>
  );
}

function FilesTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const size = 50;
  const { data } = useQuery({
    queryKey: ["admin-files", page],
    queryFn: async () => (await supabase.from("files").select("*").order("created_at", { ascending: false }).range(page * size, page * size + size - 1)).data ?? [],
    refetchInterval: 30_000,
  });
  const { data: who } = useProfilesMap([...new Set((data ?? []).map((f) => f.owner_id))]);
  async function remove(id: string, path: string | null) {
    if (!confirm("Yeh file hamesha ke liye delete karni hai?")) return;
    if (path) await supabase.storage.from("files").remove([path]);
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-files"] });
  }
  return (
    <div>
      <p className="text-sm text-muted-foreground">Latest uploads aur links (har 30 second me refresh).</p>
      <div className="mt-4 divide-y rounded-2xl border bg-card">
        {(data ?? []).map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div className="min-w-0">
              <a href={`/s/${f.slug}`} target="_blank" rel="noreferrer" className="block truncate font-medium hover:text-primary">{f.name}</a>
              <div className="text-xs text-muted-foreground">{who?.[f.owner_id]?.email ?? f.owner_id} · {f.file_type} · {formatSize(f.size)} · {f.views} views · {new Date(f.created_at).toLocaleString()}</div>
            </div>
            <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(f.id, f.storage_path)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
      <Pager page={page} setPage={setPage} more={(data ?? []).length === size} />
    </div>
  );
}

function Pager({ page, setPage, more }: { page: number; setPage: (n: number) => void; more: boolean }) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
      <Button size="sm" variant="outline" disabled={!more} onClick={() => setPage(page + 1)}>Next</Button>
    </div>
  );
}
