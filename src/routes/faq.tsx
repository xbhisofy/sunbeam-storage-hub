import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/faq")({
  head: () => pageHead("Help & FAQ", "Answers to common questions about Tanyora storage, sharing, safety, rewards and accounts.", "/faq"),
  component: FAQ,
});

const qs: { q: string; a: React.ReactNode }[] = [
  { q: "What is Tanyora?", a: "Tanyora is cloud storage and file sharing for the web and Android. Upload files, create share links and open them in the Tanyora app." },
  { q: "Are my files private?", a: "Yes. Files are stored privately and can only be opened through share links you create. You can set links to expire after 1 hour, 24 hours, 7 days or 30 days." },
  { q: "How do I delete a file or stop a share link?", a: "Open My Files, tap the three dots on the file and choose Move to Trash. The share link stops working immediately." },
  { q: "Why does the share link open in the app?", a: "Shared files open in the Tanyora Android app for the best playback and safety. If the app is not installed you will be sent to Google Play." },
  { q: "How do rewards work?", a: <>Eligible users earn from genuine views of their links or new signups through their referral link. Fake traffic is not allowed. See the <Link to="/terms">Terms</Link>.</> },
  { q: "How do I withdraw?", a: "On the website, open Earnings once you reach the minimum balance and choose UPI, PayPal, Bank Transfer or USDT. Payouts are reviewed manually." },
  { q: "What content is not allowed?", a: <>Pirated, sexual, abusive, violent, illegal or harmful content. Read the <Link to="/acceptable-use">Acceptable Use Policy</Link>.</> },
  { q: "How do I report a file?", a: <>Tap Report under the file in the app, or use <Link to="/content-reporting">Report content</Link>. No account needed.</> },
  { q: "Someone shared my private photos or video. What do I do?", a: <>Report it to us immediately — we act within 24 hours — and file a complaint at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a> or call 1930.</> },
  { q: "My content was copied. How do I get it removed?", a: <>Send a notice through our <Link to="/copyright">Copyright & DMCA</Link> page.</> },
  { q: "I forgot my password.", a: <>Contact support through the <Link to="/contact">contact form</Link> from your registered email.</> },
  { q: "How do I delete my account?", a: <>Go to Profile → Delete account, or follow the <Link to="/delete-account">account deletion steps</Link>.</> },
];

function FAQ() {
  return (
    <LegalPage title="Help & FAQ">
      <div className="space-y-3">
        {qs.map((x) => (
          <details key={x.q} className="group rounded-2xl border bg-card p-5 [&_a]:text-primary [&_a]:underline">
            <summary className="cursor-pointer list-none text-base font-semibold text-foreground">{x.q}</summary>
            <div className="mt-2">{x.a}</div>
          </details>
        ))}
      </div>
      <p>Still need help? <Link className="text-primary underline" to="/contact">Contact support</Link>.</p>
    </LegalPage>
  );
}
