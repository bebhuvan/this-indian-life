// Real FD return = bank term-deposit rate minus TRAILING-12-MONTH AVERAGE CPI
// inflation. Trailing average (not single-month) is the honest read: it asks
// whether a one-year deposit beat the past year's inflation, and avoids single
// volatile months (e.g. the Oct 2025 food-led 0.25% print) faking a huge real rate.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";
const fetchedAt = new Date().toISOString();
const fd = JSON.parse(await readFile("data/series/indiadatahub.IN.prices.deposit_rate_term.json", "utf8")).observations;
const cpi = JSON.parse(await readFile("data/series/mospi.IN.prices.cpi.combined.general.inflation.json", "utf8")).observations;
// trailing 12m average inflation keyed by month
const trail = new Map();
for (let i = 0; i < cpi.length; i++) {
  if (i < 11) continue;
  const win = cpi.slice(i - 11, i + 1).map((o) => o.value);
  trail.set(cpi[i].date, win.reduce((a, b) => a + b, 0) / win.length);
}
const obs = fd.map((o) => {
  const t = trail.get(o.date);
  return t == null ? null : { date: o.date, value: Math.round((o.value - t) * 100) / 100 };
}).filter(Boolean);
const a = createSeriesArtifact({
  indicatorId: "prices.cpi.real_fd_return", title: "Real return on a fixed deposit (after inflation)",
  sourceId: "indiadatahub", sourceIndicatorId: "DERIVED_real_fd_return", sourceUrl: "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor",
  unit: "percentage points", frequency: "monthly", geography: { type: "country", id: "IND", name: "India" }, fetchedAt,
  observations: obs, metadata: { derived: "term-deposit rate minus trailing-12-month average CPI inflation", sources: ["indiadatahub", "mospi"] }
});
const p = await writeSeriesArtifact({ sourceId: "indiadatahub", name: "indiadatahub.IN.prices.cpi.real_fd_return", artifact: a });
await writeSourceManifest("india-real-fd-return", [{ status: "ready", indicatorId: "prices.cpi.real_fd_return", observations: obs.length, artifact: p, fetchedAt }]);
console.log("real_fd_return (12m trailing):", obs.length, "points | latest", obs.at(-1).date, obs.at(-1).value + "pp | 2024-12:", obs.find(o=>o.date==="2024-12")?.value+"pp");
