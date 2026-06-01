import { mkdir, writeFile } from "node:fs/promises";
import { writeJsonSnapshot } from "./lib/source-http.mjs";
import { fetchAllUnPopulationIndiaData } from "./adapters/un-population.mjs";

const fetchedAt = new Date().toISOString();

const indicators = [
  {
    indicator: 46,
    id: "people.population.un.wpp",
    title: "Population by age and sex",
    unit: "people",
    start: 2020,
    end: 2025
  }
];

await mkdir("data/series", { recursive: true });

const manifest = [];

for (const item of indicators) {
  const raw = await fetchAllUnPopulationIndiaData({
    indicator: item.indicator,
    start: item.start,
    end: item.end
  });
  const snapshot = await writeJsonSnapshot("un-population", `indicator-${item.indicator}.IND.${item.start}-${item.end}`, raw);

  const rows = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : Array.isArray(raw?.value) ? raw.value : [];
  const artifact = {
    schemaVersion: 1,
    indicatorId: item.id,
    title: item.title,
    sourceId: "un-population",
    sourceIndicatorId: String(item.indicator),
    sourceUrl: "https://population.un.org/dataportalapi/index.html",
    unit: item.unit,
    frequency: "annual",
    geography: {
      type: "country",
      id: "IND",
      name: "India"
    },
    fetchedAt,
    observations: rows
  };

  const out = `data/series/un-population.IN.indicator-${item.indicator}.${item.start}-${item.end}.json`;
  await writeFile(out, `${JSON.stringify(artifact, null, 2)}\n`);
  manifest.push({
    indicatorId: item.id,
    sourceIndicatorId: item.indicator,
    artifact: out,
    snapshot: snapshot.path,
    rows: rows.length,
    fetchedAt
  });
}

await writeFile("data/catalog/un-population-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.length} UN Population artifact(s).`);
