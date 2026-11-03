// Builds public/r/<slug>.json in the shadcn registry-item format so each pattern is installable:
//   npx shadcn add https://<your-domain>/r/approval-step.json
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const { SITE_URL } = await import(pathToFileURL(join(root, "src/lib/site.ts")).href);
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

// The tokens every pattern reads, from src/lib/tokens.json (also the source of the /tokens page).
// The shadcn CLI adds only the ones a project is missing and never overwrites existing values,
// so a project that already ran `shadcn init` keeps its own theme.
const tokenList = JSON.parse(readFileSync(join(root, "src/lib/tokens.json"), "utf8")).tokens;
// The site's own stylesheet comes from the same list, so the previews show exactly what installs.
const { tokenCss, themeInlineCss } = await import(pathToFileURL(join(root, "src/theme/token-css.ts")).href);
writeFileSync(
  join(root, "src/app/tokens.css"),
  [
    "/* Generated from src/lib/tokens.json by scripts/build-registry.mjs. Do not edit by hand. */",
    tokenCss(tokenList, { light: ":root,\n.light", withScheme: true }),
    themeInlineCss(tokenList),
    "",
  ].join("\n\n"),
);

const cssVars = {
  light: Object.fromEntries(tokenList.map((t) => [t.name, t.light])),
  dark: Object.fromEntries(tokenList.map((t) => [t.name, t.dark])),
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
    author: `Agentic UI <${SITE_URL}>`,
    categories: meta[slug] ? [meta[slug].category.toLowerCase(), "agent"] : ["agent"],
    dependencies,
    registryDependencies: [],
    cssVars,
    files: [{ path: `registry/agentic-ui/${slug}.tsx`, type: "registry:ui", content }],
    docs: [
      `Preview and docs: ${SITE_URL}/components/${slug}`,
      "Uses the shadcn theme tokens (missing ones are added, yours are never changed) and cn in @/lib/utils.",
      'Run "npx shadcn@latest init" first if you have not.',
    ].join("\n"),
  };

  writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(item, null, 2));
  index.push({ name: slug, type: item.type, title: item.title, description: item.description, dependencies, files: [{ path: item.files[0].path, type: item.files[0].type }] });
}

// ---- Theming: the brand helper, and one preset per sample colour ----
// derive.ts is plain TypeScript with no JSX, so Node can load it directly.
const { deriveTheme } = await import(pathToFileURL(join(root, "src/theme/derive.ts")).href);
const { sampleThemes } = await import(pathToFileURL(join(root, "src/theme/samples.ts")).href);
const norm = (t) => t.replaceAll("\r\n", "\n");

const deriveSrc = norm(readFileSync(join(root, "src/theme/derive.ts"), "utf8"));
const themeSrc = norm(readFileSync(join(root, "src/theme/agentic-theme.tsx"), "utf8")).replaceAll('"./derive"', '"@/lib/agentic-theme-derive"');
const brandItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "theme-brand",
  type: "registry:ui",
  title: "Brand theme",
  description: "Give one hex colour and every Agentic UI component follows it, in light and dark, with contrast checked.",
  author: `Agentic UI <${SITE_URL}>`,
  categories: ["theme"],
  dependencies: [],
  registryDependencies: [],
  files: [
    { path: "registry/agentic-ui/agentic-theme-derive.ts", type: "registry:lib", content: deriveSrc },
    { path: "registry/agentic-ui/agentic-theme.tsx", type: "registry:ui", content: themeSrc },
  ],
  docs: [
    'Wrap your app or one section: <AgenticTheme brand="#7c3aed">...</AgenticTheme>',
    "Or paste CSS into your stylesheet: console.log(themeCss(deriveTheme(\"#7c3aed\")))",
    `Try colours at ${SITE_URL} (the Brand button, bottom left).`,
  ].join("\n"),
};
writeFileSync(join(outDir, "theme-brand.json"), JSON.stringify(brandItem, null, 2));
index.push({ name: brandItem.name, type: brandItem.type, title: brandItem.title, description: brandItem.description, dependencies: [], files: brandItem.files.map((f) => ({ path: f.path, type: f.type })) });

for (const sample of sampleThemes) {
  const t = deriveTheme(sample.hex);
  const item = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: `theme-${sample.id}`,
    type: "registry:theme",
    title: `${sample.name} theme`,
    description: `Sets the brand colour to ${sample.name} (${sample.hex}) for light and dark, with contrast checked.`,
    author: `Agentic UI <${SITE_URL}>`,
    categories: ["theme"],
    cssVars: { light: t.light, dark: t.dark },
    docs: "Changes only the brand tokens (primary, primary-foreground, ring). Status colours and neutrals are not touched.",
  };
  writeFileSync(join(outDir, `${item.name}.json`), JSON.stringify(item, null, 2));
  index.push({ name: item.name, type: item.type, title: item.title, description: item.description });
}

writeFileSync(
  join(outDir, "registry.json"),
  JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", name: "agentic-ui", homepage: SITE_URL, items: index }, null, 2),
);

// SHA-256 of every registry file, so anyone can check that what they downloaded is what we published:
//   curl -s <url>/r/<name>.json | sha256sum   (compare with /r/checksums.txt)
const sums = readdirSync(outDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => `${createHash("sha256").update(readFileSync(join(outDir, f))).digest("hex")}  ${f}`);
writeFileSync(join(outDir, "checksums.txt"), `${sums.join("\n")}\n`);

console.log(`Built ${index.length} registry items into public/r`);
