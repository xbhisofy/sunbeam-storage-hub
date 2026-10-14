import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/security")({
  head: () => pageHead("Security & Responsible Disclosure", "How Tanyora protects accounts and files, and how to report a security vulnerability.", "/security"),
  component: Sec,
});

function Sec() {
  return (
    <LegalDoc
      title="Security & Responsible Disclosure"
      intro={<p>Keeping your files and account safe is a top priority. This page explains our main safeguards and how security researchers can report problems responsibly.</p>}
      sections={[
        { id: "measures", title: "How we protect you", body: <ul><li>All traffic is encrypted with HTTPS (TLS).</li><li>Passwords are stored only as secure hashes and are never visible to staff.</li><li>Files are stored in private storage; they open only through time-limited signed links.</li><li>Database access is restricted per user with row-level security. Admin actions require a verified admin role.</li><li>Daily backups, server firewalls and regular software updates.</li><li>Abuse and fraud monitoring, and account blocking.</li></ul> },
        { id: "you", title: "What you can do", body: <ul><li>Use a strong, unique password and never share it. Tanyora staff will never ask for your password or OTP.</li><li>Share links only with people you trust and use link expiry for private files.</li><li>Log out on shared devices and delete files you no longer need.</li><li>Beware of fake Tanyora websites, apps or messages asking for payment or login details.</li></ul> },
        { id: "disclose", title: "Report a vulnerability", body: <><p>Email <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with subject "Security report", including steps to reproduce and the impact. Please:</p><ul><li>Give us reasonable time to fix the issue before disclosing it publicly.</li><li>Do not access, change or delete other users' data, and stop testing once you confirm an issue.</li><li>Do not run denial-of-service, spam or social-engineering attacks.</li></ul><p>We will not take legal action against good-faith research that follows these rules.</p></> },
        { id: "incidents", title: "Security incidents", body: <p>Cyber security incidents are reported to CERT-In within 6 hours as required by law, and affected users are informed as required by the DPDP Act. See our <Link to="/privacy">Privacy Policy</Link>.</p> },
      ]}
    />
  );
}
