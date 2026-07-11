import { createTableArtifact, writeSeriesArtifact, mergeSourceManifest } from "./core/artifacts.mjs";
import { india, label, fullLabel } from "../src/data/nfhs6.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://www.nfhsiips.in/nfhsuser/index.php";

const rows = [4, 5, 8, 7, 9].map((num) => {
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
  indicatorId: "econ.poverty.nfhs_basic_floor_latest",
  title: "Basic household capability indicators, NFHS-5 to NFHS-6",
  sourceId: "nfhs",
  sourceIndicatorId: "NFHS-6 India factsheet basic household indicators",
  sourceUrl,
  unit: "% of relevant households or women",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt,
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    provenance: "Transcribed from NFHS-6 (2023-24) and NFHS-5 (2019-21) India factsheet values in data/nfhs6/nfhs6_clean.json.",
    method: "Latest value is NFHS-6 total; nfhs5 is the prior India factsheet value where available. Denominators differ by indicator, so read this as a capability dashboard rather than one comparable rate."
  }
});

const file = await writeSeriesArtifact({ sourceId: "nfhs", name: "nfhs.IN.poverty.basic_floor_latest", artifact });
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
