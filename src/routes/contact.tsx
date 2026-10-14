import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { ContactForm } from "@/components/ContactForm";
import { pageHead, site } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("Contact Support", "Contact the Tanyora support team with questions about your account, files or payouts.", "/contact"),
  component: ContactPage,
});

function ContactPage() {
  return (
    <LegalPage title="Contact Support">
      <p>Questions about your account, files or payouts? Send us a message below.</p>
      <ContactForm />
      <h2>Email</h2>
      <p>You can also write to <a className="text-primary underline" href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>.</p>
      <h2>Complaints</h2>
      <p>To report content, see <Link className="text-primary underline" to="/copyright">Copyright & Safety</Link>. To delete your account, see <Link className="text-primary underline" to="/delete-account">Account deletion</Link>.</p>
    </LegalPage>
  );
}
