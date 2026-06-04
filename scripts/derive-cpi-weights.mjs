// Official CPI 2012 weighting diagram (All-India, Combined) — published reference
// data from MoSPI/NSO. Each group's share of the consumer basket (sums to 100).
// Source: https://esankhyiki.mospi.gov.in/macroindicators?product=cpi
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";
const fetchedAt = new Date().toISOString();
const sourceUrl = "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi";
const weights = [
  ["food_beverages", "Food & beverages", 45.86],
  ["miscellaneous", "Miscellaneous", 28.32],
  ["housing", "Housing", 10.07],
  ["fuel_light", "Fuel & light", 6.84],
  ["clothing_footwear", "Clothing & footwear", 6.53],
  ["pan_tobacco_intoxicants", "Pan, tobacco, intoxicants", 2.38]
];
const manifest = [];
for (const [slug, label, w] of weights) {
  const indicatorId = `prices.cpi.weight.${slug}`;
  const artifact = createSeriesArtifact({
    indicatorId, title: `CPI basket weight — ${label}`, sourceId: "mospi",
    sourceIndicatorId: `CPI2012_WEIGHT_${slug}`, sourceUrl, unit: "% of basket", frequency: "annual",
    geography: { type: "country", id: "IND", name: "India" }, fetchedAt,
    observations: [{ date: "2012", value: w }],
    metadata: { sourceCategory: "Inflation", sourceSubcategory: "CPI weights", baseYear: "2012",
      note: "Official CPI 2012 weighting diagram, All-India Combined" }
  });
  const path = await writeSeriesArtifact({ sourceId: "mospi", name: `mospi.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: 1, artifact: path, fetchedAt });
}
await writeSourceManifest("india-cpi-weights", manifest);
console.log(`Wrote ${manifest.length} CPI weight artifacts (sum=${weights.reduce((s,w)=>s+w[2],0).toFixed(2)}).`);
