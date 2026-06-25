// Penn World Table 10.01 growth-accounting battery for the "Why India stayed poor
// while Asia got rich" flagship. Companion to ingest-asia-divergence.mjs (World Bank);
// PWT supplies the production-function decomposition that the WB battery lacks:
// total factor productivity (within-country trend and relative-to-US level) and
// capital deepening (capital stock per worker).
//
// One series artifact per (country, metric); indicatorId divergence.<metric>.<cc>,
// filename pwt.<cc>.<metric>. History kept from 1960 onward.
//
// DATA SOURCE
// -----------
// The official PWT 10.01 lives on DataverseNL (https://doi.org/10.34894/QT5BCC) as
// xlsx/Stata, but that host is unreachable from this environment and the rug.nl
// /ggdc/docs mirror only carries PWT 10.0. We therefore pull the KAPSARC Data Portal
// mirror of PWT 10.01, an Opendatasoft instance that exposes the full long-format
// table as a filterable CSV export. Each row is (year, countrycode, country,
// currency_unit, indicator, value); the PWT short variable code is carried in the
// indicator label as a trailing "(code)" — e.g. "TFP at constant national prices
// (2017=1) (rtfpna)". We key on that suffix, which is exact and unambiguous.
// Coverage runs to 2019 (PWT 10.01 ends 2019), confirming it is 10.01 not 9.x.
//
// Metrics:
//   divergence.tfp.<cc>               <- rtfpna  (TFP at constant national prices, =1 in 2017; within-country trend)
//   divergence.tfp_rel_us.<cc>        <- ctfp    (TFP level at current PPPs, USA=1; cross-country level)
//   divergence.capital_per_worker.<cc> <- cn / emp (capital stock mil. 2017US$ / persons engaged, millions)
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const DATASET = "penn-world-table-90";
const PORTAL = "https://datasource.kapsarc.org";
const SOURCE_DOI = "https://doi.org/10.34894/QT5BCC"; // PWT 10.01 canonical citation

// ISO3 -> our short cc
const COUNTRIES = [
  { iso3: "IND", cc: "in", name: "India" },
  { iso3: "CHN", cc: "chn", name: "China" },
  { iso3: "KOR", cc: "kor", name: "South Korea" },
  { iso3: "TWN", cc: "twn", name: "Taiwan" },
  { iso3: "VNM", cc: "vnm", name: "Vietnam" },
  { iso3: "IDN", cc: "idn", name: "Indonesia" },
  { iso3: "JPN", cc: "jpn", name: "Japan" },
  { iso3: "BGD", cc: "bgd", name: "Bangladesh" }
];

const SOURCE_URL = (iso3) =>
  `${PORTAL}/api/explore/v2.1/catalog/datasets/${DATASET}/exports/csv?` +
  new URLSearchParams({ refine: `countrycode:${iso3}`, delimiter: "," }).toString();

// Minimal CSV parser (handles quoted fields with embedded commas/quotes).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (ch === "\r") {
      // skip
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function fetchCountryRows(iso3) {
  const url = SOURCE_URL(iso3);
  const res = await fetch(url, {
    headers: { accept: "text/csv", "user-agent": "Indica/0.1 data ingest" },
    signal: AbortSignal.timeout(120000)
  });
  if (!res.ok) throw new Error(`KAPSARC export ${res.status} for ${iso3}`);
  let text = await res.text();
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM
  const grid = parseCsv(text);
  const header = grid.shift().map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return grid
    .filter((r) => r.length >= header.length)
    .map((r) => ({
      year: r[idx.year],
      indicator: r[idx.indicator],
      value: r[idx.value]
    }));
}

// Pull the PWT short code from a "... (code)" indicator label.
const codeOf = (label) => {
  const m = String(label).trim().match(/\(([A-Za-z_0-9]+)\)\s*$/);
  return m ? m[1] : null;
};

// Build a {year -> Number} map for one PWT variable code from a country's rows.
function seriesFor(rows, code) {
  const out = new Map();
  for (const r of rows) {
    if (codeOf(r.indicator) !== code) continue;
    const y = String(r.year).trim();
    if (!/^\d{4}$/.test(y)) continue;
    const v = r.value === "" || r.value == null ? null : Number(r.value);
    out.set(y, Number.isFinite(v) ? v : null);
  }
  return out;
}

