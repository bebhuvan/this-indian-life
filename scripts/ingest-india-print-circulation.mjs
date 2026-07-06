// Long-run claimed circulation of registered newspapers, million copies/publishing day.
// One statutory metric (RNI/PRGI "claimed circulation") across time: CSO/MoSPI Statistical
// Year Book Table 36.4 for the early years (2008-09..2013-14) + PRGI "Press in India" for the
// later years (2018-19, 2022-23, 2023-24). Shows the Indian print boom of the 2010s, a peak
// around the late 2010s, and a recent decline. See data/manual/india-print-circulation-timeseries.json.
import { readFileSync } from "node:fs";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const d = JSON.parse(readFileSync("data/manual/india-print-circulation-timeseries.json", "utf8"));
const fetchedAt = new Date().toISOString();
const geography = { type: "country", id: "IND", name: "India" };
const manifest = [];
const baseMeta = {
  sourceCategory: "Media",
  redistributable: true,
  note: `${d.note} ${d.caveat}`,
  unitNote: d.unit
};

async function series(indicatorId, title, observations) {
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId: "prgi", sourceIndicatorId: indicatorId,
    sourceUrl: d.sourceUrlLate, unit: d.unit, frequency: "annual", geography, fetchedAt,
    observations, metadata: { ...baseMeta, sourceEarly: d.sourceUrlEarly }
  });
  const path = await writeSeriesArtifact({ sourceId: "prgi", name: `prgi.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: observations.length, artifact: path, fetchedAt });
  console.log(`  series ${indicatorId} (${observations.length}) -> ${path}`);
}

console.log("India long-run print-circulation artifacts:");
await series("media.print.circ_total", "Total newspaper circulation, claimed (CSO/MoSPI + PRGI)", d.total);
await series("media.print.circ_hindi", "Hindi newspaper circulation, claimed (CSO/MoSPI + PRGI)", d.hindi);
await series("media.print.circ_english", "English newspaper circulation, claimed (CSO/MoSPI + PRGI)", d.english);
await writeSourceManifest("india-print-circulation", manifest);
console.log(`\nwrote ${manifest.length} circulation-timeseries artifacts`);
