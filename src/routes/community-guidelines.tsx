import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/community-guidelines")({
  head: () => pageHead("Community Guidelines", "Simple rules for sharing safely and respectfully on Tanyora.", "/community-guidelines"),
  component: CG,
});

function CG() {
  return (
    <LegalDoc
      title="Community Guidelines"
      intro={<p>Tanyora is a place to store and share your own files safely. These guidelines explain, in simple words, how to keep it that way. The full rules are in the <Link to="/acceptable-use">Acceptable Use Policy</Link> and <Link to="/terms">Terms of Service</Link>.</p>}
      sections={[
        { id: "own", title: "Share only what you own", body: <p>Upload your own photos, videos, documents and creations. Don't upload movies, series, music, courses or software made by others unless you have permission.</p> },
        { id: "respect", title: "Respect people", body: <p>Never share someone's private photos, videos, phone number, address or documents without their clear consent. No harassment, hate, threats or bullying.</p> },
        { id: "kids", title: "Protect children", body: <p>Nothing that sexualises or harms a child, ever. We report this to the police. See <Link to="/child-safety">Child Safety Standards</Link>.</p> },
        { id: "safe", title: "Keep it safe", body: <p>No scams, malware, fake offers, violence, terrorism, drugs or weapons. No adult or pornographic content.</p> },
        { id: "honest", title: "Earn honestly", body: <p>Rewards are for real people viewing your links. Bots, fake accounts and click tricks lead to a ban and loss of all rewards.</p> },
        { id: "report", title: "Speak up", body: <p>See something wrong? Tap Report under the file in the app or use <Link to="/content-reporting">Report content</Link>. Reports can be anonymous.</p> },
        { id: "consequences", title: "Consequences", body: <p>Breaking these guidelines can lead to content removal, account suspension, a permanent ban, loss of rewards and, for crimes, a report to the authorities.</p> },
      ]}
    />
  );
}
