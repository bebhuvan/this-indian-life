// Ingest the multi-year IMD reported heatwave-death series (2021-2024) extracted from
// the DWE annual reports with liteparse. Emits a clean annual series artifact.
import { readFileSync, writeFileSync } from "node:fs";

const data = JSON.parse(readFileSync("data/manual/imd-heatwave-deaths.json", "utf8"));
const artifact = {
  schemaVersion: 1,
  artifactType: "series",
  indicatorId: "heat.imd_dwe.heatwave_deaths_annual",
  title: "Reported heatwave deaths, IMD (annual)",
  sourceId: "imd",
  sourceIndicatorId: "Disastrous Weather Events, eventwise Heat Wave deaths",
  sourceUrl: data.sourceUrl,
  unit: "reported deaths",
  frequency: "annual",
  geography: { type: "country", id: "IND", name: "India" },
  dimensions: ["date", "value"],
  fetchedAt: new Date().toISOString(),
  observations: data.annual.map((r) => ({ date: String(r.year), value: r.heatwaveDeaths })),
  metadata: { method: data.method, note: data.note }
};
const file = "data/series/imd.IN.heatwave_deaths_annual.json";
writeFileSync(file, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`wrote ${file} (${artifact.observations.length} years: ${artifact.observations.map((o) => o.date + "=" + o.value).join(", ")})`);
