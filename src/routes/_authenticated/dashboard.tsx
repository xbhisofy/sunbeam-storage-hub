import { pageHead } from "@/lib/site";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Share2, Upload, Wallet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "./route";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard", "Your Tanyora overview.", undefined, true),
  component: Dashboard,
});

function Dashboard() {
  const { data: p } = useProfile();
  const cards = [
    { to: "/content", icon: Upload, title: "Upload & Share", text: "Upload files and get shareable links" },
    { to: "/earnings", icon: Wallet, title: "Earnings", text: `Balance: ${money(Number(p?.balance ?? 0))}` },
    { to: "/referrals", icon: Users, title: "Referrals", text: "Invite friends and earn a bonus" },
  ] as const;
  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold">Hi, {p?.display_name}</h1>
      <p className="mt-1 text-muted-foreground">Here's how your content is performing.</p>
      <div className="mt-8 flex gap-5 rounded-2xl border bg-card p-6">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Share2 className="h-5 w-5" /></span>
        <div>
          <h2 className="font-semibold text-lg">Get your first payout</h2>
          <ol className="mt-2 space-y-1 text-muted-foreground">
            <li>1. Upload a video, audio or PDF file.</li>
            <li>2. Share its link. Every view adds money to your balance.</li>
          </ol>
          <Button className="mt-4" asChild><Link to="/content">Upload a file</Link></Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="rounded-2xl border bg-card p-5 hover:border-primary">
            <c.icon className="h-6 w-6 text-primary" />
            <div className="mt-3 font-semibold">{c.title}</div>
            <div className="text-sm text-muted-foreground">{c.text}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
