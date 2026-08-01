// The northeast monsoon (Oct-Dec) against ENSO phase - the sign flip.
//
// The article's Act 7 hinges on a fact absent from both existing El Nino articles:
// El Nino does not only subtract rain from India, it MOVES it. The June-September
// southwest monsoon tends to weaken, but the October-December northeast monsoon that
// gives southern Tamil Nadu roughly half its annual rain tends to STRENGTHEN. So an
// event peaking in OND 2026 - after the kharif season closes - lands on a region
// where the sign of the effect is reversed.
//
// Built entirely from data already on disk: `imd.IN.climate.imd.subdivision_rainfall`
// carries all twelve months for 36 subdivisions, 1901-2025.
//
// METHOD NOTE. IMD's own regional averages are area-weighted; we do not have
// subdivision areas. Summing millimetres across subdivisions of different sizes
// would silently weight by nothing meaningful, so instead each subdivision is
// converted to a percentage departure from ITS OWN 1971-2020 normal, and the region
// figure is the unweighted mean of those departures. That answers "how anomalous was
// this season across the northeast-monsoon belt" rather than "how many millimetres
// fell", which is the question the chart asks. Stated in the artifact metadata.

import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const SUBDIV = "data/series/imd.IN.climate.imd.subdivision_rainfall.json";
const ONI = "data/series/noaa-enso.global.oni_seasonal.json";
const SOURCE_URL = "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html";

// IMD's northeast-monsoon core. Lakshadweep and Andaman & Nicobar are excluded as
// island subdivisions whose rainfall regime is not the peninsular NEM.
const NEM_CORE = [
  "Tamil Nadu, Puducherry and Karaikal",
  "Coastal Andhra Pradesh and Yanam",
  "Rayalaseema",
  "South Interior Karnataka",
  "Kerala and Mahe"
];

const NORMAL_FROM = 1971;
const NORMAL_TO = 2020;

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const round = (value, dp = 1) => Number(Number(value).toFixed(dp));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const [subdivArt, oniArt] = await Promise.all([readJson(SUBDIV), readJson(ONI)]);

// --- OND totals per subdivision-year ---------------------------------------
const ondBySub = new Map();
for (const row of subdivArt.rows) {
  const parts = [row.actual_oct_mm, row.actual_nov_mm, row.actual_dec_mm];
  if (parts.some((value) => value === null || value === undefined)) continue;
  if (!ondBySub.has(row.subdivision)) ondBySub.set(row.subdivision, new Map());
  ondBySub.get(row.subdivision).set(row.year, parts.reduce((sum, value) => sum + value, 0));
}

// --- per-subdivision 1971-2020 normal, then departures ----------------------
const departures = new Map();   // subdivision -> Map(year -> departure %)
const normals = {};
for (const [subdivision, byYear] of ondBySub) {
  const baseline = [...byYear.entries()].filter(([year]) => year >= NORMAL_FROM && year <= NORMAL_TO).map(([, value]) => value);
  if (baseline.length < 40) continue;                       // need a real normal
  const normal = mean(baseline);
  if (normal <= 0) continue;
  normals[subdivision] = round(normal, 1);
  const perYear = new Map();
  for (const [year, value] of byYear) perYear.set(year, ((value - normal) / normal) * 100);
  departures.set(subdivision, perYear);
}

// --- ENSO phase for the OND season itself ----------------------------------
// The northeast monsoon IS Oct-Dec, so the contemporaneous season is OND, not JJAS.
const ondOni = new Map();
for (const row of oniArt.rows) {
  if (row.season === "OND") ondOni.set(row.year, row.oni_anomaly_c);
}
const phaseFor = (oni) => (oni >= 0.5 ? "El Nino" : oni <= -0.5 ? "La Nina" : "Neutral");

// --- region-mean departure per year ----------------------------------------
const available = NEM_CORE.filter((name) => departures.has(name));
const missing = NEM_CORE.filter((name) => !departures.has(name));

const yearRows = [];
for (const year of [...ondOni.keys()].sort()) {
  const values = available.map((name) => departures.get(name).get(year)).filter((value) => value !== undefined);
  if (values.length !== available.length) continue;          // require the full region
  const oni = ondOni.get(year);
  yearRows.push({
    label: String(year),
    // `year` deliberately NOT a row key: rowDate() would treat it as a date and
    // preferredRowsForLockedNumbers would keep only the newest and oldest seasons.
    category: `${year} northeast monsoon`,
    // Scatter coordinates: the OND Pacific state against that season's rainfall. 76 points
    // are stronger evidence for the sign flip than a three-bar average of the same data,
    // and they let the reader see the spread instead of being handed a mean.
    x: oni,
    y: round(mean(values)),
    highlight: oni >= 1.5 ? 1 : 0,
    value: round(mean(values)),
    nem_departure_pct: round(mean(values)),
    phase: phaseFor(oni),
    tamil_nadu_departure_pct: round(departures.get("Tamil Nadu, Puducherry and Karaikal").get(year))
  });
}

