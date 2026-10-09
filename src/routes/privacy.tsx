import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TenBox" },
      { name: "description", content: "How TenBox collects, uses and protects your data." },
      { property: "og:title", content: "Privacy Policy — TenBox" },
      { property: "og:description", content: "How TenBox collects, uses and protects your data." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Privacy Policy">
      <p>TenBox ("we", "us") provides a website and an Android app that let you upload files, share them through links and earn rewards. This policy explains what data we collect and how we use it.</p>
      <h2>Information we collect</h2>
      <p><b>Account data:</b> email address, display name and sign-in details (email/password or Google).</p>
      <p><b>Content you upload:</b> videos, audio, PDFs and other files, plus links you convert.</p>
      <p><b>Usage data:</b> view counts of shared files, referral relationships and earnings balance.</p>
      <p><b>Advertising data:</b> our ad partners (such as Google AdMob/AdSense) may collect device identifiers and usage data to show and measure ads.</p>
      <h2>How we use your data</h2>
      <p>To run your account, store and deliver your files, count views, calculate earnings and referral rewards, prevent fraud and abuse, and show ads.</p>
      <h2>Sharing</h2>
      <p>We do not sell your personal data. Files you share are visible to anyone who has the link. We use trusted service providers for hosting, storage and advertising.</p>
      <h2>Security</h2>
      <p>Data is sent over encrypted connections (HTTPS) and stored with access controls.</p>
      <h2>Data retention and deletion</h2>
      <p>We keep your data while your account is active. You can delete your account and all your files anytime from Profile → Delete account in the app or website. See our <a className="text-primary underline" href="/delete-account">account deletion page</a>.</p>
      <h2>Children</h2>
      <p>TenBox is not intended for children under 13 and we do not knowingly collect their data.</p>
      <h2>Contact</h2>
      <p>Questions? Email us at support@tenbox.app.</p>
    </LegalPage>
  ),
});
