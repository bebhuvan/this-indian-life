// Derive REAL (inflation-adjusted) wages for the "How India Works" flagship by
// deflating nominal wages with MOSPI CPI (base 2012=100), so real series are in
// constant 2012 rupees. This reproduces the "salary freeze" finding (nominal up,
// real flat/down). Rural wages use CPI-Rural; all-India PLFS earnings use CPI-
// Combined. See dataforindia.com/the-big-shift/salary-freeze and memory.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const load = async (p) => JSON.parse(await readFile(p, "utf8"));
const obsMap = (artifact) => new Map(artifact.observations.filter((o) => Number.isFinite(o.value)).map((o) => [o.date, o.value]));

const ruralCpi = obsMap(await load("data/series/mospi.IN.prices.cpi.rural.general.index.json")); // YYYY-MM, 2012=100
const combinedCpi = obsMap(await load("data/series/mospi.IN.prices.cpi.combined.general.index.json"));

const manifest = [];
async function emit({ id, title, unit, frequency, observations, metadata }) {
  if (!observations.some((o) => Number.isFinite(o.value))) { console.warn(`  skip ${id}: empty`); return; }
  const artifact = createSeriesArtifact({
    indicatorId: `work.real.${id}`, title, sourceId: "derived", sourceIndicatorId: `real.${id}`,
    sourceUrl: "https://www.indica.local/derived/real-wages",
    unit, frequency, geography: { type: "country", id: "IN", name: "India" }, fetchedAt, observations,
    metadata: { derivation: "nominal deflated by MOSPI CPI (2012=100)", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: "derived", name: `derived.IN.real.${id}`, artifact });
  manifest.push({ status: "ready", indicatorId: `work.real.${id}`, sourceIndicatorId: `real.${id}`, artifact: path, observations: observations.length, fetchedAt });
  console.log(`  work.real.${id} (${observations.length} obs, ${observations[0].date}→${observations.at(-1).date}, latest ${observations.at(-1).value})`);
}

// ---- Real rural wages (monthly): deflate IDH nominal by CPI-Rural ----
for (const [src, id, label] of [
  ["indiadatahub.IN.LAWRAGGAVG13M", "rural_wage_men", "men"],
  ["indiadatahub.IN.LAWRWTTAVG13M", "rural_wage_women", "women"]
]) {
  const nominal = await load(`data/series/${src}.json`);
  const observations = nominal.observations
    .map((o) => {
      const ym = String(o.date).slice(0, 7); // YYYY-MM-DD -> YYYY-MM
      const cpi = ruralCpi.get(ym);
      if (!Number.isFinite(o.value) || !Number.isFinite(cpi)) return null;
      return { date: String(o.date), value: Math.round((o.value / cpi) * 100 * 10) / 10 };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  await emit({ id, title: `Real daily rural wage — ${label} (2012 ₹)`, unit: "₹/day (2012 prices)", frequency: "monthly", observations, metadata: { deflator: "CPI-Rural", nominalSource: src } });
}

// ---- Real PLFS earnings (survey year): deflate by CPI-Combined survey-year mean ----
// Survey year "2017-18" = Jul 2017 .. Jun 2018; deflator = mean CPI over those months.
function surveyYearDeflator(syear) {
  const start = Number(syear.slice(0, 4));
  const months = [];
  for (let m = 7; m <= 12; m++) months.push(`${start}-${String(m).padStart(2, "0")}`);
  for (let m = 1; m <= 6; m++) months.push(`${start + 1}-${String(m).padStart(2, "0")}`);
  const vals = months.map((ym) => combinedCpi.get(ym)).filter(Number.isFinite);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}
for (const [src, id, label, unit] of [
  ["mospi.IN.plfs.wage_regular_person", "wage_regular_person", "regular wage/salaried", "₹/month (2012 prices)"],
  ["mospi.IN.plfs.wage_self_employed_person", "wage_self_employed_person", "self-employed", "₹/month (2012 prices)"],
  ["mospi.IN.plfs.wage_casual_person", "wage_casual_person", "casual labour", "₹/day (2012 prices)"]
]) {
  const nominal = await load(`data/series/${src}.json`);
  const observations = nominal.observations
    .map((o) => {
      const defl = surveyYearDeflator(String(o.date));
      if (!Number.isFinite(o.value) || !Number.isFinite(defl)) return null;
      return { date: String(o.date), value: Math.round((o.value / defl) * 100) };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  await emit({ id, title: `Real earnings — ${label} (2012 ₹)`, unit, frequency: "annual", observations, metadata: { deflator: "CPI-Combined (survey-year mean)", nominalSource: src } });
}

await writeSourceManifest("derived-real-wages", manifest);
console.log(`\nWrote ${manifest.length} real-wage artifacts.`);
