import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/content-reporting")({
  head: () => pageHead("Content Reporting and Removal", "How to report abusive or illegal content on Tanyora and what happens next.", "/content-reporting"),
  component: () => <LegalPage title="Content Reporting and Removal"><p>Anyone, with or without an account, can report a file or share link.</p>
<h2>How to report</h2><p>Email <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with the share link, the reason (copyright, child safety, harassment, malware, privacy, illegal content or other) and any details that help us review it. For copyright, follow the <Link className="text-primary underline" to="/copyright">Copyright policy</Link>.</p>
<h2>What we do</h2><p>We review reports, may disable the link while reviewing, and remove content that breaks our <Link className="text-primary underline" to="/acceptable-use">Acceptable Use Policy</Link>. We aim to acknowledge reports within 24 hours and resolve them within 15 days. Child-safety reports are prioritised.</p>
<h2>Appeals</h2><p>If your content was removed and you believe this was a mistake, reply to the removal notice or contact the <Link className="text-primary underline" to="/grievance">Grievance officer</Link>.</p></LegalPage>,
});
