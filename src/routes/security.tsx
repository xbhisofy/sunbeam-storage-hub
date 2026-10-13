import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/security")({
  head: () => pageHead("Security and Responsible Disclosure", "How Tanyora protects data and how to report a security issue.", "/security"),
  component: () => <LegalPage title="Security and Responsible Disclosure"><h2>How we protect data</h2><p>Connections use HTTPS. Files are stored in private cloud storage and are served through short-lived signed links. Access rules restrict each account to its own files. No service is perfectly secure, so avoid sharing highly confidential files through public links.</p>
<h2>Report a vulnerability</h2><p>Email <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with steps to reproduce. Please give us reasonable time to fix the issue before public disclosure, do not access other users' data, and do not disrupt the service. We do not currently run a paid bug bounty.</p></LegalPage>,
});
