// The ENSO-index family for q.climate.el_nino_2026.
//
// Six derived artifacts, all from data already on disk, covering the article's
// analytical spine:
//
//   1. index_ladder_2026        - five official numbers for the same ocean (the hero)
//   2. oni_vs_roni              - both indices, 1950-2026
//   3. oni_roni_gap_by_decade   - the measuring stick drifting
//   4. event_peak_intensity     - peak ONI and RONI per event, 1950-2026
//   5. strong_event_outcomes    - the 7 strong monsoons and what India got
//   6. flavour_by_event         - the eastern/central-Pacific hypothesis, and its failure
//
// CARDINAL RULE for everything here: these series measure the same ocean on
// different products, periods, base periods and scalings. Every artifact carries
// `product`, `period` and `basePeriod`, and nothing is ever compared across them
// without those labels. That discipline IS the article's argument.
//
// Event definition follows NOAA: an El Nino event is a run of at least five
// consecutive overlapping seasons with ONI >= 0.5. Applied identically to RONI so
// the two rankings are comparable.

import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const SRC = {
  oni: "data/series/noaa-enso.global.oni_seasonal.json",
  roni: "data/series/noaa-enso.global.roni_seasonal.json",
  monthlyErsst: "data/series/noaa-enso.global.nino_regions_monthly_ersst5.json",
  monthlyOisst: "data/series/noaa-enso.global.nino_regions_monthly_oisst.json",
  weekly: "data/series/noaa-enso.global.nino_regions_weekly_oisst.json",
  join: "data/series/derived.IN.climate.enso_iod_imd_monsoon_join.json"
};

const CPC = "https://www.cpc.ncep.noaa.gov/data/indices";
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASONS = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"];
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const round = (value, dp = 2) => Number(Number(value).toFixed(dp));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const [oniArt, roniArt, ersstArt, oisstArt, weeklyArt, joinArt] = await Promise.all(
  [SRC.oni, SRC.roni, SRC.monthlyErsst, SRC.monthlyOisst, SRC.weekly, SRC.join].map(readJson)
);

// Order seasonal rows chronologically. A season's calendar position is its index in
// SEASONS, except NDJ/DJF which straddle the year boundary - the source files are
// already in order, so trust that rather than re-deriving it.
const oniRows = oniArt.rows;
const roniByKey = new Map(roniArt.rows.map((row) => [`${row.year}-${row.season}`, row.roni_anomaly_c]));


// EVIDENCE-PACKET CONSTRAINTS (scripts/core/evidence.mjs). Chart rows are not just chart
// rows: they are also what the writer sees as "locked numbers". Three rules bite, and
// breaking any of them silently starves the prose of the values the chart is about.
//
//  1. `rowDate` reads TIME_PERIOD/time/year/date/period. If rows carry DIFFERENT values
//     there, `preferredRowsForLockedNumbers` keeps only the latest and earliest date
//     groups and DROPS the middle. The index ladder lost 0.98 and 0.47 this way - the two
//     numbers the chart exists to show - and the writer duly reported the range as
//     "2.2 down to 1.44".
//  2. Extraction stops at 12 numbers per table, counting EVERY numeric column of every
//     row. Wide rows exhaust the budget in two or three rows.
//  3. `rowQualifier` only labels a number if the row carries variant/sex/category/
//     series/fuel/IndicatorCode. Without one, every locked number reads
//     "<chart title>: value" with no clue which row it came from.
//
// So chart rows must be NARROW (only the numeric columns the chart renders), carry
// `category` for labelling, and must not put differing values in a date-like key.
// Everything else belongs in metadata, where it is preserved but costs no budget.
function chartRow({ label, value, category, extra }) {
  return { label, value, category: category || label, ...(extra || {}) };
}

