import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — TenBox" },
      { name: "description", content: "Rules for using TenBox file sharing and earnings." },
      { property: "og:title", content: "Terms of Service — TenBox" },
      { property: "og:description", content: "Rules for using TenBox file sharing and earnings." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Terms of Service">
      <p>By using TenBox you agree to these terms.</p>
      <h2>Your content</h2>
      <p>You own the files you upload. You must have the rights to every file you upload or share. Do not upload pirated, adult, violent, hateful or illegal content.</p>
      <h2>Copyright complaints</h2>
      <p>If you believe content on TenBox infringes your copyright, email support@tenbox.app with the share link. We remove infringing content and may close repeat offenders' accounts.</p>
      <h2>Earnings</h2>
      <p>Rewards are paid only for genuine views and signups. Fake traffic, bots or self-referrals lead to cancelled earnings and account suspension. Minimum withdrawal is shown on the Earnings page.</p>
      <h2>Termination</h2>
      <p>We may suspend accounts that break these terms. You may delete your account at any time.</p>
      <h2>Disclaimer</h2>
      <p>The service is provided "as is" without warranties.</p>
      <h2>Contact</h2>
      <p>support@tenbox.app</p>
    </LegalPage>
  ),
});
