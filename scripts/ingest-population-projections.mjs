// Cross-model population projections for India, for the "when does India peak,
// and do the models agree?" beat of the canonical population article.
//
//  - UN median trajectory (our spine) is extracted from the UN WPP 2024 total-
//    population artifact (Median variant, Both sexes), annual to 2100.
//  - IHME is the notable OUTLIER: Vollset et al., Lancet 2020 (GBD 2017 reference
//    scenario) forecast an earlier, lower peak and a far deeper decline, on much
//    faster assumed fertility decline. Published key points are entered by hand with
//    provenance (no open annual series without a GHDx login).
//  - US Census IDB (~1.7bn, early 2060s) and Wittgenstein SSP2 (~1.7-1.9bn, 2070s-80s)
//    cluster near the UN; they have no published headline peak and need a key/CSV, so
//    they are carried as prose context, not charted here.
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

// ---- UN median trajectory to 2100 (extracted from WPP total artifact) ----
const unTable = JSON.parse(await readFile("data/series/un-population.IN.indicator-49.2000-2100.json", "utf8"));
const unMedian = (unTable.rows || [])
  .filter((r) => r.variant === "Median" && r.sex === "Both sexes")
  .map((r) => ({ date: String(r.timeLabel), value: Math.round(r.value) }))
  .sort((a, b) => Number(a.date) - Number(b.date));
const peak = unMedian.reduce((best, p) => (p.value > best.value ? p : best), unMedian[0]);

const unArtifact = createSeriesArtifact({
  indicatorId: "people.projections.un_median",
  title: "UN projection (median variant)",
  sourceId: "un-population",
  sourceIndicatorId: "WPP 2024, indicator 49 (total population), Median variant",
  sourceUrl: "https://population.un.org/wpp/",
  unit: "people",
  frequency: "annual",
  fetchedAt,
  observations: unMedian,
  metadata: { model: "UN WPP 2024", peakYear: peak.date, peakValue: peak.value, value2100: unMedian.at(-1)?.value, note: "Median variant of UN World Population Prospects 2024." }
});
manifest.push({ status: "ready", indicatorId: "people.projections.un_median", artifact: await writeSeriesArtifact({ sourceId: "un-population", name: "un-population.IN.people_projections_un_median", artifact: unArtifact }), fetchedAt, peakYear: peak.date, peakValue: peak.value });
console.log(`un median: peak ${peak.date} = ${(peak.value / 1e9).toFixed(2)}bn, 2100 = ${(unMedian.at(-1).value / 1e9).toFixed(2)}bn`);

// ---- IHME (Vollset et al., Lancet 2020, GBD 2017 reference scenario) ----
// Published key points (millions): 2017 ~1383, peak 2048 = 1605.6, 2100 = 1093.15.
const ihmePoints = [
  { date: "2017", value: 1383_000000 },
  { date: "2048", value: 1605_600000 },
  { date: "2100", value: 1093_150000 }
];
const ihmeArtifact = createSeriesArtifact({
  indicatorId: "people.projections.ihme_reference",
  title: "IHME projection (reference scenario)",
  sourceId: "ihme",
  sourceIndicatorId: "Vollset et al., The Lancet 2020 (GBD 2017 reference scenario)",
  sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7561721/",
  unit: "people",
  frequency: "annual",
  fetchedAt,
  observations: ihmePoints,
  metadata: { model: "IHME (Vollset 2020)", peakYear: "2048", peakValue: 1605600000, value2100: 1093150000, note: "Key published points only (2017, peak 2048, 2100). IHME assumes faster fertility decline than the UN, giving an earlier, lower peak and a deeper decline." }
});
manifest.push({ status: "ready", indicatorId: "people.projections.ihme_reference", artifact: await writeSeriesArtifact({ sourceId: "ihme", name: "ihme.IN.people_projections_ihme_reference", artifact: ihmeArtifact }), fetchedAt });
console.log(`ihme: peak 2048 = 1.61bn, 2100 = 1.09bn (Vollset 2020)`);

await writeSnapshot("population-projections", "model-comparison", {
  models: [
    { model: "UN WPP 2024", scenario: "Median", peakYear: peak.date, peakBn: +(peak.value / 1e9).toFixed(2), bn2100: +(unMedian.at(-1).value / 1e9).toFixed(2) },
    { model: "IHME (Vollset 2020)", scenario: "Reference", peakYear: "2048", peakBn: 1.61, bn2100: 1.09 },
    { model: "US Census IDB", scenario: "single", peakYear: "early 2060s", peakBn: 1.70, bn2100: 1.5, note: "not charted; needs API key" },
    { model: "Wittgenstein WIC2023", scenario: "SSP2 (medium)", peakYear: "2070s-2080", peakBn: 1.8, bn2100: null, note: "not charted; approximate, from CSV" }
  ]
});
await writeSourceManifest("population-projections", manifest);
console.log(`\nWrote ${manifest.length} projection artifact(s).`);
