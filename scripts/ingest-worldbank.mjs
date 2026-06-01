import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadEnv } from "./env.mjs";

loadEnv();
const fetchedAt = new Date().toISOString();

const indicators = [
  {
    id: "econ.gdp.current_usd",
    sourceIndicatorId: "NY.GDP.MKTP.CD",
    title: "GDP, current US dollars",
    unit: "current US$",
    frequency: "annual"
  },
  {
    id: "econ.gdp.growth_real",
    sourceIndicatorId: "NY.GDP.MKTP.KD.ZG",
    title: "GDP growth, annual percent",
    unit: "annual %",
    frequency: "annual"
  },
  {
    id: "econ.gdp.per_capita_current_usd",
    sourceIndicatorId: "NY.GDP.PCAP.CD",
    title: "GDP per capita, current US dollars",
    unit: "current US$ per person",
    frequency: "annual"
  },
  {
    id: "people.population.total",
    sourceIndicatorId: "SP.POP.TOTL",
    title: "Population, total",
    unit: "people",
    frequency: "annual"
  },
  {
    id: "health.life_expectancy",
    sourceIndicatorId: "SP.DYN.LE00.IN",
    title: "Life expectancy at birth",
    unit: "years",
    frequency: "annual"
  },
  {
    id: "energy.electricity_access",
    sourceIndicatorId: "EG.ELC.ACCS.ZS",
    title: "Access to electricity",
    unit: "% of population",
    frequency: "annual"
  },
  {
    id: "society.urban_population_share",
    sourceIndicatorId: "SP.URB.TOTL.IN.ZS",
    title: "Urban population",
    unit: "% of population",
    frequency: "annual"
  }
];

function artifactName(indicator) {
  return `worldbank.IN.${indicator.sourceIndicatorId.replaceAll(".", "_")}.json`;
}

async function fetchIndicator(indicator) {
  const url = `https://api.worldbank.org/v2/country/IN/indicator/${indicator.sourceIndicatorId}?format=json&per_page=20000`;
  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "Indica/0.1 data ingest"
    }
  });

  if (!response.ok) {
    throw new Error(`World Bank ${indicator.sourceIndicatorId} failed: ${response.status} ${response.statusText}`);
  }

  const raw = await response.json();
  const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
  const observations = rows
    .map((row) => ({
      date: String(row.date),
      value: row.value === null || row.value === undefined ? null : Number(row.value)
    }))
    .filter((row) => row.date && row.date >= "1960")
    .sort((a, b) => a.date.localeCompare(b.date));

  const rawHash = createHash("sha256").update(JSON.stringify(raw)).digest("hex");

  return {
    raw,
    rawHash,
    artifact: {
      schemaVersion: 1,
      indicatorId: indicator.id,
      title: indicator.title,
      sourceId: "worldbank",
      sourceIndicatorId: indicator.sourceIndicatorId,
      sourceUrl: url,
      unit: indicator.unit,
      frequency: indicator.frequency,
      geography: {
        type: "country",
        id: "IN",
        name: "India"
      },
      fetchedAt,
      observations
    }
  };
}

await mkdir("data/series", { recursive: true });
await mkdir("data/snapshots/worldbank", { recursive: true });

const manifest = [];

for (const indicator of indicators) {
  const result = await fetchIndicator(indicator);
  const file = artifactName(indicator);
  await writeFile(`data/series/${file}`, `${JSON.stringify(result.artifact, null, 2)}\n`);
  await writeFile(
    `data/snapshots/worldbank/${indicator.sourceIndicatorId}.${result.rawHash.slice(0, 12)}.json`,
    `${JSON.stringify(result.raw, null, 2)}\n`
  );
  manifest.push({
    indicatorId: indicator.id,
    sourceIndicatorId: indicator.sourceIndicatorId,
    artifact: `data/series/${file}`,
    rawHash: result.rawHash,
    fetchedAt,
    observations: result.artifact.observations.length
  });
}

await writeFile("data/catalog/worldbank-manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.length} World Bank series artifacts.`);
