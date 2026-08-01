// CPC's official probabilistic ENSO strength forecast.
//
// WHY THIS EXISTS. The article previously asserted, with no source, that "forecasters
// expect 2026 to cross that 1.5C mark while the monsoon is still running". That claim
// was removed because no forecast was in the evidence. This script puts a real,
// citable, quantified one there instead, so the article can say what is actually
// forecast rather than either inventing it or pretending nothing is known.
//
// THE SOURCE. https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/strengths/
// A nine-season table of probabilities across El Nino and La Nina strength categories,
// updated on the second Thursday of each month alongside the ENSO Diagnostic
// Discussion, produced by a ~10 member CPC team from multi-model ensembles.
//
// THE DETAIL THAT MATTERS FOR THIS ARTICLE. CPC states on that page:
//
//   "Probabilities are verified using the Relative Oceanic Nino Index (RONI), using
//    incremental -/+ 0.5 degree Celsius thresholds ... The 1991-2020 climatological
//    base period is used to define the departures."
//
// So NOAA's own official strength forecast is expressed in RONI, the trend-adjusted
// index. That settles an argument the article makes in its opening act: switching to
// RONI is not a way of making the event look smaller. NOAA forecasts in RONI terms and
// still puts an 81% chance on a very strong event in October-December.
//
// THE SECOND THING THAT MATTERS. Read down the monsoon seasons and the escalation is
// late. The chance of reaching the +1.5 "strong" threshold that the article's base
// rates use is about 25% for JJA, 73% for JAS and 90% for ASO. The event is forecast
// to arrive properly after the kharif crop is largely settled, which is the article's
// central timing argument, now stated by the forecaster rather than inferred from a
// histogram of past peak dates.
//
// A DISCREPANCY, DELIBERATELY NOT USED. The 9 July 2026 Diagnostic Discussion quotes
// "the latest weekly Nino-3.4 index value was +1.2C", with Nino-4 at +0.5 and Nino-1+2
// at +2.7. CPC's own weekly file (wksst9120.for) gives +2.0, +1.2 and +3.4 for the week
// centred 8 July. Every one of the three runs about 0.7-0.8C lower in the discussion,
// a suspiciously uniform offset of roughly the size of the tropical-mean warming that
// RONI removes. That is a plausible explanation and not a confirmed one, so NO observed
// value from the discussion text is ingested here. Only the forecast probabilities are,
// and those cross-check exactly against the table (both give 81% for OND). Observed
// values in the article continue to come from the weekly and seasonal data files.

import { writeFile, mkdir } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const STRENGTHS_URL = "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/strengths/";
const DISCUSSION_URL = "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const fetchText = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
};

// HTML comments MUST go first. The strengths page still carries a commented-out
// "Issued April 2026 -->" above the live "Issued July 2026", and a naive strip pulls
// the stale one, which would date the whole forecast three months wrong.
const decode = (s) => s
  .replace(/&nbsp;/g, " ")
  .replace(/&ntilde;/gi, "ñ")
  .replace(/&amp;/g, "&")
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
  .replace(/&[a-z]+;/gi, " ");
const strip = (s) => decode(s.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const [strengthsHtml, discussionHtml] = await Promise.all([fetchText(STRENGTHS_URL), fetchText(DISCUSSION_URL)]);

// --- the probability table --------------------------------------------------
// Nine data rows, each "SSS Mon Mon Mon" followed by nine integers. The header's
// El Nino columns are cumulative-threshold labelled (0.5 <= Index, 1.0 <= Index,
// 1.5 <= Index, Index >= 2.0) but the VALUES are per-category and sum to 100 with the
// La Nina and neutral columns, which is how the page's stacked bars are drawn.
const CATS = ["la_nina_very_strong", "la_nina_strong", "la_nina_moderate", "la_nina_weak", "neutral", "el_nino_weak", "el_nino_moderate", "el_nino_strong", "el_nino_very_strong"];
const rows = [];
for (const tr of strengthsHtml.match(/<tr[\s\S]*?<\/tr>/gi) || []) {
  const cells = (tr.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) || []).map(strip);
  if (cells.length !== 10) continue;
  const season = cells[0].split(/\s+/)[0];
  if (!/^[A-Z]{3}$/.test(season)) continue;
  const nums = cells.slice(1).map((c) => Number(c));
  if (nums.some((n) => !Number.isFinite(n))) continue;
  const rec = { season, months: cells[0].replace(/^\S+\s*/, "") };
  CATS.forEach((c, i) => { rec[c] = nums[i]; });
  const total = nums.reduce((a, b) => a + b, 0);
  if (total < 98 || total > 102) throw new Error(`${season} probabilities sum to ${total}, not ~100`);
  // The article's base rates all key off the +1.5 "strong" threshold, so precompute it.
  rec.at_or_above_strong = rec.el_nino_strong + rec.el_nino_very_strong;
  rows.push(rec);
}
if (rows.length !== 9) throw new Error(`expected 9 forecast seasons, parsed ${rows.length}`);

