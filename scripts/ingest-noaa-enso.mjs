// NOAA CPC ENSO indices.
//
// Five plain-ASCII CPC files, no auth. They measure the *same ocean* on different
// products, periods and base periods, and the article built on this
// (q.climate.el_nino_2026) turns exactly that disagreement into its argument - so
// every artifact records `product`, `basePeriod` and `cadence` in metadata. Never
// compare values across these series without carrying those three labels.
//
// Two traps, both learned the hard way:
//
//  1. COLUMN ORDER DIFFERS BETWEEN THE WEEKLY AND MONTHLY REGION FILES.
//       monthly (ersst5.nino.mth, sstoi.indices): Nino1+2, Nino3, Nino4, Nino3.4
//       weekly  (wksst9120.for):                  Nino1+2, Nino3, Nino3.4, Nino4
//     Verified against the west-warm/east-cool SST gradient (Nino4 > Nino3.4 >
//     Nino3 > Nino1+2) in both files. Swapping them silently mislabels Nino3.4.
//
//  2. BASE PERIODS DIFFER. oni.ascii and RONI use *centred 30-year* climatologies,
//     so their baseline shifts through the record. The region files use a fixed
//     1991-2020 base. Mixing them silently is a real error: the ONI-minus-RONI gap
//     drifts from about -0.12 C in the 1950s to +0.44 C in the 2020s, which is a
//     finding, not noise.
//
// Also: `wksst8110.for` is the legacy 1981-2010 weekly file and is FROZEN at
// Jan 2021. Do not use it. `wksst9120.for` is the live one.

import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const BASE = "https://www.cpc.ncep.noaa.gov/data/indices";
const fetchedAt = new Date().toISOString();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_BY_ABBR = new Map([
  ["JAN", 1], ["FEB", 2], ["MAR", 3], ["APR", 4], ["MAY", 5], ["JUN", 6],
  ["JUL", 7], ["AUG", 8], ["SEP", 9], ["OCT", 10], ["NOV", 11], ["DEC", 12]
]);

function phaseFor(anomaly) {
  if (anomaly >= 0.5) return "El Nino";
  if (anomaly <= -0.5) return "La Nina";
  return "Neutral";
}

function strengthFor(anomaly) {
  const abs = Math.abs(anomaly);
  if (abs < 0.5) return "neutral";
  if (abs < 1) return "weak";
  if (abs < 1.5) return "moderate";
  if (abs < 2) return "strong";
  return "very strong";
}

// The weekly file (wksst9120.for) is fixed-width Fortran output, so a negative
// anomaly is GLUED to the SST it follows: "20.6-0.1", not "20.6 -0.1". Splitting
// on whitespace therefore silently drops every week with a negative anomaly,
// leaving a warm-biased subset (614 of ~2340 rows). Tokenise on number shape
// instead, which handles both the glued and the space-separated files.
function numbers(line) {
  return (line.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

// --- oni.ascii.txt : SEAS YR TOTAL ANOM -------------------------------------
function parseSeasonalIndex(text, { anomalyField }) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("SEAS"))
    .map((line) => {
      const parts = line.split(/\s+/);
      // ONI has 4 columns (season, year, sst, anom); RONI has 3 (season, year, anom).
      if (parts.length < 3) return null;
      const season = parts[0];
      const year = Number(parts[1]);
      const hasSst = parts.length >= 4;
      const sst = hasSst ? Number(parts[2]) : null;
      const anomaly = Number(parts[hasSst ? 3 : 2]);
      if (!/^[A-Z]{3}$/.test(season) || !Number.isFinite(year) || !Number.isFinite(anomaly)) return null;
      if (hasSst && !Number.isFinite(sst)) return null;
      const row = { date: `${year}-${season}`, year, season };
      if (hasSst) row.sst_c = sst;
      row[anomalyField] = anomaly;
      row.phase = phaseFor(anomaly);
      row.strength = strengthFor(anomaly);
      return row;
    })
    .filter(Boolean);
}

