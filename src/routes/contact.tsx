import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/contact")({
  head: () => pageHead('Contact & Operator Details', 'Tanyora operator, support and privacy enquiry details.', "/contact"),
  component: () => <LegalPage title='Contact & Operator Details'><h2>Operator</h2><p>{site.operator}<br />{site.location}</p><h2>Support and privacy enquiries</h2><p><a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a></p><p>This address was supplied by the operator. Its mailbox availability has not been verified. The intended brand domain is tanyora.com; domain connection and email delivery are separate setup steps.</p><h2>Complaints</h2><p>For the information needed in a content complaint, see <Link className="text-primary underline" to="/copyright">Copyright & Safety</Link>. For deletion, see <Link className="text-primary underline" to="/delete-account">Account deletion</Link>.</p><h2>Business particulars</h2><p>A complete postal/service address and a designated grievance officer have not yet been provided. No business registration, tax registration or regulatory certification is claimed.</p></LegalPage>,
});
