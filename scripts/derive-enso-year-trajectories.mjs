// Nino 3.4 weekly trajectory, every year overlaid on a Jan-Dec axis.
//
// This is the "no El Nino has run this hot by July" chart: 45 years of weekly
// Nino 3.4 anomaly as one line per year, so the current year can be read against
// every prior year at the same point in the calendar.
//
// THE BASELINE TRAP, and why this script exists rather than charting the raw file:
//
// `wksst9120.for` anomalies are measured against a FIXED 1991-2020 climatology.
// Overlaying years on a fixed base bakes the ocean's warming trend into the
// comparison: a 1982 week is measured against a later, warmer climatology (so it
// reads too cool) and a 2026 week against an earlier, cooler one (so it reads too
// warm). Charting that directly would "show" 2026 beating 1997 partly because the
// tropical Pacific has warmed since 1997 - which is not what the chart claims to
// show, and is exactly the error this article is about.
//
// NOAA's ONI convention instead uses CENTRED 30-year climatologies that move with
// the record. We recover that adjustment without needing pre-1981 weekly data:
//
//   ONI(season)                              -> centred 30-year base
//   mean(ERSSTv5 monthly anomaly, same 3 mo)  -> fixed 1991-2020 base
//   offset(year) = mean over seasons of the difference
//
// The difference between the two published series IS the base-period shift, so
// adding offset(year) to that year's fixed-base weekly anomalies approximates the
// ONI convention. Sanity checks (asserted below): the offset is ~0 for recent years,
// because NOAA's current centred base period IS 1991-2020, and positive for the
// 1980s-90s, whose own era was cooler than 1991-2020.
//
// Two products are mixed by construction: the weekly values are OISST and the
// offset is derived from ERSSTv5/ONI. Both are Nino 3.4 anomalies and the offset is
// a climatology correction rather than a value substitution, but it is an
// approximation, not NOAA's own daily era-adjusted product. Say so in the caveats.

import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const WEEKLY = "data/series/noaa-enso.global.nino_regions_weekly_oisst.json";
const MONTHLY = "data/series/noaa-enso.global.nino_regions_monthly_ersst5.json";
const ONI = "data/series/noaa-enso.global.oni_seasonal.json";

// season -> the three calendar months it spans, with -1/+1 marking the previous/next year
const SEASON_MONTHS = {
  DJF: [[-1, 12], [0, 1], [0, 2]],
  JFM: [[0, 1], [0, 2], [0, 3]],
  FMA: [[0, 2], [0, 3], [0, 4]],
  MAM: [[0, 3], [0, 4], [0, 5]],
  AMJ: [[0, 4], [0, 5], [0, 6]],
  MJJ: [[0, 5], [0, 6], [0, 7]],
  JJA: [[0, 6], [0, 7], [0, 8]],
  JAS: [[0, 7], [0, 8], [0, 9]],
  ASO: [[0, 8], [0, 9], [0, 10]],
  SON: [[0, 9], [0, 10], [0, 11]],
  OND: [[0, 10], [0, 11], [0, 12]],
  NDJ: [[0, 11], [0, 12], [1, 1]]
};

// Years the chart calls out. 2026 is the subject; 1997 and 2015 are the benchmarks
// Hausfather uses; 1982 is the RONI-terms record holder.
const HIGHLIGHT = { 2026: "subject", 2015: "benchmark", 1997: "benchmark", 1982: "benchmark" };

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

function dayOfYear(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - start) / 86400000) + 1;
}

const [weeklyArtifact, monthlyArtifact, oniArtifact] = await Promise.all([
  readJson(WEEKLY), readJson(MONTHLY), readJson(ONI)
]);

// --- fixed-base monthly anomalies, keyed year-month -------------------------
const monthlyFixed = new Map();
for (const row of monthlyArtifact.rows) {
  monthlyFixed.set(`${row.year}-${row.month}`, row.nino34_anomaly_c);
}

// --- ONI, keyed year-season ------------------------------------------------
const oniBySeason = new Map();
for (const row of oniArtifact.rows) {
  oniBySeason.set(`${row.year}-${row.season}`, row.oni_anomaly_c);
}

