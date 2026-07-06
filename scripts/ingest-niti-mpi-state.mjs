import { readFile } from "node:fs/promises";
import {
  createTableArtifact,
  writeSeriesArtifact,
  mergeSourceManifest
} from "./core/artifacts.mjs";

const sourceId = "niti";
const fetchedAt = new Date().toISOString();
const manual = JSON.parse(await readFile("data/manual/mpi-niti-2023.json", "utf8"));

const rows = manual.byState
  .map((row) => ({
    label: row.state,
    value: row.mpi
  }))
  .sort((a, b) => b.value - a.value);

const artifact = createTableArtifact({
  indicatorId: "econ.poverty.niti_mpi_by_state",
  title: "NITI National MPI headcount by state, 2019-21",
  sourceId,
  sourceIndicatorId: "National Multidimensional Poverty Index 2023: state headcount ratios",
  sourceUrl: manual.sourceUrl,
  unit: "% multidimensionally poor",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt,
  rows,
  dimensions: ["label", "value"],
  metadata: {
    provenance: "NITI Aayog National Multidimensional Poverty Index, 2023.",
    method: "State headcount ratios reported for NFHS-5, 2019-21. Union territories are retained where listed by the source.",
    caveat: "MPI is a multidimensional deprivation measure, not a consumption-poverty line."
  }
});

const file = await writeSeriesArtifact({
  sourceId,
  name: "niti.IN.mpi_by_state",
  artifact
});

await mergeSourceManifest(sourceId, [
  {
    status: "ready",
    indicatorId: artifact.indicatorId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    source: sourceId,
    artifact: file,
    rows: rows.length,
    fetchedAt
  }
]);

console.log(`niti table ${artifact.indicatorId} (${rows.length})`);
