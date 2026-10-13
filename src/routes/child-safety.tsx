import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/child-safety")({
  head: () => pageHead("Child Safety Standards", "Tanyora standards against child sexual abuse and exploitation (CSAE).", "/child-safety"),
  component: () => <LegalPage title="Child Safety Standards"><p>Tanyora has zero tolerance for child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM).</p>
<h2>Our standards</h2><ul className="list-disc space-y-1 pl-5"><li>Uploading, storing or sharing CSAM, or content that sexualises minors, is prohibited.</li><li>Grooming, sextortion or any attempt to exploit a child is prohibited.</li><li>Violating content is removed, the account is closed, and we report to relevant authorities, including the National Center for Missing &amp; Exploited Children (NCMEC) and Indian authorities where required.</li></ul>
<h2>Report</h2><p>Report immediately to <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with the share link. Reports are reviewed with top priority. You can also report to the National Cybercrime Reporting Portal at cybercrime.gov.in.</p>
<h2>Contact</h2><p>Child safety point of contact: {site.operator}, <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.</p></LegalPage>,
});