// --- monthly region files : YR MON  N1+2 A  N3 A  N4 A  N3.4 A --------------
function parseMonthlyRegions(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^YR/i.test(line))
    .map((line) => {
      const v = numbers(line);
      if (v.length < 10 || !v.every(Number.isFinite)) return null;
      const [year, month, n12, n12a, n3, n3a, n4, n4a, n34, n34a] = v;
      if (month < 1 || month > 12) return null;
      return {
        date: `${year}-${pad2(month)}`,
        year,
        month,
        month_name: MONTHS[month - 1],
        nino12_sst_c: n12, nino12_anomaly_c: n12a,
        nino3_sst_c: n3, nino3_anomaly_c: n3a,
        nino4_sst_c: n4, nino4_anomaly_c: n4a,
        nino34_sst_c: n34, nino34_anomaly_c: n34a
      };
    })
    .filter(Boolean);
}

// --- wksst9120.for : DDMMMYYYY  N1+2 A  N3 A  N3.4 A  N4 A -----------------
// NOTE the order: Nino3.4 comes THIRD here, Nino4 fourth. See header comment.
function parseWeeklyRegions(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .map((line) => {
      const match = line.match(/^\s*(\d{2})([A-Z]{3})(\d{4})\s+(.*)$/);
      if (!match) return null;
      const [, day, monAbbr, year, rest] = match;
      const month = MONTH_BY_ABBR.get(monAbbr);
      if (!month) return null;
      const v = numbers(rest);
      if (v.length < 8 || !v.every(Number.isFinite)) return null;
      const [n12, n12a, n3, n3a, n34, n34a, n4, n4a] = v;
      return {
        week_centred: `${year}-${pad2(month)}-${day}`,
        year: Number(year),
        month,
        nino12_sst_c: n12, nino12_anomaly_c: n12a,
        nino3_sst_c: n3, nino3_anomaly_c: n3a,
        nino34_sst_c: n34, nino34_anomaly_c: n34a,
        nino4_sst_c: n4, nino4_anomaly_c: n4a,
        phase: phaseFor(n34a),
        strength: strengthFor(n34a)
      };
    })
    .filter(Boolean);
}