// --- issue date and headline statements ------------------------------------
const issued = (strip(strengthsHtml).match(/Issued\s+([A-Z][a-z]+ \d{4})/) || [])[1];
const discussion = strip(discussionHtml);
const discussionDate = (discussion.match(/issued by[\s\S]{0,120}?(\d{1,2} [A-Z][a-z]+ \d{4})/) || [])[1];
const alertStatus = (discussion.match(/ENSO Alert System Status:\s*(.+?)\s+Synopsis/) || [])[1];
const synopsis = (discussion.match(/Synopsis:\s*(.+?)\s+El Ni/) || [])[1];
const nextUpdate = (discussion.match(/next ENSO Diagnostics Discussion is scheduled for\s+(\d{1,2} [A-Z][a-z]+ \d{4})/) || [])[1];
if (!issued || !alertStatus) throw new Error("could not read the issue date or alert status - CPC page layout may have changed");
// The strengths page and the discussion are released together, so their months must
// agree. This catches both a stale cache and the commented-out-date trap above.
if (discussionDate && !discussionDate.includes(issued.split(" ")[0])) {
  throw new Error(`issue date "${issued}" disagrees with the discussion date "${discussionDate}" - check for a stale or commented-out date on the strengths page`);
}

// Cross-check the discussion's headline number against the table it describes.
const ondVeryStrong = rows.find((r) => r.season === "OND")?.el_nino_very_strong;
const quotedVeryStrong = Number((discussion.match(/There is an (\d+)% chance of a very strong El Ni/) || [])[1]);
if (Number.isFinite(quotedVeryStrong) && quotedVeryStrong !== ondVeryStrong) {
  throw new Error(`discussion quotes ${quotedVeryStrong}% for a very strong OND event but the table says ${ondVeryStrong}%`);
}

const metadata = {
  index: "RONI (Relative Oceanic Nino Index), NOT the raw ONI",
  basePeriod: "1991-2020",
  thresholds: "Categories are 0.5C increments of the Nino-3.4 departure: weak 0.5-1.0, moderate 1.0-1.5, strong 1.5-2.0, very strong >= 2.0",
  issued,
  discussionDate,
  alertStatus,
  synopsis,
  nextUpdate,
  cadence: "Updated the second Thursday of each month, with the ENSO Diagnostic Discussion.",
  method: "CPC's official outlook, set by a team of about ten forecasters from multi-model ensembles (including NMME and NCEP CFSv2), reanalysis, in situ and satellite observations.",
  whyRoniMatters: "NOAA's own official strength probabilities are expressed in RONI, the trend-adjusted index. Switching to RONI is therefore not a way of making this event look smaller: the forecaster uses it and still projects a very strong event.",
  timingForIndia: `Chance of reaching the +1.5 strong threshold: ${rows.filter((r) => ["JJA", "JAS", "ASO"].includes(r.season)).map((r) => `${r.season} ${r.at_or_above_strong}%`).join(", ")}. The escalation is forecast to arrive late in the monsoon and peak after it, which is the article's timing argument stated by the forecaster rather than inferred from past peak dates.`,
  honestyRules: [
    "This is a FORECAST, not an observation. Label it as such every time. Observed values in this article come from the CPC weekly and seasonal data files, never from here.",
    "It is a probability distribution, not a number. Do not collapse '81% chance of very strong in OND' into 'a very strong El Nino is coming'.",
    "The forecast is re-issued monthly and moves. Quote its issue date alongside it.",
    "Strength is not impact. CPC states plainly that the strength of an event does not necessarily correspond with the strength of its influence.",
    "DO NOT use the observed Nino-3.4 values quoted in the Diagnostic Discussion text: they disagree with CPC's own weekly data file by about 0.7-0.8C across all three Nino regions, and the reason is not established. See the header of this script."
  ]
};

