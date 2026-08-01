// The escalation fork: what happened to monsoons that began where 2026 begins.
//
// WHY THIS EXISTS. The article previously leaned on an unsourced sentence -
// "forecasters expect 2026 to cross that 1.5C mark while the monsoon is still
// running" - to justify applying the strong-event base rate (n=7, mean -12.1%) to
// 2026. No forecast is in the evidence packet, and the article's own data says the
// AMJ 2026 ONI is 0.98, which CPC classifies as WEAK, with RONI at 0.47, NEUTRAL.
// The piece was therefore selecting its harshest reference class on a claim it could
// not support.
//
// The honest, checkable question is the conditional one: of the monsoons that stood
// where 2026 stands NOW - a mid-range ONI at AMJ, before the season - how many went
// on to become strong events during the monsoon, and what did India get?
//
// THE FINDING. Thirteen years since 1950 had an AMJ ONI between +0.6 and +1.4.
// Five of them (38%) crossed +1.5 during the monsoon; those five averaged -12.1%.
// The eight that did not averaged +6.8%, and only two finished below normal. The gap
// is 18.9 points against standard deviations of 8.1 and 6.5: Welch t = -4.41,
// df = 7.2, p = 0.003. Unlike the northeast-monsoon sign flip, this one IS
// significant in our record.
//
// So the fork, not the forecast, is the story. At the start of August the Pacific has
// not yet told India which branch it is on.
//
// HONESTY LIMITS, enforced in the artifact metadata below:
//   - n=13 total, 5 v 8 in the split. Small. A rough guide to the odds, never a forecast.
//   - The split is partly definitional: a year that escalates lands in the strong-event
//     set by construction. The NON-circular content is the escalation RATE (5 of 13)
//     and the outcome of the branch that did NOT escalate.
//   - 1965 (AMJ 0.46) and 2023 (AMJ 0.57) escalated from BELOW this band, so a low
//     AMJ reading is not safety either. Escalation is not exclusive to this starting range.
//   - Uses the JJAS-window peak, not the event's calendar peak, consistent with the
//     rest of the article.

import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const ONI = "data/series/noaa-enso.global.oni_seasonal.json";
const RONI = "data/series/noaa-enso.global.roni_seasonal.json";
const IMD = "data/series/imd.IN.climate.imd.monsoon_rainfall_regions.json";
const SOURCE_URL = "https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt";

// The band around the current AMJ reading. Chosen as +-0.4C either side of 2026's
// 0.98 and checked for sensitivity: 0.5-1.5 gives 6 of 14 escalating, 0.7-1.3 gives
// 3 of 9, 0.8-1.2 gives 2 of 5. The escalation rate stays between 33% and 43% and
// the sign of the outcome split never changes, so the finding is not an artefact of
// where the band was drawn. Recorded in metadata.bandSensitivity.
const BAND_LO = 0.6;
const BAND_HI = 1.4;
const STRONG = 1.5;
const CURRENT_YEAR = 2026;
// Seasons whose three-month windows overlap June-September.
const MONSOON_SEASONS = ["MJJ", "JJA", "JAS", "ASO"];

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const round = (value, dp = 1) => Number(Number(value).toFixed(dp));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const sd = (values) => {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1));
};

