// Freezes the current registry as a pinned release: public/r/v<version>/<name>.json.
//   npm run registry:release
// Run it once per release, after bumping the version in package.json and running registry:build.
// It refuses to overwrite an existing release, so a pinned URL never changes under anyone.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const latest = join(root, "public/r");
const target = join(latest, `v${version}`);

if (existsSync(target)) {
  console.error(`public/r/v${version} already exists. Bump the version in package.json first.`);
  process.exit(1);
}

// Only the files at the top of public/r: the items, registry.json and checksums.txt, never other releases.
const files = readdirSync(latest, { withFileTypes: true })
  .filter((e) => e.isFile() && (e.name.endsWith(".json") || e.name === "checksums.txt"))
  .map((e) => e.name);

mkdirSync(target);
for (const f of files) copyFileSync(join(latest, f), join(target, f));
console.log(`Froze ${files.length} files into public/r/v${version}`);
