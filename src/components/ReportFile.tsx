import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const REPORT_REASONS = [
  { value: "copyright", label: "Copyright infringement" },
  { value: "sexual", label: "Sexual or adult content" },
  { value: "child_safety", label: "Child sexual abuse material" },
  { value: "violence", label: "Violence or harmful content" },
  { value: "spam", label: "Spam or scam" },
  { value: "illegal", label: "Other illegal content" },
  { value: "other", label: "Something else" },
] as const;

export const reasonLabel = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

export function ReportFile({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!reason) { toast.error("Choose what is wrong with this file"); return; }
    const e = email.trim();
    if (e && !/^\S+@\S+\.\S+$/.test(e)) { toast.error("Enter a valid email or leave it blank"); return; }
    setBusy(true);
    const uid = await currentUserId();
    const { error } = await supabase.from("reports").insert({
      file_slug: slug, file_name: name.slice(0, 300), reason,
      details: details.trim().slice(0, 1000) || null, email: e || null, reporter_id: uid,
    });
    setBusy(false);
    if (error) { toast.error("Could not send report. Please try again."); return; }
    toast.success("Report sent. Thank you.");
    setOpen(false); setReason(""); setDetails(""); setEmail("");
  }

  return (
    <>
      <div className="mt-3 flex justify-end">
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <Flag className="h-3.5 w-3.5" /> Report
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report a file</DialogTitle>
            <DialogDescription>You do not need an account. We record only what you type below.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-muted/40 p-3 text-xs">
            <p className="font-semibold">Reporting</p>
            <p className="truncate text-muted-foreground">{name}</p>
            <p className="text-muted-foreground">/s/{slug}</p>
          </div>
          <div className="space-y-4">
            <label className="block space-y-1.5 text-sm font-medium">What is wrong with it?
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm font-normal">
                <option value="">Choose one</option>
                {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">Anything else (optional)
              <Textarea value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} placeholder="What should we look at? Do not paste or describe the material itself." className="font-normal" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">Your email (optional)
              <Input type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} placeholder="Only if you want us to be able to reply" className="font-normal" />
              <span className="block text-xs font-normal text-muted-foreground">Leave it blank to report anonymously.</span>
            </label>
            <Button className="w-full rounded-full" size="lg" disabled={busy} onClick={send}>{busy ? "Sending…" : "Send report"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
