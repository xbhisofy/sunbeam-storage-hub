import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "./route";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referrals — TenBox" }, { name: "description", content: "Invite friends and earn." }] }),
  component: Referrals,
});

function Referrals() {
  const { data: p } = useProfile();
  const { data: count = 0 } = useQuery({
    queryKey: ["refcount"],
    queryFn: async () => (await supabase.rpc("my_referral_count")).data ?? 0,
  });
  const link = p ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?mode=signup&ref=${p.referral_code}` : "";
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Referrals</h1>
      <p className="mt-1 text-muted-foreground">Earn 10% extra on every view your invited friends get.</p>
      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="text-sm font-medium">Your invite link</div>
        <div className="mt-2 flex gap-2">
          <Input readOnly value={link} />
          <Button onClick={() => { navigator.clipboard.writeText(link); toast.success("Copied"); }}><Copy className="h-4 w-4" /> Copy</Button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-2xl border bg-card p-5">
        <Users className="h-8 w-8 text-primary" />
        <div><div className="text-2xl font-bold">{count}</div><div className="text-sm text-muted-foreground">Friends joined</div></div>
      </div>
    </div>
  );
}
