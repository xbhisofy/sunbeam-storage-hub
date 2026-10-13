import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/law-enforcement")({
  head: () => pageHead("Law Enforcement and Government Requests", "How Tanyora responds to requests from authorities.", "/law-enforcement"),
  component: () => <LegalPage title="Law Enforcement and Government Requests"><p>We respond to valid legal requests from authorities under applicable law, including Indian law.</p>
<h2>How to submit</h2><p>Send requests from an official address to <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>, stating the legal basis, the issuing authority and the specific share links or accounts concerned.</p>
<h2>Our approach</h2><p>We review each request, may ask for clarification, and disclose only the information legally required. Emergency requests involving risk of death or serious harm are prioritised. Where permitted, we may notify the affected user.</p></LegalPage>,
});
