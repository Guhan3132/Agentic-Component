import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { BrandCss, CopyText } from "@/components/TokenTools";
import { cn } from "@/lib/cn";
import { SITE_URL } from "@/lib/site";
import tokenData from "@/lib/tokens.json";
import { LATEST_RELEASE } from "@/registry";
import { contrast, deriveTheme, parseColor, wcagLevel, type Rgb } from "@/theme/derive";
import { sampleThemes } from "@/theme/samples";
import { themeInlineCss, tokenCss } from "@/theme/token-css";

export const metadata: Metadata = {
  title: "Tokens and theming",
  description: "The colour tokens every Agentic UI component reads, how to give them your brand colour, and the contrast they reach.",
  alternates: { canonical: "/tokens" },
};

const origin = SITE_URL;
const groups = ["Brand", "Surface", "Status"] as const;
const value = (name: string, mode: "light" | "dark") => parseColor(tokenData.tokens.find((t) => t.name === name)![mode])!;
const over = (fg: Rgb, alpha: number, bg: Rgb): Rgb => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as Rgb;

// The pairs that actually appear in the components.
const PAIRS: { label: string; fg: string; bg: string | [string, number]; kind: "text" | "ui" }[] = [
  { label: "Text on the page", fg: "foreground", bg: "background", kind: "text" },
  { label: "Secondary text on a card", fg: "muted-foreground", bg: "card", kind: "text" },
  { label: "Secondary text on muted", fg: "muted-foreground", bg: "muted", kind: "text" },
  { label: "Button text on primary", fg: "primary-foreground", bg: "primary", kind: "text" },
  { label: "Focus ring on a card", fg: "ring", bg: "card", kind: "ui" },
  { label: "Success on its tint", fg: "success", bg: ["success", 0.1], kind: "text" },
  { label: "Warning on its tint", fg: "warning", bg: ["warning", 0.1], kind: "text" },
  { label: "Danger on its tint", fg: "danger", bg: ["danger", 0.1], kind: "text" },
];
const pairRatio = (p: (typeof PAIRS)[number], mode: "light" | "dark") => {
  const bg = typeof p.bg === "string" ? value(p.bg, mode) : over(value(p.bg[0], mode), p.bg[1], value("card", mode));
  return contrast(value(p.fg, mode), bg);
};

function Swatch({ value: v, dark }: { value: string; dark?: boolean }) {
  // Dark values are drawn on a dark chip, so translucent ones (like the dark border) show as they really look.
  return (
    <span className={cn("inline-flex items-center gap-1.5", dark && "dark rounded-md bg-card p-1 pr-0 text-foreground")}>
      <span aria-hidden className="size-5 shrink-0 rounded-md ring-1 ring-foreground/15" style={{ background: v }} />
      <CopyText text={v} className="text-muted-foreground" />
    </span>
  );
}

function Level({ ratio, kind }: { ratio: number; kind: "text" | "ui" }) {
  const level = wcagLevel(ratio, kind);
  return (
    <span className={cn("font-mono text-xs", level === "Fail" ? "text-danger" : "text-success")}>
      {ratio.toFixed(1)} {level === "Fail" ? "✗" : "✓"} {level}
    </span>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-20 text-2xl font-semibold tracking-tight">
      <a href={`#${id}`} className="hover:underline">
        {children}
      </a>
    </h2>
  );
}