const manifest = [];
async function emit({ id, name, title, unit, rows, metadata, geography }) {
  const artifact = createTableArtifact({
    indicatorId: id,
    title,
    sourceId: "derived",
    sourceIndicatorId: `derived.${id}`,
    sourceUrl: `${CPC}/oni.ascii.txt`,
    unit,
    geography: geography || { type: "region", id: "nino34", name: "Nino 3.4 region" },
    fetchedAt: new Date().toISOString(),
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata
  });
  const path = await writeSeriesArtifact({ sourceId: "derived", name, artifact });
  manifest.push({ status: "ready", indicatorId: id, artifact: path, rows: rows.length, fetchedAt: artifact.fetchedAt });
  console.log(`  ${id}: ${rows.length} rows`);
  return path;
}

// ---------------------------------------------------------------------------
// 1. The index ladder. Five official numbers, same ocean, all current.
// ---------------------------------------------------------------------------
const lastWeek = weeklyArt.rows.at(-1);
const lastErsst = ersstArt.rows.at(-1);
const lastOisst = oisstArt.rows.at(-1);
const lastOni = oniRows.at(-1);
const lastRoni = roniArt.rows.at(-1);

// LABELS DO THE EXPLAINING. `barsFromTableRows` renders only `label`, `value` and
// `group`; any other column is dropped. An earlier version put the product, period and
// baseline in separate fields and the chart rendered as five near-identical jargon
// labels with no hint of why they differ, which is the whole point of the chart.
// Ordered least-processed to most-processed, so the bars fall in a readable ladder and
// the reader can see that more averaging and more adjustment means a smaller number.
const monthName = (date) => {
  const [year, month] = String(date).split("-");
  return `${MONTHS_SHORT[Number(month) - 1]} ${year}`;
};
const weekLabel = (iso) => {
  const [, month, day] = String(iso).split("-");
  return `${Number(day)} ${MONTHS_SHORT[Number(month) - 1]}`;
};
const ladderSpec = [
  { label: `One week, unsmoothed (${weekLabel(lastWeek.week_centred)})`, value: round(lastWeek.nino34_anomaly_c), group: "Raw Nino 3.4", product: "OISST", measuredOver: `week centred ${lastWeek.week_centred}`, basePeriod: "fixed 1991-2020", smoothing: "none" },
  { label: `One month, averaged (${monthName(lastOisst.date)})`, value: round(lastOisst.nino34_anomaly_c), group: "Raw Nino 3.4", product: "OISST", measuredOver: lastOisst.date, basePeriod: "fixed 1991-2020", smoothing: "monthly mean" },
  { label: `Same month, other dataset (${monthName(lastErsst.date)})`, value: round(lastErsst.nino34_anomaly_c), group: "Raw Nino 3.4", product: "ERSSTv5", measuredOver: lastErsst.date, basePeriod: "fixed 1991-2020", smoothing: "monthly mean" },
  { label: `Three months averaged, the official index (${lastOni.season})`, value: round(lastOni.oni_anomaly_c), group: "Official and adjusted", product: "ERSSTv5", measuredOver: lastOni.date, basePeriod: "centred 30-year", smoothing: "3-month running mean" },
  { label: `Same three months, tropical warming removed (${lastRoni.season})`, value: round(lastRoni.roni_anomaly_c), group: "Official and adjusted", product: "ERSSTv5 minus tropical-mean SST", measuredOver: lastRoni.date, basePeriod: "centred 30-year", smoothing: "3-month running mean" }
];
// Rows stay narrow: label, value, group for the renderer, plus category so each locked
// number identifies itself. The recipe columns move to metadata.
const ladder = ladderSpec.map((row) => ({ label: row.label, value: row.value, group: row.group, category: row.label }));
const ladderValues = ladder.map((row) => row.value);

