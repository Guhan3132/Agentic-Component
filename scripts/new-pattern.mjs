// Scaffolds a new pattern so a contributor starts from working, wired-in code.
//   npm run new-pattern -- my-pattern "My pattern"
// Writes src/registry/<slug>/<slug>.tsx and demo.tsx, then lists the four files still to edit.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [slug, ...rest] = process.argv.slice(2);
const title = rest.join(" ").trim();

if (!slug || !title || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error('Usage: npm run new-pattern -- <slug> "<Title>"\n  slug: lowercase letters, digits and dashes, e.g. rate-limit-notice');
  process.exit(1);
}

const dir = join(process.cwd(), "src/registry", slug);
if (existsSync(dir)) {
  console.error(`src/registry/${slug} already exists.`);
  process.exit(1);
}

const Name = slug.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

const component = `"use client";

import { cn } from "@/lib/cn";

type Props = {
  /** Replace with the props that make this pattern work. */
  title: string;
  className?: string;
};

/**
 * ${title}. Say in one or two sentences what problem this solves for the person using it.
 * Keep it to React, lucide-react, motion and cn, and read colours from the theme tokens
 * (bg-card, text-foreground, border-border, ...) so it works in light and dark.
 */
export function ${Name}({ title, className }: Props) {
  return (
    <section aria-label="${title}" className={cn("@container rounded-xl border border-border bg-card p-4", className)}>
      <h3 className="font-medium text-foreground">{title}</h3>
    </section>
  );
}
`;

const demo = `"use client";

import { useState } from "react";
import { DemoFrame } from "@/components/DemoFrame";
import type { Scenario } from "@/lib/simulator/types";
import { ${Name} } from "./${slug}";

// At least two scenarios, and one of them must be a failure or an edge case.
const scenarios: Scenario[] = [
  { id: "happy", label: "Happy path", hint: "What it looks like when everything works.", script: [] },
  { id: "edge", label: "Edge case", hint: "What it looks like when something goes wrong.", script: [] },
];

export default function Demo() {
  const [id, setId] = useState("happy");
  const [run, setRun] = useState(0);

  return (
    <DemoFrame
      scenarios={scenarios}
      scenarioId={id}
      onScenario={(n) => {
        setId(n);
        setRun((r) => r + 1);
      }}
      onReplay={() => setRun((r) => r + 1)}
    >
      <${Name} key={id + run} title="${title}" />
    </DemoFrame>
  );
}
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `${slug}.tsx`), component);
writeFileSync(join(dir, "demo.tsx"), demo);

console.log(`Created src/registry/${slug}/${slug}.tsx and demo.tsx

Still to do (npm test lists anything you miss):
  1. src/registry/index.ts       add the metadata: summary, why, dos, donts, a11y, props (set since to the next version)
  2. src/registry/usage.ts       add a usage snippet and tags
  3. src/registry/demos.tsx      import the demo and add it to the map
  4. src/components/Previews.tsx add a small static preview for the gallery card

Then: npm run registry:build && npm test && npm run lint
Guide: docs/adding-a-pattern.md`);
