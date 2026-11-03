import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Customising components",
  description: "How to change colour, radius, fonts, spacing, icons, motion and wording in Agentic UI components, and what to keep when you do.",
  alternates: { canonical: "/customize" },
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

const toc = [
  ["colour", "Colour"],
  ["radius", "Corner radius"],
  ["type", "Fonts and text size"],
  ["spacing", "Spacing and density"],
  ["icons", "Icons"],
  ["motion", "Motion"],
  ["wording", "Wording and language"],
  ["dark", "Dark mode"],
  ["keep", "What to keep"],
] as const;

export default function Customize() {
  return (
    <main className="pb-24 pt-10">
      <div className="mx-auto max-w-3xl px-5">
        <h1 className="text-4xl font-semibold sm:text-5xl">Customising components</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          When you install a pattern, its file is copied into your project, so you own it. Colour is set through tokens and needs no edits. Everything
          else is plain Tailwind classes in that file: change them like any other code.
        </p>

        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 text-sm">
          {toc.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-border bg-card px-3 py-1 text-foreground/80 hover:border-foreground/30">
              {label}
            </a>
          ))}
        </nav>

        <Section id="colour" title="Colour">
          <p>
            Components read only tokens such as <code>bg-primary</code>, <code>bg-card</code> and <code>text-muted-foreground</code>, so a theme change
            reaches every pattern at once. To use your brand colour, see{" "}
            <Link href="/tokens" className="text-foreground underline">
              Tokens and theming
            </Link>
            : a preset, a one-line wrapper, or pasted CSS.
          </p>
          <p>
            Success, warning and danger have their own tokens (<code>text-success</code>, <code>bg-danger/10</code>, ...). Change them in your stylesheet if
            your brand has its own status colours, but keep them clearly different from the brand.
          </p>
        </Section>

        <Section id="radius" title="Corner radius">
          <p>
            Corners use Tailwind radius classes: <code>rounded-xl</code> on cards and panels, <code>rounded-lg</code> on buttons and inputs, and{" "}
            <code>rounded-full</code> on pills and avatars. For a sharper look, replace them in the file:
          </p>
          <CodeBlock code={`// approval-step.tsx: cards from rounded-xl to rounded-md, buttons from rounded-lg to rounded\n- "rounded-xl border bg-card p-4"\n+ "rounded-md border bg-card p-4"`} file="approval-step.tsx" />
          <p>
            To change every component at once, change Tailwind&apos;s radius scale in your stylesheet. In Tailwind v4 the classes read theme variables:
          </p>
          <CodeBlock code={`@theme {\n  --radius-lg: 0.25rem; /* buttons and inputs */\n  --radius-xl: 0.375rem; /* cards and panels */\n}`} file="globals.css" />
        </Section>

        <Section id="type" title="Fonts and text size">
          <p>
            Components inherit your page font. Set it once with Tailwind&apos;s <code>--font-sans</code> and every pattern follows. Code and timers use{" "}
            <code>font-mono</code>.
          </p>
          <CodeBlock code={`@theme {\n  --font-sans: "Inter", system-ui, sans-serif;\n}`} file="globals.css" />
          <p>
            Body text is <code>text-sm</code> (14px) with <code>text-xs</code> for captions. Text inputs are 16px on small screens on purpose, so iOS does
            not zoom the page when they get focus. Keep that if you shrink the text elsewhere.
          </p>
        </Section>

        <Section id="spacing" title="Spacing and density">
          <p>
            Padding is set per element (<code>p-4</code> on cards, <code>px-3 py-1.5</code> on buttons). For a denser layout, lower those numbers. Leave
            the <code>pointer-coarse:</code> classes alone: they keep buttons 44px tall on touch screens even when the desktop layout is compact.
          </p>
          <p>
            Many patterns change layout by their own width, not the window, using container queries (<code>@container</code> and <code>@md:</code>). They
            behave the same in a sidebar as on a phone, so you rarely need breakpoints.
          </p>
        </Section>

        <Section id="icons" title="Icons">
          <p>
            Icons come from <a className="text-foreground underline" href="https://lucide.dev" target="_blank" rel="noreferrer">lucide-react</a>. Swap the
            import for another set, or for your own SVG components. Decorative icons have <code>aria-hidden</code>; icon-only buttons have an{" "}
            <code>aria-label</code>. Keep both when you swap.
          </p>
        </Section>

        <Section id="motion" title="Motion">
          <p>
            Entrances and layout changes use <a className="text-foreground underline" href="https://motion.dev" target="_blank" rel="noreferrer">Motion</a>{" "}
            with short, critically damped springs. To turn motion off in a component, remove the <code>motion.</code> prefix from the element and its{" "}
            <code>initial</code>, <code>animate</code> and <code>transition</code> props. People who ask their system for reduced motion already get none:
            spinners and pulses use <code>motion-reduce:</code> classes.
          </p>
        </Section>

        <Section id="wording" title="Wording and language">
          <p>
            Labels and messages are plain strings in the file (&quot;Retrying in 3s&quot;, &quot;Leave the line&quot;). Edit them in place, or lift them into
            props if you translate your app. The patterns avoid colour-only meaning and spell things out, so keep a word next to every colour and icon.
          </p>
        </Section>

        <Section id="dark" title="Dark mode">
          <p>
            Components follow a <code>.dark</code> class on any ancestor, the shadcn convention. Put it on <code>&lt;html&gt;</code> for the whole app, or on
            one container to preview a single section. Dark values come from the same tokens, including a brand colour set with{" "}
            <code>AgenticTheme</code>.
          </p>
        </Section>

        <Section id="keep" title="What to keep when you change things">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Keyboard access and visible focus (<code>focus-visible:</code> classes)</li>
            <li>44px touch targets on touch screens (<code>pointer-coarse:</code> classes)</li>
            <li>Labels on icon-only buttons, and words next to colours</li>
            <li>One announcement per change, not per tick (<code>role=&quot;status&quot;</code> and <code>aria-live</code> regions)</li>
            <li>Contrast of at least 4.5:1 for text and 3:1 for focus rings and controls</li>
          </ul>
          <p>
            Ran into something that is hard to change? <a className="text-foreground underline" href="https://github.com/Guhan3132/Agentic-Component/issues/new/choose" target="_blank" rel="noreferrer">Open an issue</a>.
          </p>
        </Section>
      </div>
    </main>
  );
}