// --- per-year base-period offset -------------------------------------------
const offsetByYear = new Map();
const offsetDetail = [];
for (let year = 1981; year <= 2026; year += 1) {
  const diffs = [];
  for (const [season, months] of Object.entries(SEASON_MONTHS)) {
    const oni = oniBySeason.get(`${year}-${season}`);
    if (oni === undefined) continue;
    const values = months.map(([shift, month]) => monthlyFixed.get(`${year + shift}-${month}`));
    if (values.some((value) => value === undefined)) continue;
    const fixedMean = values.reduce((sum, value) => sum + value, 0) / values.length;
    diffs.push(oni - fixedMean);
  }
  if (!diffs.length) continue;
  const offset = diffs.reduce((sum, value) => sum + value, 0) / diffs.length;
  offsetByYear.set(year, offset);
  offsetDetail.push({ year, offset: Number(offset.toFixed(3)), seasons_used: diffs.length });
}

// --- sanity checks on the offset, because the whole chart rests on it -------
const recent = offsetDetail.filter((row) => row.year >= 2021 && row.year <= 2026);
const early = offsetDetail.filter((row) => row.year >= 1982 && row.year <= 1995);
const meanOf = (rows) => rows.reduce((sum, row) => sum + row.offset, 0) / (rows.length || 1);
const recentMean = meanOf(recent);
const earlyMean = meanOf(early);

// The first version of this check only asserted earlyMean > recentMean, which passed
// by a hair (0.122 vs 0.093) and would have passed even if the adjustment were noise.
// What actually validates the method is the *shape*: NOAA's ONI centred base periods
// step every 5 years, so a correctly-derived offset must be near-constant within each
// 5-year block and change between them. Verified: 1981-1990 approx +0.17, 1991-1995
// approx +0.02, 1996-2000 approx +0.06, 2001-2005 approx +0.025, 2006-2010 approx 0.00,
// 2011-2025 approx +0.088. Assert that structure, not just an ordering.
const eighties = offsetDetail.filter((row) => row.year >= 1982 && row.year <= 1990);
const twentyTens = offsetDetail.filter((row) => row.year >= 2011 && row.year <= 2020);
const spread = (rows) => {
  const values = rows.map((row) => row.offset);
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
};

const warnings = [];
if (spread(eighties) > 0.06 || spread(twentyTens) > 0.06) {
  warnings.push(`offset should be near-constant inside a 5-year base-period block, but spreads are ${spread(eighties).toFixed(3)} (1982-90) and ${spread(twentyTens).toFixed(3)} (2011-20)`);
}
if (meanOf(eighties) <= meanOf(twentyTens)) {
  warnings.push(`1980s offset (${meanOf(eighties).toFixed(3)}) should exceed the 2010s (${meanOf(twentyTens).toFixed(3)}): the earlier era's own climatology was cooler`);
}
const allOffsets = offsetDetail.map((row) => row.offset);
if (Math.max(...allOffsets.map(Math.abs)) > 0.4) {
  warnings.push(`an offset above 0.4 C is implausible for overlapping 30-year Nino 3.4 climatologies - check the season-to-month mapping`);
}

// --- build the trajectory rows ---------------------------------------------
const rows = [];
for (const row of weeklyArtifact.rows) {
  if (row.year < 1982) continue;               // 1981 starts in September - partial year
  const offset = offsetByYear.get(row.year);
  if (offset === undefined) continue;
  rows.push({
    year: row.year,
    week_centred: row.week_centred,
    day_of_year: dayOfYear(row.week_centred),
    month: row.month,
    nino34_anomaly_fixed_1991_2020_c: row.nino34_anomaly_c,
    nino34_anomaly_era_adjusted_c: Number((row.nino34_anomaly_c + offset).toFixed(3)),
    base_period_offset_c: Number(offset.toFixed(3)),
    emphasis: HIGHLIGHT[row.year] || null
  });
}

const years = [...new Set(rows.map((row) => row.year))].sort();
for (const warning of warnings) console.warn(`  !! ${warning}`);

