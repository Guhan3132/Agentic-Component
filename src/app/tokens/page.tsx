import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import tokenData from "@/lib/tokens.json";
import { deriveTheme } from "@/theme/derive";
import { sampleThemes } from "@/theme/samples";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tokens and theming",
  description: "The colour tokens every Agentic UI component reads, and how to give them your brand colour.",
  alternates: { canonical: "/tokens" },
};

const origin = SITE_URL;
const groups = ["Brand", "Surface", "Status"] as const;

function Swatch({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="size-5 shrink-0 rounded-md ring-1 ring-foreground/10" style={{ background: value }} />
      <code className="text-xs text-muted-foreground">{value}</code>
    </span>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-20 text-2xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export default function Tokens() {
  return (
    <main className="pb-24 pt-10">
      <div className="mx-auto max-w-4xl px-5">
        <h1 className="text-4xl font-semibold sm:text-5xl">Tokens and theming</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Every component reads its colours from a small set of CSS variables, the same names shadcn uses. Change the variables and every pattern follows,
          in light and dark. Try it with the <strong className="text-foreground">Brand</strong> button at the bottom left of any page.
        </p>

        <H2 id="brand">Use your brand colour</H2>
        <p className="mt-3 text-muted-foreground">
          A brand colour changes three tokens: <code>primary</code>, <code>primary-foreground</code> and <code>ring</code>. The text colour on buttons is
          picked for contrast, the focus ring is darkened if your colour is too light to see on white, and in dark mode a colour that would disappear is
          lightened. Status colours and neutrals are never changed, so an error never looks like branding. Pick one of three ways:
        </p>

        <h3 className="mt-6 font-medium text-foreground">1. Install a preset</h3>
        <p className="mt-1 text-sm text-muted-foreground">Writes the brand tokens into your global stylesheet. Pick a sample below, or use option 2 for your own colour.</p>
        <div className="mt-3">
          <CodeBlock code={`npx shadcn@latest add "${origin}/r/theme-violet.json"`} file="terminal" />
        </div>

        <h3 className="mt-6 font-medium text-foreground">2. Wrap with your hex colour</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Installs <code>AgenticTheme</code> and its colour maths (no other dependencies). Wrap the whole app, or one section with its own colour.
        </p>
        <div className="mt-3 space-y-3">
          <CodeBlock code={`npx shadcn@latest add "${origin}/r/theme-brand.json"`} file="terminal" />
          <CodeBlock
            code={`import { AgenticTheme } from "@/components/ui/agentic-theme"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AgenticTheme brand="#7c3aed">{children}</AgenticTheme>
}`}
            file="layout.tsx"
          />
        </div>

        <h3 className="mt-6 font-medium text-foreground">3. Paste the CSS</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No runtime code at all. Use <strong>Copy CSS</strong> in the Brand panel, or generate it once with <code>themeCss(deriveTheme(&quot;#7c3aed&quot;))</code>, and add
          it to your global stylesheet:
        </p>
        <div className="mt-3">
          <CodeBlock
            code={(() => {
              const t = deriveTheme("#7c3aed")!;
              const block = (sel: string, v: Record<string, string>) => `${sel} {\n${Object.entries(v).map(([k, x]) => `  --${k}: ${x};`).join("\n")}\n}`;
              return `${block(":root", t.light)}\n\n${block(".dark", t.dark)}`;
            })()}
            file="globals.css"
          />
        </div>

        <H2 id="samples">The 10 samples</H2>
        <p className="mt-3 text-muted-foreground">Each is an installable preset. The numbers are WCAG contrast for button text (AA needs 4.5) and the focus ring (AA needs 3).</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Theme</th>
                <th className="px-4 py-2 font-medium">Light primary</th>
                <th className="px-4 py-2 font-medium">Dark primary</th>
                <th className="px-4 py-2 font-medium">Button text</th>
                <th className="px-4 py-2 font-medium">Install</th>
              </tr>
            </thead>
            <tbody>
              {sampleThemes.map((s) => {
                const t = deriveTheme(s.hex)!;
                return (
                  <tr key={s.id} className="border-t border-border">
                    <th scope="row" className="px-4 py-2 font-medium text-foreground">
                      {s.name}
                    </th>
                    <td className="px-4 py-2">
                      <Swatch value={t.light.primary} />
                    </td>
                    <td className="px-4 py-2">
                      <Swatch value={t.dark.primary} />
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {t.report.onPrimary.light.toFixed(1)} / {t.report.onPrimary.dark.toFixed(1)}
                    </td>
                    <td className="px-4 py-2">
                      <code className="text-xs text-muted-foreground">/r/theme-{s.id}.json</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <H2 id="tokens">All tokens</H2>
        <p className="mt-3 text-muted-foreground">
          These are the defaults the registry adds when you install a pattern. The CLI only adds the ones your project is missing and never changes values
          you already have.
        </p>
        {groups.map((g) => (
          <section key={g} aria-labelledby={`group-${g}`}>
            <h3 id={`group-${g}`} className="mt-8 font-medium text-foreground">
              {g}
              {g === "Status" && <span className="ml-2 text-sm font-normal text-muted-foreground">never follow the brand</span>}
              {g === "Brand" && <span className="ml-2 text-sm font-normal text-muted-foreground">set from your brand colour</span>}
            </h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Token</th>
                    <th className="px-4 py-2 font-medium">Used for</th>
                    <th className="px-4 py-2 font-medium">Light</th>
                    <th className="px-4 py-2 font-medium">Dark</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenData.tokens
                    .filter((t) => t.group === g)
                    .map((t) => (
                      <tr key={t.name} className="border-t border-border">
                        <th scope="row" className="px-4 py-2 font-mono text-xs font-normal text-foreground">
                          --{t.name}
                        </th>
                        <td className="px-4 py-2 text-muted-foreground">{t.role}</td>
                        <td className="px-4 py-2">
                          <Swatch value={t.light} />
                        </td>
                        <td className="px-4 py-2">
                          <Swatch value={t.dark} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <p className="mt-10 text-sm text-muted-foreground">
          Want to change radius, fonts, spacing or icons too? Those live in the component file you own. See{" "}
          <Link href="/customize" className="text-foreground underline">
            Customising components
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
