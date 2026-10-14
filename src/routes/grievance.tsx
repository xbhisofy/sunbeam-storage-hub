import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, OfficialReporting } from "@/components/LegalDoc";
import { ContactForm } from "@/components/ContactForm";
import { pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/grievance")({
  head: () => pageHead("Grievance Redressal", "How to raise a complaint with Tanyora's Grievance Officer under the IT Rules, 2021 and the DPDP Act, 2023.", "/grievance"),
  component: Grievance,
});

function Grievance() {
  return (
    <LegalDoc
      title="Grievance Redressal"
      intro={<p>In line with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Digital Personal Data Protection Act, 2023, Tanyora has appointed a Grievance Officer to handle complaints from users and victims.</p>}
      summary={[
        "Complaints are acknowledged within 24 hours and resolved within 15 days.",
        "Complaints about intimate images shared without consent are acted on within 24 hours.",
        "You can appeal to the Grievance Appellate Committee if you are not satisfied.",
      ]}
      sections={[
        { id: "officer", title: "Grievance Officer", body: <><p><strong>Designation:</strong> Grievance Officer, {site.name}</p><p><strong>Contact:</strong> the form on this page, or <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with subject "Grievance".</p><p><strong>Working hours:</strong> Monday to Saturday, 10:00 AM to 6:00 PM IST. Complaints can be sent at any time.</p></> },
        { id: "what", title: "What you can complain about", body: <ul><li>Content that breaks our <Link to="/acceptable-use">Acceptable Use Policy</Link> or Indian law.</li><li>Content showing you in a sexual act, partial or full nudity, or a morphed image of you.</li><li>Removal of your content or suspension of your account that you believe was wrong.</li><li>How we handle your personal data.</li><li>Rewards, payouts or any other part of the Service.</li></ul> },
        { id: "how", title: "How to file a complaint", body: <ol><li>Choose the topic that fits best and describe the issue clearly.</li><li>Include the share link(s), your account email (if you have one), and any reference number.</li><li>For removal of your own content, explain why you believe the decision was wrong.</li></ol> },
        { id: "timeline", title: "Timelines", body: <ul><li>Acknowledgement: within 24 hours.</li><li>Resolution: within 15 days.</li><li>Requests to remove intimate or morphed images of you: within 24 hours.</li><li>Court or government orders: within 36 hours.</li></ul> },
        { id: "appeal", title: "Appeal", body: <p>If you are not satisfied with the decision, you can appeal to the Grievance Appellate Committee within 30 days at <a href="https://gac.gov.in" target="_blank" rel="noopener noreferrer">gac.gov.in</a>. For personal data complaints you can also approach the Data Protection Board of India after using this process.</p> },
      ]}
    >
      <ContactForm />
      <OfficialReporting />
    </LegalDoc>
  );
}
