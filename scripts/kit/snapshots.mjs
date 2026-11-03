// Regression fingerprints for the kit: every gallery sample drawn at 360, 680 and 1040 px,
// each SVG hashed and compared with src/kit/fixtures/snapshots.json. A change to any form,
// scale, formatter or the renderer shows up as the samples whose drawing moved, so a change
// meant for one form cannot quietly alter another.
//   node scripts/kit/snapshots.mjs            check; exits 1 and lists what changed
//   node scripts/kit/snapshots.mjs --update   accept the current drawings
// Look at the changed samples (scripts/kit/render-samples.mjs --only=<id>) before updating.
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "src/kit/fixtures/snapshots.json";
const WIDTHS = [360, 680, 1040];
const res = await build({
  stdin: { contents: `export { SAMPLES } from "./src/kit/samples/index.ts"; export { draw, renderSvg } from "./src/kit/index.ts";`, resolveDir: process.cwd(), loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { SAMPLES, draw, renderSvg } = await import("data:text/javascript;base64," + Buffer.from(res.outputFiles[0].text).toString("base64"));

const now = {};
for (const s of SAMPLES) for (const w of WIDTHS) now[`${s.id}@${w}`] = createHash("sha1").update(renderSvg(draw(s.spec, w))).digest("hex").slice(0, 16);

if (process.argv.includes("--update") || !existsSync(FILE)) {
  writeFileSync(FILE, JSON.stringify(now, null, 1) + "\n");
  console.log(`wrote ${Object.keys(now).length} fingerprints to ${FILE}`);
  process.exit(0);
}
const was = JSON.parse(readFileSync(FILE, "utf8"));
const changed = Object.keys(now).filter((k) => was[k] && was[k] !== now[k]);
const added = Object.keys(now).filter((k) => !was[k]);
const gone = Object.keys(was).filter((k) => !now[k]);
for (const k of changed) console.log(`  changed: ${k}`);
for (const k of added) console.log(`  new:     ${k}`);
for (const k of gone) console.log(`  gone:    ${k}`);
console.log(`${Object.keys(now).length} drawings: ${changed.length} changed, ${added.length} new, ${gone.length} gone`);
process.exit(changed.length || added.length || gone.length ? 1 : 0);
