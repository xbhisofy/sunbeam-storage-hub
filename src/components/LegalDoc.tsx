import type { ReactNode } from "react";
import { LegalPage } from "@/components/LegalPage";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Long-form legal page with a summary box and a clickable table of contents. */
export function LegalDoc({ title, intro, summary, sections, children }: { title: string; intro: ReactNode; summary?: string[]; sections: LegalSection[]; children?: ReactNode }) {
  return (
    <LegalPage title={title}>
      <div className="space-y-3 text-[15px]">{intro}</div>
      {summary && summary.length > 0 && (
        <div className="rounded-2xl border bg-accent/40 p-5">
          <p className="text-sm font-semibold text-foreground">Key points</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">{summary.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      )}
      {children}
      <nav aria-label="Contents" className="rounded-2xl border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Contents</p>
        <ol className="mt-2 grid list-decimal gap-1.5 pl-5 sm:grid-cols-2">
          {sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-primary hover:underline">{s.title}</a></li>)}
        </ol>
      </nav>
      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:text-primary [&_a]:underline [&_strong]:text-foreground">
          <h2>{i + 1}. {s.title}</h2>
          {s.body}
        </section>
      ))}
    </LegalPage>
  );
}

/** Official Indian and international places to report crimes, shown on safety pages. */
export function OfficialReporting() {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
      <p className="font-semibold text-foreground">Report crimes directly to the authorities</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 [&_a]:text-primary [&_a]:underline">
        <li>India — National Cyber Crime Reporting Portal: <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a> (women and child related crimes can be reported anonymously).</li>
        <li>India — Cyber fraud helpline: call <strong className="text-foreground">1930</strong>. Emergency: call <strong className="text-foreground">112</strong>.</li>
        <li>Child sexual abuse material — NCMEC CyberTipline: <a href="https://report.cybertip.org" target="_blank" rel="noopener noreferrer">report.cybertip.org</a>.</li>
        <li>Childline India (children in distress): call <strong className="text-foreground">1098</strong>.</li>
      </ul>
      <p className="mt-2">Do not download, copy, forward or keep illegal material, even to use as evidence. Share the link only with Tanyora and the authorities.</p>
    </div>
  );
}
