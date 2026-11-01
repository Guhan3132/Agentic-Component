// Freezes the current registry as a pinned release: public/r/v<version>/<name>.json.
//   npm run registry:release
// Run it once per release, after bumping the version in package.json. It refuses to overwrite an
// existing release, so a pinned URL never changes under anyone.
import { cpSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const latest = join(root, "public/r");
const target = join(latest, `v${version}`);

if (existsSync(target)) {
  console.error(`public/r/v${version} already exists. Bump the version in package.json first.`);
  process.exit(1);
}

cpSync(latest, target, { recursive: true, filter: (src) => !/[\\/]v\d+\.\d+\.\d+([\\/]|$)/.test(src) });
console.log(`Froze ${readdirSync(target).length} files into public/r/v${version}`);
