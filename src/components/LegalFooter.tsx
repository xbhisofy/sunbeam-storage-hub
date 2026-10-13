import { Link } from "@tanstack/react-router";
import { site } from "@/lib/site";

type Item = { to: string; label: string };
const groups: { title: string; items: Item[] }[] = [
  { title: "Product", items: [
    { to: "/", label: "Home" }, { to: "/faq", label: "Help & FAQ" },
    { to: "/contact", label: "Contact support" }, { to: "/grievance", label: "Grievance officer" },
  ] },
  { title: "Legal", items: [
    { to: "/privacy", label: "Privacy Policy" }, { to: "/terms", label: "Terms of Service" },
    { to: "/acceptable-use", label: "Acceptable Use" }, { to: "/community-guidelines", label: "Community Guidelines" },
    { to: "/cookies", label: "Cookie Policy" }, { to: "/refunds", label: "Refunds & Billing" },
  ] },
  { title: "Safety", items: [
    { to: "/copyright", label: "Copyright & DMCA" }, { to: "/content-reporting", label: "Report content" },
    { to: "/child-safety", label: "Child Safety Standards" }, { to: "/security", label: "Security & Disclosure" },
    { to: "/law-enforcement", label: "Law Enforcement Requests" },
  ] },
  { title: "Your account", items: [
    { to: "/data-retention", label: "Data Retention & Deletion" }, { to: "/delete-account", label: "Delete account" },
    { to: "/contact", label: "Request my data" },
  ] },
];

export function LegalFooter() {
  return (
    <footer className="border-t bg-card/40 px-5 pb-8 pt-12 text-sm text-muted-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3">
          <p className="text-base font-semibold text-foreground">{site.name}</p>
          <p>Private cloud storage and file sharing for web and Android.</p>
          <a className="block hover:text-foreground" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </div>
        {groups.map((g) => (
          <nav key={g.title} aria-label={g.title} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{g.title}</p>
            <ul className="space-y-2">
              {g.items.map((i) => <li key={i.label}><Link to={i.to} className="hover:text-foreground">{i.label}</Link></li>)}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} {site.name} · Operated by {site.operator}, {site.location}</span>
        <span>Last updated {site.updated}</span>
      </div>
    </footer>
  );
}
