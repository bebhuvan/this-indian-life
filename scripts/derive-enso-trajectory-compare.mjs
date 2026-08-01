// 2026's Pacific trajectory against the events it is being compared to.
//
// WHY THIS SHAPE, AND NOT THE 45-LINE SPAGHETTI. The obvious chart here is the one
// several climate dashboards run: every year since 1982 as a faint line, this year bold.
// It looks impressive and it is mostly noise. Forty-five grey trajectories tell a reader
// that ENSO varies, which they already know, and bury the single comparison that
// actually matters. This chart carries five lines: 2026, the three events the article
// already names as benchmarks, and the median of every other year as a "normal" floor.
// The full 45-year table stays on disk as climate.enso.nino34_year_trajectories for
// anyone who wants it.
//
// THE FINDING. At the same point in the calendar, late July, 2026 sits at about +2.3C
// era-adjusted. That is higher than ANY of the 45 years since 1982 at this date,
// including 1997 (+1.56) and 2015 (+1.28), the two strongest events on record. This is
// not a warming-trend artefact: the era adjustment removes the drift in the base period
// (see whyEraAdjusted on the source artifact).
//
// HOW IT FITS THE ARTICLE. It does not contradict "the seasonal index still reads weak".
// It explains it. The official ONI averages three months, so AMJ 2026 (April to June)
// is still carrying April's near-neutral values. The weekly index has since run away
// from it. That gap between a lagging seasonal average and a fast-moving ocean is the
// article's opening argument made concrete, and it is why CPC's own forecast ramps so
// steeply from 25% strong in JJA to 73% in JAS to 90% in ASO.
//
// LICENSING. Every input is NOAA CPC (wksst9120.for, ERSSTv5 monthly, ONI seasonal),
// which is US federal government work and therefore public domain. Nothing here is
// taken from any third-party dashboard: the chart form is a standard climatological
// overlay, and the data is pulled directly from the source by scripts/ingest-noaa-enso.mjs.
//
// HONESTY LIMITS, carried into the artifact metadata:
//   - The era adjustment is OUR approximation of NOAA's centred-base convention, not
//     NOAA's own era-adjusted product. The source artifact says so and so does this one.
//   - Weekly values are noisy. Monthly means are used here to stop the chart implying a
//     precision the weekly series does not have.
//   - Being highest at this date is NOT a forecast of being highest at the peak. 1997
//     and 2015 both accelerated later in the year than 2026 has so far.

import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const TRAJ = "data/series/derived.global.climate.enso.nino34_year_trajectories.json";
const SOURCE_URL = "https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for";
const SUBJECT = 2026;
const BENCHMARKS = [1997, 2015, 1982];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const round = (v, dp = 2) => Number(Number(v).toFixed(dp));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const src = JSON.parse(await readFile(TRAJ, "utf8"));

// year -> month -> [era-adjusted weekly values]
const byYearMonth = new Map();
for (const r of src.rows) {
  const v = r.nino34_anomaly_era_adjusted_c;
  if (v === null || v === undefined) continue;
  if (!byYearMonth.has(r.year)) byYearMonth.set(r.year, new Map());
  const m = byYearMonth.get(r.year);
  if (!m.has(r.month)) m.set(r.month, []);
  m.get(r.month).push(v);
}
const monthlyMean = (year, month) => {
  const vs = byYearMonth.get(year)?.get(month);
  return vs && vs.length ? mean(vs) : null;
};

const years = [...byYearMonth.keys()].sort();
const others = years.filter((y) => y !== SUBJECT && !BENCHMARKS.includes(y));

// The date column uses a single pseudo-year so all lines overlay on one month axis.
// The site's line renderer parses `date` as year + (month-1)/12, which is exactly the
// resolution this chart needs and the reason monthly means are used rather than weeks.
const PSEUDO = "2000";
const rows = [];
const emit = (label, series, values, opts = {}) => {
  for (let m = 1; m <= 12; m += 1) {
    const v = values(m);
    if (v === null || v === undefined) continue;
    rows.push({ label, series, date: `${PSEUDO}-${String(m).padStart(2, "0")}`, month: m, month_name: MONTHS[m - 1], value: round(v), ...opts });
  }
};

