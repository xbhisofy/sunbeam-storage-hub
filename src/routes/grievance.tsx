import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/grievance")({
  head: () => pageHead("Grievance Redressal", "Contact the Tanyora grievance officer.", "/grievance"),
  component: () => <LegalPage title="Grievance Redressal"><p>In line with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, users can raise complaints with our grievance officer.</p>
<h2>Grievance officer</h2><p>Name: {site.operator}<br/>Email: <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a><br/>Location: {site.location}</p>
<h2>Timelines</h2><p>We acknowledge complaints within 24 hours and aim to resolve them within 15 days. Requests to remove content that exposes a person's private areas or impersonates them are handled within 24 hours.</p>
<h2>What to include</h2><p>Your name, contact email, the share link or account concerned, and a description of the issue.</p></LegalPage>,
});
