import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/faq")({
  head: () => pageHead("Help and FAQ", "Answers to common questions about Tanyora.", "/faq"),
  component: () => <LegalPage title="Help and FAQ"><h2>What is Tanyora?</h2><p>Private cloud storage for videos, photos, audio and documents, with share links that can expire.</p>
<h2>How do I share a file?</h2><p>Open My Files, tap the menu on a file, choose Share, pick how long the link works, then choose an app to send it.</p>
<h2>Can I stop a link from working?</h2><p>Yes. Remove the share in Shared Files, or delete the file. Links with an expiry stop working automatically.</p>
<h2>Is there a file size limit?</h2><p>Each file can be up to 50 MB right now.</p>
<h2>How do I delete my account?</h2><p>Go to Profile, then Delete account, or see <Link className="text-primary underline" to="/delete-account">Delete account</Link>.</p>
<h2>How do I report something?</h2><p>See <Link className="text-primary underline" to="/content-reporting">Report content</Link>.</p>
<h2>Need more help?</h2><p>Email <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.</p></LegalPage>,
});