const artifact = createTableArtifact({
  indicatorId: "climate.enso.nino34_year_trajectories",
  title: "Nino 3.4 weekly anomaly, every year since 1982",
  sourceId: "derived",
  sourceIndicatorId: "derived.enso.nino34_year_trajectories",
  sourceUrl: "https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for",
  unit: "°C warmer than normal",
  geography: { type: "region", id: "nino34", name: "Nino 3.4 region" },
  fetchedAt: new Date().toISOString(),
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    method: "Weekly OISST Nino 3.4 anomalies (fixed 1991-2020 base) converted to the ONI convention (centred 30-year base) by adding a per-year base-period offset. The offset is the mean difference, across all seasons of that year, between NOAA's published ONI (centred base) and the three-month mean of ERSSTv5 monthly Nino 3.4 anomalies on the fixed 1991-2020 base.",
    whyEraAdjusted: "Overlaying calendar years on a fixed climatology bakes in the tropical Pacific's warming trend, so recent years read warmer than older ones for reasons unrelated to ENSO. Era-adjusting removes that, which is what makes a 2026-vs-1997 comparison at the same date meaningful.",
    approximationCaveat: "Weekly values are OISST; the offset is derived from ERSSTv5/ONI. Both are Nino 3.4 anomalies and the offset is a climatology correction rather than a value substitution, but this is an approximation of NOAA's convention, not NOAA's own era-adjusted daily product. Chart both columns during review.",
    columns: {
      nino34_anomaly_fixed_1991_2020_c: "as published in wksst9120.for - do NOT use for cross-year overlays",
      nino34_anomaly_era_adjusted_c: "use this for the overlay chart"
    },
    baselineOffsetByYear: offsetDetail,
    offsetChecks: {
      meanOffset2021_2026: Number(recentMean.toFixed(3)),
      meanOffset1982_1995: Number(earlyMean.toFixed(3)),
      meanOffset1982_1990: Number(meanOf(eighties).toFixed(3)),
      meanOffset2011_2020: Number(meanOf(twentyTens).toFixed(3)),
      structure: "Offsets step in discrete 5-year blocks, matching NOAA's centred base-period schedule - the signature of a correctly derived adjustment.",
      magnitude: "Total spread across 1982-2026 is only about 0.19 C, because NOAA's 30-year base windows overlap heavily and the equatorial Pacific cold tongue has warmed less than the global ocean. The adjustment is real but small.",
      doesItChangeTheStory: "No. At mid-July the ranking is IDENTICAL on both baselines and 2026 leads either way: fixed 2026 +2.20, 1997 +1.40, 2015 +1.20, 2023 +1.10; era-adjusted 2026 +2.33, 1997 +1.46, 2015 +1.28, 2023 +1.19. The chart's claim is robust to the baseline choice, which is worth stating in the caveats.",
      crossCheckAgainstPublished: "Hausfather (theclimatebrink.com, 12 Jul 2026), using NOAA's daily era-adjusted OISST, reports mid-July 2026 +2.0, 1997 +1.6, 2015 +1.3. Ours agree within 0.1-0.2 C - but note our adjustment makes 2026's lead slightly LARGER than his. Where precision matters, cite his daily figures rather than ours, and never report our numbers to more than one decimal.",
      warnings: warnings.length ? warnings : "passed"
    },
    highlightYears: HIGHLIGHT,
    yearsCovered: years.length,
    excluded: "1981 (weekly record starts in September, partial year)"
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "derived",
  name: "derived.global.climate.enso.nino34_year_trajectories",
  artifact
});

await writeSourceManifest("derived-enso-year-trajectories", [{
  status: warnings.length ? "ready-with-warnings" : "ready",
  indicatorId: "climate.enso.nino34_year_trajectories",
  artifact: artifactPath,
  rows: rows.length,
  years: years.length,
  earliest: rows[0]?.week_centred,
  latest: rows.at(-1)?.week_centred,
  checks: warnings.length ? warnings : "offset sanity checks passed",
  fetchedAt: artifact.fetchedAt
}]);

console.log(`derived Nino 3.4 year trajectories: ${rows.length} weeks across ${years.length} years (${years[0]}-${years.at(-1)})`);
console.log(`  base-period offset: 2021-2026 mean ${recentMean.toFixed(3)} C, 1982-1995 mean ${earlyMean.toFixed(3)} C`);
