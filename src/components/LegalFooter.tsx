import { Link } from "@tanstack/react-router";
export function LegalFooter() {
  return <footer className="border-t px-5 py-6 text-sm text-muted-foreground">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
      <span>Tanyora · Abhishek kumar</span>
      <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-3">
        <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link>
        <Link to="/community-guidelines">Community guidelines</Link><Link to="/copyright">Copyright & safety</Link>
        <Link to="/delete-account">Delete account</Link><Link to="/contact">Contact</Link>
      </nav>
    </div>
  </footer>;
}
