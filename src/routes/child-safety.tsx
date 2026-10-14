import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, OfficialReporting } from "@/components/LegalDoc";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/child-safety")({
  head: () => pageHead("Child Safety Standards", "Tanyora's zero-tolerance standards against child sexual abuse and exploitation (CSAE), and how to report it.", "/child-safety"),
  component: ChildSafety,
});

function ChildSafety() {
  return (
    <LegalDoc
      title="Child Safety Standards"
      intro={<p>Tanyora has <strong className="text-foreground">zero tolerance</strong> for child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM). These standards apply to the website, the Android app and every share link, and meet Google Play's Child Safety Standards policy, the Protection of Children from Sexual Offences (POCSO) Act, 2012 and Section 67B of the Information Technology Act, 2000.</p>}
      summary={[
        "Any content sexualising a minor is banned, including drawings, AI-generated or morphed images.",
        "Offending files are removed, the account is permanently banned, and the case is reported to the authorities.",
        "Anyone can report — no account needed.",
      ]}
      sections={[
        { id: "banned", title: "What is banned", body: <ul><li>Any image, video, audio or text that shows, describes or promotes sexual activity involving anyone under 18.</li><li>Sexualised images of children, including cartoons, drawings, AI-generated, edited or "deepfake" content.</li><li>Grooming, sextortion, or any attempt to contact, meet or exploit a child.</li><li>Links to, or advertising of, CSAM anywhere else.</li><li>Content promoting child trafficking, child marriage or harm to children.</li></ul> },
        { id: "action", title: "What we do", body: <ul><li>Reports in this category are reviewed first, ahead of all other reports.</li><li>Confirmed material is removed immediately, and the share link stops working.</li><li>The uploader's account and related accounts are permanently banned, and all rewards are forfeited.</li><li>Evidence is preserved securely for at least 180 days, as required by law, and reported to Indian law enforcement through the National Cyber Crime Reporting Portal (as required by Section 19 of the POCSO Act) and to NCMEC.</li><li>We cooperate fully with lawful investigations.</li></ul> },
        { id: "prevention", title: "Prevention", body: <ul><li>Files are private by default and only reachable through links created by the uploader.</li><li>Users must accept our rules at signup, and are reminded of them regularly.</li><li>A Report button is shown below every opened file in the app.</li><li>Our moderators can remove files and ban accounts from the admin panel at any time.</li></ul> },
        { id: "report", title: "How to report", body: <p>Use <Link to="/content-reporting">Report content</Link> (choose "Child sexual abuse material") or tap Report below the file in the app. Please also report directly to the authorities using the links above. Do not download, screenshot or forward the material to anyone.</p> },
        { id: "contact", title: "Child safety point of contact", body: <p>Our designated child-safety contact can be reached through the <Link to="/contact">contact form</Link> (topic "Privacy & data") or the <Link to="/grievance">Grievance Officer</Link>. Urgent cases should always also go to the police (112) or cybercrime.gov.in.</p> },
      ]}
    >
      <OfficialReporting />
    </LegalDoc>
  );
}
