import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { ContentReportForm } from "@/components/ContentReportForm";
import { pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/copyright")({
  head: () => pageHead("Copyright & DMCA Policy", "How to report copyright infringement on Tanyora under the Indian Copyright Act and the US DMCA, and how counter-notices work.", "/copyright"),
  component: Copyright,
});

const mail = <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>;

function Copyright() {
  return (
    <LegalDoc
      title="Copyright & DMCA Policy"
      intro={<p>Tanyora respects intellectual property and expects users to do the same. Uploading or sharing films, web series, TV shows, music, software, games, books, courses or any other work you do not own or have permission to share is strictly prohibited. We respond quickly to valid notices under the Indian Copyright Act, 1957, the Copyright Rules, 2013, the IT Rules, 2021 and the US Digital Millennium Copyright Act (17 U.S.C. § 512).</p>}
      summary={[
        "Send a notice using the form below or by email. Valid notices are actioned quickly, normally within 36 hours.",
        "We remove or disable access to the file and its share link and tell the uploader.",
        "Repeat infringers are permanently banned and lose all rewards.",
        "False or abusive notices may lead to legal liability.",
      ]}
      sections={[
        { id: "notice", title: "How to file a copyright notice", body: <><p>Your notice must include:</p><ol><li>Your full name, address, phone number and email.</li><li>A description of the copyrighted work, and proof of ownership or authority (such as registration, a link to the original, or a licence).</li><li>The exact Tanyora share link(s) of the infringing file (for example tanyora.com/s/abc123).</li><li>A statement that you have a good-faith belief the use is not authorised by the owner, its agent or the law.</li><li>A statement that the information is accurate and, under penalty of perjury, that you are the owner or authorised to act for the owner.</li><li>Your physical or electronic signature.</li></ol><p>Indian rights owners may also give the details required by Rule 75 of the Copyright Rules, 2013. Send the notice through the form below (choose "Copyright infringement") or by email to {mail} with subject "Copyright notice".</p></> },
        { id: "action", title: "What we do", body: <ul><li>We review every complete notice and, if valid, remove or disable access to the file and share link — normally within 36 hours.</li><li>Under Section 52(1)(c) of the Copyright Act and Rule 75, access is disabled for 21 days; it stays disabled if you give us a court order within that time.</li><li>We notify the uploader and may freeze rewards earned from the file.</li><li>We keep a record of the notice and action for legal purposes.</li></ul> },
        { id: "cloud", title: "Content stored in our cloud", body: <p>Tanyora is a cloud file storage and sharing service. Files are uploaded by users, stored in cloud object storage (Cloudflare R2) and made available only through share links created by the uploader. We do not pre-screen uploads, but on a valid notice we disable the share link and remove the stored copy, including copies created by converting that link. Removed content and related logs may be preserved for up to 180 days where the law requires.</p> },
        { id: "counter", title: "Counter-notice", body: <><p>If you believe your file was removed by mistake or you have permission to share it, you can send a counter-notice with: your name, address, phone and email; the removed share link; a statement under penalty of perjury that you believe it was removed by mistake or misidentification; consent to the jurisdiction of the courts of Gujarat, India (or, for DMCA, the federal court for your address); and your signature.</p><p>We forward valid counter-notices to the complainant. Unless they tell us they have filed a court action, we may restore the content in 10 to 14 business days.</p></> },
        { id: "repeat", title: "Repeat infringer policy", body: <p>Accounts that receive repeated valid copyright notices are terminated. Normally a first strike removes the content with a warning, a second strike suspends rewards and uploads, and a third strike permanently bans the account. Serious or commercial-scale piracy may lead to an immediate ban.</p> },
        { id: "misuse", title: "Misuse of notices", body: <p>Sending a notice you know is false can make you liable for damages under Section 512(f) of the DMCA and Indian law. Do not use this process for non-copyright complaints — use <Link to="/content-reporting">Report content</Link> instead.</p> },
        { id: "trademark", title: "Trademarks and other rights", body: <p>For trademark, privacy, impersonation or defamation complaints, use the form below with the closest reason and explain the issue, or contact the <Link to="/grievance">Grievance Officer</Link>.</p> },
      ]}
    >
      <ContentReportForm defaultReason="copyright" />
    </LegalDoc>
  );
}
