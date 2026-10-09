import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "./route";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — TenBox" }, { name: "description", content: "Your account settings." }] }),
  component: Profile,
});

function Profile() {
  const { data: p } = useProfile();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  useEffect(() => { if (p?.display_name) setName(p.display_name); }, [p?.display_name]);
  async function save() {
    const v = name.trim().slice(0, 60);
    if (!v || !p) return;
    const { error } = await supabase.from("profiles").update({ display_name: v }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["profile"] }); }
  }
  const del = useServerFn(deleteMyAccount);
  async function removeAccount() {
    if (!confirm("Delete your account and all files permanently?")) return;
    try { await del(); await supabase.auth.signOut(); toast.success("Account deleted"); }
    catch (e) { toast.error((e as Error).message); }
  }
  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="mt-6 space-y-3 rounded-2xl border bg-card p-5">
        <label className="text-sm font-medium">Display name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <div className="text-sm text-muted-foreground">Email: {p?.email}</div>
        <Button onClick={save}>Save</Button>
      </div>
      <div className="mt-6 space-y-3 rounded-2xl border bg-card p-5">
        <div className="flex gap-4 text-sm">
          <a className="text-primary underline" href="/privacy">Privacy Policy</a>
          <a className="text-primary underline" href="/terms">Terms</a>
        </div>
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
      <div className="mt-6 space-y-3 rounded-2xl border border-destructive/40 bg-card p-5">
        <div className="font-semibold">Delete account</div>
        <p className="text-sm text-muted-foreground">Permanently deletes your account, all files and earnings. This cannot be undone.</p>
        <Button variant="destructive" onClick={removeAccount}>Delete account</Button>
      </div>
    </div>
  );
}
