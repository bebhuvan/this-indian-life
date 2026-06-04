// Extra data to make the inflation flagship India-relevant and comparative:
//  - IndiaDataHub: bank term-deposit (FD) rate, monthly (so we can ask "does your
//    FD beat inflation?") -> derived real FD return.
//  - World Bank: cross-country CPI inflation (US, China, World, Brazil) for the
//    "is India's inflation high?" comparison.
//  - Derived from the long annual series: cumulative price multiple since 1960,
//    purchasing power of ₹100 from 1960, and decade-average inflation.
import { readFile } from "node:fs/promises";
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const idhUrl = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";
const manifest = [];

async function write({ indicatorId, title, unit, frequency, sourceId, sourceUrl, sourceIndicatorId, observations, metadata = {} }) {
  const clean = observations.filter((o) => o.value != null && Number.isFinite(o.value));
  if (clean.length < 2) { console.warn(`  skip ${indicatorId}: <2 points`); return; }
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId, sourceIndicatorId: sourceIndicatorId || indicatorId, sourceUrl, unit, frequency,
    geography: { type: "country", id: "IND", name: "India" }, fetchedAt, observations: clean, metadata
  });
  const path = await writeSeriesArtifact({ sourceId, name: `${sourceId}.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: clean.length, artifact: path, fetchedAt, latest: clean[clean.length - 1] });
}

// ---- 1. IDH term-deposit (FD) rate, monthly ----
const idhRows = (raw) => { const ds = Array.isArray(raw?.dataset) ? raw.dataset[0] : null; return Array.isArray(ds?.data) ? ds.data : []; };
const idhObs = (rows) => rows.map((r) => ({ date: String(r.Date || r.date || "").slice(0, 7), value: r.India == null ? null : Number(r.India) })).filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date));

let fdSeries = [];
for (const [id, slug, title] of [
  ["MOIRCBOTDR11M", "deposit_rate_term", "Bank term-deposit (FD) rate, all SCBs"],
  ["MOIRCBDRMX11W", "deposit_rate_1y_max", "Bank deposit rate, >1 year (max)"]
]) {
  try {
    const raw = await fetchIndiaEconomySeries({ id, fields: "India" });
    await writeSnapshot("indiadatahub", id, raw);
    const obs = idhObs(idhRows(raw));
    if (slug === "deposit_rate_term") fdSeries = obs;
    await write({ indicatorId: `prices.${slug}`, title, unit: "% per year", frequency: id.endsWith("W") ? "weekly" : "monthly",
      sourceId: "indiadatahub", sourceUrl: idhUrl, sourceIndicatorId: id, observations: obs,
      metadata: { sourceCategory: "Interest Rates", sourceSubcategory: "Deposit Rates" } });
    console.log(`idh ${slug}: ${obs.length} points (${obs[0]?.date}→${obs.at(-1)?.date})`);
  } catch (e) { console.warn(`idh ${slug} failed: ${e.message}`); }
}

// ---- 2. World Bank cross-country CPI inflation ----
const WB = { IND: "in", USA: "us", CHN: "chn", WLD: "wld", BRA: "bra" };
try {
  const raw = await fetchJson(`https://api.worldbank.org/v2/country/${Object.keys(WB).join(";")}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20000`);
  await writeSnapshot("world-context", "wb_cpi_inflation_multi", raw);
  const rows = Array.isArray(raw) ? raw[1] || [] : [];
  for (const [iso, slug] of Object.entries(WB)) {
    const obs = rows.filter((r) => r.countryiso3code === iso && r.value != null)
      .map((r) => ({ date: String(r.date), value: Number(r.value) })).sort((a, b) => a.date.localeCompare(b.date));
    await write({ indicatorId: `compare.cpi_inflation.${slug}`, title: `CPI inflation — ${iso}`, unit: "% per year", frequency: "annual",
      sourceId: "world-context", sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG", sourceIndicatorId: `FP.CPI.TOTL.ZG.${iso}`,
      observations: obs, metadata: { sourceCategory: "Inflation", country: iso } });
    console.log(`wb cpi ${slug}: ${obs.length} points`);
  }
} catch (e) { console.warn(`wb cross-country cpi failed: ${e.message}`); }

// ---- 3. Derived from long annual series ----
const long = JSON.parse(await readFile("data/series/worldbank.IN.prices.cpi.headline_annual_long.json", "utf8"));
const lp = (long.observations || []).map((o) => ({ year: Number(o.date), infl: Number(o.value) })).filter((o) => o.year && Number.isFinite(o.infl)).sort((a, b) => a.year - b.year);
// cumulative price level (first year = 100) and price multiple
let level = 100; const levelObs = [], multObs = [], ppObs = [];
const base = lp[0]?.year;
for (let i = 0; i < lp.length; i++) {
  if (i > 0) level = level * (1 + lp[i].infl / 100);
  levelObs.push({ date: String(lp[i].year), value: Math.round(level * 10) / 10 });
  multObs.push({ date: String(lp[i].year), value: Math.round((level / 100) * 10) / 10 });
  ppObs.push({ date: String(lp[i].year), value: Math.round((100 / (level / 100)) * 10) / 10 });
}
await write({ indicatorId: "prices.cpi.price_level_since_1960", title: `India price level since ${base}`, unit: `index (${base}=100)`, frequency: "annual",
  sourceId: "worldbank", sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG", observations: levelObs,
  metadata: { derived: `cumulative from annual CPI inflation, ${base}=100`, sources: ["worldbank", "mospi"] } });
await write({ indicatorId: "prices.cpi.price_multiple_since_1960", title: `How many times prices have risen since ${base}`, unit: `× (${base}=1)`, frequency: "annual",
  sourceId: "worldbank", sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG", observations: multObs,
  metadata: { derived: `price level / base level`, sources: ["worldbank", "mospi"] } });
await write({ indicatorId: "prices.cpi.purchasing_power_1960", title: `What ₹100 from ${base} buys today`, unit: `₹ (${base} rupees)`, frequency: "annual",
  sourceId: "worldbank", sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG", observations: ppObs,
  metadata: { derived: `100 / cumulative price multiple`, sources: ["worldbank", "mospi"] } });

// decade-average inflation
const byDecade = new Map();
for (const o of lp) { const dec = Math.floor(o.year / 10) * 10; if (!byDecade.has(dec)) byDecade.set(dec, []); byDecade.get(dec).push(o.infl); }
const decObs = [...byDecade.entries()].sort((a, b) => a[0] - b[0]).map(([dec, vals]) => ({ date: `${dec}s`, value: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 }));
await write({ indicatorId: "prices.cpi.decade_avg_inflation", title: "Average inflation by decade", unit: "% per year", frequency: "annual",
  sourceId: "worldbank", sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG", observations: decObs,
  metadata: { derived: "mean annual CPI inflation per decade", sources: ["worldbank", "mospi"] } });

// ---- 4. Real FD return = FD rate − CPI inflation (monthly) ----
if (fdSeries.length) {
  const cpi = JSON.parse(await readFile("data/series/mospi.IN.prices.cpi.combined.general.inflation.json", "utf8"));
  const cpiByMonth = new Map(cpi.observations.map((o) => [o.date, o.value]));
  const real = fdSeries.map((o) => { const c = cpiByMonth.get(o.date); return c == null ? null : { date: o.date, value: Math.round((o.value - c) * 100) / 100 }; }).filter(Boolean);
  await write({ indicatorId: "prices.cpi.real_fd_return", title: "Real return on a fixed deposit (after inflation)", unit: "percentage points", frequency: "monthly",
    sourceId: "indiadatahub", sourceUrl: idhUrl, observations: real,
    metadata: { derived: "SCB term-deposit rate minus CPI inflation", sources: ["indiadatahub", "mospi"] } });
  console.log(`derived real_fd_return: ${real.length} points, latest ${real.at(-1)?.date}=${real.at(-1)?.value}pp`);
}

await writeSourceManifest("india-inflation-extras", manifest);
console.log(`\nWrote ${manifest.length} inflation-extra series.`);