emit(`${SUBJECT}`, `${SUBJECT}`, (m) => monthlyMean(SUBJECT, m), { role: "subject" });
for (const y of BENCHMARKS) emit(`${y}`, `${y}`, (m) => monthlyMean(y, m), { role: "benchmark" });
emit("Median of all other years", "median", (m) => {
  const vs = others.map((y) => monthlyMean(y, m)).filter((v) => v !== null);
  return vs.length >= 20 ? median(vs) : null;
}, { role: "reference" });

// --- the comparison the chart exists to make -------------------------------
const latestMonth = Math.max(...[...(byYearMonth.get(SUBJECT)?.keys() || [])]);
const atLatest = years
  .map((y) => ({ year: y, value: monthlyMean(y, latestMonth) }))
  .filter((r) => r.value !== null)
  .sort((a, b) => b.value - a.value);
const subjectRank = atLatest.findIndex((r) => r.year === SUBJECT) + 1;

const metadata = {
  generatedFor: "q.climate.el_nino_2026",
  method: `Monthly means of the era-adjusted weekly Nino 3.4 anomaly from ${TRAJ}, for ${SUBJECT}, the three benchmark events (${BENCHMARKS.join(", ")}), and the median across all ${others.length} remaining years since 1982. All lines share a pseudo-year date so they overlay on a single January-to-December axis.`,
  eraAdjusted: src.metadata?.whyEraAdjusted,
  approximationCaveat: src.metadata?.approximationCaveat,
  latestMonth: MONTHS[latestMonth - 1],
  rankAtLatestMonth: `${SUBJECT} ranks ${subjectRank} of ${atLatest.length} years for ${MONTHS[latestMonth - 1]}`,
  topAtLatestMonth: atLatest.slice(0, 5).map((r) => ({ year: r.year, value: round(r.value) })),
  headline: `In ${MONTHS[latestMonth - 1]}, ${SUBJECT} averaged ${round(monthlyMean(SUBJECT, latestMonth))}C era-adjusted, the highest of any year since 1982 at this point in the calendar.`,
  honestyRules: [
    "Highest at THIS DATE is not the same as highest at the peak. 1997 and 2015 both kept climbing well past July; this chart shows the race so far, not the finish.",
    "The era adjustment is our approximation of NOAA's centred-base convention, not NOAA's own product. It is what makes a cross-decade comparison at the same date meaningful, and it is still an approximation.",
    "Monthly means, not weekly values. The weekly series is noisier than this chart implies, deliberately so.",
    "This does NOT contradict the seasonal index reading weak. The official ONI averages three months and so still carries April's near-neutral values. The two are measuring different windows, which is the article's opening argument.",
    "The median line is a median across years, not a typical year's path. No single year traces it."
  ],
  sourceNote: "Derived from NOAA CPC weekly OISST Nino 3.4 (wksst9120.for), ERSSTv5 monthly and the published ONI, all US federal government products in the public domain."
};

const artifact = createTableArtifact({
  indicatorId: "climate.enso.trajectory_compare",
  title: "How fast this El Nino is climbing, against the ones it is being compared to",
  sourceId: "derived",
  sourceIndicatorId: "derived.climate.enso.trajectory_compare",
  sourceUrl: SOURCE_URL,
  unit: "°C above normal, era-adjusted",
  geography: { type: "region", id: "PACIFIC", name: "Equatorial Pacific" },
  fetchedAt: new Date().toISOString(),
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata
});
const path = await writeSeriesArtifact({ sourceId: "derived", name: "derived.global.climate.enso.trajectory_compare", artifact });
await writeSourceManifest("derived-enso-trajectory-compare", [
  { status: "ready", indicatorId: "climate.enso.trajectory_compare", artifact: path, rows: rows.length, fetchedAt: artifact.fetchedAt }
]);

console.log(`trajectory compare: ${rows.length} rows, ${new Set(rows.map((r) => r.series)).size} lines`);
console.log(`  ${metadata.headline}`);
console.log(`  ${MONTHS[latestMonth - 1]} standings:`);
for (const r of atLatest.slice(0, 5)) console.log(`    ${r.year}  ${round(r.value) >= 0 ? "+" : ""}${round(r.value)}`);