await emit({
  id: "climate.enso.index_ladder_2026",
  name: "derived.global.climate.enso.index_ladder_2026",
  title: "Five official numbers for the same ocean",
  unit: "°C warmer than normal",
  rows: ladder,
  metadata: {
    recipePerRow: ladderSpec,
    spread: { min: Math.min(...ladderValues), max: Math.max(...ladderValues), range: round(Math.max(...ladderValues) - Math.min(...ladderValues)) },
    whyTheyDiffer: {
      roniVsOni: "The substantive gap. RONI removes the tropical-mean SST trend, on the reasoning that convection responds to the Pacific's warmth relative to the rest of the tropics rather than to absolute local warmth.",
      ersstVsOisst: "A product difference of roughly 0.1 C for the same month. Honest noise, not a finding.",
      weeklyVsSeasonal: "Mostly TIMING AND SMOOTHING, not method: the weekly value is unsmoothed and later in the year, while the seasonal ONI is a three-month mean centred earlier, during which the Pacific genuinely warmed. Do not present this gap as an artefact of index choice."
    },
    honestyRule: "Every row must be rendered with its product, period and base period visible. Presented bare, this table would itself be the misleading comparison the article criticises.",
    doNotCompareTo: "Hausfather's peak-monthly RONI figures, which apply the L'Heureux et al. (2024) variance-restoration scaling. Ours are unscaled."
  }
});

// ---------------------------------------------------------------------------
// 2. ONI vs RONI, full record.
// ---------------------------------------------------------------------------
const paired = oniRows
  .map((row) => {
    const roni = roniByKey.get(`${row.year}-${row.season}`);
    if (roni === undefined) return null;
    return { date: row.date, year: row.year, season: row.season, oni_anomaly_c: row.oni_anomaly_c, roni_anomaly_c: roni, gap_c: round(row.oni_anomaly_c - roni, 3) };
  })
  .filter(Boolean);

await emit({
  id: "climate.enso.oni_vs_roni",
  name: "derived.global.climate.enso.oni_vs_roni",
  title: "The Pacific measured two ways: ONI and RONI",
  unit: "°C warmer than normal",
  rows: paired,
  metadata: {
    note: "Both are three-month running means on centred 30-year base periods; RONI additionally subtracts the tropical-mean SST anomaly. They track each other closely before about 2000 and separate afterwards as the tropics warm.",
    seasons: SEASONS,
    coverage: `${paired[0].date} to ${paired.at(-1).date}`
  }
});

// ---------------------------------------------------------------------------
// 3. The gap by decade - the measuring stick drifting.
// ---------------------------------------------------------------------------
const byDecade = new Map();
for (const row of paired) {
  const decade = Math.floor(row.year / 10) * 10;
  if (!byDecade.has(decade)) byDecade.set(decade, []);
  byDecade.get(decade).push(row.gap_c);
}
const decadeRows = [...byDecade.entries()]
  .sort((a, b) => a[0] - b[0])
  // `decade` removed from the row: it is numeric (burns cap) and date-like (would trigger
  // the latest/earliest row filter and drop the middle decades).
  .map(([decade, gaps]) => ({ label: `${decade}s`, value: round(mean(gaps), 3), category: `${decade}s average gap`, seasons_counted: gaps.length }));

await emit({
  id: "climate.enso.oni_roni_gap_by_decade",
  name: "derived.global.climate.enso.oni_roni_gap_by_decade",
  title: "How far the raw index now runs above the trend-adjusted one",
  unit: "°C gap between the two indices",
  rows: decadeRows,
  metadata: {
    note: "Mean ONI minus RONI per decade. It fluctuates unsignedly around zero before 2000 (-0.18 to +0.01, so NOT a monotone trend across the whole record), then rises sharply: +0.23 in the 2010s and +0.44 in the 2020s - the raw Nino 3.4 anomaly increasingly overstates the RELATIVE Pacific gradient as the whole tropical ocean warms. This is why comparing 2026's raw number with 1972's or 1997's is not apples-to-apples.",
    caveat: "The 2020s bucket is a partial decade.",
    readWith: "climate.enso.oni_vs_roni"
  }
});

