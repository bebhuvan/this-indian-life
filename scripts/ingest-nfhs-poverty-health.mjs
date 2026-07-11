import { createTableArtifact, writeSeriesArtifact, mergeSourceManifest } from "./core/artifacts.mjs";
import { india, label, fullLabel } from "../src/data/nfhs6.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://www.nfhsiips.in/nfhsuser/index.php";
const rows = [69, 72, 70, 71, 68, 74].map((num) => {
  const value = india(num);
  return {
    label: label(num),
    indicator: fullLabel(num),
    nfhs5: value.nfhs5,
    value: value.total,
    urban: value.urban,
    rural: value.rural
  };
});

const artifact = createTableArtifact({
  indicatorId: "econ.poverty.nfhs_nutrition_latest",
  title: "Nutrition deprivation indicators, NFHS-5 to NFHS-6",
  sourceId: "nfhs",
  sourceIndicatorId: "NFHS-6 India factsheet nutrition indicators",
  sourceUrl,
  unit: "% of relevant population",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    provenance: "Transcribed from NFHS-6 (2023-24) and NFHS-5 (2019-21) India factsheet values in data/nfhs6/nfhs6_clean.json.",
    method: "Latest value is NFHS-6 total; nfhs5 is the prior India factsheet value where available. These are nutrition and feeding indicators, not consumption poverty."
  }
});

const file = await writeSeriesArtifact({ sourceId: "nfhs", name: "nfhs.IN.poverty.nutrition_latest", artifact });
await mergeSourceManifest("nfhs", [{
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  source: artifact.sourceId,
  artifact: file,
  rows: rows.length,
  fetchedAt
}]);
console.log(`wrote ${file}`);
