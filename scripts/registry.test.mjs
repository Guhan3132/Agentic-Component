// Consistency checks for the pattern registry. Run with `npm test` (after `npm run registry:build`).
import assert from "node:assert/strict";
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
