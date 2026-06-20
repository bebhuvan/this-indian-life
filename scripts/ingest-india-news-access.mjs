// Mass-India counterweight to the Reuters DNR online-English slice.
// Three independent nationally-representative / administrative sources:
//   TRAI  - administrative telecom supply ("who is online")
//   IAMAI - Kantar ICUBE face-to-face internet-use survey (~90k households)
//   MoSPI - NSS CMS:T 2025 official household survey (the representative anchor)
// Figures verified from primary PDFs (see data/manual/india-news-access.json).
import { readFileSync } from "node:fs";
import {
  createSeriesArtifact,
  createTableArtifact,
  writeSeriesArtifact,
  writeSourceManifest
} from "./core/artifacts.mjs";

const data = JSON.parse(readFileSync("data/manual/india-news-access.json", "utf8"));
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

console.log("India news-access counterweight artifacts:");

// --- TRAI: administrative supply ---
// NOTE: the long internet-growth line uses the existing repo series
// society.trai.broadband_subscribers_total (monthly 2008-2026). Here we add only the
// internet-specific penetration split and per-subscriber data use, which that series lacks.
const t = data.trai;
await series("trai", "media.access.trai_data_gb", "Average wireless data use per subscriber per month (TRAI)", "GB", t.data_usage_gb_per_month, t.sourceUrl,
  { vintage: t.vintage, latest: t.data_usage_latest });
await table("trai", "media.access.trai_penetration", t.penetration_per_100.label + " (TRAI)", "per 100 population",
  t.penetration_per_100.rows.map((r) => ({ label: r.area, value: r.value })), t.sourceUrl,
  { vintage: t.vintage, structure: t.structure, note: "Urban vs rural per-100 gap is the connectivity divide; wireless is 95.7% of all internet subscriptions." });

// --- IAMAI-Kantar ICUBE: internet use + the news split ---
const i = data.iamai;
await series("iamai", "media.access.iamai_aiu", "Active internet users (IAMAI-Kantar ICUBE)", "million", i.aiu_million, i.sourceUrl,
  { vintage: i.vintage, definition: "Accessed the internet in the last month.", indicLanguagePct: i.indic_language_pct });
await table("iamai", "media.access.iamai_aiu_split_2024", i.aiu_split_2024.label + " (IAMAI-Kantar ICUBE)", "million",
  i.aiu_split_2024.rows.map((r) => ({ label: r.area, value: r.value })), i.sourceUrl,
  { vintage: i.vintage });
await table("iamai", "media.news.iamai_news_users_2024", i.news_users_2024.label + " (IAMAI-Kantar ICUBE)", "million users",
  i.news_users_2024.rows.map((r) => ({ label: r.category, value: r.millions, pct: r.pct })), i.sourceUrl,
  { vintage: i.vintage, note: i.news_users_2024.note });

// --- MoSPI NSS CMS:T 2025: the nationally-representative anchor ---
const m = data.mospi_cmst_2025;
await table("mospi", "media.access.mospi_hh_internet", m.household_internet_pct.label + " (MoSPI NSS CMS:T)", "percent",
  m.household_internet_pct.rows.map((r) => ({ label: r.area, value: r.value })), m.sourceUrl,
  { vintage: m.vintage, smartphoneOwnershipPct: m.smartphone_ownership_pct, youth15_29Pct: m.internet_use_youth_15_29_pct });
await table("mospi", "media.access.mospi_internet_use_gender", m.internet_use_by_gender_pct.label + " (MoSPI NSS CMS:T)", "percent",
  m.internet_use_by_gender_pct.rows.map((r) => ({ label: r.group, value: r.value })), m.sourceUrl,
  { vintage: m.vintage, note: "Rural-female internet use (57.6%) trails urban-male (85.5%) by nearly 28 points." });

await writeSourceManifest("india-news-access", manifest);
console.log(`\nwrote ${manifest.length} counterweight artifacts`);
