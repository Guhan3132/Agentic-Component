import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/#patterns", label: "Patterns" },
  { href: "/tokens", label: "Tokens" },
  { href: "/playground", label: "Playground" },
];

/** A solid bar, the same width as the page content, so everything below lines up with the logo. */
export function Header() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Logo size={24} className="rounded-md" />
            Agentic UI
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 text-sm font-medium text-muted-foreground sm:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/playground" className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/5 sm:hidden">
            Playground
          </Link>
          <ThemeToggle />
          <Link href="/get-started" className="rounded-lg bg-foreground px-3.5 py-2 text-sm font-medium text-background hover:bg-foreground/85">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