// ---------------------------------------------------------------------------
// 4. Peak intensity per event, on both indices.
// NOAA definition: >= 5 consecutive overlapping seasons at or above +0.5.
// ---------------------------------------------------------------------------
function findEvents(valueBySeasonIndex, field) {
  const events = [];
  let run = [];
  const flush = () => {
    if (run.length >= 5) {
      const peak = run.reduce((best, row) => (row.value > best.value ? row : best), run[0]);
      const startYear = run[0].year;
      const endYear = run.at(-1).year;
      events.push({
        label: startYear === endYear ? `${startYear}` : `${startYear}-${String(endYear).slice(2)}`,
        start: run[0].date,
        end: run.at(-1).date,
        seasons: run.length,
        peak_value: round(peak.value),
        peak_season: peak.date,
        [field]: round(peak.value)
      });
    }
    run = [];
  };
  for (const row of valueBySeasonIndex) {
    if (row.value >= 0.5) run.push(row);
    else flush();
  }
  flush();
  return events;
}

const oniEvents = findEvents(paired.map((row) => ({ ...row, value: row.oni_anomaly_c })), "peak_oni_c");
const roniEvents = findEvents(paired.map((row) => ({ ...row, value: row.roni_anomaly_c })), "peak_roni_c");

// Match RONI events to ONI events by overlapping peak season year, so the table can
// show both indices per event. Events do not always align exactly, which is itself
// informative - record unmatched ones rather than dropping them silently.
// Match each RONI event to AT MOST ONE ONI event. The first version fell back to a
// neighbouring year without tracking what it had already used, so a single RONI event
// could be assigned to two adjacent ONI events: 1957-58 and 1958-59 both came out at
// RONI 2.02, and 1958-59 was left claiming a raw peak of 0.62 against a RONI of 2.02,
// which is impossible when the 1950s ONI-minus-RONI gap is about -0.12. Exact-year
// matches are claimed first; a plus/minus one year match is only allowed against an
// unclaimed event; anything still unmatched stays null rather than borrowing.
const roniByPeakYear = new Map();
for (const event of roniEvents) roniByPeakYear.set(Number(event.peak_season.slice(0, 4)), event);
const claimed = new Set();
const roniMatchFor = new Map();
const peakYearOf = (event) => Number(event.peak_season.slice(0, 4));

for (const event of oniEvents) {
  const match = roniByPeakYear.get(peakYearOf(event));
  if (match && !claimed.has(match.peak_season)) {
    claimed.add(match.peak_season);
    roniMatchFor.set(event.peak_season, match);
  }
}
for (const event of oniEvents) {
  if (roniMatchFor.has(event.peak_season)) continue;
  const year = peakYearOf(event);
  for (const candidate of [roniByPeakYear.get(year + 1), roniByPeakYear.get(year - 1)]) {
    if (candidate && !claimed.has(candidate.peak_season)) {
      claimed.add(candidate.peak_season);
      roniMatchFor.set(event.peak_season, candidate);
      break;
    }
  }
}

const eventRows = oniEvents.map((event) => {
  const roniMatch = roniMatchFor.get(event.peak_season);
  return {
    label: event.label,
    value: event.peak_oni_c,
    peak_oni_c: event.peak_oni_c,
    peak_oni_season: event.peak_season,
    peak_roni_c: roniMatch ? roniMatch.peak_value : null,
    peak_roni_season: roniMatch ? roniMatch.peak_season : null,
    seasons_at_or_above_0_5: event.seasons,
    strength_oni: event.peak_oni_c >= 2 ? "very strong" : event.peak_oni_c >= 1.5 ? "strong" : event.peak_oni_c >= 1 ? "moderate" : "weak"
  };
});
// PIPELINE CONSTRAINT, learned the hard way. `buildEvidencePacket` caps locked numbers
// at roughly 12 per chart AND strips row labels, emitting entries that read only
// "<chart title>: value -> 2.75". So a chart must satisfy two rules or the writer will
// misattribute its numbers:
//   (a) keep rows under the cap, and
//   (b) make every row's `label` self-identifying, because the label is the ONLY context
//       that survives into the prompt.
// The first version of this chart used 16 rows in two `group`s. Extraction kept all eight
// ONI values but only two of eight RONI values, so 2.52 - the RONI record, the whole point
// of the chart - never reached the model, which then reused ONI figures for RONI and wrote
// that 1982-83 "leads at about 2.23". One row per event, sorted by RONI, with the raw value
// carried inside the label, fixes both problems at once.
const topEvents = [...eventRows]
  .filter((row) => row.peak_roni_c !== null)
  .sort((a, b) => b.peak_roni_c - a.peak_roni_c)
  .slice(0, 8);
