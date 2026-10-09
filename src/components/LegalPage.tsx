import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-5 py-3">
        <Link to="/" className="font-semibold">TenBox</Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-5 py-10 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p>Last updated: October 10, 2026</p>
        {children}
      </main>
    </div>
  );
}
