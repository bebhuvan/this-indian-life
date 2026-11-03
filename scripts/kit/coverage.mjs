// How much of the site the chart kit can draw: every article's visuals put through
// toKitSpec, with the reason each one that stays on the old engine is refused.
//   node scripts/kit/coverage.mjs            totals, rejects by reason, articles by coverage
//   node scripts/kit/coverage.mjs --json=x   the same, per visual, as JSON
import { build } from "esbuild";
import { writeFileSync } from "node:fs";

const res = await build({
  stdin: {
    contents: `export { questionPages } from "./src/data/questions.ts"; export { visualsForQuestion } from "./src/data/viz.ts"; export { toKitSpec, KIT_ARTICLES } from "./src/kit/adapt.ts";`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  external: ["node:*"],
  logLevel: "error",
});
const { questionPages, visualsForQuestion, toKitSpec, KIT_ARTICLES } = await import("data:text/javascript;base64," + Buffer.from(res.outputFiles[0].text).toString("base64"));

/** Why the adapter refuses a visual, in the adapter's own terms. */
function reason(v) {
  if (v.kind === "line") return v.range ? "line: range band" : v.categoricalX ? "line: categorical x" : v.monthAxis ? "line: month axis" : v.lines.some((l) => l.dash) ? "line: dashed" : "line: five or more peers (small multiples)";
  if (v.kind === "bar") return v.scale === "log" ? "bar: log scale" : !v.bars?.length ? "bar: empty" : "bar: share of a whole (strip)";
  if (v.kind === "groupedBar") return `groupedBar: ${v.series?.length} series`;
  if (v.kind === "almanac") return `almanac: ${v.form}`;
  return v.kind;
}

const rows = [], byReason = {}, articles = [];
let total = 0, ok = 0;
for (const page of questionPages) {
  let n = 0, k = 0;
  for (const v of visualsForQuestion(page)) {
    n++;
    let spec = null, err = null;
    try { spec = toKitSpec(v); } catch (e) { err = e.message; }
    if (spec) k++;
    else { const r = err ? `error: ${err}` : reason(v); byReason[r] = (byReason[r] ?? 0) + 1; rows.push({ id: page.id, title: v.title, reason: r }); }
  }
  total += n; ok += k;
  articles.push({ id: page.id, n, k, on: KIT_ARTICLES.has(page.id) });
}

console.log(`${questionPages.length} articles, ${total} visuals; the kit can draw ${ok} (${Math.round((100 * ok) / total)}%). On the kit now: ${articles.filter((a) => a.on).length} articles.`);
console.log("\nRefused, by reason:");
for (const [r, c] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(4)}  ${r}`);
console.log("\nArticles fully drawable by the kit and not yet on it:");
for (const a of articles.filter((a) => !a.on && a.n && a.k === a.n)) console.log(`  ${a.id} (${a.n})`);
console.log("\nArticles partly drawable (kit / all):");
for (const a of articles.filter((a) => !a.on && a.k < a.n).sort((p, q) => q.k / q.n - p.k / p.n)) console.log(`  ${a.k}/${a.n}  ${a.id}`);
const json = process.argv.find((a) => a.startsWith("--json="));
if (json) writeFileSync(json.slice(7), JSON.stringify({ total, ok, byReason, articles, refused: rows }, null, 1));
