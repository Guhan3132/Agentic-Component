import Link from "next/link";

const links = [
  { href: "/#patterns", label: "Patterns" },
  { href: "/components/prompt-composer", label: "Composer" },
  { href: "/playground", label: "Playground" },
];

/** Solid white bar, the same width as the page content, so everything below lines up with the logo. */
export function Header() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-zinc-900 text-xs text-white">A</span>
            Agentic UI
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium text-zinc-600 sm:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 hover:bg-zinc-900/5 hover:text-zinc-900 active:bg-zinc-900/10">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/playground" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-900/5 sm:hidden">
            Playground
          </Link>
          <Link href="/#patterns" className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-zinc-700">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
