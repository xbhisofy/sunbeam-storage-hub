import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead, site } from "@/lib/site";
export const Route = createFileRoute("/acceptable-use")({
  head: () => pageHead("Acceptable Use Policy", "Rules for what you may and may not store or share on Tanyora.", "/acceptable-use"),
  component: () => <LegalPage title="Acceptable Use Policy"><p>This policy applies to everything you upload, store or share through Tanyora on the website or Android app.</p>
<h2>You must not upload or share</h2><ul className="list-disc space-y-1 pl-5"><li>Child sexual abuse material or any content that sexualises minors.</li><li>Content that infringes copyright, trademarks or other rights you do not hold.</li><li>Malware, phishing pages or files designed to harm devices or steal data.</li><li>Non-consensual intimate images, doxxing or private data about others.</li><li>Content promoting terrorism, violent extremism or credible threats.</li><li>Illegal goods, scams, or material that breaks applicable law.</li></ul>
<h2>Misuse of the service</h2><p>Do not generate artificial views or signups, automate abuse, bypass link expiry, probe our systems or overload them.</p>
<h2>Enforcement</h2><p>We may remove content, disable share links, withhold rewards obtained through abuse, suspend or close accounts, and report illegal content to authorities. Report a violation at <Link className="text-primary underline" to="/content-reporting">Report content</Link>.</p></LegalPage>,
});
