import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/cookies")({
  head: () => pageHead("Cookie Policy", "The cookies and browser storage Tanyora uses and how to control them.", "/cookies"),
  component: Cookies,
});

function Cookies() {
  return (
    <LegalDoc
      title="Cookie Policy"
      intro={<p>This policy explains how Tanyora uses cookies and similar browser storage (local storage and session storage) on the website and in the Android app.</p>}
      summary={["We only use storage that is essential to run the Service.", "We do not use advertising or cross-site tracking cookies today."]}
      sections={[
        { id: "what", title: "What we use", body: <ul><li><strong>Sign-in session</strong> (local storage): keeps you logged in securely. Removed when you log out.</li><li><strong>App preferences</strong> (session storage): for example, remembering that the welcome screen was already shown.</li><li><strong>Security</strong>: technical data needed to prevent abuse and keep accounts safe.</li></ul> },
        { id: "ads", title: "Advertising", body: <p>Share pages may show an advertisement before a file opens. If we add third-party advertising or analytics partners that use cookies, we will update this policy and, where required, ask for your consent first.</p> },
        { id: "control", title: "Your choices", body: <p>You can clear or block cookies and site data in your browser settings. Blocking essential storage will sign you out and some features will stop working.</p> },
        { id: "more", title: "More information", body: <p>See our <Link to="/privacy">Privacy Policy</Link> or <Link to="/contact">contact us</Link>.</p> },
      ]}
    />
  );
}
