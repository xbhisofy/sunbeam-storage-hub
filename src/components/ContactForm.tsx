import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { contactSchema, contactTable, CONTACT_TOPICS } from "@/lib/contact";
import { currentUserId } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", topic: "general", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = contactSchema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Check the form"); return; }
    setBusy(true);
    const { error } = await contactTable().insert({ ...p.data, sender_id: await currentUserId() });
    setBusy(false);
    if (error) { toast.error("Could not send your message. Please try again."); return; }
    setSent(true);
  }

  if (sent) return (
    <div className="rounded-3xl border bg-card p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <h2 className="!mt-4 text-xl font-semibold text-foreground">Message sent</h2>
      <p className="mt-2">Thanks for reaching out. Our team will reply to {f.email}.</p>
      <Button variant="outline" className="mt-5 rounded-full" onClick={() => { setSent(false); setF({ name: "", email: "", topic: "general", message: "" }); }}>Send another message</Button>
    </div>
  );

  const field = "block space-y-1.5 text-sm font-medium text-foreground";
  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div>
        <h2 className="!mt-0 text-xl font-semibold text-foreground">Send us a message</h2>
        <p className="mt-1">Have a question or need help? Fill in the form and we will get back to you.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={field}>Your name<Input value={f.name} onChange={set("name")} maxLength={100} placeholder="Full name" className="h-11 rounded-xl font-normal" /></label>
        <label className={field}>Email<Input type="email" value={f.email} onChange={set("email")} maxLength={255} placeholder="you@example.com" className="h-11 rounded-xl font-normal" /></label>
      </div>
      <label className={field}>Topic
        <select value={f.topic} onChange={set("topic")} className="h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal">
          {CONTACT_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>
      <label className={field}>Message<Textarea value={f.message} onChange={set("message")} maxLength={2000} rows={6} placeholder="How can we help?" className="rounded-xl font-normal" />
        <span className="block text-right text-xs font-normal text-muted-foreground">{f.message.length}/2000</span>
      </label>
      <Button type="submit" size="lg" disabled={busy} className="w-full rounded-full"><Send className="h-4 w-4" />{busy ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