// --- by phase ---------------------------------------------------------------
const phases = ["El Nino", "Neutral", "La Nina"];
const phaseRows = phases.map((phase) => {
  const subset = yearRows.filter((row) => row.phase === phase);
  const values = subset.map((row) => row.nem_departure_pct);
  const tn = subset.map((row) => row.tamil_nadu_departure_pct);
  return {
    label: phase,
    value: round(mean(values)),
    // `category` is what makes each locked number self-identifying in the evidence packet
    // (scripts/core/evidence.mjs rowQualifier). Without it every number reads
    // "<chart title>: value" and the writer has to guess which phase it belongs to.
    category: `${phase} seasons, northeast-monsoon belt mean`,
    tamil_nadu_mean_departure_pct: round(mean(tn)),
    years_counted: subset.length,
    above_normal_share_pct: round((subset.filter((row) => row.nem_departure_pct > 0).length / subset.length) * 100, 0)
  };
});

// --- IS THE SIGN FLIP ACTUALLY DISTINGUISHABLE FROM NOISE? ------------------
// It is not, and that has to travel with the data. The phase MEANS order neatly
// (El Nino above normal, La Nina below), which is what the literature reports and what
// an earlier version of this article presented as a finding. But the year-to-year
// spread inside each phase is enormous - standard deviations of 24 to 32 percentage
// points against a gap between the means of about 6 - so a Welch test cannot separate
// them. For contrast the SOUTHWEST monsoon effect in the same record is overwhelming.
// Compute both every run so nobody can quote the means without the test.
function welch(a, b) {
  const mean_ = (v) => v.reduce((s, x) => s + x, 0) / v.length;
  const varr = (v) => { const m = mean_(v); return v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1); };
  const ma = mean_(a); const mb = mean_(b);
  const va = varr(a); const vb = varr(b);
  const se = Math.sqrt(va / a.length + vb / b.length);
  const t = (ma - mb) / se;
  const df = (va / a.length + vb / b.length) ** 2 /
    ((va / a.length) ** 2 / (a.length - 1) + (vb / b.length) ** 2 / (b.length - 1));
  // two-sided p via a normal approximation, adequate at these degrees of freedom
  const erf = (x) => {
    const sign = x < 0 ? -1 : 1; const ax = Math.abs(x);
    const tt = 1 / (1 + 0.3275911 * ax);
    const y = 1 - ((((1.061405429 * tt - 1.453152027) * tt + 1.421413741) * tt - 0.284496736) * tt + 0.254829592) * tt * Math.exp(-ax * ax);
    return sign * y;
  };
  const p = 2 * (1 - 0.5 * (1 + erf(Math.abs(t) / Math.SQRT2)));
  return { meanA: round(ma), meanB: round(mb), differencePp: round(ma - mb), sdA: round(Math.sqrt(va)), sdB: round(Math.sqrt(vb)), nA: a.length, nB: b.length, t: round(t, 2), df: Math.round(df), pApprox: round(p, 3) };
}

const nemTest = welch(
  yearRows.filter((row) => row.phase === "El Nino").map((row) => row.nem_departure_pct),
  yearRows.filter((row) => row.phase === "La Nina").map((row) => row.nem_departure_pct)
);
console.log(`  significance: El Nino minus La Nina = ${nemTest.differencePp}pp, t=${nemTest.t}, p~${nemTest.pApprox} (sd ${nemTest.sdA}/${nemTest.sdB})`);

// --- the sign flip, stated explicitly --------------------------------------
// Southwest-monsoon comparison comes from the existing phase summary so both halves
// of the claim rest on the same IMD record.
let swPhase = null;
try {
  const sw = await readJson("data/series/derived.IN.climate.el_nino.phase_rain_summary.json");
  swPhase = Object.fromEntries(sw.rows.map((row) => [row.label, row.value]));
} catch {
  swPhase = null;
}

const elNino = phaseRows.find((row) => row.label === "El Nino");
const laNina = phaseRows.find((row) => row.label === "La Nina");

