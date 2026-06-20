// Legacy-media scale: the money-follows-attention story (FICCI-EY) and the print
// reality behind the English-online survey skew (PRGI). Verified from primary PDFs;
// see data/manual/india-media-legacy.json.
import { readFileSync } from "node:fs";
import {
  createSeriesArtifact,
  createTableArtifact,
  writeSeriesArtifact,
  writeSourceManifest
} from "./core/artifacts.mjs";

const data = JSON.parse(readFileSync("data/manual/india-media-legacy.json", "utf8"));
const fetchedAt = new Date().toISOString();
const geography = { type: "country", id: "IND", name: "India" };
const manifest = [];

async function series(sourceId, indicatorId, title, unit, observations, sourceUrl, metadata = {}) {
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId, sourceIndicatorId: indicatorId, sourceUrl, unit,
    frequency: "annual", geography, fetchedAt, observations,
    metadata: { sourceCategory: "Media", redistributable: true, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId, name: `${sourceId}.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: observations.length, artifact: path, fetchedAt });
  console.log(`  series ${indicatorId} (${observations.length}) -> ${path}`);
}

async function table(sourceId, indicatorId, title, unit, rows, sourceUrl, metadata = {}) {
  const artifact = createTableArtifact({
    indicatorId, title, sourceId, sourceIndicatorId: indicatorId, sourceUrl, unit,
    geography, fetchedAt, rows,
    metadata: { sourceCategory: "Media", redistributable: true, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId, name: `${sourceId}.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, rows: rows.length, artifact: path, fetchedAt });
  console.log(`  table  ${indicatorId} (${rows.length}) -> ${path}`);
}

console.log("India legacy-media artifacts:");

// --- FICCI-EY: industry revenue by segment (digital overtook TV in 2024) ---
const f = data.ficci_ey;
const segMeta = { vintage: f.vintage, note: "Industry revenue, not audience reach. Digital media overtook television in 2024." };
await series("ficciey", "media.industry.ficci_digital", "Digital media industry revenue (FICCI-EY)", f.unit, f.segments.digital, f.sourceUrl, segMeta);
await series("ficciey", "media.industry.ficci_television", "Television industry revenue (FICCI-EY)", f.unit, f.segments.television, f.sourceUrl, segMeta);
await series("ficciey", "media.industry.ficci_print", "Print industry revenue (FICCI-EY)", f.unit, f.segments.print, f.sourceUrl, segMeta);
await series("ficciey", "media.industry.ficci_film", "Filmed-entertainment industry revenue (FICCI-EY)", f.unit, f.segments.film, f.sourceUrl, segMeta);
await series("ficciey", "media.industry.ficci_radio", "Radio industry revenue (FICCI-EY)", f.unit, f.segments.radio, f.sourceUrl, segMeta);

// --- PRGI: print scale + the Hindi-vs-English divide (counterweight to DNR's English skew) ---
const p = data.prgi;
const prgiMeta = { vintage: p.vintage, note: p.caveat, totals: p.totals };
await table("prgi", "media.print.registered_by_language", p.registered_by_language.label + " (PRGI)", "registered periodicals",
  p.registered_by_language.rows.map((r) => ({ label: r.language, value: r.value })), p.sourceUrl, prgiMeta);
await table("prgi", "media.print.circulation_by_language", p.claimed_circulation_by_language_million.label + " (PRGI)", "million copies/day",
  p.claimed_circulation_by_language_million.rows.map((r) => ({ label: r.language, value: r.value })), p.sourceUrl, prgiMeta);

await writeSourceManifest("india-media-legacy", manifest);
console.log(`\nwrote ${manifest.length} legacy-media artifacts`);
