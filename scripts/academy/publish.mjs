// Publish a validated academy draft: strip the generator's internal meta keys and
// copy docs/academy/drafts/<slug>.final.json -> data/academy/en/<slug>.json (the
// location the Astro build reads).
//
// Usage: node scripts/academy/publish.mjs <slug> [<slug> ...]   (or --all)

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const DRAFTS = resolve(ROOT, "docs/academy/drafts");
const OUT = resolve(ROOT, "data/academy/en");

const META_KEYS = ["_lint", "_derived", "_figureWarnings", "_linkEntitiesMissing", "_clean", "selfCritique"];

async function publish(slug) {
  const entry = JSON.parse(await readFile(resolve(DRAFTS, `${slug}.final.json`), "utf8"));
  if (entry._clean === false) console.warn(`  ! ${slug}: draft is marked not-clean; publishing anyway, review it.`);
  for (const k of META_KEYS) delete entry[k];
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, `${slug}.json`), JSON.stringify(entry, null, 2));
  console.log(`  published ${slug} -> data/academy/en/${slug}.json`);
}

async function main() {
  const args = process.argv.slice(2);
  let slugs = args.filter((a) => !a.startsWith("--"));
  if (args.includes("--all")) {
    slugs = (await readdir(DRAFTS)).filter((f) => f.endsWith(".final.json")).map((f) => basename(f, ".final.json"));
  }
  if (!slugs.length) throw new Error("Pass one or more slugs, or --all");
  for (const slug of slugs) await publish(slug);
}

main().catch((err) => { console.error(err); process.exit(1); });
