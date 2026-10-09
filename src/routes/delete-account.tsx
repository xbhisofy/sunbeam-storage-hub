import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/delete-account")({
  head: () => pageHead('Account & Data Deletion', 'Delete your Tanyora account and associated uploaded content from the website or app.', "/delete-account"),
  component: () => <LegalPage title='Account & Data Deletion'><p>This page applies to Tanyora accounts on both the website and Android app.</p>
<h2>Delete without reinstalling the app</h2><ol className="list-decimal space-y-2 pl-5"><li><Link className="text-primary underline" to="/auth">Sign in on this website</Link> using the same account.</li><li>Open <Link className="text-primary underline" to="/profile">Profile</Link>.</li><li>Choose Delete account and confirm the permanent deletion.</li></ol>
<h2>What the action removes</h2><p>The action deletes uploaded objects, owned file records and share links, then your authentication account and associated profile. Profile deletion removes its displayed earnings balance, earning-plan and referral fields. It cannot erase copies downloaded by other people.</p>
<h2>If deletion cannot complete</h2><p>An error is shown when a deletion step fails. Some files may already have been deleted before that error; the operation is not reversible. Retry or contact <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> from your registered email. Never send your password. No fixed manual response or backup-erasure deadline is promised.</p>
<h2>Records and balances</h2><p>Download any files you want to keep first. Account access and displayed balance are removed when deletion completes. Contact support before deletion for balance questions. Provider backups, recipient copies and records required by law are outside the immediate deletion action; an audited retention schedule is still required before public release.</p></LegalPage>,
});
