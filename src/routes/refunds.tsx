import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/refunds")({
  head: () => pageHead("Refunds, Cancellation and Billing", "Billing, cancellation and refund terms for Tanyora.", "/refunds"),
  component: () => <LegalPage title="Refunds, Cancellation and Billing"><p>Tanyora accounts are currently free. Paid storage plans are not yet available for purchase.</p>
<h2>When paid plans launch</h2><p>Plans bought in the Android app will be billed through Google Play and follow Google Play's refund and cancellation rules; you can cancel anytime in Google Play subscriptions. Any plan bought on the website will show its price, renewal period and cancellation steps before payment.</p>
<h2>Creator rewards</h2><p>Creator rewards are not purchases and are paid out according to the <Link className="text-primary underline" to="/terms">Terms</Link>. Rewards from invalid or fraudulent activity may be withheld.</p>
<h2>Questions</h2><p>Email <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.</p></LegalPage>,
});
