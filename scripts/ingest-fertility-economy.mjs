// Ingest long-history state fertility for the fertility-vs-economy article.
//
// Source: dataforindia.com /fertility/ chart payloads (snapshotted in
// data/snapshots/dataforindia/), which draw on the SRS Compendium of India's
// Fertility & Mortality Indicators / SRS Annual Statistical Reports, Office of
// the Registrar General of India. Verified value-for-value against the SRS
// numbers already in the repo (2013-2023) before extending back to 1971.
//
// Distinct from scripts/ingest-fertility-states.mjs, which deliberately CLIPS
// the same source to 2013-2023 for the q.people.population article (so the
// post-2000 reorganised states share a common decade). Here we keep the FULL
// 1971-2023 history for the North-South divergence narrative, under a separate
// `people.srs.tfr_long.*` namespace so the two articles don't collide.
//
// Reorganisation caveat baked into per-state metadata: SRS reports the parent
// state under its old name across the whole span, so a long line for Andhra
// Pradesh is *undivided* AP (incl. Telangana) until 2014; Madhya Pradesh /
// Uttar Pradesh / Bihar include their future child states until 2000. The child
// states (Telangana, Jharkhand, Chhattisgarh, Uttarakhand, ...) only start when
// SRS began reporting them separately.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSeriesArtifact } from "./core/artifacts.mjs";

const ROOT = process.cwd();
const SNAP = resolve(ROOT, "data/snapshots/dataforindia");
const OUT = resolve(ROOT, "data/series");
const FETCHED = "2026-07-10T00:00:00.000Z";

const DFI_URL = "https://www.dataforindia.com/fertility/";
const SRS_URL = "https://censusindia.gov.in/census.website/en/data/srsstat";

const round1 = (v) => (v === null || v === undefined ? null : Math.round(v * 10) / 10);
const slug = (s) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const readSnap = (name) => JSON.parse(readFileSync(resolve(SNAP, name), "utf8"));
const write = (file, obj) => {
  writeFileSync(resolve(OUT, file), JSON.stringify(obj, null, 2) + "\n");
  console.log("  wrote", file);
};

// DFI stores each column as a parallel object keyed 0..n-1. Zip into rows.
function dfiRows(data, cols) {
  const d = data.data;
  const n = Object.keys(d[cols[0]]).length;
  const out = [];
  for (let i = 0; i < n; i++) out.push(cols.map((c) => d[c][i]));
  return out;
}

// States whose long line carries a definitional break (undivided-parent naming).
const UNDIVIDED_UNTIL = {
  "Andhra Pradesh": "Includes Telangana until the 2014 bifurcation (undivided Andhra Pradesh before 2014).",
  "Madhya Pradesh": "Includes Chhattisgarh until the 2000 reorganisation (undivided Madhya Pradesh before 2000).",
  "Uttar Pradesh": "Includes Uttarakhand until the 2000 reorganisation (undivided Uttar Pradesh before 2000).",
  Bihar: "Includes Jharkhand until the 2000 reorganisation (undivided Bihar before 2000)."
};

function buildLongTfr(snapFile, valueCol, kind) {
  const data = readSnap(snapFile);
  const rows = dfiRows(data, ["dfi_1_location", "dfi_3_year", valueCol]);
  const byState = new Map();
  for (const [loc, yr, tfr] of rows) {
    if (tfr === null || tfr === undefined) continue;
    if (!byState.has(loc)) byState.set(loc, []);
    byState.get(loc).push({ date: String(yr), value: round1(tfr) });
  }
  const suffix = kind === "total" ? "" : `_${kind}`;
  const label = kind === "total" ? "" : ` (${kind})`;
  let written = 0;
  for (const [state, obs] of byState) {
    const sorted = obs.sort((a, b) => Number(a.date) - Number(b.date));
    if (sorted.length < 2) continue;
    const sslug = state === "India" ? "india" : slug(state);
    const note = [
      "Annual SRS estimate of the total fertility rate; full history from the 1970s.",
      UNDIVIDED_UNTIL[state]
    ]
      .filter(Boolean)
      .join(" ");
    write(`srs.IN.people.srs.tfr_long${suffix}.${sslug}.json`, createSeriesArtifact({
      indicatorId: `people.srs.tfr_long${suffix}.${sslug}`,
      title: `Total fertility rate${label}, ${state}`,
      sourceId: "dataforindia",
      sourceIndicatorId: `SRS total fertility rate${label}, ${state}`,
      sourceUrl: DFI_URL,
      unit: "births per woman",
      geography:
        state === "India"
          ? { type: "country", id: "IN", name: "India" }
          : { type: "subnational", id: `IND-${sslug}`, name: state },
      fetchedAt: FETCHED,
      observations: sorted,
      metadata: {
        dataset: "SRS Compendium of India's Fertility & Mortality Indicators (via dataforindia)",
        via: DFI_URL,
        firstYear: sorted[0].date,
        lastYear: sorted[sorted.length - 1].date,
        note
      }
    }));
    written++;
  }
  return written;
}

console.log("Long total TFR by state (SRS 1971-2023):");
const nTotal = buildLongTfr("tfr-by-state-over-time.data.json", "dfi_565_tfr", "total");

console.log("Long rural TFR by state (SRS 1971-2023):");
const nRural = buildLongTfr("tfr-by-state-rural-urban.data.json", "dfi_566_tfrrura", "rural");

console.log("Long urban TFR by state (SRS 1971-2023):");
const nUrban = buildLongTfr("tfr-by-state-rural-urban.data.json", "dfi_567_tfrurba", "urban");

console.log(`Done. total=${nTotal} rural=${nRural} urban=${nUrban} series.`);