function toObservations(map) {
  return [...map.entries()]
    .filter(([y]) => y >= "1960")
    .map(([date, value]) => ({ date, value: Number.isFinite(value) ? value : null }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function hasFinite(obs) {
  return obs.some((o) => Number.isFinite(o.value));
}

const manifest = [];
const failures = [];

async function writeMetric({ country, slug, metric, title, unit, code, observations, raw }) {
  const indicatorId = `divergence.${slug}.${country.cc}`;
  const artifact = createSeriesArtifact({
    indicatorId,
    title: `${title} — ${country.name}`,
    sourceId: "pwt",
    sourceIndicatorId: code,
    sourceUrl: SOURCE_URL(country.iso3),
    unit,
    frequency: "annual",
    geography: { type: "country", id: country.iso3, name: country.name },
    fetchedAt,
    observations,
    metadata: {
      angle: "productivity",
      metric,
      country: country.name,
      pwtVersion: "10.01",
      pwtCode: code,
      sourceCitation: SOURCE_DOI,
      mirror: "KAPSARC Data Portal (Opendatasoft)"
    }
  });
  const path = await writeSeriesArtifact({ sourceId: "pwt", name: `pwt.${country.cc}.${metric}`, artifact });
  const last = observations.filter((o) => Number.isFinite(o.value)).at(-1);
  const first = observations.filter((o) => Number.isFinite(o.value)).at(0);
  manifest.push({
    status: "ready",
    indicatorId,
    sourceIndicatorId: code,
    artifact: path,
    observations: observations.length,
    earliest: first?.date,
    latest: last?.date,
    fetchedAt
  });
  console.log(`pwt ${indicatorId} (${observations.length} obs, ${first?.date}→${last?.date})`);
}

for (const country of COUNTRIES) {
  let rows;
  try {
    rows = await fetchCountryRows(country.iso3);
  } catch (error) {
    failures.push({ status: "failed", country: country.name, error: error.message, fetchedAt });
    console.warn(`pwt ${country.iso3} fetch failed: ${error.message}`);
    continue;
  }

  // Snapshot the raw long-format rows for this country.
  await writeSnapshot("pwt", `pwt1001.${country.iso3}`, rows);

  const rtfpna = seriesFor(rows, "rtfpna");
  const ctfp = seriesFor(rows, "ctfp");
  const cn = seriesFor(rows, "cn");
  const emp = seriesFor(rows, "emp");

  // 1a) TFP, within-country trend (rtfpna, =1 in 2017).
  {
    const obs = toObservations(rtfpna);
    if (hasFinite(obs)) {
      await writeMetric({
        country, slug: "tfp", metric: "tfp",
        title: "Total factor productivity (national prices, 2017=1)",
        unit: "index (2017=1)", code: "rtfpna", observations: obs
      });
    } else {
      failures.push({ status: "failed", indicatorId: `divergence.tfp.${country.cc}`, sourceIndicatorId: "rtfpna", fetchedAt, error: "no finite observations" });
      console.warn(`pwt divergence.tfp.${country.cc} failed: no finite observations`);
    }
  }

  // 1b) TFP relative to US (ctfp, USA=1).
  {
    const obs = toObservations(ctfp);
    if (hasFinite(obs)) {
      await writeMetric({
        country, slug: "tfp_rel_us", metric: "tfp_rel_us",
        title: "Total factor productivity relative to the US (USA=1)",
        unit: "ratio (USA=1)", code: "ctfp", observations: obs
      });
    } else {
      failures.push({ status: "failed", indicatorId: `divergence.tfp_rel_us.${country.cc}`, sourceIndicatorId: "ctfp", fetchedAt, error: "no finite observations" });
      console.warn(`pwt divergence.tfp_rel_us.${country.cc} failed: no finite observations`);
    }
  }

  // 2) Capital per worker = cn (mil. 2017US$) / emp (millions) => 2017 US$ per worker.
  {
    const years = new Set([...cn.keys(), ...emp.keys()]);
    const cpw = new Map();
    for (const y of years) {
      const k = cn.get(y);
      const e = emp.get(y);
      // cn is in millions of US$, emp in millions of persons; the millions cancel,
      // leaving US$ per worker directly.
      cpw.set(y, Number.isFinite(k) && Number.isFinite(e) && e !== 0 ? k / e : null);
    }
    const obs = toObservations(cpw);
    if (hasFinite(obs)) {
      await writeMetric({
        country, slug: "capital_per_worker", metric: "capital_per_worker",
        title: "Capital stock per worker",
        unit: "2017 US$ per worker", code: "cn/emp", observations: obs
      });
    } else {
      failures.push({ status: "failed", indicatorId: `divergence.capital_per_worker.${country.cc}`, sourceIndicatorId: "cn/emp", fetchedAt, error: "no finite observations" });
      console.warn(`pwt divergence.capital_per_worker.${country.cc} failed: no finite observations`);
    }
  }
}

await writeSourceManifest("pwt-divergence", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} PWT 10.01 divergence artifacts across ${COUNTRIES.length} countries; ${failures.length} failure(s).`);