const artifact = createTableArtifact({
  indicatorId: "climate.enso.cpc_strength_forecast",
  title: "What NOAA actually forecasts, season by season",
  sourceId: "cpc-enso-forecast",
  sourceIndicatorId: "cpc.enso.strength_probabilities",
  sourceUrl: STRENGTHS_URL,
  unit: "% chance",
  geography: { type: "region", id: "PACIFIC", name: "Equatorial Pacific" },
  fetchedAt: new Date().toISOString(),
  rows,
  dimensions: Object.keys(rows[0]),
  metadata
});
await writeSeriesArtifact({ sourceId: "cpc-enso-forecast", name: "cpc-enso.global.strength_forecast", artifact });

// A narrow, chart-ready view: the chance of reaching the +1.5 threshold the article's
// base rates use, by season. tableBars renders label/value/group only.
const ladderRows = rows.map((r) => ({
  label: `${r.season} (${r.months})`,
  group: ["JJA", "JAS", "ASO"].includes(r.season) ? "During the monsoon" : "After the monsoon",
  value: r.at_or_above_strong,
  very_strong_pct: r.el_nino_very_strong
}));
const ladder = createTableArtifact({
  indicatorId: "climate.enso.forecast_strong_threshold",
  title: "When NOAA expects this El Nino to cross the strong line",
  sourceId: "cpc-enso-forecast",
  sourceIndicatorId: "cpc.enso.strength_probabilities.threshold",
  sourceUrl: STRENGTHS_URL,
  unit: "% chance of reaching +1.5C or above",
  geography: { type: "region", id: "PACIFIC", name: "Equatorial Pacific" },
  fetchedAt: artifact.fetchedAt,
  rows: ladderRows,
  dimensions: Object.keys(ladderRows[0]),
  metadata: { ...metadata, note: "Chance of the RONI reaching +1.5C or above, which is the threshold every strong-event base rate in this article uses. The first three seasons overlap the June-September monsoon." }
});
await writeSeriesArtifact({ sourceId: "cpc-enso-forecast", name: "cpc-enso.global.forecast_strong_threshold", artifact: ladder });

await mkdir("data/snapshots/cpc-enso-forecast", { recursive: true });
await writeFile(`data/snapshots/cpc-enso-forecast/strengths-${issued.replace(/\s+/g, "-").toLowerCase()}.html`, strengthsHtml);
await writeFile(`data/snapshots/cpc-enso-forecast/ensodisc-${issued.replace(/\s+/g, "-").toLowerCase()}.html`, discussionHtml);

await writeSourceManifest("cpc-enso-forecast", [
  { status: "ready", indicatorId: "climate.enso.cpc_strength_forecast", artifact: "data/series/cpc-enso.global.strength_forecast.json", rows: rows.length, fetchedAt: artifact.fetchedAt },
  { status: "ready", indicatorId: "climate.enso.forecast_strong_threshold", artifact: "data/series/cpc-enso.global.forecast_strong_threshold.json", rows: ladderRows.length, fetchedAt: artifact.fetchedAt }
]);

console.log(`CPC ENSO strength forecast, issued ${issued} (discussion ${discussionDate})`);
console.log(`  alert status: ${alertStatus}`);
console.log(`  index: RONI, 1991-2020 base`);
console.log(`  next update: ${nextUpdate}`);
for (const r of rows) {
  console.log(`  ${r.season}  weak ${String(r.el_nino_weak).padStart(2)}  mod ${String(r.el_nino_moderate).padStart(2)}  strong ${String(r.el_nino_strong).padStart(2)}  v.strong ${String(r.el_nino_very_strong).padStart(2)}   >=+1.5: ${String(r.at_or_above_strong).padStart(3)}%`);
}
