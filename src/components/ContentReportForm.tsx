import { useState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import { toast } from "sonner";
import { reportsTable } from "@/lib/reports";
import { currentUserId } from "@/lib/session";
import { REPORT_REASONS } from "@/components/ReportFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Pulls the share code out of a pasted Tanyora link such as https://tanyora.com/s/abc123. */
export function slugFromLink(v: string) {
  const m = v.trim().match(/\/s\/([A-Za-z0-9_-]{4,64})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{4,64}$/.test(v.trim()) ? v.trim() : null;
}

export function ContentReportForm({ defaultReason = "" }: { defaultReason?: string }) {
  const [link, setLink] = useState("");
  const [reason, setReason] = useState(defaultReason);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugFromLink(link);
    if (!slug) { toast.error("Paste the full Tanyora share link, for example tanyora.com/s/abc123"); return; }
    if (!reason) { toast.error("Choose what is wrong with this file"); return; }
    const em = email.trim();
    if (em && !/^\S+@\S+\.\S+$/.test(em)) { toast.error("Enter a valid email or leave it blank"); return; }
    if (reason === "copyright" && !em) { toast.error("Copyright notices need an email so we can contact you"); return; }
    setBusy(true);
    const { error } = await reportsTable().insert({ file_slug: slug, reason, details: details.trim().slice(0, 1000) || null, email: em || null, reporter_id: await currentUserId() });
    setBusy(false);
    if (error) { toast.error("Could not send report. Please try again."); return; }
    setDone(true);
  }

  if (done) return (
    <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <p className="mt-4 text-lg font-semibold text-foreground">Report received</p>
      <p className="mt-1">Our moderation team will review it. Thank you for helping keep Tanyora safe.</p>
      <Button variant="outline" className="mt-5 rounded-full" onClick={() => { setDone(false); setLink(""); setDetails(""); }}>Report another file</Button>
    </div>
  );

  const field = "block space-y-1.5 text-sm font-medium text-foreground";
  return (
    <form onSubmit={send} className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive"><Flag className="h-5 w-5" /></span>
        <div><p className="font-semibold text-foreground">Report a file</p><p className="text-xs">No account needed. You can stay anonymous.</p></div>
      </div>
      <label className={field}>Share link<Input value={link} onChange={(e) => setLink(e.target.value)} maxLength={300} placeholder="https://tanyora.com/s/..." className="h-11 rounded-xl font-normal" /></label>
      <label className={field}>What is wrong with it?
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal">
          <option value="">Choose one</option>
          {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </label>
      <label className={field}>Details (optional)<Textarea value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} rows={4} placeholder="For copyright, name the original work and confirm you own it or act for the owner. Do not paste or describe illegal material." className="rounded-xl font-normal" /></label>
      <label className={field}>Your email {reason === "copyright" ? "(required for copyright)" : "(optional)"}<Input type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} placeholder="Only if you want a reply" className="h-11 rounded-xl font-normal" /></label>
      <Button type="submit" size="lg" disabled={busy} className="w-full rounded-full">{busy ? "Sending…" : "Send report"}</Button>
    </form>
  );
}