/** A strip of real component parts, in light and dark side by side. It follows the Brand panel. */
function Preview() {
  return (
    <div aria-label="Live preview" className="mt-5 grid gap-3 sm:grid-cols-2">
      {(["light", "dark"] as const).map((mode) => (
        <div key={mode} className={cn(mode, "space-y-3 rounded-2xl border border-border bg-background p-4 text-foreground")}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{mode}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">Approve</span>
            <span className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground">Reject</span>
            <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs text-warning">Needs review</span>
          </div>
          <span className="block rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-muted-foreground outline-2 outline-offset-2 outline-ring">Focused input</span>
          <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
            <span className="block h-full w-2/3 rounded-full bg-primary" />
          </span>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="text-success">✓ Approved</span>
            <span className="text-warning">Retrying in 3s</span>
            <span className="text-danger">Failed</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Tokens() {
  return (
    <main className="pb-24 pt-10">
      <div className="mx-auto max-w-4xl px-5">
        <h1 className="text-4xl font-semibold sm:text-5xl">Tokens and theming</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Every component reads its colours from a small set of CSS variables: shadcn&apos;s names, plus <code>success</code>, <code>warning</code> and{" "}
          <code>danger</code> for status. Change them and every pattern follows, in light and dark. Try the <strong className="text-foreground">Brand</strong>{" "}
          button at the bottom left: this page follows it.
        </p>
        <Preview />

        <H2 id="brand">Use your brand colour</H2>
        <p className="mt-3 text-muted-foreground">
          A brand colour changes three tokens: <code>primary</code>, <code>primary-foreground</code> and <code>ring</code>. Button text is picked for contrast
          (or kept white, with the button darkened until it passes), the focus ring is darkened if your colour is too light to see on white, and in dark mode a
          colour that would disappear is lightened. Status colours and neutrals are never changed. Pick one of three ways:
        </p>

        <h3 className="mt-6 font-medium text-foreground">1. Install a preset</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Writes the brand tokens into your global stylesheet. The versioned URL never changes after release; the plain one always serves the latest.
        </p>
        <div className="mt-3 space-y-3">
          <CodeBlock code={`# pinned to v${LATEST_RELEASE} (recommended)\nnpx shadcn@latest add "${origin}/r/v${LATEST_RELEASE}/theme-violet.json"\n\n# latest\nnpx shadcn@latest add "${origin}/r/theme-violet.json"`} file="terminal" />
        </div>

        <h3 className="mt-6 font-medium text-foreground">2. Wrap with your colour</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Installs <code>AgenticTheme</code> and its colour maths (no other dependencies). It takes hex, <code>rgb()</code>, <code>hsl()</code> or <code>oklch()</code>.
          Wrap the whole app, or one section with its own colour.
        </p>
        <div className="mt-3 space-y-3">
          <CodeBlock code={`npx shadcn@latest add "${origin}/r/v${LATEST_RELEASE}/theme-brand.json"`} file="terminal" />
          <CodeBlock
            code={`import { AgenticTheme } from "@/components/ui/agentic-theme"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AgenticTheme brand="#7c3aed" textColor="white">
      {children}
    </AgenticTheme>
  )
}`}
            file="layout.tsx"
          />
        </div>

        <h3 className="mt-6 font-medium text-foreground">3. Paste the CSS</h3>
        <div className="mt-3">
          <BrandCss />
        </div>

        <H2 id="samples">The 10 samples</H2>
        <p className="mt-3 text-muted-foreground">
          Each is an installable preset. Contrast is for button text (AA needs 4.5) and the focus ring (AA needs 3), in light / dark. A few sit close to a
          status colour: they work, but check that badges and errors still stand out.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Theme</th>
                <th className="px-4 py-2 font-medium">Primary (light / dark)</th>
                <th className="px-4 py-2 font-medium">Button text</th>
                <th className="px-4 py-2 font-medium">Focus ring</th>
                <th className="px-4 py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {sampleThemes.map((s) => {
                const t = deriveTheme(s.hex)!;
                return (
                  <tr key={s.id} id={`theme-${s.id}`} className="border-t border-border">
                    <th scope="row" className="px-4 py-2 font-medium text-foreground">
                      {s.name}
                      <CopyText text={`/r/theme-${s.id}.json`} className="block text-muted-foreground" />
                    </th>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-1">
                        <span aria-hidden className="size-5 rounded-md ring-1 ring-foreground/15" style={{ background: t.light.primary }} />
                        <span aria-hidden className="dark size-5 rounded-md bg-card p-0.5">
                          <span className="block size-full rounded" style={{ background: t.dark.primary }} />
                        </span>
                        <CopyText text={s.hex} className="text-muted-foreground" />
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Level ratio={t.report.onPrimary.light} kind="text" /> <span className="text-muted-foreground">/</span> <Level ratio={t.report.onPrimary.dark} kind="text" />
                    </td>
                    <td className="px-4 py-2">
                      <Level ratio={t.report.ring.light} kind="ui" /> <span className="text-muted-foreground">/</span> <Level ratio={t.report.ring.dark} kind="ui" />
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{t.report.statusClash ? <span className="text-warning">Close to {t.report.statusClash}</span> : (s.note ?? "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <H2 id="tokens">All tokens</H2>
        <p className="mt-3 text-muted-foreground">
          These are the defaults the registry adds when you install a pattern, and what this site uses. The CLI only adds the ones your project is missing and
          never changes values you already have. Click a name or value to copy it.
        </p>
        {groups.map((g) => (
          <section key={g} aria-labelledby={`group-${g}`}>
            <h3 id={`group-${g}`} className="mt-8 font-medium text-foreground">
              {g}
              {g === "Status" && <span className="ml-2 text-sm font-normal text-muted-foreground">never follow the brand</span>}
              {g === "Brand" && <span className="ml-2 text-sm font-normal text-muted-foreground">set from your brand colour</span>}
            </h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[44rem] text-left text-sm">
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
                      <tr key={t.name} id={`token-${t.name}`} className="scroll-mt-20 border-t border-border">
                        <th scope="row" className="px-4 py-2 font-normal text-foreground">
                          <CopyText text={`--${t.name}`} />
                        </th>
                        <td className="px-4 py-2 text-muted-foreground">{t.role}</td>
                        <td className="px-4 py-2">
                          <Swatch value={t.light} />
                        </td>
                        <td className="px-4 py-2">
                          <Swatch value={t.dark} dark />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <H2 id="contrast">Contrast</H2>
        <p className="mt-3 text-muted-foreground">The pairs the components actually use, measured with WCAG 2 on the default tokens. Every one passes in both modes.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Pair</th>
                <th className="px-4 py-2 font-medium">Light</th>
                <th className="px-4 py-2 font-medium">Dark</th>
              </tr>
            </thead>
            <tbody>
              {PAIRS.map((p) => (
                <tr key={p.label} className="border-t border-border">
                  <th scope="row" className="px-4 py-2 font-normal text-foreground">
                    {p.label}
                  </th>
                  <td className="px-4 py-2">
                    <Level ratio={pairRatio(p, "light")} kind={p.kind} />
                  </td>
                  <td className="px-4 py-2">
                    <Level ratio={pairRatio(p, "dark")} kind={p.kind} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="export">Use them elsewhere</H2>
        <p className="mt-3 text-muted-foreground">
          The same tokens as a stylesheet, as Tailwind v4 theme variables, and as{" "}
          <a className="text-foreground underline" href="/tokens.dtcg.json" download>
            W3C design tokens (DTCG JSON)
          </a>{" "}
          for Figma plugins and Style Dictionary.
        </p>
        <div className="mt-3 space-y-3">
          <CodeBlock code={`${tokenCss(tokenData.tokens)}\n\n${themeInlineCss(tokenData.tokens)}`} file="globals.css" />
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Want to change radius, fonts, spacing or icons too? See{" "}
          <Link href="/customize" className="text-foreground underline">
            Customising components
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
