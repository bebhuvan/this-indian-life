import { loadEnv } from "./env.mjs";
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { gbdDeathIndicators, gbdDeathChartSlug, gbdAgeBands } from "./registry/v1-indicators.mjs";

// IHME Global Burden of Disease 2023, accessed via OWID's per-indicator data API.
// The bulk grapher CSV for "Causes of death" (32 columns) returns 403, so we fetch
// each cause variable on its own: {base}/{variableId}.data.json + .metadata.json.
// The data.json is column-parallel arrays: { values[], years[], entities[] }, where
// `entities` holds OWID entity ids; the metadata.json maps those ids -> {name, code}.
loadEnv();
const fetchedAt = new Date().toISOString();
const apiBase = process.env.OWID_INDICATORS_BASE_URL || "https://api.ourworldindata.org/v1/indicators";
const chartUrl = `https://ourworldindata.org/grapher/${gbdDeathChartSlug}`;

function indiaEntityId(metadata) {
  const values = metadata?.dimensions?.entities?.values || [];
  const india = values.find((entity) => entity.code === "IND" || entity.name === "India");
  if (!india) throw new Error("India entity not found in indicator metadata");
  return india.id;
}

async function fetchIndicator(indicator) {
  const [data, metadata] = await Promise.all([
    fetchJson(`${apiBase}/${indicator.variableId}.data.json`),
    fetchJson(`${apiBase}/${indicator.variableId}.metadata.json`)
  ]);
  const indiaId = indiaEntityId(metadata);
  const observations = (data.entities || [])
    .map((entityId, index) => ({ entityId, year: data.years?.[index], value: data.values?.[index] }))
    .filter((row) => row.entityId === indiaId && row.year != null)
    .map((row) => ({ date: String(row.year), value: row.value == null ? null : Number(row.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!observations.some((row) => Number.isFinite(row.value))) {
    throw new Error(`No finite India observations for variable ${indicator.variableId}`);
  }

  return {
    raw: { variableId: indicator.variableId, india: observations, metadataChart: metadata?.presentation?.titlePublic || metadata?.name },
    artifact: createSeriesArtifact({
      indicatorId: indicator.id,
      title: indicator.title,
      sourceId: "gbd",
      sourceIndicatorId: indicator.variableId,
      sourceUrl: chartUrl,
      unit: indicator.unit,
      frequency: "annual",
      geography: { type: "country", id: "IND", name: "India" },
      fetchedAt,
      observations,
      metadata: {
        gbdRelease: "GBD 2023",
        owidVariableId: indicator.variableId,
        group: indicator.group,
        label: indicator.label,
        chartSlug: gbdDeathChartSlug
      }
    })
  };
}

// Flatten the age-band structure into ingestable indicators (counts, both sexes).
const ageIndicators = gbdAgeBands.flatMap((band) =>
  band.causes.map((cause) => ({
    id: cause.id,
    variableId: cause.variableId,
    title: `${cause.label} deaths, age ${band.label}`,
    unit: "deaths",
    group: `age:${band.band}`,
    label: cause.label
  }))
);

const allIndicators = [...gbdDeathIndicators, ...ageIndicators];

const manifest = [];
const failures = [];

for (const indicator of allIndicators) {
  try {
    const result = await fetchIndicator(indicator);
    const artifact = await writeSeriesArtifact({ sourceId: "gbd", name: `gbd.IN.${sourceSlug(indicator.id)}`, artifact: result.artifact });
    const snapshot = await writeSnapshot("gbd", String(indicator.variableId), result.raw);
    const latest = result.artifact.observations.at(-1);
    manifest.push({
      status: "ready",
      indicatorId: indicator.id,
      sourceIndicatorId: String(indicator.variableId),
      group: indicator.group,
      artifact,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      fetchedAt,
      observations: result.artifact.observations.length,
      latestYear: latest?.date,
      latestValue: latest?.value
    });
    console.log(`gbd ${sourceSlug(indicator.id)} ${result.artifact.observations.length} obs · latest ${latest?.date}=${Math.round(latest?.value ?? 0).toLocaleString()}`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: indicator.id,
      sourceIndicatorId: String(indicator.variableId),
      fetchedAt,
      error: error.message
    });
    console.warn(`gbd ${sourceSlug(indicator.id)} failed: ${error.message}`);
  }
}

await writeSourceManifest("gbd", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} GBD series artifacts; ${failures.length} failure(s).`);