const DATASETS = [
  {
    file: "oni.ascii.txt",
    indicatorId: "climate.enso.oni",
    artifactName: "noaa-enso.global.oni_seasonal",
    cadenceKind: "seasonal",
    title: "Oceanic Nino Index by season",
    unit: "degrees C anomaly",
    geography: { type: "region", id: "nino34", name: "Nino 3.4 region" },
    parse: (text) => parseSeasonalIndex(text, { anomalyField: "oni_anomaly_c" }),
    dateField: "date",
    metadata: {
      product: "ERSSTv5",
      cadence: "seasonal (three-month running mean)",
      basePeriod: "centred 30-year climatologies (shifts through the record)",
      note: "NOAA CPC ONI is a three-month running mean SST anomaly in the Nino 3.4 region. Phase labels here are mechanical threshold tags; official event classification requires persistence and coupled ocean-atmosphere conditions.",
      thresholds: { elNino: "oni_anomaly_c >= 0.5", laNina: "oni_anomaly_c <= -0.5" }
    }
  },
  {
    file: "RONI.ascii.txt",
    indicatorId: "climate.enso.roni",
    artifactName: "noaa-enso.global.roni_seasonal",
    cadenceKind: "seasonal",
    title: "Relative Oceanic Nino Index by season",
    unit: "degrees C anomaly",
    geography: { type: "region", id: "nino34", name: "Nino 3.4 region" },
    parse: (text) => parseSeasonalIndex(text, { anomalyField: "roni_anomaly_c" }),
    dateField: "date",
    metadata: {
      product: "ERSSTv5, tropical-mean SST trend removed",
      cadence: "seasonal (three-month running mean)",
      basePeriod: "centred 30-year climatologies (shifts through the record)",
      note: "RONI subtracts the tropical-mean SST anomaly from the Nino 3.4 anomaly, on the reasoning that convection responds to the Pacific's warmth RELATIVE to the rest of the tropics rather than to absolute local warmth. As the tropics warm, raw ONI drifts upward for the same relative gradient, so RONI runs cooler than ONI in recent decades. CPC's official El Nino declaration still uses ONI, not RONI. CPC warns real-time RONI values may be revised for up to two months.",
      thresholds: { elNino: "roni_anomaly_c >= 0.5", laNina: "roni_anomaly_c <= -0.5" }
    }
  },
  {
    file: "ersst5.nino.mth.91-20.ascii",
    indicatorId: "climate.enso.nino_regions_monthly_ersst5",
    artifactName: "noaa-enso.global.nino_regions_monthly_ersst5",
    cadenceKind: "monthly",
    title: "Nino region SSTs and anomalies by month (ERSSTv5)",
    unit: "degrees C (SST and anomaly)",
    geography: { type: "region", id: "nino_regions", name: "Nino 1+2, 3, 3.4 and 4 regions" },
    parse: parseMonthlyRegions,
    dateField: "date",
    metadata: {
      product: "ERSSTv5",
      cadence: "monthly",
      basePeriod: "fixed 1991-2020",
      columnOrderInSource: "Nino1+2, Nino3, Nino4, Nino3.4",
      note: "Used to characterise El Nino 'flavour' - whether the warming sits in the eastern Pacific (Nino1+2 / Nino3) or the central Pacific (Nino4). Note the source column order puts Nino3.4 LAST, unlike the weekly file."
    }
  },
  {
    file: "sstoi.indices",
    indicatorId: "climate.enso.nino_regions_monthly_oisst",
    artifactName: "noaa-enso.global.nino_regions_monthly_oisst",
    cadenceKind: "monthly",
    title: "Nino region SSTs and anomalies by month (OISST)",
    unit: "degrees C (SST and anomaly)",
    geography: { type: "region", id: "nino_regions", name: "Nino 1+2, 3, 3.4 and 4 regions" },
    parse: parseMonthlyRegions,
    dateField: "date",
    metadata: {
      product: "OISST",
      cadence: "monthly",
      basePeriod: "fixed 1991-2020",
      columnOrderInSource: "Nino1+2, Nino3, Nino4, Nino3.4",
      note: "The OISST-based monthly counterpart to the ERSSTv5 file. The two products differ modestly for the same month (roughly 0.1 C for Nino3.4), which is honest product noise rather than a finding - keep them in separate series so the difference stays visible."
    }
  },
  {
    file: "wksst9120.for",
    indicatorId: "climate.enso.nino_regions_weekly",
    artifactName: "noaa-enso.global.nino_regions_weekly_oisst",
    cadenceKind: "weekly",
    title: "Nino region SSTs and anomalies by week (OISST)",
    unit: "degrees C (SST and anomaly)",
    geography: { type: "region", id: "nino_regions", name: "Nino 1+2, 3, 3.4 and 4 regions" },
    parse: parseWeeklyRegions,
    dateField: "week_centred",
    metadata: {
      product: "OISST",
      cadence: "weekly (value is centred on the stated date)",
      basePeriod: "fixed 1991-2020",
      columnOrderInSource: "Nino1+2, Nino3, Nino3.4, Nino4",
      note: "The fastest-moving official ENSO number, and the one press coverage usually quotes. It is unsmoothed and runs well above the seasonal ONI during a warming event, so it must never be compared with an ONI threshold directly. Source column order puts Nino3.4 THIRD, unlike the monthly files. The legacy 1981-2010 file wksst8110.for is frozen at Jan 2021 - do not use it."
    }
  }
];

const SEASONS = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"];

