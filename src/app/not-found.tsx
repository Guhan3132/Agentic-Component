import type { Metadata } from "next";
import Link from "next/link";
import { patterns } from "@/registry";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  const picks = patterns.filter((p) => ["streaming-response", "approval-step", "prompt-composer", "task-checklist"].includes(p.slug));
  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-20">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">This page is not here</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        The link may be old, or a pattern may have been merged into another one. Everything still on the site is one click away.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/#patterns" className="rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90 sm:py-2.5">
          Browse all patterns
        </Link>
        <Link href="/get-started" className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted sm:py-2.5">
          Get started
        </Link>
      </div>
      <h2 className="mt-14 text-sm font-medium uppercase tracking-wider text-muted-foreground">Popular patterns</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {picks.map((p) => (
          <li key={p.slug}>
            <Link href={`/components/${p.slug}`} className="block rounded-xl border border-border bg-card p-3.5 hover:bg-muted">
              <span className="font-medium text-foreground">{p.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{p.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
