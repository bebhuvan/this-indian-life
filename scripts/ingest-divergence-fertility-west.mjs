// Fetch World Bank total fertility rate (SP.DYN.TFRT.IN) for advanced Western
// economies, matching the existing divergence.fertility.<cc> scheme so the
// q.people.population country-comparison chart can show India against both the
// Asian development path and the advanced West. The Asian peers + World + India
// are already ingested (worldbank.divergence.*.SP_DYN_TFRT_IN).
import { writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const METRIC = "SP.DYN.TFRT.IN";
const COUNTRIES = [
  { code: "USA", name: "United States" },
  { code: "GBR", name: "United Kingdom" },
  { code: "DEU", name: "Germany" },
  { code: "FRA", name: "France" }
];

const manifest = [];
for (const c of COUNTRIES) {
  const url = `https://api.worldbank.org/v2/country/${c.code}/indicator/${METRIC}?format=json&per_page=20000`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const rows = Array.isArray(json) ? json[1] || [] : [];
    const observations = rows
      .map((r) => ({ date: String(r.date), value: r.value === null ? null : Number(r.value) }))
      .sort((a, b) => Number(a.date) - Number(b.date));
    const real = observations.filter((o) => o.value !== null);
    if (!real.length) throw new Error("no values returned");
    const artifact = {
      schemaVersion: 1,
      artifactType: "series",
      indicatorId: `divergence.fertility.${c.code.toLowerCase()}`,
      title: `Fertility rate — ${c.name}`,
      sourceId: "worldbank",
      sourceIndicatorId: METRIC,
      sourceUrl: url,
      unit: "births per woman",
      frequency: "annual",
      geography: { type: "country", id: c.code, name: c.name },
      dimensions: [],
      fetchedAt,
      observations,
      metadata: { angle: "women", metric: "fertility", country: c.name }
    };
    const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${c.code.toLowerCase()}.${METRIC.replaceAll(".", "_")}`, artifact });
    manifest.push({ status: "ready", indicatorId: artifact.indicatorId, artifact: path, observations: observations.length, fetchedAt });
    console.log(`divergence.fertility.${c.code.toLowerCase()} (${observations.length} obs, latest ${real.at(-1).date}=${real.at(-1).value})`);
  } catch (err) {
    manifest.push({ status: "failed", indicatorId: `divergence.fertility.${c.code.toLowerCase()}`, error: err.message, fetchedAt });
    console.warn(`FAILED ${c.code}: ${err.message}`);
  }
}
await writeSourceManifest("worldbank-divergence-fertility-west", manifest);
console.log(`\nDone: ${manifest.filter((m) => m.status === "ready").length}/${COUNTRIES.length} ingested.`);
