import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete your account — TenBox" },
      { name: "description", content: "How to delete your TenBox account and data." },
      { property: "og:title", content: "Delete your account — TenBox" },
      { property: "og:description", content: "How to delete your TenBox account and data." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Delete your TenBox account">
      <h2>In the app or website</h2>
      <p>1. Sign in to TenBox. 2. Open <b>Profile</b>. 3. Tap <b>Delete account</b> and confirm.</p>
      <h2>By email</h2>
      <p>Send a request from your registered email to support@tenbox.app. We process requests within 7 days.</p>
      <h2>What gets deleted</h2>
      <p>Your account, profile, all uploaded files, share links, and earnings/referral records are permanently deleted. Unwithdrawn balance is forfeited.</p>
    </LegalPage>
  ),
});
