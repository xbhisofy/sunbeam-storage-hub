import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc, OfficialReporting } from "@/components/LegalDoc";
import { ContentReportForm } from "@/components/ContentReportForm";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/content-reporting")({
  head: () => pageHead("Report Content", "Report illegal, harmful, copyrighted or abusive files shared on Tanyora. No account needed.", "/content-reporting"),
  component: ReportPage,
});

function ReportPage() {
  return (
    <LegalDoc
      title="Report Content"
      intro={<p>If you find a Tanyora share link with illegal, harmful, abusive or copyrighted material, report it here. You do not need an account. Inside the app you can also tap <strong className="text-foreground">Report</strong> below any opened file.</p>}
      summary={[
        "Every report goes straight to our moderation team.",
        "Child sexual abuse material and non-consensual intimate images are handled first, within 24 hours.",
        "We remove violating files, ban accounts and report crimes to the authorities.",
      ]}
      sections={[
        { id: "what", title: "What you can report", body: <ul><li>Child sexual abuse material (CSAM) or any sexual content involving minors.</li><li>Intimate or sexual images shared without consent, including morphed or deepfake images.</li><li>Copyright or trademark infringement (piracy).</li><li>Violence, terrorism, extremist propaganda, threats or self-harm promotion.</li><li>Scams, phishing, malware or fraud.</li><li>Hate speech, harassment, impersonation or private information (doxxing).</li><li>Anything else that is illegal in India.</li></ul> },
        { id: "process", title: "What happens after you report", body: <ol><li>Your report is logged and placed in the moderation queue.</li><li>A moderator reviews the file against our <Link to="/acceptable-use">Acceptable Use Policy</Link> and the law.</li><li>If it breaks the rules, the file and its share link are removed and the uploader may be suspended or banned.</li><li>Where the law requires, we preserve evidence for 180 days and report to Indian authorities or NCMEC.</li><li>If you gave an email, we may contact you about the outcome.</li></ol> },
        { id: "timelines", title: "Response times", body: <ul><li>Non-consensual intimate images: removed within 24 hours of a valid complaint (IT Rules, 2021, Rule 3(2)(b)).</li><li>Court or government orders: actioned within 36 hours.</li><li>Other complaints: acknowledged within 24 hours and resolved within 15 days.</li></ul> },
        { id: "authorities", title: "Report to the police too", body: <p>Tanyora is not a law-enforcement agency. For serious crimes, also file a complaint with the authorities using the links above. If you are not satisfied with our response, escalate to the <Link to="/grievance">Grievance Officer</Link>.</p> },
      ]}
    >
      <ContentReportForm />
      <OfficialReporting />
    </LegalDoc>
  );
}
