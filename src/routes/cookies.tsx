import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead } from "@/lib/site";
export const Route = createFileRoute("/cookies")({
  head: () => pageHead("Cookie Policy", "How Tanyora uses cookies and browser storage.", "/cookies"),
  component: () => <LegalPage title="Cookie Policy"><p>Tanyora uses only essential browser storage and cookies needed to keep you signed in and remember basic settings.</p>
<h2>What we use</h2><ul className="list-disc space-y-1 pl-5"><li>Sign-in session storage, so you stay logged in.</li><li>Basic preferences, such as app mode detection.</li></ul>
<h2>What we do not use</h2><p>We do not currently use advertising or third-party analytics cookies. If that changes, this policy will be updated and consent will be requested where required.</p>
<h2>Control</h2><p>You can clear cookies and site data in your browser; this will sign you out.</p></LegalPage>,
});
