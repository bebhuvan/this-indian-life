// The convergence gap: the single number the article is really about.
//
// The hero shows every state's fertility line; the sparkGrid shows each fall on
// its own. Neither shows the SPREAD between states as one quantity over time.
// This derives that: for each year, the distance (in births per woman) between
// the highest- and lowest-fertility big state, from the long SRS series.
//
// The story it tells: the gap stayed wide (about 3) through the 1980s and 90s
// as the south finished its transition while the north had barely begun, then
// began closing after ~2000 as the north fell fast. Divergence, then convergence.
//
// Underlying source: SRS long TFR series (via Data For India), same as the hero.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createSeriesArtifact } from "./core/artifacts.mjs";

const ROOT = process.cwd();
const DIR = resolve(ROOT, "data/series");
const DFI_URL = "https://www.dataforindia.com/fertility/";
const FETCHED = "2026-07-10T00:00:00.000Z";

// Fixed set of large states with long records, so the gap is not an artifact of
// SRS adding new states over time. Undivided-boundary caveat carried in the note.
const MAJORS = {
  kerala: "Kerala", tamil_nadu: "Tamil Nadu", karnataka: "Karnataka",
  andhra_pradesh: "Andhra Pradesh", maharashtra: "Maharashtra", punjab: "Punjab",
  west_bengal: "West Bengal", gujarat: "Gujarat", odisha: "Odisha",
  bihar: "Bihar", uttar_pradesh: "Uttar Pradesh", madhya_pradesh: "Madhya Pradesh",
  rajasthan: "Rajasthan", haryana: "Haryana", assam: "Assam"
};
const MIN_STATES = 10; // require at least this many reporting to define a gap

const series = {};
for (const slug of Object.keys(MAJORS)) {
  const f = resolve(DIR, `srs.IN.people.srs.tfr_long.${slug}.json`);
  if (!existsSync(f)) continue;
  const d = JSON.parse(readFileSync(f, "utf8"));
  series[slug] = new Map(d.observations.map((o) => [o.date, o.value]));
}

const years = [...new Set(Object.values(series).flatMap((m) => [...m.keys()]))].sort(
  (a, b) => Number(a) - Number(b)
);

const obs = [];
let peak = { gap: -1 };
let latest = null;
for (const y of years) {
  const present = Object.entries(series)
    .filter(([, m]) => m.has(y))
    .map(([slug, m]) => ({ slug, name: MAJORS[slug], v: m.get(y) }));
  if (present.length < MIN_STATES) continue;
  const hi = present.reduce((a, b) => (b.v > a.v ? b : a));
  const lo = present.reduce((a, b) => (b.v < a.v ? b : a));
  const gap = Math.round((hi.v - lo.v) * 10) / 10;
  obs.push({ date: y, value: gap });
  const rec = { year: y, gap, hi: hi.name, hiV: hi.v, lo: lo.name, loV: lo.v };
  if (gap > peak.gap) peak = rec;
  latest = rec;
}

const artifact = createSeriesArtifact({
  indicatorId: "people.tfr_convergence_gap",
  title: "The gap between India's states, over time",
  sourceId: "dataforindia",
  sourceIndicatorId: "SRS total fertility rate, spread between highest and lowest major state",
  sourceUrl: DFI_URL,
  unit: "births per woman (gap)",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt: FETCHED,
  observations: obs,
  metadata: {
    dataset: "Derived from SRS long total fertility rate series (via Data For India)",
    method: `Per year, the difference between the highest and lowest TFR among ${Object.keys(MAJORS).length} major states (min ${MIN_STATES} reporting).`,
    via: DFI_URL,
    peakYear: peak.year, peakGap: peak.gap, peakHigh: `${peak.hi} ${peak.hiV}`, peakLow: `${peak.lo} ${peak.loV}`,
    latestYear: latest.year, latestGap: latest.gap, latestHigh: `${latest.hi} ${latest.hiV}`, latestLow: `${latest.lo} ${latest.loV}`,
    note: "Distance in births per woman between the highest- and lowest-fertility major state each year. The long series use undivided-state boundaries, so pre-reorganisation years count parent states (undivided Bihar, Madhya Pradesh, Uttar Pradesh)."
  }
});

writeFileSync(resolve(DIR, "derived.IN.tfr_convergence_gap.json"), JSON.stringify(artifact, null, 2) + "\n");
console.log("wrote derived.IN.tfr_convergence_gap.json");
console.log(`  ${obs.length} years, ${obs[0].date}-${obs[obs.length - 1].date}`);
console.log(`  peak gap ${peak.gap} in ${peak.year} (${peak.hi} ${peak.hiV} vs ${peak.lo} ${peak.loV})`);
console.log(`  latest gap ${latest.gap} in ${latest.year} (${latest.hi} ${latest.hiV} vs ${latest.lo} ${latest.loV})`);
