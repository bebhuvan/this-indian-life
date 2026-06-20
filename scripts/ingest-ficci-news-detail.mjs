// News-relevant detail from the FICCI-EY M&E report (2026 ed.): the AI-hit online-news
// audience, the rise of social-media time, and print ad-vs-circulation revenue.
// Transcribed from the report charts; see data/manual/ficci-news-detail.json.
import { readFileSync } from "node:fs";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const d = JSON.parse(readFileSync("data/manual/ficci-news-detail.json", "utf8"));
const fetchedAt = new Date().toISOString();
const geography = { type: "country", id: "IND", name: "India" };
const manifest = [];

async function series(indicatorId, title, unit, observations, frequency, metadata = {}) {
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId: "ficciey", sourceIndicatorId: indicatorId,
    sourceUrl: d.sourceUrl, unit, frequency, geography, fetchedAt, observations,
    metadata: { sourceCategory: "Media", redistributable: true, ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: "ficciey", name: `ficciey.IN.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: observations.length, artifact: path, fetchedAt });
  console.log(`  series ${indicatorId} (${observations.length}) -> ${path}`);
}

console.log("FICCI-EY news-detail artifacts:");
const a = d.online_news_audience;
await series("media.news.online_news_audience", "Online news audience, India — Comscore (FICCI-EY)", a.unit, a.points, "annual", { note: a.note, source: "Comscore via FICCI-EY" });
const s = d.social_media_hours;
await series("media.news.social_media_hours", "Quarterly time spent on social media, India (FICCI-EY)", s.unit, s.points, "quarterly", { note: s.pointNote });
const ad = d.print_ad_revenue;
await series("media.print.ad_revenue", "Print advertising revenue, India (FICCI-EY)", ad.unit, ad.points, "annual", {});
const cr = d.print_circulation_revenue;
await series("media.print.circulation_revenue", "Print circulation revenue, India (FICCI-EY)", cr.unit, cr.points, "annual", { note: cr.note });

await writeSourceManifest("ficci-news-detail", manifest);
console.log(`\nwrote ${manifest.length} FICCI-EY news-detail artifacts`);
