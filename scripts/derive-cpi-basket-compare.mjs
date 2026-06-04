// 2012-base vs 2024-base CPI basket weights, mapped to a common 5-bucket structure
// (2024's 13 COICOP divisions aggregated up to the coarser 2012 groups, so the two
// baskets are comparable). Shows how India's spending shifted as incomes rose: food
// down, services up (Engel's law). Sources: 2012 official weighting diagram; 2024
// division weights from MoSPI base-2024 series via IndiaDataHub. Both sum to 100.
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";
const fetchedAt = new Date().toISOString();
const sourceUrl = "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi";
// [slug, label, weight2012, weight2024]
const BUCKETS = [
  ["food_beverages", "Food & beverages", 45.86, 36.75],
  ["miscellaneous", "Services & other", 28.32, 36.22], // 2024 = furnishings+health+transport+infocomm+recreation+education+restaurants+personal care
  ["housing_fuel", "Housing & fuel", 16.91, 17.66],    // 2012 housing 10.07 + fuel&light 6.84; 2024 housing+utilities incl. fuel
  ["clothing_footwear", "Clothing & footwear", 6.53, 6.38],
  ["pan_tobacco", "Pan, tobacco, intoxicants", 2.38, 2.99]
];
const man = [];
for (const base of ["2012", "2024"]) {
  for (const [slug, label, w12, w24] of BUCKETS) {
    const value = base === "2012" ? w12 : w24;
    const a = createSeriesArtifact({
      indicatorId: `prices.cpi.weight${base}.${slug}`, title: `CPI ${base} basket weight — ${label}`,
      sourceId: "mospi", sourceIndicatorId: `CPI${base}_WEIGHT_${slug}`, sourceUrl, unit: "% of basket", frequency: "annual",
      geography: { type: "country", id: "IND", name: "India" }, fetchedAt, observations: [{ date: base, value }],
      metadata: { sourceCategory: "Inflation", sourceSubcategory: "CPI weights", baseYear: base, note: `${base}-base CPI weighting diagram, All-India Combined` + (base === "2024" ? " (13 COICOP divisions aggregated to comparable 2012 groups; division weights via IndiaDataHub)" : "") }
    });
    const p = await writeSeriesArtifact({ sourceId: "mospi", name: `mospi.IN.prices.cpi.weight${base}.${slug}`, artifact: a });
    man.push({ status: "ready", indicatorId: `prices.cpi.weight${base}.${slug}`, observations: 1, artifact: p, fetchedAt });
  }
}
await writeSourceManifest("india-cpi-basket-compare", man);
const s12 = BUCKETS.reduce((s, b) => s + b[2], 0), s24 = BUCKETS.reduce((s, b) => s + b[3], 0);
console.log(`Wrote ${man.length} basket-compare artifacts. 2012 sum=${s12.toFixed(2)}, 2024 sum=${s24.toFixed(2)}`);
