// Consistency checks for the pattern registry. Run with `npm test` (after `npm run registry:build`).
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");
const slugs = readdirSync(join(root, "src/registry"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const indexSrc = read("src/registry/index.ts");
const usageSrc = read("src/registry/usage.ts");
const demosSrc = read("src/registry/demos.tsx");
const previewsSrc = read("src/components/Previews.tsx");
const key = (slug) => (/^[a-z]+$/.test(slug) ? `(?:"${slug}"|${slug})` : `"${slug}"`);
const has = (src, slug, tail) => new RegExp(`${key(slug)}\\s*${tail}`).test(src);

test("there are patterns to check", () => {
  assert.ok(slugs.length >= 10);
});

for (const slug of slugs) {
  test(`${slug}: files and wiring`, () => {
    assert.ok(existsSync(join(root, `src/registry/${slug}/${slug}.tsx`)), "component file");
    assert.ok(existsSync(join(root, `src/registry/${slug}/demo.tsx`)), "demo file");
    assert.ok(indexSrc.includes(`slug: "${slug}"`), "metadata in index.ts");
    assert.ok(has(usageSrc, slug, ":\\s*`"), "usage snippet in usage.ts");
    assert.ok(has(usageSrc, slug, ":\\s*\\["), "tags in usage.ts");
    assert.ok(has(demosSrc, slug, ":"), "demo in demos.tsx");
    assert.ok(has(previewsSrc, slug, ":"), "gallery preview in Previews.tsx");
  });

  test(`${slug}: component stays copy-pasteable`, () => {
    const src = read(`src/registry/${slug}/${slug}.tsx`);
    // Server-safe components (no hooks, no handlers) may omit the directive; anything interactive must have it.
    const interactive = /\buse[A-Z]\w*\(|\bon[A-Z]\w*=\{/.test(src);
    if (interactive) assert.match(src.split("\n")[0], /^"use client";?\s*$/, 'interactive component starts with "use client"');
    const imports = [...src.matchAll(/^import[^;]*?from\s+"([^"]+)";?/gms)].map((m) => m[1]);
    const allowed = new Set(["react", "lucide-react", "motion/react", "@/lib/cn"]);
    for (const i of imports) assert.ok(allowed.has(i), `unexpected import "${i}" (a pattern may only use react, lucide-react, motion and cn)`);
  });

  test(`${slug}: registry item is complete`, () => {
    const p = join(root, `public/r/${slug}.json`);
    assert.ok(existsSync(p), "public/r file exists (run npm run registry:build)");
    const item = JSON.parse(readFileSync(p, "utf8"));
    assert.equal(item.name, slug);
    assert.ok(item.title && item.description, "title and description");
    assert.ok(item.files?.[0]?.content?.includes("export function"), "file content");
    assert.ok(!item.files[0].content.includes('"@/lib/cn"'), "cn import rewritten for consumers");
    for (const d of item.dependencies) assert.ok(["lucide-react", "motion"].includes(d), `dependency ${d}`);
  });
}

test("metadata is filled in for every pattern", () => {
  for (const slug of slugs) {
    const block = indexSrc.slice(indexSrc.indexOf(`slug: "${slug}"`));
    const next = block.indexOf("\n  {\n    slug:");
    const entry = next === -1 ? block : block.slice(0, next);
    for (const field of ["summary", "why", "dos", "donts", "a11y", "props"]) assert.ok(entry.includes(`${field}:`), `${slug} is missing ${field}`);
  }
});

test("a pinned release, if it exists for this version, matches the latest registry", () => {
  const { version } = JSON.parse(read("package.json"));
  const dir = join(root, `public/r/v${version}`);
  if (!existsSync(dir)) return; // not released yet: nothing is pinned
  for (const slug of slugs) {
    const pinned = readFileSync(join(dir, `${slug}.json`), "utf8");
    const latest = readFileSync(join(root, `public/r/${slug}.json`), "utf8");
    assert.equal(pinned, latest, `${slug} changed since v${version} was frozen. Bump the version and run npm run registry:release`);
  }
});

test("every token in tokens.json is declared for both themes in each registry item", () => {
  const tokens = JSON.parse(read("src/lib/tokens.json")).tokens;
  assert.ok(tokens.length >= 14);
  for (const slug of slugs) {
    const item = JSON.parse(read(`public/r/${slug}.json`));
    for (const t of tokens) assert.ok(item.cssVars.light[t.name] && item.cssVars.dark[t.name], `${slug}: token ${t.name} in both themes`);
  }
});

test("the tokens the components use are all in tokens.json", () => {
  const names = new Set(JSON.parse(read("src/lib/tokens.json")).tokens.map((t) => t.name));
  const used = new Set();
  for (const slug of slugs) {
    const src = read(`src/registry/${slug}/${slug}.tsx`);
    for (const m of src.matchAll(/(?:bg|text|border|ring|outline|fill|stroke|divide|from|to|via)-(background|foreground|card|muted-foreground|muted|accent|border|input|primary-foreground|primary|ring|success|warning|danger)/g)) used.add(m[1]);
  }
  for (const u of used) assert.ok(names.has(u), `component uses token "${u}" that is not in tokens.json`);
});

test("checksums.txt matches every registry file", () => {
  const lines = read("public/r/checksums.txt").trim().split("\n");
  assert.ok(lines.length >= slugs.length);
  for (const line of lines) {
    const [hash, name] = line.split(/\s+/);
    const actual = createHash("sha256").update(readFileSync(join(root, "public/r", name))).digest("hex");
    assert.equal(actual, hash, `${name} does not match checksums.txt (run npm run registry:build)`);
  }
});

test("theme-brand ships the wrapper and its maths, wired to each other", () => {
  const item = JSON.parse(read("public/r/theme-brand.json"));
  assert.deepEqual(item.files.map((f) => f.type), ["registry:lib", "registry:ui"]);
  const [lib, ui] = item.files;
  assert.match(lib.path, /agentic-theme-derive\.ts$/);
  assert.ok(lib.content.includes("export function deriveTheme"), "derive maths");
  assert.ok(ui.content.includes('from "@/lib/agentic-theme-derive"'), "wrapper imports the lib by its installed path");
  assert.ok(!ui.content.includes('"./derive"'), "no relative import left behind");
  assert.ok(!lib.content.includes("\r") && !ui.content.includes("\r"), "LF only");
});

test("every sample colour has a preset with light and dark brand tokens", () => {
  const samples = [...read("src/theme/samples.ts").matchAll(/id: "([a-z]+)", name: "([^"]+)", hex: "(#[0-9a-f]{6})"/g)];
  assert.equal(samples.length, 10);
  const index = JSON.parse(read("public/r/registry.json")).items.map((i) => i.name);
  for (const [, id, , hex] of samples) {
    const item = JSON.parse(read(`public/r/theme-${id}.json`));
    assert.equal(item.type, "registry:theme");
    assert.equal(item.cssVars.light.primary, hex, `${id} light primary is the brand`);
    for (const mode of ["light", "dark"]) for (const k of ["primary", "primary-foreground", "ring"]) assert.match(item.cssVars[mode][k], /^#[0-9a-f]{6}$/, `${id} ${mode} ${k}`);
    assert.ok(index.includes(`theme-${id}`), `theme-${id} in registry.json`);
  }
});
