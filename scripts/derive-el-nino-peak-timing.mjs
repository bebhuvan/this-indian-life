// When does an El Nino actually peak?
//
// This exists because the article's post-monsoon act needed a fact it could stand on.
// The northeast-monsoon "sign flip" is directionally consistent with published work but
// cannot be separated from noise in our record (Welch p about 0.46, see
// derive-northeast-monsoon-enso.mjs), so it cannot carry an act on its own.
//
// Seasonal phase-locking can. Of the ten strong El Nino events since 1950, NINE peaked
// between September and February; the lone exception is the unusual two-year 1986-88
// event, which topped out in JAS 1987. That is the fact that makes the whole "the risk
// migrates past the kharif harvest" argument work, and it is verifiable from the ONI
// series already on disk.
//
// Row shape follows the evidence-packet rules (see derive-enso-index-family.mjs): narrow
// rows, a `category` so each locked number identifies itself, and no date-like key.

import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const EVENTS = "data/series/derived.global.climate.el_nino.event_peak_intensity.json";
const SOURCE_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt";

// Grouped into the calendar language a reader thinks in, not season codes.
const WINDOW = {
  JAS: "Jul-Sep", ASO: "Jul-Sep",
  SON: "Sep-Nov",
  OND: "Oct-Dec", NDJ: "Nov-Jan",
  DJF: "Dec-Feb", JFM: "Jan-Mar",
  FMA: "Feb-Apr", MAM: "Mar-May", AMJ: "Apr-Jun", MJJ: "May-Jul", JJA: "Jun-Aug"
};
const ORDER = ["Jul-Sep", "Sep-Nov", "Oct-Dec", "Nov-Jan", "Dec-Feb", "Jan-Mar"];

const events = JSON.parse(await readFile(EVENTS, "utf8")).rows;
const strong = events.filter((row) => row.peak_oni_c >= 1.5);

const counts = new Map();
for (const row of events) {
  const season = String(row.peak_oni_season).split("-")[1];
  const window = WINDOW[season] || season;
  if (!counts.has(window)) counts.set(window, { all: 0, strong: 0, events: [] });
  const bucket = counts.get(window);
  bucket.all += 1;
  if (row.peak_oni_c >= 1.5) { bucket.strong += 1; bucket.events.push(row.label); }
}

const rows = ORDER.filter((w) => counts.has(w)).map((w) => {
  const bucket = counts.get(w);
  return {
    label: w,
    value: bucket.all,
    category: `El Nino events peaking in ${w}`,
    strong_events: bucket.strong
  };
});

const afterKharif = ["Sep-Nov", "Oct-Dec", "Nov-Jan", "Dec-Feb", "Jan-Mar"];
const strongLate = strong.filter((row) => afterKharif.includes(WINDOW[String(row.peak_oni_season).split("-")[1]]));

const artifact = createTableArtifact({
  indicatorId: "climate.el_nino.event_peak_timing",
  title: "El Nino peaks after the kharif harvest is decided",
  sourceId: "derived",
  sourceIndicatorId: "derived.climate.el_nino.event_peak_timing",
  sourceUrl: SOURCE_URL,
  unit: "number of events",
  geography: { type: "region", id: "nino34", name: "Nino 3.4 region" },
  fetchedAt: new Date().toISOString(),
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    note: "Every El Nino event since 1950, grouped by the three-month window in which its ONI peaked. Events cluster heavily in autumn and early winter, months after India's June-September monsoon has finished.",
    strongEvents: {
      total: strong.length,
      peakingSeptemberToFebruary: strongLate.length,
      exception: strong.filter((row) => !afterKharif.includes(WINDOW[String(row.peak_oni_season).split("-")[1]])).map((row) => `${row.label} (peaked ${row.peak_oni_season})`),
      list: strong.map((row) => `${row.label}: peaks ${row.peak_oni_season}, ONI ${row.peak_oni_c}`)
    },
    whyItMatters: "The kharif crop is largely settled by the end of September. If the Pacific does not reach its maximum until Oct-Jan, the loudest part of the event lands on reservoir carryover, the winter rabi sowing and food prices in the following year, rather than on the summer harvest everyone is watching.",
    caveat: "Peak here means the highest SEASONAL ONI value, using the three-month running mean. Events also vary in how long they hold near their peak, which this count does not show."
  }
});

const path = await writeSeriesArtifact({ sourceId: "derived", name: "derived.global.climate.el_nino.event_peak_timing", artifact });
await writeSourceManifest("derived-el-nino-peak-timing", [{ status: "ready", indicatorId: "climate.el_nino.event_peak_timing", artifact: path, rows: rows.length, fetchedAt: artifact.fetchedAt }]);

console.log(`el nino peak timing: ${rows.length} windows across ${events.length} events`);
for (const row of rows) console.log(`  ${row.label.padEnd(8)} ${String(row.value).padStart(2)} events (${row.strong_events} strong)`);
console.log(`  strong events peaking Sep-Feb: ${strongLate.length}/${strong.length}`);
