import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy Policy", "How Tanyora collects, uses, stores, shares and protects personal data under India's Digital Personal Data Protection Act, 2023.", "/privacy"),
  component: Privacy,
});

const mail = <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>;

function Privacy() {
  return (
    <LegalDoc
      title="Privacy Policy"
      intro={<><p>This Privacy Policy explains how {site.name} handles personal data when you use our website, Android app and share links. We follow the Digital Personal Data Protection Act, 2023 ("DPDP Act"), the Information Technology Act, 2000 and the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</p><p>For the purposes of the DPDP Act, Tanyora is the Data Fiduciary for account data. For the files you upload, you decide what to share and with whom.</p></>}
      summary={[
        "We collect only what we need: your name, email, files you upload, and basic usage and security logs.",
        "We never sell your personal data.",
        "Files are stored privately and are only reachable through share links you create.",
        "You can access, correct and delete your data at any time.",
      ]}
      sections={[
        { id: "collect", title: "Data we collect", body: <><p><strong>You give us:</strong></p><ul><li>Account details: name, email address and password (stored only as a secure hash).</li><li>Files you upload, their names, types, sizes, and the share settings you choose (such as expiry).</li><li>Payout details you enter for withdrawals (UPI ID, PayPal email, bank details or crypto wallet address).</li><li>Messages you send through the contact form and content reports (email is optional for most reports).</li></ul><p><strong>Collected automatically:</strong></p><ul><li>View counts on your share links, and which share links a signed-in user has opened (used to show "Recent" files and prevent duplicate counting).</li><li>Technical and security logs: IP address, device and browser type, timestamps and error reports.</li><li>Referral relationship, if you joined using someone's referral link.</li></ul><p>We do not knowingly collect sensitive data such as health, biometric or financial account passwords.</p></> },
        { id: "use", title: "How we use data", body: <ul><li>To create and secure your account and let you sign in.</li><li>To store, display and deliver your files and share links.</li><li>To calculate rewards, detect fraud and process payouts.</li><li>To review reports, enforce our policies and comply with legal obligations.</li><li>To answer support requests and send essential service notices.</li><li>To keep the Service secure, debug problems and improve it.</li></ul> },
        { id: "basis", title: "Legal basis and consent", body: <p>We process data on the basis of your consent (given when you sign up) and for legitimate uses permitted by Section 7 of the DPDP Act, such as complying with law, responding to court or government orders, and preventing fraud. You may withdraw consent at any time by deleting your account; this does not affect processing already done or data we must keep by law.</p> },
        { id: "share", title: "Who we share data with", body: <><p>We do not sell or rent personal data. We share it only with:</p><ul><li><strong>People you share links with</strong> — they can see the file and its name.</li><li><strong>Service providers</strong> that host our servers, database and file storage (including Cloudflare R2), under confidentiality and security obligations.</li><li><strong>Payment providers</strong> needed to send your payout.</li><li><strong>Authorities</strong> — law enforcement, courts, CERT-In or other government agencies when required by law, as described in our <Link to="/law-enforcement">Law Enforcement Guidelines</Link>; and NCMEC or Indian authorities for child sexual abuse material.</li></ul></> },
        { id: "storage", title: "Where and how long data is stored", body: <p>Data is stored on secured servers and may be processed outside India where permitted by law. We keep data only as long as needed. Retention periods (including the 180-day legal preservation of removed content and logs) are explained in <Link to="/data-retention">Data Retention & Deletion</Link>.</p> },
        { id: "security", title: "Security", body: <p>We use HTTPS encryption, private storage with time-limited signed links, hashed passwords, role-based admin access, row-level database permissions and daily encrypted backups. No system is 100% secure; read our <Link to="/security">Security</Link> page and report problems there.</p> },
        { id: "rights", title: "Your rights", body: <><p>Under the DPDP Act you have the right to:</p><ul><li>access a summary of your personal data and how it is processed;</li><li>correct, complete or update inaccurate data;</li><li>erase your data (delete your account from Profile or the <Link to="/delete-account">deletion page</Link>);</li><li>nominate another person to exercise your rights in case of death or incapacity;</li><li>grievance redressal through our <Link to="/grievance">Grievance Redressal</Link> process, and then a complaint to the Data Protection Board of India.</li></ul><p>To request a copy of your data, use the <Link to="/contact">contact form</Link> with topic "Privacy & data" from your registered email.</p></> },
        { id: "children", title: "Children", body: <p>The Service is not meant for children under 18 without verifiable parental consent. We do not track or target advertising at children. If you believe a child has given us data without consent, contact us and we will delete it. See <Link to="/child-safety">Child Safety Standards</Link>.</p> },
        { id: "cookies", title: "Cookies and local storage", body: <p>We use only essential browser storage to keep you signed in and remember settings. See the <Link to="/cookies">Cookie Policy</Link>.</p> },
        { id: "breach", title: "Data breaches", body: <p>If a personal data breach happens, we will contain it, notify affected users and the Data Protection Board of India as required by the DPDP Act, and report cyber security incidents to CERT-In within 6 hours as required by its 2022 directions.</p> },
        { id: "changes", title: "Changes", body: <p>We will post updates here and change the "Last updated" date. Significant changes will be notified in the Service.</p> },
        { id: "contact", title: "Contact", body: <p>Privacy questions: <Link to="/contact">contact form</Link> or {mail}.</p> },
      ]}
    />
  );
}
