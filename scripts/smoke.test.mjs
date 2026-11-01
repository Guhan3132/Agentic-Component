// Smoke test of the production build: start the server and check the pages, headers and files that matter.
// Run `npm run build` first, then `npm run test:smoke`.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { after, before, test } from "node:test";

const PORT = 3199;
const base = `http://localhost:${PORT}`;
const root = process.cwd();
const slugs = readdirSync(join(root, "src/registry"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
let server;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start in 30s");
}

before(async () => {
  server = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], { stdio: "ignore" });
  await waitForServer();
});
after(() => server?.kill());

const get = (path) => fetch(base + path);

test("the main pages load with the site name in the title", async () => {
  for (const path of ["/", "/about", "/get-started", "/playground"]) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.match(await res.text(), /<title>[^<]*Agentic UI/, `${path} title`);
  }
});

test("every pattern page loads, names itself and has its own social image", async () => {
  for (const slug of slugs) {
    const res = await get(`/components/${slug}`);
    assert.equal(res.status, 200, slug);
    const html = await res.text();
    assert.match(html, new RegExp(`/components/${slug}/opengraph-image`), `${slug} og:image`);
    assert.match(html, /<link rel="canonical"/, `${slug} canonical`);
    const img = await get(`/components/${slug}/opengraph-image`);
    assert.equal(img.headers.get("content-type"), "image/png", `${slug} image type`);
  }
});

test("security headers are sent", async () => {
  const res = await get("/");
  assert.match(res.headers.get("content-security-policy") ?? "", /default-src 'self'/);
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.match(res.headers.get("strict-transport-security") ?? "", /max-age=/);
  assert.match(res.headers.get("permissions-policy") ?? "", /microphone=\(self\)/);
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("the registry is served with CORS and every item installs from its URL", async () => {
  const index = await (await get("/r/registry.json")).json();
  assert.equal(index.items.length, slugs.length);
  for (const item of index.items) {
    const res = await get(`/r/${item.name}.json`);
    assert.equal(res.status, 200, item.name);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.ok((await res.json()).files[0].content.length > 100, `${item.name} has content`);
  }
  assert.equal((await get("/r/checksums.txt")).status, 200);
});

test("search and sharing files exist and list every pattern", async () => {
  const sitemap = await (await get("/sitemap.xml")).text();
  for (const slug of slugs) assert.ok(sitemap.includes(`/components/${slug}<`), `${slug} in sitemap`);
  assert.match(await (await get("/robots.txt")).text(), /Sitemap:/);
  assert.match(await (await get("/.well-known/security.txt")).text(), /Contact:/);
  assert.equal((await get("/opengraph-image")).headers.get("content-type"), "image/png");
});

test("an unknown page is a 404, not a crash", async () => {
  assert.equal((await get("/components/does-not-exist")).status, 404);
});