const comparisonRows = topEvents.map((row) => ({
  label: `${row.label} (raw ${row.peak_oni_c.toFixed(2)})`,
  value: row.peak_roni_c,
  // `category` makes the locked number self-identifying; the raw peak is stated inside it
  // so the writer cannot mix up which index a figure belongs to.
  category: `${row.label}, trend-adjusted peak (its raw peak was ${row.peak_oni_c.toFixed(2)})`
}));
const comparisonDetail = topEvents.map((row) => ({ event: row.label, peak_oni_c: row.peak_oni_c, peak_roni_c: row.peak_roni_c }));

const rankedByOni = [...eventRows].sort((a, b) => b.peak_oni_c - a.peak_oni_c).slice(0, 5).map((row) => row.label);
const rankedByRoni = [...eventRows].filter((row) => row.peak_roni_c !== null).sort((a, b) => b.peak_roni_c - a.peak_roni_c).slice(0, 5).map((row) => row.label);

await emit({
  id: "climate.el_nino.event_rank_by_index",
  name: "derived.global.climate.el_nino.event_rank_by_index",
  title: "Change the index and the record holder changes",
  unit: "°C above normal, at the event's peak",
  rows: comparisonRows,
  metadata: {
    note: "The eight strongest El Nino events since 1950, ranked by the TREND-ADJUSTED index (RONI), with each event's RAW index peak shown in its label. Read the ordering against those raw figures: 1982-83 tops this ranking at 2.52 even though its raw peak (2.23) is lower than 2014-16's (2.75), which falls to third at 2.37. That reordering is the point - accounting for a warming tropics changes which event counts as the benchmark.",
    perEvent: comparisonDetail,
    barValueIs: "peak RONI. The number in brackets in each label is peak ONI.",
    topFiveByOni: [...topEvents].sort((a, b) => b.peak_oni_c - a.peak_oni_c).slice(0, 5).map((row) => `${row.label} ${row.peak_oni_c}`),
    topFiveByRoni: [...topEvents].sort((a, b) => b.peak_roni_c - a.peak_roni_c).slice(0, 5).map((row) => `${row.label} ${row.peak_roni_c}`),
    caveat: "Peak SEASONAL values, unscaled. These run lower than the peak MONTHLY figures quoted in most coverage, and are not comparable with variance-restoration-scaled RONI figures published elsewhere."
  }
});

await emit({
  id: "climate.el_nino.event_peak_intensity",
  name: "derived.global.climate.el_nino.event_peak_intensity",
  title: "Every El Nino event since 1950, at its peak",
  unit: "°C above normal, at the event's peak",
  rows: eventRows,
  metadata: {
    eventDefinition: "NOAA convention: an event is a run of at least five consecutive overlapping seasons with the index at or above +0.5. Applied identically to ONI and RONI.",
    topFiveByOni: rankedByOni,
    topFiveByRoni: rankedByRoni,
    theReRanking: "The two orderings differ, and that is the point: switching to the trend-adjusted index changes which event counts as the benchmark. Report both orderings side by side.",
    caveat: "Seasonal three-month means, unscaled. Peak SEASONAL values are lower than the peak MONTHLY values quoted in most coverage. The record starts in 1950, so the 1877-78 event often cited as a rival is out of scope here.",
    unmatchedRoniEvents: roniEvents.filter((event) => !eventRows.some((row) => row.peak_roni_season === event.peak_season)).map((event) => event.label)
  }
});