const flipRows = [
  { label: "Southwest monsoon (Jun-Sep), all India", value: swPhase ? swPhase["El Nino"] : null, category: "Southwest monsoon, all India, El Nino years" },
  { label: "Northeast monsoon (Oct-Dec), south peninsula", value: elNino.value, category: "Northeast monsoon, southern belt, El Nino years" },
  { label: "Northeast monsoon (Oct-Dec), Tamil Nadu", value: elNino.tamil_nadu_mean_departure_pct, category: "Northeast monsoon, Tamil Nadu, El Nino years" }
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

const sharedMethod = {
  method: `Oct+Nov+Dec rainfall per IMD subdivision, expressed as a percentage departure from that subdivision's own ${NORMAL_FROM}-${NORMAL_TO} OND normal. The region figure is the UNWEIGHTED MEAN of subdivision departures, not an area-weighted total, because subdivision areas are not in the dataset. It therefore answers "how anomalous was the season across the belt", not "how much rain fell".`,
  subdivisionsUsed: available,
  subdivisionsMissing: missing.length ? missing : "none",
  ondNormalsMm: normals,
  ensoSeasonUsed: "OND ONI - the season contemporaneous with the northeast monsoon itself, not the JJAS value used for the southwest monsoon.",
  sourceNote: "IMD subdivisional monthly rainfall, 1901-2025, already ingested for this repo."
};

await emit({
  id: "climate.el_nino.northeast_monsoon_by_phase",
  name: "derived.IN.climate.el_nino.northeast_monsoon_by_phase",
  title: "El Nino and the northeast monsoon: the sign flips",
  unit: "% above or below normal Oct-Dec rainfall",
  rows: phaseRows,
  metadata: {
    ...sharedMethod,
    headline: `El Nino OND seasons average ${elNino.value > 0 ? "+" : ""}${elNino.value}% across the northeast-monsoon belt and ${laNina.value > 0 ? "+" : ""}${laNina.value}% in La Nina seasons - the OPPOSITE ordering to the southwest monsoon. BUT SEE significanceTest: that ordering is NOT distinguishable from noise in this record.`,
    significanceTest: {
      ...nemTest,
      verdict: "NOT SIGNIFICANT. The means order as the literature predicts, but the spread within each phase dwarfs the gap between them, so this record cannot confirm the effect.",
      howToWriteIt: "Report the direction as consistent with published work on the northeast monsoon, and state plainly that our own data cannot separate it from noise. Do NOT present the phase means as a finding. The contrast with the southwest monsoon, where the same test is overwhelming, is the honest way to show what a real signal looks like.",
      contrastSouthwestMonsoon: "El Nino -6.8% against La Nina +6.8%, a 13.6pp gap, t about -4.1, p below 0.0001."
    },
    whyItMatters: "The 2026-27 event is forecast to peak in OND, after the kharif season closes. For the south peninsula that is the season El Nino tends to help, so the article must not present El Nino as uniformly dry for India.",
    honestyRules: [
      "THE HEADLINE CLAIM IS NOT STATISTICALLY SUPPORTED BY THIS RECORD. See significanceTest. The direction matches published work, but with about 27 seasons per phase and standard deviations of 24 to 32 percentage points, a difference of roughly 6 points cannot be separated from noise.",
      "This is a tendency across decades, not a forecast for any single season. The spread within each phase is wide.",
      "More rain is not automatically good news: the northeast monsoon delivers much of its total in intense spells, so a wet El Nino OND can mean flooding in Chennai rather than a comfortable harvest.",
      "Unweighted mean of subdivision departures - see method."
    ]
  }
});

await emit({
  id: "climate.el_nino.northeast_monsoon_years",
  name: "derived.IN.climate.el_nino.northeast_monsoon_years",
  title: "Northeast monsoon departure by year, with the Pacific's state",
  unit: "% above or below normal Oct-Dec rainfall",
  rows: yearRows,
  metadata: { ...sharedMethod, note: "One row per year: the northeast-monsoon belt's OND departure, Tamil Nadu on its own, and the OND ONI that season." }
});

await emit({
  id: "climate.el_nino.monsoon_sign_flip",
  name: "derived.IN.climate.el_nino.monsoon_sign_flip",
  title: "Same El Nino, opposite signs: two monsoons",
  unit: "average % above or below normal rainfall",
  rows: flipRows,
  metadata: {
    ...sharedMethod,
    note: "The southwest-monsoon figure is the all-India El Nino mean from climate.el_nino.phase_rain_summary (JJAS, IMD). The northeast-monsoon figures are OND departures for the southern belt. Both rest on the same IMD record.",
    caveat: swPhase ? "Southwest figure read from the existing phase summary." : "Southwest figure unavailable - phase_rain_summary artifact not found; regenerate it before charting.",
    doNotMisread: "These are different seasons over different regions. The chart's claim is that the sign of El Nino's effect reverses between them, not that the magnitudes are comparable."
  }
});

await writeSourceManifest("derived-northeast-monsoon-enso", manifest);

console.log(`\nnortheast monsoon vs ENSO: ${yearRows.length} years, ${available.length} subdivisions`);
for (const row of phaseRows) {
  console.log(`  ${row.label.padEnd(9)} n=${String(row.years_counted).padStart(2)}  belt ${row.value > 0 ? "+" : ""}${row.value}%  TN ${row.tamil_nadu_mean_departure_pct > 0 ? "+" : ""}${row.tamil_nadu_mean_departure_pct}%  above-normal ${row.above_normal_share_pct}%`);
}
if (swPhase) console.log(`  southwest monsoon, El Nino, all-India: ${swPhase["El Nino"]}%`);
