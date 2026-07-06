// Round raw "X million [dollars]" figures to human-readable billions across the whole
// FDI/FII explanation (body, standfirst, short, macha, chartExplainers, caveats), and
// strip em-dashes. Preview by default; pass --apply to write. Deterministic, reviewable.
import { readFile, writeFile } from "node:fs/promises";
const apply = process.argv.includes("--apply");
const path = "data/explanations/en/q.econ.foreign_investment.json";
const d = JSON.parse(await readFile(path, "utf8"));

const repls = [];
function roundBn(bn) {
  if (bn >= 100) return `$${Math.round(bn)} billion`;
  if (bn >= 10) return `$${bn.toFixed(1).replace(/\.0$/, "")} billion`;
  if (bn >= 1) return `$${bn.toFixed(1)} billion`;
  if (bn >= 0.9) return "about $1 billion";
  return `$${Math.round(bn * 1000)} million`; // genuinely small: keep as millions, no decimals
}
function fix(s, where) {
  if (typeof s !== "string") return s;
  let out = s;
  // "12,345.6 million dollars" / Indian-format "1,80,190.5 million" -> billions
  out = out.replace(/\b(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d{4,}(?:\.\d+)?|\d+\.\d+)\s+million(\s+dollars)?\b/g, (m, num) => {
    const n = Number(num.replace(/,/g, ""));
    if (!Number.isFinite(n)) return m;
    const r = roundBn(n / 1000);
    repls.push([where, m.trim(), r]);
    return r;
  });
  // em-dashes -> comma
  if (out.includes("—")) { out = out.replace(/\s*—\s*/g, ", "); repls.push([where, "—", ", "]); }
  return out;
}
// walk targeted fields
d.article.standfirst = fix(d.article.standfirst, "standfirst");
d.article.bodyMarkdown = fix(d.article.bodyMarkdown, "body");
if (d.article.caveats) d.article.caveats = d.article.caveats.map((c) => fix(c, "article.caveat"));
for (const k of ["headline", "dek", "body"]) if (d.short?.[k]) d.short[k] = fix(d.short[k], `short.${k}`);
for (const k of ["heading", "body", "soWhat"]) if (d.macha?.[k]) d.macha[k] = fix(d.macha[k], `macha.${k}`);
for (const ce of d.chartExplainers || []) for (const k of Object.keys(ce)) if (typeof ce[k] === "string") ce[k] = fix(ce[k], `ce:${ce.visualId?.slice(0, 20)}.${k}`);
if (d.caveats) d.caveats = d.caveats.map((c) => fix(c, "caveat"));

console.log(`${repls.length} replacement(s):`);
for (const [w, a, b] of repls.slice(0, 80)) console.log(`  [${w}]  "${a}" -> "${b}"`);
if (apply) { await writeFile(path, JSON.stringify(d, null, 2)); console.log("\nAPPLIED."); }
else console.log("\n(preview only; re-run with --apply to write)");
