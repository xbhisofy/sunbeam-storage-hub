import { Link } from "@tanstack/react-router";
import { site } from "@/lib/site";
import { Brand } from "@/components/Brand";
import { StoreBadges } from "@/components/StoreBadges";

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

export function LegalFooter({ variant = "default" }: { variant?: "default" | "marketing" }) {
  if (variant === "marketing") return <footer className="website-footer"><div className="website-container website-footer-grid"><div className="website-footer-brand"><Brand /><p>Tanyora helps you upload, share and manage your files with a fast, simple experience.</p><StoreBadges /></div><nav aria-label="Quick links"><h3>Quick Links</h3><a href={`${site.webUrl}/content`}>Upload Files</a><a href={`${site.webUrl}/dashboard`}>Dashboard</a><a href={`${site.webUrl}/auth`}>Sign In</a><a href={site.playStoreUrl} target="_blank" rel="noopener noreferrer">Android App</a></nav><nav aria-label="Resources"><h3>Resources</h3><a href="#how-it-works">How It Works</a><Link to="/faq">FAQ</Link><Link to="/acceptable-use">Content Rules</Link><Link to="/content-reporting">Report a File</Link><Link to="/contact">Contact Support</Link></nav><nav aria-label="Legal"><h3>Legal</h3><Link to="/terms">Terms of Service</Link><Link to="/privacy">Privacy Policy</Link><Link to="/copyright">Copyright & DMCA</Link><Link to="/child-safety">Child Safety</Link><Link to="/delete-account">Delete Account</Link></nav></div><div className="website-container website-footer-bottom"><span>© {new Date().getFullYear()} {site.name} · Operated by {site.operator}</span><div><Link to="/cookies">Cookies</Link><Link to="/security">Security</Link><Link to="/grievance">Grievance Officer</Link><Link to="/data-retention">Data Retention</Link><Link to="/community-guidelines">Community Guidelines</Link><Link to="/refunds">Refunds</Link><Link to="/law-enforcement">Law Enforcement</Link></div></div></footer>;
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
