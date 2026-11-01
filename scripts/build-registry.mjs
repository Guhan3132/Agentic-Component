// Builds public/r/<slug>.json in the shadcn registry-item format so each pattern is installable:
//   npx shadcn add https://<your-domain>/r/approval-step.json
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const registryDir = join(root, "src/registry");
const outDir = join(root, "public/r");
mkdirSync(outDir, { recursive: true });

const slugs = readdirSync(registryDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// Titles and summaries live in the TypeScript registry; read them without a TS loader.
const meta = {};
const indexSrc = readFileSync(join(registryDir, "index.ts"), "utf8");
const entry = /slug: "([^"]+)",\s*title: "([^"]+)",\s*category: "([^"]+)",\s*summary: "((?:[^"\\]|\\.)*)"/g;
for (const m of indexSrc.matchAll(entry)) {
  meta[m[1]] = { title: m[2], category: m[3], summary: JSON.parse(`"${m[4]}"`) };
}

// The tokens every pattern reads. The shadcn CLI adds only the ones a project is missing and never
// overwrites existing values, so a project that already ran `shadcn init` keeps its own theme.
const cssVars = {
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    muted: "oklch(0.97 0 0)",
    "muted-foreground": "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
    primary: "oklch(0.205 0 0)",
    "primary-foreground": "oklch(0.985 0 0)",
  },
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    muted: "oklch(0.269 0 0)",
    "muted-foreground": "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.556 0 0)",
    primary: "oklch(0.922 0 0)",
    "primary-foreground": "oklch(0.205 0 0)",
  },
};

const index = [];

for (const slug of slugs) {
  const file = join(registryDir, slug, `${slug}.tsx`);
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  // shadcn projects keep `cn` in @/lib/utils, so point the copied file there.
  // Always LF, so the output is identical on Windows and Linux (CI checks that it is up to date).
  const content = source.replaceAll("\r\n", "\n").replaceAll('"@/lib/cn"', '"@/lib/utils"');
  const dependencies = ["lucide-react"];
  if (source.includes("motion/react")) dependencies.push("motion");

  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: slug,
    type: "registry:ui",
    title: meta[slug]?.title ?? slug,
    description: meta[slug]?.summary ?? "",
    author: "Agentic UI <https://agentic-component.vercel.app>",
    categories: meta[slug] ? [meta[slug].category.toLowerCase(), "agent"] : ["agent"],
    dependencies,
    registryDependencies: [],
    cssVars,
    files: [{ path: `registry/agentic-ui/${slug}.tsx`, type: "registry:ui", content }],
    docs: [
      `Preview and docs: https://agentic-component.vercel.app/components/${slug}`,
      "Uses the shadcn theme tokens (missing ones are added, yours are never changed) and cn in @/lib/utils.",
      'Run "npx shadcn@latest init" first if you have not.',
    ].join("\n"),
  };

  writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(item, null, 2));
  index.push({ name: slug, type: item.type, title: item.title, description: item.description, dependencies, files: [{ path: item.files[0].path, type: item.files[0].type }] });
}

writeFileSync(
  join(outDir, "registry.json"),
  JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", name: "agentic-ui", homepage: "https://agentic-component.vercel.app", items: index }, null, 2),
);

console.log(`Built ${index.length} registry items into public/r`);
