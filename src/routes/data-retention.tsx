import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/data-retention")({
  head: () => pageHead("Data Retention and Deletion", "How long Tanyora keeps your data and how deletion works.", "/data-retention"),
  component: () => <LegalPage title="Data Retention and Deletion"><h2>What we keep</h2><p>Your account details, uploaded files and file information are kept while your account is active.</p>
<h2>Deleting files</h2><p>Move to Trash in My Files deletes the file and its share link. Expired links stop working but the file stays in your account until you delete it.</p>
<h2>Deleting your account</h2><p>You can delete your account from Profile or via <Link className="text-primary underline" to="/delete-account">Delete account</Link>. This removes your profile, files and share links. Daily backups are kept for up to 14 days and then overwritten.</p>
<h2>Records we may retain</h2><p>Withdrawal and payment records, and records needed for legal claims, abuse investigation or legal obligations, may be kept as required by law.</p>
<h2>Request your data</h2><p>Email <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> from your account email to request a copy of your personal data. We may verify your identity first.</p></LegalPage>,
});
