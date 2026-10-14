import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/refunds")({
  head: () => pageHead("Refunds, Cancellation and Billing", "Billing, cancellation and refund terms for Tanyora plans, and how creator payouts work.", "/refunds"),
  component: Refunds,
});

function Refunds() {
  return (
    <LegalDoc
      title="Refunds, Cancellation and Billing"
      intro={<p>Tanyora accounts are currently free. Paid plans shown in the Service are not yet available for purchase, and no payment is taken today. This page explains how billing will work when they launch, in line with the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.</p>}
      sections={[
        { id: "prices", title: "Prices and renewal", body: <p>Before you pay, we will clearly show the price (including taxes), the billing period, what the plan includes, and how renewal works. Subscriptions renew automatically until cancelled.</p> },
        { id: "play", title: "Purchases in the Android app", body: <p>Plans bought in the app are billed by Google Play and follow Google Play's refund policy. Cancel anytime in Google Play → Payments & subscriptions. Refund requests for Play purchases are handled by Google.</p> },
        { id: "web", title: "Purchases on the website", body: <ul><li>You can cancel anytime; you keep access until the end of the paid period.</li><li>If you were charged by mistake, charged twice, or the service did not work as described, request a refund within 7 days through the <Link to="/contact">contact form</Link>. Approved refunds are returned to the original payment method within 5–10 business days.</li><li>No refunds are given for accounts suspended for breaking our <Link to="/terms">Terms</Link>.</li></ul> },
        { id: "rewards", title: "Creator rewards are not purchases", body: <p>Rewards and payouts are not payments for a purchase and are not refundable. They are governed by the rewards section of the <Link to="/terms">Terms</Link>. Rewards from invalid or fraudulent activity are withheld or reversed.</p> },
        { id: "help", title: "Billing help", body: <p>Use the <Link to="/contact">contact form</Link> with topic "Earnings & payouts" or escalate to the <Link to="/grievance">Grievance Officer</Link>.</p> },
      ]}
    />
  );
}
