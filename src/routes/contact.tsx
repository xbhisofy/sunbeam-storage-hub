import { createFileRoute, Link } from "@tanstack/react-router";
import { Copyright, Flag, LifeBuoy, ShieldAlert, Clock, Mail } from "lucide-react";
import { LegalPage } from "@/components/LegalPage";
import { ContactForm } from "@/components/ContactForm";
import { OfficialReporting } from "@/components/LegalDoc";
import { pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("Contact Support", "Contact the Tanyora support team about your account, files, payouts, privacy or safety.", "/contact"),
  component: ContactPage,
});

const quick = [
  { to: "/faq", icon: LifeBuoy, title: "Help & FAQ", text: "Quick answers to common questions." },
  { to: "/content-reporting", icon: Flag, title: "Report a file", text: "Illegal or harmful content." },
  { to: "/copyright", icon: Copyright, title: "Copyright notice", text: "Your work was shared without permission." },
  { to: "/child-safety", icon: ShieldAlert, title: "Child safety", text: "Urgent reports, handled first." },
] as const;

function ContactPage() {
  return (
    <LegalPage title="Contact Support">
      <p className="text-[15px]">We're here to help with your account, files, payouts and privacy. Pick a quick option or send us a message.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className="flex items-start gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><q.icon className="h-5 w-5" /></span>
            <span><span className="block font-semibold text-foreground">{q.title}</span><span className="text-xs">{q.text}</span></span>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <ContactForm />
        <aside className="space-y-3">
          <div className="rounded-2xl border bg-card p-4"><Clock className="h-5 w-5 text-primary" /><p className="mt-2 font-semibold text-foreground">Response time</p><p className="text-xs">We usually reply within 24–48 hours, Monday to Saturday.</p></div>
          <div className="rounded-2xl border bg-card p-4"><Mail className="h-5 w-5 text-primary" /><p className="mt-2 font-semibold text-foreground">Email</p><a className="break-all text-xs text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></div>
          <div className="rounded-2xl border bg-card p-4 text-xs"><p className="font-semibold text-foreground">Never share your password</p><p>Tanyora staff will never ask for your password, OTP or payment to unlock your account.</p></div>
        </aside>
      </div>
      <OfficialReporting />
    </LegalPage>
  );
}
