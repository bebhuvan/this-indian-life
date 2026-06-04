// Derive each major group's CONTRIBUTION to the latest headline CPI inflation:
// contribution_i = weight_i × inflation_i / 100 (percentage points). The six
// contributions sum (approximately) to the headline rate — the decomposition that
// answers "which part of the basket actually drove this month's number".
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";
const fetchedAt = new Date().toISOString();
const sourceUrl = "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi";
const read = async (id) => JSON.parse(await readFile(`data/series/mospi.IN.${id}.json`, "utf8"));

const GROUPS = [
  ["food_beverages", "Food & beverages", 45.86],
  ["miscellaneous", "Miscellaneous", 28.32],
  ["housing", "Housing", 10.07],
  ["fuel_light", "Fuel & light", 6.84],
  ["clothing_footwear", "Clothing & footwear", 6.53],
  ["pan_tobacco_intoxicants", "Pan, tobacco, intoxicants", 2.38]
];

const manifest = [];
let latestDate = null, headline = 0;
for (const [slug, label, weight] of GROUPS) {
  const s = await read(`prices.cpi.combined.${slug}.inflation`);
  const last = s.observations[s.observations.length - 1];
  latestDate = last.date;
  const contribution = Math.round((weight * last.value / 100) * 100) / 100;
  headline += contribution;
  const artifact = createSeriesArtifact({
    indicatorId: `prices.cpi.contribution.${slug}`, title: `Contribution to CPI inflation — ${label}`,
    sourceId: "mospi", sourceIndicatorId: `CPI2012_contrib_${slug}`, sourceUrl, unit: "percentage points", frequency: "monthly",
    geography: { type: "country", id: "IND", name: "India" }, fetchedAt,
    observations: [{ date: last.date, value: contribution }],
    metadata: { sourceCategory: "Inflation", sourceSubcategory: "CPI contribution", derived: `weight ${weight}% × ${label} inflation ${last.value}% / 100`, weight, groupInflation: last.value }
  });
  const path = await writeSeriesArtifact({ sourceId: "mospi", name: `mospi.IN.prices.cpi.contribution.${slug}`, artifact });
  manifest.push({ status: "ready", indicatorId: `prices.cpi.contribution.${slug}`, observations: 1, artifact: path, fetchedAt });
}
await writeSourceManifest("india-cpi-contribution", manifest);
console.log(`Wrote ${manifest.length} contribution artifacts for ${latestDate}. Sum=${Math.round(headline*100)/100}pp (≈ headline CPI).`);
