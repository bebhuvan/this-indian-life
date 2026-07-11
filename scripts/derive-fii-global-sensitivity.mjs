// Derive: how strongly do global financial conditions move India's monthly FII equity flows?
// Recomputes correlations (month-over-month change for level series) from the snapshotted
// FRED + NSDL data, so the "what moves FII money" bar is reproducible, never hand-typed.
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const EXT = "/home/bhuvanesh.r/Documents/Bhuvan projects/RBI DBIE/FDI";

const fred = JSON.parse(await readFile(`${EXT}/fred_raw/fred_series.json`, "utf8"));
const fredEm = JSON.parse(await readFile(`${EXT}/fred_raw/fred_em_series.json`, "utf8"));
const fredDxy = JSON.parse(await readFile(`${EXT}/fred_raw/fred_dollar_em_indices.json`, "utf8"));

function monthlyAvg(obs) {
  const m = {};
  for (const [d, v] of obs) (m[d.slice(0, 7)] ||= []).push(v);
  return Object.fromEntries(Object.entries(m).map(([k, vs]) => [k, vs.reduce((a, b) => a + b, 0) / vs.length]));
}
// FII equity (NSDL monthly, USD)
const nsdlText = await readFile(`${EXT}/../NSDL_FII/nsdl_fii_monthly.csv`, "utf8");
const nLines = nsdlText.trim().split(/\r?\n/);
const nHead = nLines[0].split(",");
const ci = (n) => nHead.indexOf(n);
const fii = {};
for (const line of nLines.slice(1)) {
  const c = line.split(",");
  if (c[ci("currency")] !== "USD") continue;
  const v = Number(c[ci("equity")]);
  if (Number.isFinite(v)) fii[c[ci("date")].slice(0, 7)] = v;
}
function corr(a, b) {
  const p = a.map((x, i) => [x, b[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const n = p.length; const mx = p.reduce((s, [x]) => s + x, 0) / n; const my = p.reduce((s, [, y]) => s + y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of p) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  return { r: sxy / Math.sqrt(sxx * syy), n };
}
// factors: use month-over-month CHANGE for level series (flows respond to changes); months from 2011
const factors = [
  ["Dollar (vs EM currencies)", monthlyAvg(fredDxy.DTWEXEMEGS), "change"],
  ["Emerging-market volatility", monthlyAvg(fredEm.VXEEMCLS), "change"],
  ["Global volatility (VIX)", monthlyAvg(fred.VIXCLS), "change"],
  ["US 10-year yield", monthlyAvg(fred.DGS10), "change"],
  ["US Fed funds rate", monthlyAvg(fred.FEDFUNDS), "level"]
];
const months = Object.keys(fii).filter((m) => m >= "2011-01").sort();
const rows = [];
for (const [label, series, mode] of factors) {
  const xs = [], ys = [];
  for (let i = 1; i < months.length; i++) {
    const m = months[i], pm = months[i - 1];
    if (!(m in series)) continue;
    const x = mode === "change" ? (pm in series ? series[m] - series[pm] : NaN) : series[m];
    xs.push(x); ys.push(fii[m]);
  }
  const { r, n } = corr(xs, ys);
  rows.push({ factor: label, basis: mode === "change" ? "month-over-month change" : "level", correlation: Math.round(r * 100) / 100, n, label, value: Math.round(r * 100) / 100 });
}
rows.sort((a, b) => a.correlation - b.correlation); // most negative (strongest pull-out) first

const artifact = createTableArtifact({
  indicatorId: "extfin.fpi.global_sensitivity.corr",
  title: "What moves FII money: correlation of monthly equity flows with global conditions",
  sourceId: "derived", sourceIndicatorId: "extfin.fpi.global_sensitivity.corr",
  sourceUrl: "https://fred.stlouisfed.org/", unit: "correlation coefficient",
  geography: { type: "country", id: "IN", name: "India" }, fetchedAt, rows,
  dimensions: [{ id: "factor", label: "Global factor" }],
  metadata: {
    method: "Pearson correlation of NSDL monthly net FPI equity flow (USD) with each global factor, 2011-2026; level series use month-over-month change (flows respond to changes, not levels).",
    sources: ["FRED DTWEXEMEGS/DGS10/FEDFUNDS/VIXCLS/VXEEMCLS", "NSDL FPI net investment (monthly)"],
    note: "All correlations are negative: tighter global conditions (stronger dollar, higher US rates, more fear) pull FII money out. Moderate magnitudes (~-0.1 to -0.4) mean global weather tilts flows, it does not fully determine them.",
    caveat: "Correlation, not causation; USDINR was excluded as partly circular (FII selling itself weakens the rupee)."
  }
});
const path = await writeSeriesArtifact({ sourceId: "derived", name: "derived.IN.extfin_fpi_global_sensitivity", artifact });
await writeSourceManifest("foreign-investment-sensitivity", [{ status: "ready", indicatorId: artifact.indicatorId, artifact: path, rows: rows.length, fetchedAt }]);
console.log(`Wrote FII global-sensitivity table (${rows.length} factors, ${months.length} months):`);
for (const r of rows) console.log(`  ${r.factor.padEnd(30)} r=${r.correlation}  (${r.basis}, n=${r.n})`);
