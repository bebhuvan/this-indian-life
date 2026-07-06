// Reuters Institute Digital News Report (India) — the "surveyed online-English slice" spine.
// Multi-year figures hand-transcribed from the India country pages of the per-year PDF reports
// (2021-2026), saved in data/manual/dnr-india.json with per-year source URLs.
//
// CRITICAL HONESTY NOTE baked into every artifact's metadata: the DNR India sample is mainly
// English-speaking, online news users (n approx 2,000), NOT nationally representative, and it
// under-represents TV/print and the offline/vernacular majority. No education quota was applied
// to the India sample. A sampling/weighting change from 2021 and a 2025 widening of the "online"
// source category mean the TV/print and per-platform lines are cleaner than the broad
// "online"/"social media" category lines.
import { readFileSync } from "node:fs";
import {
  createSeriesArtifact,
  createTableArtifact,
  writeSeriesArtifact,
  writeSourceManifest
} from "./core/artifacts.mjs";

const data = JSON.parse(readFileSync("data/manual/dnr-india.json", "utf8"));
const fetchedAt = new Date().toISOString();
const SRC = "dnr";
const latestUrl = data.landingUrl;
const caveat =
  "Reuters DNR India: mainly English-speaking, online news users; not nationally representative; under-represents TV/print and the offline/vernacular majority. India sample n approx 2,000; no education quota applied.";

const baseMeta = {
  sourceCategory: "Media",
  survey: "Reuters Institute Digital News Report (India)",
  note: caveat,
  samplingBreak: data.samplingBreak,
  redistributable: true
};

const manifest = [];

async function series(indicatorId, title, unit, observations, extraMeta = {}, sourceUrl = latestUrl) {
  const artifact = createSeriesArtifact({
    indicatorId,
    title,
    sourceId: SRC,
    sourceIndicatorId: indicatorId,
    sourceUrl,
    unit,
    frequency: "annual",
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    observations,
    metadata: { ...baseMeta, ...extraMeta }
  });
  const name = `dnr.IN.${indicatorId}`;
  const path = await writeSeriesArtifact({ sourceId: SRC, name, artifact });
  manifest.push({ status: "ready", indicatorId, observations: observations.length, artifact: path, fetchedAt });
  console.log(`  series ${indicatorId} (${observations.length} obs) -> ${path}`);
}

async function table(indicatorId, title, unit, rows, extraMeta = {}, sourceUrl = latestUrl) {
  const artifact = createTableArtifact({
    indicatorId,
    title,
    sourceId: SRC,
    sourceIndicatorId: indicatorId,
    sourceUrl,
    unit,
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    rows,
    metadata: { ...baseMeta, ...extraMeta }
  });
  const name = `dnr.IN.${indicatorId}`;
  const path = await writeSeriesArtifact({ sourceId: SRC, name, artifact });
  manifest.push({ status: "ready", indicatorId, rows: rows.length, artifact: path, fetchedAt });
  console.log(`  table  ${indicatorId} (${rows.length} rows) -> ${path}`);
}

console.log("Reuters DNR India artifacts:");

// 1. Overall trust in news, 2021-2026 (the headline line).
await series(
  "media.news.dnr_trust",
  "Trust in news — surveyed online Indians (Reuters DNR)",
  "percent",
  data.trust.points,
  { rankNote: data.trust.rankNote, definition: "Share who agree they can trust most news most of the time." }
);

// 2. Sources of news by TYPE (weekly use). TV and print are the clean declines.
const sbt = data.sources_by_type;
await series("media.news.dnr_source_tv", "Weekly TV news use — surveyed online Indians (Reuters DNR)", "percent", sbt.tv, { note: `${caveat} ${sbt.note}` });
await series("media.news.dnr_source_print", "Weekly print news use — surveyed online Indians (Reuters DNR)", "percent", sbt.print, { note: `${caveat} ${sbt.note}` });
await series("media.news.dnr_source_online", "Weekly use of any online source for news — surveyed online Indians (Reuters DNR)", "percent", sbt.online, { note: `${caveat} ${sbt.note}` });
await series("media.news.dnr_source_social", "Weekly social-media news use — surveyed online Indians (Reuters DNR)", "percent", sbt.social, { note: `${caveat} ${sbt.note}` });

// 3. Per-platform shares for news (the migration into closed/video platforms).
const pf = data.platforms_for_news;
await series("media.news.dnr_platform_youtube", "YouTube for news — surveyed online Indians (Reuters DNR)", "percent", pf.youtube);
await series("media.news.dnr_platform_whatsapp", "WhatsApp for news — surveyed online Indians (Reuters DNR)", "percent", pf.whatsapp);
await series("media.news.dnr_platform_instagram", "Instagram for news — surveyed online Indians (Reuters DNR)", "percent", pf.instagram);
await series("media.news.dnr_platform_facebook", "Facebook for news — surveyed online Indians (Reuters DNR)", "percent", pf.facebook);
await series("media.news.dnr_platform_telegram", "Telegram for news — surveyed online Indians (Reuters DNR)", "percent", pf.telegram);

// 4. Smartphone as a source (the mobile-first slice).
await series("media.news.dnr_smartphone", "Smartphone for news — surveyed online Indians (Reuters DNR)", "percent", data.devices_smartphone.points);

// 5. 2026 brand trust cross-section (legacy print + public broadcasters trusted; partisan TV less).
//    The 2026 platform ranking is drawn as latestBars over the per-platform series above
//    (their latest observation is the 2026 value), so no separate table is needed.
const BRAND_GROUP = {
  "All India Radio": "Public broadcaster",
  "DD India": "Public broadcaster",
  "BBC News": "Public broadcaster",
  "The Times of India": "Legacy print",
  "Hindustan Times": "Legacy print",
  "Economic Times": "Legacy print",
  "The Indian Express": "Legacy print",
  "The Hindu": "Legacy print",
  "Other regional or local newspaper": "Legacy print",
  "NDTV": "Private TV",
  "CNN-News18": "Private TV",
  "India Today TV": "Private TV",
  "Republic TV": "Private TV",
  "The Wire": "Digital-born",
  "Scroll.in": "Digital-born"
};
await table(
  "media.news.dnr_brand_trust_2026",
  "Trust in individual news brands, 2026 — surveyed online Indians (Reuters DNR)",
  "percent",
  data.brand_trust_2026.rows.map((r) => ({ label: r.brand, value: r.trust, group: BRAND_GROUP[r.brand] || "Other" })),
  { note: `${caveat} ${data.brand_trust_2026.note}` }
);

await writeSourceManifest("dnr-india", manifest);
console.log(`\nwrote ${manifest.length} Reuters DNR India artifacts`);