// ---------------------------------------------------------------------------
// 5. The strong-event subset: what India's monsoon actually did.
// ---------------------------------------------------------------------------
const allIndia = joinArt.rows.filter((row) => row.region_id === "all_india");
const strong = allIndia
  .filter((row) => (row.oni_monsoon_strongest_c ?? -9) >= 1.5)
  .sort((a, b) => a.year - b.year)
  .map((row) => ({
    // Narrow by design: label/value/x/y/highlight is everything the scatter renders.
    // Carrying departure and peak ONI again as extra columns would double-count against
    // the 12-number extraction cap and push later events out of the writer's view.
    label: String(row.year),
    value: row.departure_jun_sep_pct,
    x: row.oni_monsoon_strongest_c,
    y: row.departure_jun_sep_pct,
    highlight: row.year === 1997 || row.year === 2015 ? 1 : 0,
    category: `${row.year}: peak ONI ${row.oni_monsoon_strongest_c}, monsoon ${row.departure_jun_sep_pct > 0 ? "+" : ""}${row.departure_jun_sep_pct}%`,
    iod_phase: row.dmi_jun_sep_phase
  }));

const looseElNino = allIndia.filter((row) => row.official_enso_active_during_monsoon && row.oni_monsoon_phase_by_mean === "El Nino");
const strongDepartures = strong.map((row) => row.departure_jun_sep_pct);

await emit({
  id: "climate.el_nino.strong_event_outcomes",
  name: "derived.IN.climate.el_nino.strong_event_outcomes",
  title: "The strong El Nino monsoons, and what India got",
  unit: "% above or below normal rainfall",
  geography: { type: "country", id: "IN", name: "India" },
  rows: strong,
  metadata: {
    xLabel: "Peak Pacific warmth during the monsoon (°C above normal)",
    yLabel: "India's monsoon rainfall, % above or below normal",
    entityNoun: "monsoons",
    definition: "Monsoons in which the ONI reached +1.5 or above at some point during June-September. This is peak ONI DURING THE MONSOON, not the event's calendar peak - many events peak later, in OND-DJF.",
    summary: {
      events: strong.length,
      below_normal: strong.filter((row) => row.departure_jun_sep_pct < 0).length,
      below_minus_5: strong.filter((row) => row.departure_jun_sep_pct < -5).length,
      below_minus_10: strong.filter((row) => row.departure_jun_sep_pct < -10).length,
      mean_departure_pct: round(mean(strongDepartures), 1)
    },
    referenceClassLadder: {
      note: "The point of this artifact. The same record gives very different answers depending on how strictly an El Nino monsoon is defined - so the definition must be stated whenever a number is quoted.",
      sustained_el_nino_jjas: { events: looseElNino.length, mean_departure_pct: round(mean(looseElNino.map((row) => row.departure_jun_sep_pct)), 1) },
      strong_only: { events: strong.length, mean_departure_pct: round(mean(strongDepartures), 1) }
    },
    honestyRules: [
      "n is 7. Say so every time this is quoted. Do not dress a 7-case base rate as a forecast.",
      "1997 is the lone escape AND had the highest peak ONI of the seven - amplitude does not rank the damage.",
      "1972 pairs a positive IOD with the worst monsoon in the record, so a positive dipole is a tilt, not a shield.",
      "2026 has not yet cleared +1.5 on either index; it is where the forecast points, not where the season currently sits."
    ]
  }
});

// ---------------------------------------------------------------------------
// 6. Flavour, and the hypothesis that did not replicate.
// ---------------------------------------------------------------------------
const ersstByKey = new Map(ersstArt.rows.map((row) => [`${row.year}-${row.month}`, row]));
function jjasFlavour(year) {
  const months = [6, 7, 8, 9].map((month) => ersstByKey.get(`${year}-${month}`)).filter(Boolean);
  if (!months.length) return null;
  const n12 = mean(months.map((row) => row.nino12_anomaly_c));
  const n4 = mean(months.map((row) => row.nino4_anomaly_c));
  return { n12: round(n12), n4: round(n4), diff: round(n12 - n4), months: months.length };
}