// Completeness guard. A silently *incomplete* parse is the dangerous failure mode
// here, not a loud one: the first version of this script split the fixed-width
// weekly file on whitespace, which dropped every week whose anomaly was negative
// and left 614 of 2343 rows - a warm-biased subset that still looked like a
// plausible series. Row count alone caught it, so check it every run.
function completenessIssues(rows, cadence) {
  const issues = [];
  const keyed = rows.map((row) => row.date || row.week_centred);
  const dupes = keyed.filter((key, i) => keyed.indexOf(key) !== i);
  if (dupes.length) issues.push(`${dupes.length} duplicate keys (first: ${dupes[0]})`);

  if (cadence === "monthly") {
    let expected = 0;
    for (let i = 1; i < rows.length; i += 1) {
      const gap = (rows[i].year - rows[i - 1].year) * 12 + (rows[i].month - rows[i - 1].month);
      if (gap !== 1) { expected += 1; if (expected <= 3) issues.push(`month gap of ${gap} at ${rows[i].date}`); }
    }
    if (expected > 3) issues.push(`...${expected} month gaps in total`);
  }

  if (cadence === "seasonal") {
    let gaps = 0;
    for (let i = 1; i < rows.length; i += 1) {
      const prev = SEASONS.indexOf(rows[i - 1].season);
      const curr = SEASONS.indexOf(rows[i].season);
      if (prev < 0 || curr < 0) { issues.push(`unknown season label at ${rows[i].date}`); break; }
      const step = (curr - prev + 12) % 12;
      if (step !== 1) { gaps += 1; if (gaps <= 3) issues.push(`season gap at ${rows[i].date}`); }
    }
    if (gaps > 3) issues.push(`...${gaps} season gaps in total`);
  }

  if (cadence === "weekly") {
    let odd = 0;
    for (let i = 1; i < rows.length; i += 1) {
      const days = (Date.parse(rows[i].week_centred) - Date.parse(rows[i - 1].week_centred)) / 86400000;
      if (days !== 7) { odd += 1; if (odd <= 3) issues.push(`${days}-day step at ${rows[i].week_centred}`); }
    }
    if (odd > 3) issues.push(`...${odd} non-7-day steps in total`);
    // A weekly file with a negative-anomaly count near zero means the glued-negative
    // bug is back: over 40+ years roughly half of all weeks should be below normal.
    const negative = rows.filter((row) => row.nino34_anomaly_c < 0).length;
    const share = negative / rows.length;
    if (share < 0.2) issues.push(`only ${negative}/${rows.length} weeks have a negative Nino3.4 anomaly - suspect a number-parsing bug`);
  }

  return issues;
}

const manifest = [];

for (const dataset of DATASETS) {
  const sourceUrl = `${BASE}/${dataset.file}`;
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = dataset.parse(text);
    if (!rows.length) throw new Error(`No rows parsed from ${dataset.file}`);

    const snapshot = await writeSnapshot("noaa-enso", dataset.file, { sourceUrl, text });
    const artifact = createTableArtifact({
      indicatorId: dataset.indicatorId,
      title: dataset.title,
      sourceId: "noaa-enso",
      sourceIndicatorId: dataset.file,
      sourceUrl,
      unit: dataset.unit,
      geography: dataset.geography,
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: dataset.metadata
    });
    const artifactPath = await writeSeriesArtifact({
      sourceId: "noaa-enso",
      name: dataset.artifactName,
      artifact
    });

    const issues = completenessIssues(rows, dataset.cadenceKind);
    for (const issue of issues) console.warn(`  !! ${dataset.file}: ${issue}`);

    const earliest = rows[0]?.[dataset.dateField];
    const latest = rows.at(-1)?.[dataset.dateField];
    manifest.push({
      status: issues.length ? "ready-with-warnings" : "ready",
      checks: issues.length ? issues : "contiguous, no duplicates",
      indicatorId: dataset.indicatorId,
      sourceIndicatorId: dataset.file,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      earliest,
      latest,
      fetchedAt
    });
    console.log(`noaa-enso ${dataset.file} ${rows.length} rows (${earliest} to ${latest})`);
  } catch (error) {
    manifest.push({
      status: "failed",
      indicatorId: dataset.indicatorId,
      sourceIndicatorId: dataset.file,
      fetchedAt,
      error: error.message
    });
    console.warn(`noaa-enso ${dataset.file} failed: ${error.message}`);
  }
}

await writeSourceManifest("noaa-enso", manifest);
