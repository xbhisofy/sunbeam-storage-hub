import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/data-retention")({
  head: () => pageHead("Data Retention & Deletion", "How long Tanyora keeps files, account data, logs and reports, and how deletion works.", "/data-retention"),
  component: DR,
});

function DR() {
  return (
    <LegalDoc
      title="Data Retention & Deletion"
      intro={<p>We keep personal data only as long as needed to provide the Service, meet legal duties and resolve disputes, as required by the DPDP Act, 2023, the IT Rules, 2021 and CERT-In directions.</p>}
      sections={[
        { id: "table", title: "Retention periods", body: <ul><li><strong>Your files:</strong> until you delete them, the share link expires (the file record stays until you delete it), or your account is deleted.</li><li><strong>Account and profile:</strong> while your account is active; erased when you delete it.</li><li><strong>Content removed for violations, and related account data:</strong> preserved for 180 days, or longer if a court or investigating agency asks (IT Rules, 2021, Rule 3(1)(g) and 3(1)(h)).</li><li><strong>Security and access logs:</strong> 180 days, as required by CERT-In directions of 28 April 2022.</li><li><strong>Payout and reward records:</strong> as long as tax and accounting laws require.</li><li><strong>Reports and support messages:</strong> until resolved and then as long as needed for safety and legal records.</li><li><strong>Backups:</strong> daily backups are kept for 14 days and then overwritten.</li></ul> },
        { id: "delete", title: "Deleting your data", body: <p>Delete single files from My Files, or your whole account from Profile or the <Link to="/delete-account">account deletion page</Link>. Deletion removes your files, share links, profile and login. Copies other people already downloaded cannot be recalled.</p> },
        { id: "inactive", title: "Inactive accounts", body: <p>We may delete accounts that have been inactive for a long period after giving notice by email.</p> },
        { id: "requests", title: "Access requests", body: <p>To get a copy of your data, use the <Link to="/contact">contact form</Link> with topic "Privacy & data" from your registered email.</p> },
      ]}
    />
  );
}
