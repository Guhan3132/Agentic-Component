import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { SITE_URL } from "@/lib/site";
import tokenData from "@/lib/tokens.json";
import { patterns } from "@/registry";
import { themeInlineCss, tokenCss } from "@/theme/token-css";

export const metadata: Metadata = {
  title: "Get started",
  description: "Add an Agentic UI pattern to your React project with the shadcn CLI in a few minutes.",
  alternates: { canonical: "/get-started" },
};

const origin = SITE_URL;

// Generated from the same token list as the registry and the site, so it is always complete and current.
const tokens = `${tokenCss(tokenData.tokens)}

${themeInlineCss(tokenData.tokens)}`;

const cn = `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-sm text-background">{n}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function GetStarted() {
  return (
    <main className="pb-24 pt-10">
      <div className="mx-auto max-w-3xl px-5">
        <h1 className="text-4xl font-semibold sm:text-5xl">Get started</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Each pattern is one file that you own. Install it with the shadcn CLI, or copy the code. No package to keep up to date.
        </p>

        <Step n={1} title="Check you have the basics">
          <ul className="list-disc space-y-1 pl-5">
            <li>React 18 or 19 and TypeScript</li>
            <li>Tailwind CSS v4</li>
            <li>Browsers from 2023 on: Chrome and Edge 111+, Safari 16.4+, Firefox 113+ (for OKLCH colours, color-mix() and container queries)</li>
            <li>
              A shadcn project (<code className="text-foreground">npx shadcn@latest init</code>), which gives you the theme tokens and{" "}
              <code className="text-foreground">cn</code> in <code className="text-foreground">@/lib/utils</code>
            </li>
          </ul>
        </Step>

        <Step n={2} title="Install a pattern">
          <CodeBlock code={`npx shadcn@latest add "${origin}/r/approval-step.json"`} file="terminal" />
          <p>
            Swap <code className="text-foreground">approval-step</code> for any pattern name. The CLI adds the file to your{" "}
            <code className="text-foreground">components/ui</code> folder and installs <code className="text-foreground">lucide-react</code> and{" "}
            <code className="text-foreground">motion</code> if the pattern needs them.
          </p>
        </Step>

        <Step n={3} title="Pin a version (optional)">
          <p>
            The URL above always serves the latest. To lock to a release, use its versioned path, which never changes once published:
          </p>
          <CodeBlock code={`npx shadcn@latest add "${origin}/r/v0.4.0/approval-step.json"`} file="terminal" />
          <p>
            Check any file against <a className="text-foreground underline" href="/r/checksums.txt">the published checksums</a>. Releases are listed on{" "}
            <a className="text-foreground underline" href="https://github.com/Guhan3132/Agentic-Component/releases" target="_blank" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
        </Step>

        <Step n={4} title="Use it">
          <p>
            Every pattern page has a usage snippet and a props table. The component takes plain props and callbacks, so you connect it to your
            own agent, whether that is a stream from an API or a mock.
          </p>
          <p>
            Prefer an AI to wire it up? Use <strong className="text-foreground">Copy prompt</strong> on a pattern page for Claude Code, Cursor,
            Codex, Lovable, Bolt.new, v0 or Replit.
          </p>
        </Step>

        <Step n={5} title="Use your brand colour (optional)">
          <p>
            One hex colour restyles every pattern, in light and dark, with contrast checked. Try it with the <strong className="text-foreground">Brand</strong> button at the bottom left, then follow{" "}
            <Link href="/tokens" className="text-foreground underline">
              Tokens and theming
            </Link>
            . To change radius, fonts or spacing, see{" "}
            <Link href="/customize" className="text-foreground underline">
              Customising components
            </Link>
            .
          </p>
        </Step>

        <Step n={6} title="If it looks wrong">
          <p>
            The components read shadcn&apos;s tokens plus three status colours (<code className="text-foreground">success</code>,{" "}
            <code className="text-foreground">warning</code>, <code className="text-foreground">danger</code>). The CLI adds any you are missing. If you install by hand, add
            this to your global CSS (light, dark, and the Tailwind mapping):
          </p>
          <CodeBlock code={tokens} file="globals.css" />
          <p>
            If your project has no <code className="text-foreground">cn</code> helper yet, create <code className="text-foreground">lib/utils.ts</code>:
          </p>
          <CodeBlock code={cn} file="lib/utils.ts" />
        </Step>

        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight">Patterns</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {patterns.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/components/${p.slug}`}
                  className="block rounded-xl border border-border bg-card p-3.5 hover:bg-muted/60"
                >
                  <span className="font-medium text-foreground">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{p.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