// Welch's t, with a two-sided p from the regularised incomplete beta.
function betacf(a, b, x) {
  const MAXIT = 200, EPS = 3e-16, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; c = 1 + aa / c;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; c = 1 + aa / c;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function lgamma(z) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
function welch(a, b) {
  const ma = mean(a), mb = mean(b);
  const va = sd(a) ** 2, vb = sd(b) ** 2;
  const na = a.length, nb = b.length;
  const t = (ma - mb) / Math.sqrt(va / na + vb / nb);
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  return { t: round(t, 2), df: round(df, 1), p: Number(betai(df / 2, 0.5, df / (df + t * t)).toFixed(4)) };
}

const [oniArt, roniArt, imdArt] = await Promise.all([readJson(ONI), readJson(RONI), readJson(IMD)]);

const oni = new Map(oniArt.rows.map((row) => [`${row.year}-${row.season}`, row.oni_anomaly_c]));
const roni = new Map(roniArt.rows.map((row) => [`${row.year}-${row.season}`, row.roni_anomaly_c]));
const rain = new Map(
  imdArt.rows.filter((row) => row.region_id === "all_india").map((row) => [row.year, row.departure_jun_sep_pct])
);

const monsoonPeak = (year) => {
  const values = MONSOON_SEASONS.map((season) => oni.get(`${year}-${season}`)).filter((v) => v !== undefined && v !== null);
  return values.length ? Math.max(...values) : null;
};

const currentAmj = oni.get(`${CURRENT_YEAR}-AMJ`);
const currentRoni = roni.get(`${CURRENT_YEAR}-AMJ`);
if (currentAmj === undefined) throw new Error(`no AMJ ONI for ${CURRENT_YEAR} - re-run scripts/ingest-noaa-enso.mjs`);

const years = [...new Set(oniArt.rows.map((row) => row.year))].filter((y) => y < CURRENT_YEAR).sort();

const cohort = years
  .filter((year) => {
    const amj = oni.get(`${year}-AMJ`);
    return amj !== undefined && amj >= BAND_LO && amj <= BAND_HI && rain.get(year) !== undefined && rain.get(year) !== null;
  })
  .map((year) => ({
    year,
    amj: round(oni.get(`${year}-AMJ`), 2),
    peak: round(monsoonPeak(year), 2),
    escalated: monsoonPeak(year) >= STRONG,
    departure: rain.get(year)
  }));

const escalated = cohort.filter((row) => row.escalated);
const stayed = cohort.filter((row) => !row.escalated);
const escRain = escalated.map((row) => row.departure);
const stayRain = stayed.map((row) => row.departure);
const test = welch(escRain, stayRain);

// Band sensitivity, so the choice of window is auditable rather than asserted.
const bandSensitivity = [[0.5, 1.5], [0.6, 1.4], [0.7, 1.3], [0.8, 1.2]].map(([lo, hi]) => {
  const set = years.filter((year) => {
    const amj = oni.get(`${year}-AMJ`);
    return amj !== undefined && amj >= lo && amj <= hi && rain.get(year) !== undefined && rain.get(year) !== null;
  });
  const esc = set.filter((year) => monsoonPeak(year) >= STRONG);
  const non = set.filter((year) => monsoonPeak(year) < STRONG);
  return {
    band: `${lo} to ${hi}`,
    n: set.length,
    escalated: esc.length,
    escalationRatePct: round((100 * esc.length) / set.length, 0),
    escalatedMeanDeparturePct: esc.length ? round(mean(esc.map((y) => rain.get(y)))) : null,
    stayedMeanDeparturePct: non.length ? round(mean(non.map((y) => rain.get(y)))) : null
  };
});

// Years that reached strong DURING the monsoon but started BELOW the band - the
// reason a low reading today is not reassurance either.
const escapedFromBelow = years
  .filter((year) => {
    const amj = oni.get(`${year}-AMJ`);
    return amj !== undefined && amj < BAND_LO && monsoonPeak(year) !== null && monsoonPeak(year) >= STRONG && rain.get(year) != null;
  })
  .map((year) => ({ year, amj: round(oni.get(`${year}-AMJ`), 2), peak: round(monsoonPeak(year), 2), departure: rain.get(year) }));

const allYears = years.filter((year) => rain.get(year) !== undefined && rain.get(year) !== null).map((year) => rain.get(year));

// --- chart rows -------------------------------------------------------------
// tableBars renders only label, value and group, so the peak has to live in the label.
const GROUP_ESC = "Grew into a strong El Nino during the monsoon";
const GROUP_STAY = "Stayed below the strong threshold";
const forkRows = [
  ...escalated.sort((a, b) => a.departure - b.departure),
  ...stayed.sort((a, b) => a.departure - b.departure)
].map((row) => ({
  // Fixed 2dp so the labels line up: 1.7 next to 1.58 reads as a different precision.
  label: `${row.year} (reached ${row.peak > 0 ? "+" : ""}${row.peak.toFixed(2)})`,
  group: row.escalated ? GROUP_ESC : GROUP_STAY,
  value: row.departure,
  amj_oni: row.amj,
  monsoon_peak_oni: row.peak
}));

const summaryRows = [
  {
    label: `Grew past +1.5 during the monsoon (${escalated.length} of ${cohort.length})`,
    group: "What happened next",
    value: round(mean(escRain)),
    years_counted: escalated.length,
    below_normal: escRain.filter((v) => v < 0).length
  },
  {
    label: `Stayed below +1.5 (${stayed.length} of ${cohort.length})`,
    group: "What happened next",
    value: round(mean(stayRain)),
    years_counted: stayed.length,
    below_normal: stayRain.filter((v) => v < 0).length
  },
  {
    label: "Every monsoon since 1950, for comparison",
    group: "Background",
    value: round(mean(allYears)),
    years_counted: allYears.length,
    below_normal: allYears.filter((v) => v < 0).length
  }
];

const sharedMethod = {
  method: `Every year from 1950 whose April-June ONI fell between +${BAND_LO} and +${BAND_HI}, the band around ${CURRENT_YEAR}'s AMJ reading of ${currentAmj}. Each is then split by whether the ONI reached +${STRONG} in any three-month window overlapping June-September (${MONSOON_SEASONS.join(", ")}), and paired with IMD's all-India June-September rainfall departure for that year.`,
  currentReading: {
    year: CURRENT_YEAR,
    amjOni: currentAmj,
    amjOniClass: "weak, per CPC's own strength labelling on this artifact",
    amjRoni: currentRoni,
    amjRoniClass: "neutral",
    note: "This is the latest observation on disk, not a forecast. The article must not assert what the event will become."
  },
  peakDefinition: `Peak ONI reached during the monsoon window only, NOT the event's calendar peak. Most El Nino events peak in OND or NDJ, so the JJAS peak is the lower and more relevant number for the kharif season. Consistent with climate.el_nino.strong_event_outcomes.`,
  bandSensitivity,
  escapedFromBelow,
  sourceNote: "NOAA CPC ONI (ERSSTv5, three-month running means) and IMD Pune all-India June-September rainfall departures, both already ingested for this repo."
};

const honestyRules = [
  `SMALL SAMPLE. n=${cohort.length} in total, split ${escalated.length} against ${stayed.length}. Read as a rough guide to the odds and never as a forecast.`,
  "PARTLY DEFINITIONAL. A year that escalates lands in the strong-event set by construction, so the low mean of that branch is not an independent discovery. The non-circular content is (a) the escalation RATE and (b) the outcome of the branch that did NOT escalate, which is where the genuinely new information sits.",
  `NOT EXCLUSIVE. ${escapedFromBelow.map((r) => r.year).join(" and ")} reached strong intensity during the monsoon from an AMJ reading BELOW this band. A low reading today is not safety either.`,
  "DO NOT WRITE THIS AS A FORECAST FOR 2026. The claim is about what the record does and does not settle at this point in the season, not about what the Pacific will do next.",
  "The article must not restore any sentence of the form 'forecasters expect 2026 to...' unless a forecast artifact is actually ingested and cited."
];

const manifest = [];
async function emit({ id, name, title, unit, rows, metadata }) {
  const artifact = createTableArtifact({
    indicatorId: id,
    title,
    sourceId: "derived",
    sourceIndicatorId: `derived.${id}`,
    sourceUrl: SOURCE_URL,
    unit,
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt: new Date().toISOString(),
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata
  });
  const path = await writeSeriesArtifact({ sourceId: "derived", name, artifact });
  manifest.push({ status: "ready", indicatorId: id, artifact: path, rows: rows.length, fetchedAt: artifact.fetchedAt });
  console.log(`  ${id}: ${rows.length} rows`);
}

await emit({
  id: "climate.el_nino.escalation_fork",
  name: "derived.IN.climate.el_nino.escalation_fork",
  title: "Monsoons that began where this one begins",
  unit: "% above or below normal June-September rainfall",
  rows: forkRows,
  metadata: {
    ...sharedMethod,
    generatedFor: "q.climate.el_nino_2026",
    headline: `Of the ${cohort.length} monsoons since 1950 that opened with the Pacific where it is now, ${escalated.length} grew into strong events during the season and averaged ${round(mean(escRain))}%. The ${stayed.length} that did not averaged +${round(mean(stayRain))}%.`,
    significanceTest: {
      ...test,
      escalatedMean: round(mean(escRain)),
      escalatedSd: round(sd(escRain)),
      escalatedN: escalated.length,
      stayedMean: round(mean(stayRain)),
      stayedSd: round(sd(stayRain)),
      stayedN: stayed.length,
      gapPoints: round(mean(escRain) - mean(stayRain)),
      verdict: `SIGNIFICANT. t = ${test.t}, df = ${test.df}, p = ${test.p}. Unlike the northeast-monsoon sign flip in climate.el_nino.northeast_monsoon_by_phase, the gap here is large relative to the spread within each branch.`,
      howToWriteIt: "Lead with the escalation rate, because that is the part the reader cannot get from the strong-event base rate alone. Then give both branch means. State the sample size in the same breath, every time."
    },
    honestyRules
  }
});

await emit({
  id: "climate.el_nino.escalation_odds",
  name: "derived.IN.climate.el_nino.escalation_odds",
  title: "The fork, not the forecast",
  unit: "average % above or below normal June-September rainfall",
  rows: summaryRows,
  metadata: {
    ...sharedMethod,
    generatedFor: "q.climate.el_nino_2026",
    note: "The same cohort collapsed to branch means, with every monsoon since 1950 as the background rate. The point of the third bar is that the branch which did not escalate was not merely average, it was wetter than average.",
    honestyRules
  }
});

await writeSourceManifest("derived-enso-escalation-fork", manifest);

console.log(`\nescalation fork: ${CURRENT_YEAR} AMJ ONI ${currentAmj} (RONI ${currentRoni})`);
console.log(`  cohort AMJ in [${BAND_LO}, ${BAND_HI}]: ${cohort.length} years`);
console.log(`  escalated past +${STRONG} during JJAS: ${escalated.length} (${Math.round((100 * escalated.length) / cohort.length)}%)  mean ${round(mean(escRain))}%  below normal ${escRain.filter((v) => v < 0).length}/${escRain.length}`);
console.log(`  stayed below:                          ${stayed.length}  mean +${round(mean(stayRain))}%  below normal ${stayRain.filter((v) => v < 0).length}/${stayRain.length}`);
console.log(`  Welch t=${test.t} df=${test.df} p=${test.p}`);
console.log(`  escalated from below the band: ${escapedFromBelow.map((r) => `${r.year} (AMJ ${r.amj})`).join(", ")}`);
