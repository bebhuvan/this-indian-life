// SRS 2024 fertility detail that is a profile across categories (not a year series):
// age-specific fertility rate (by age band) and birth-order distribution. Written as
// table artifacts so the canonical population article can render them as bar charts.
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://censusindia.gov.in/nada/index.php/catalog/47152";
const srs = JSON.parse(await readFile("data/manual/srs-2024.json", "utf8"));
const manifest = [];

function writeTable({ indicatorId, title, unit, labels, values, extractedFrom, name }) {
  const rows = labels.map((label, i) => ({ label, value: values[i] }));
  const artifact = createTableArtifact({
    indicatorId, title,
    sourceId: "srs",
    sourceIndicatorId: extractedFrom,
    sourceUrl, unit, fetchedAt, rows,
    dimensions: ["label", "value"],
    metadata: { source: srs.source, publisher: srs.publisher, sourceFile: srs.sourceFile, extractedFrom }
  });
  manifest.push({ status: "ready", indicatorId, artifact: name, fetchedAt, rows: rows.length });
  return writeSeriesArtifact({ sourceId: "srs", name, artifact });
}

const asfr = srs.ageSpecificFertilityRate;
await writeTable({
  indicatorId: "people.srs.asfr", title: "Age-specific fertility rate, 2024",
  unit: asfr.unit, labels: asfr.ageGroups, values: asfr.total,
  extractedFrom: asfr.extractedFrom, name: "srs.IN.people_srs_asfr"
});
console.log(`srs asfr: ${asfr.ageGroups.length} age bands, peak ${Math.max(...asfr.total)} at ${asfr.ageGroups[asfr.total.indexOf(Math.max(...asfr.total))]}`);

const bo = srs.birthOrderPct;
await writeTable({
  indicatorId: "people.srs.birth_order", title: "Live births by birth order, 2024",
  unit: bo.unit, labels: bo.orders.map((o) => o === "4+" ? "4th or higher" : `${o}${o === "1" ? "st" : o === "2" ? "nd" : o === "3" ? "rd" : "th"} child`), values: bo.total,
  extractedFrom: bo.extractedFrom, name: "srs.IN.people_srs_birth_order"
});
console.log(`srs birth_order: ${bo.orders.length} categories, 1st+2nd = ${(bo.total[0] + bo.total[1]).toFixed(1)}%`);

await writeSourceManifest("srs-fertility-detail", manifest);
console.log(`\nWrote ${manifest.length} SRS fertility-detail artifact(s).`);
