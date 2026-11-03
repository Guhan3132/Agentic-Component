"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { usePathname } from "next/navigation";

const repo = "https://github.com/Guhan3132/Agentic-Component";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/#patterns", label: "Patterns" },
      { href: "/playground", label: "Playground" },
      { href: "/get-started", label: "Get started" },
      { href: "/tokens", label: "Tokens and theming" },
      { href: "/customize", label: "Customising" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about", label: "About" },
      { href: repo, label: "GitHub", external: true },
      { href: `${repo}/blob/main/CHANGELOG.md`, label: "Changelog", external: true },
    ],
  },
  {
    title: "Contribute",
    links: [
      { href: `${repo}/blob/main/CONTRIBUTING.md`, label: "Contributing", external: true },
      { href: `${repo}/issues/new/choose`, label: "Request a pattern", external: true },
      { href: `${repo}/security/advisories/new`, label: "Report a vulnerability", external: true },
    ],
  },
];

/** Site footer. Hidden on the playground, which fills the screen like a chat app. */
export function Footer() {
  const pathname = usePathname();
  if (pathname === "/playground") return null;

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Logo size={24} className="rounded-md" />
            Agentic UI
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Open-source UX patterns for AI agents. Click them, break them, copy them.
          </p>
        </div>
        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.title}</h2>
            <ul className="mt-3 space-y-1">
              {c.links.map((l) => (
                <li key={l.label}>
                  {"external" in l ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="-mx-1 block rounded px-1 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:underline">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="-mx-1 block rounded px-1 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:underline">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-4 text-xs text-muted-foreground">
          <span>MIT licensed. Built by Guhan3132.</span>
          <span>Anonymous page-view analytics only. No cookies.</span>
        </div>
      </div>
    </footer>
  );
}
