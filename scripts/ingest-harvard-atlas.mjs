import { fetchAtlasEciRankings } from "./adapters/harvard-atlas.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

const { rows, url } = await fetchAtlasEciRankings();
const snapshot = await writeSnapshot("harvard-atlas", "eci_rankings.hs92", { rowCount: rows.length, fetchedFrom: url });

async function emit({ id, title, unit, iso3, name, field, geographyId }) {
  const obs = rows
    .filter((r) => r.country_iso3_code === iso3)
    .map((r) => ({ date: String(r.year), value: r[field] === "" || r[field] == null ? null : Number(r[field]) }))
    .filter((o) => o.date && o.value !== null && Number.isFinite(o.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!obs.length) { console.warn(`harvard-atlas ${id}: no obs`); return; }
  const artifact = createSeriesArtifact({
    indicatorId: id, title, sourceId: "harvard-atlas", sourceIndicatorId: `${field}.${iso3}`,
    sourceUrl: "https://atlas.hks.harvard.edu/", unit, frequency: "annual",
    geography: { type: geographyId === "IND" ? "country" : "country", id: geographyId, name },
    fetchedAt, observations: obs, metadata: { classification: "HS92", source: "Harvard Growth Lab Atlas of Economic Complexity" }
  });
  const path = await writeSeriesArtifact({ sourceId: "harvard-atlas", name: `harvard-atlas.${geographyId}.${id}`, artifact });
  manifest.push({ status: "ready", indicatorId: id, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
  console.log(`harvard-atlas ${id} ${obs.length} obs (→${obs.at(-1).date}=${obs.at(-1).value})`);
}

// India: ECI value + global rank
await emit({ id: "trade.atlas.eci", title: "Economic Complexity Index", unit: "ECI (HS92)", iso3: "IND", name: "India", field: "eci_hs92", geographyId: "IND" });
await emit({ id: "trade.atlas.eci_rank", title: "Economic complexity global rank", unit: "rank (lower = more complex)", iso3: "IND", name: "India", field: "eci_rank_hs92", geographyId: "IND" });
// Peers: ECI value for the complexity-divergence comparison
for (const [iso3, name, gid] of [["CHN", "China", "CHN"], ["KOR", "South Korea", "KOR"], ["VNM", "Viet Nam", "VNM"], ["THA", "Thailand", "THA"]]) {
  await emit({ id: `trade.atlas.eci_${gid.toLowerCase()}`, title: `Economic Complexity Index — ${name}`, unit: "ECI (HS92)", iso3, name, field: "eci_hs92", geographyId: gid });
}

await writeSourceManifest("harvard-atlas", manifest);
console.log(`Wrote ${manifest.length} Harvard Atlas artifacts.`);
