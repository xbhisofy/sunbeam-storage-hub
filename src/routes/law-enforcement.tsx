import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, OfficialReporting } from "@/components/LegalDoc";
import { pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/law-enforcement")({
  head: () => pageHead("Law Enforcement Guidelines", "How government and law enforcement agencies can request data or content removal from Tanyora.", "/law-enforcement"),
  component: LE,
});

function LE() {
  return (
    <LegalDoc
      title="Law Enforcement Guidelines"
      intro={<p>Tanyora cooperates with lawful requests from Indian law enforcement and government agencies under the Information Technology Act, 2000, the IT Rules, 2021, the Bharatiya Nagarik Suraksha Sanhita, 2023 and other applicable laws, while protecting our users' privacy.</p>}
      sections={[
        { id: "submit", title: "How to submit a request", body: <><p>Send requests on official letterhead from an official government email address to <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with subject "Law enforcement request". Include:</p><ul><li>Name, rank, agency, official contact details.</li><li>The legal provision under which the request is made (for example Section 69 or 79(3)(b) of the IT Act, or Section 94 of the BNSS).</li><li>The exact Tanyora share link(s) or account email.</li><li>The data or action requested, and case or FIR number.</li></ul></> },
        { id: "time", title: "Response times", body: <ul><li>Requests for information or assistance for investigation: within 72 hours (IT Rules, 2021, Rule 3(1)(j)).</li><li>Content removal orders from a court or authorised agency: within 36 hours (Rule 3(1)(d)).</li><li>Emergencies involving risk of death or serious harm: handled immediately.</li></ul> },
        { id: "preserve", title: "Preservation", body: <p>We preserve the requested records for 180 days, or longer when asked in writing, pending formal legal process.</p> },
        { id: "foreign", title: "Foreign requests", body: <p>Foreign agencies should use the Mutual Legal Assistance Treaty (MLAT) process or letters rogatory through the Government of India.</p> },
        { id: "notice", title: "User notice", body: <p>Where the law allows, we may tell users about requests for their data, unless doing so would harm an investigation or someone's safety.</p> },
        { id: "public", title: "Members of the public", body: <p>If you are a victim of a crime, please report to the police or the cyber crime portal below, and report the file to us through <Link to="/content-reporting">Report content</Link>.</p> },
      ]}
    >
      <OfficialReporting />
    </LegalDoc>
  );
}