const flavourRows = [];
for (const row of strong) {
  const year = Number(row.label);
  const flavour = jjasFlavour(year);
  if (!flavour) continue;
  const kind = flavour.diff > 0.3 ? "eastern Pacific" : flavour.diff < -0.3 ? "central Pacific" : "mixed";
  // `row` comes from the lean strong-event rows, where the monsoon departure lives in
  // `value` (and `y`). Reading `departure_jun_sep_pct` here left dep undefined, which
  // silently dropped the scatter's y column and broke the hypothesis test below.
  const dep = row.value;
  flavourRows.push({
    label: row.label,
    value: flavour.diff,
    x: flavour.diff,
    y: dep,
    highlight: Number(row.label) === 1997 ? 1 : 0,
    category: `${row.label}: leaned eastern-Pacific by ${flavour.diff}, monsoon ${dep > 0 ? "+" : ""}${dep}%`,
    flavour: kind,
    // Kumar et al. predict central-Pacific events hurt India MORE. So a fit means
    // (central Pacific AND a bad monsoon) or (eastern Pacific AND a mild one).
    fits_kumar_hypothesis: kind === "central Pacific" ? dep < -10 : kind === "eastern Pacific" ? dep > -10 : null
  });
}
const currentFlavour = jjasFlavour(2026);
const testable = flavourRows.filter((row) => row.fits_kumar_hypothesis !== null);

await emit({
  id: "climate.el_nino.flavour_by_event",
  name: "derived.IN.climate.el_nino.flavour_by_event",
  title: "Where the Pacific warmed, and whether it predicted India's monsoon",
  unit: "% above or below normal rainfall",
  geography: { type: "country", id: "IN", name: "India" },
  rows: flavourRows,
  metadata: {
    xLabel: "How far the warmth leaned to the eastern Pacific (Nino 1+2 minus Nino 4, °C)",
    yLabel: "India's monsoon rainfall, % above or below normal",
    entityNoun: "monsoons",
    hypothesis: "Kumar et al., Science, 2006 (doi:10.1126/science.1131152): El Nino events with the warmest anomalies in the CENTRAL equatorial Pacific focus drought-producing subsidence over India more effectively than eastern-Pacific events.",
    proxy: "JJAS-mean Nino 1+2 anomaly minus JJAS-mean Nino 4 anomaly. Positive means eastern-Pacific-leaning, negative central-Pacific-leaning. This is a CRUDE proxy - Kumar et al. use a composite/regression decomposition.",
    result: {
      testable_events: testable.length,
      consistent: testable.filter((row) => row.fits_kumar_hypothesis).length,
      verdict: "CANNOT BE TESTED on this subset, and does not explain it. Every one of the seven strong-event monsoons is eastern-Pacific-leaning on this proxy - there is not a single central-Pacific case among them (2002, the clearest central-Pacific event, peaked at only +1.01 during JJAS and so falls outside the strong subset). So flavour cannot account for variation WITHIN the strong events: 5 of the 7 eastern-Pacific events still produced monsoons worse than -10%, while 1997 and 2023 did not. The hypothesis is not refuted; it simply has no discriminating power here."
    },
    howToUseThis: "Report it as an honest negative result, and be precise about WHY it is negative: the strong-event subset contains no central-Pacific events, so there is nothing for the flavour contrast to discriminate between. Explain flavour as a mechanism the literature supports, show that it has no purchase on these seven cases, and state plainly that 2026 being eastern-Pacific-leaning therefore CANNOT be used to reassure anyone. This is not a refutation of Kumar et al. - the proxy is crude, n is small, and their composite decomposition is a different instrument.",
    current2026Jjas: currentFlavour ? { ...currentFlavour, note: "Partial season - only the months available so far. 2026 leans strongly eastern-Pacific, like 1997 and 2023, but per the result above that licenses no monsoon inference." } : null
  }
});

await writeSourceManifest("derived-enso-index-family", manifest);
console.log(`\nderived ENSO index family: ${manifest.length} artifacts`);
