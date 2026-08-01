// The second thing El Nino does to the rabi season: it makes it hotter.
//
// WHY THIS EXISTS. The article's spine is that this event peaks in October-December,
// after the kharif harvest is settled, so what it actually lands on is the WINTER crop:
// reservoir levels going into October, the wheat sown after them, and food prices the
// following year. Until now that argument was purely about water. It is also about heat,
// and Indian wheat is far more heat-sensitive than it is drought-sensitive once it is
// irrigated. Two independent channels onto the same crop is a materially stronger claim
// than one, and the second channel turns out to be the better-evidenced of the two.
//
// THE FINDING. Detrended against each year's own decade, India's rabi growing season
// (October to February) runs about 0.30C above normal after an El Nino monsoon and about
// 0.24C below after a La Nina one. That 0.54C gap survives a Welch test comfortably
// (t = 4.12, df = 28.8, p = 0.0003). After a STRONG El Nino the figure is about 0.44C.
// The same test on the monsoon season itself gives a smaller gap, 0.29C, at p = 0.013.
// So El Nino warms India in both windows, and it warms the rabi window harder.
//
// WHY DETRENDED. Without removing the warming trend this comparison is worthless: El
// Nino years are scattered through a warming record, so any subset containing more
// recent years looks hotter for reasons that have nothing to do with the Pacific. Each
// year is expressed against the mean of the eleven-year window centred on it, so what
// survives is the anomaly relative to its own era.
//
// PROVENANCE. Entirely repo data: our own ERA5 ingest from the Copernicus CDS
// (reanalysis-era5-single-levels-monthly-means) joined to our own ONI-based monsoon
// classification. This was prompted by Our World in Data's "Global temperature anomalies
// by El Nino and La Nina" chart, whose per-country CSV carries the same ERA5 field. That
// CSV was used only to CHECK this result, not to produce it: it gives +0.49C for a
// November-to-March window against our +0.54C for October-to-February, which is the
// agreement you would want from two extractions of the same reanalysis over slightly
// different months. Nothing from OWID is ingested, so no third-party licence attaches;
// Copernicus is credited as our own source already requires.
//
// HONESTY LIMITS, carried into the artifact:
//   - Correlation across 17 El Nino seasons, not a causal attribution for any one year.
//   - The narrower grain-filling window (February to March), which is what actually
//     decides a wheat yield, is NOT separable from noise: on the OWID monthly series the
//     same test gives p = 0.10. Report the season, not the critical fortnight.
//   - ERA5 is a reanalysis, a model-observation blend, not a station record.
//   - "Rabi season" here is Oct-Dec plus the following Jan-Feb, assembled from two
//     existing seasonal artifacts. It approximates the growing season; it is not a
//     sowing-to-harvest window for any particular crop or state.

import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const ERA5 = (s) => `data/series/era5.IN.climate.era5.region.all_india.temp_anomaly_${s}_1991_2020.json`;
const JOIN = "data/series/derived.IN.climate.enso_iod_imd_monsoon_join.json";
const SOURCE_URL = "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means";
const HALF_WINDOW = 5; // detrend against the 11-year window centred on each year

const readJson = async (p) => JSON.parse(await readFile(p, "utf8"));
const round = (v, dp = 2) => Number(Number(v).toFixed(dp));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs) => { const m = mean(xs); return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1); };

function lgamma(z) {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function betacf(a, b, x) {
  const FPMIN = 1e-300;
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; c = 1 + aa / c;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; c = 1 + aa / c;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-16) break;
  }
  return h;
}
function betai(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
function welch(a, b) {
  const va = variance(a) / a.length, vb = variance(b) / b.length;
  const t = (mean(a) - mean(b)) / Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  return { t: round(t), df: round(df, 1), p: Number(betai(df / 2, 0.5, df / (df + t * t)).toFixed(4)) };
}

const asMap = (art) => new Map((art.observations || art.rows || []).filter((o) => o.value !== null && o.value !== undefined).map((o) => [Number(o.date), o.value]));
const [postArt, winterArt, swArt, joinArt] = await Promise.all([readJson(ERA5("post_monsoon")), readJson(ERA5("winter")), readJson(ERA5("southwest_monsoon")), readJson(JOIN)]);
const post = asMap(postArt), winter = asMap(winterArt), sw = asMap(swArt);

const joinRows = (joinArt.rows || joinArt.observations || []).filter((r) => r.region_id === "all_india");
const phase = new Map(joinRows.map((r) => [r.year, r.oni_monsoon_phase_by_mean]));
const strong = new Set(joinRows.filter((r) => (r.oni_monsoon_strongest_c ?? -9) >= 1.5).map((r) => r.year));

// Rabi growing season: Oct-Dec of the monsoon year plus Jan-Feb of the next.
const rabi = new Map();
for (const [y, v] of post) if (winter.has(y + 1)) rabi.set(y, (v + winter.get(y + 1)) / 2);

const detrend = (series, y) => {
  const win = [...series.keys()].filter((k) => Math.abs(k - y) <= HALF_WINDOW && k !== y).map((k) => series.get(k));
  return win.length >= 6 ? series.get(y) - mean(win) : null;
};

const PHASES = [
  { key: "La Nina", label: "After a La Nina monsoon" },
  { key: "Neutral", label: "After a neutral monsoon" },
  { key: "El Nino", label: "After an El Nino monsoon" },
  { key: "__strong", label: "After a strong El Nino monsoon" }
];
const WINDOWS = [
  { key: "rabi", series: rabi, group: "The winter crop season (Oct-Feb)" },
  { key: "monsoon", series: sw, group: "The monsoon itself (Jun-Sep)" }
];

const rows = [];
const stats = {};
for (const w of WINDOWS) {
  const byPhase = {};
  for (const [y] of w.series) {
    const d = detrend(w.series, y);
    if (d === null || !phase.has(y)) continue;
    const p = phase.get(y);
    (byPhase[p] ||= []).push(d);
    if (strong.has(y)) (byPhase.__strong ||= []).push(d);
  }
  for (const p of PHASES) {
    const vs = byPhase[p.key];
    if (!vs?.length) continue;
    rows.push({ label: p.label, group: w.group, value: round(mean(vs)), years: vs.length });
  }
  stats[w.key] = { ...welch(byPhase["El Nino"], byPhase["La Nina"]), elNino: round(mean(byPhase["El Nino"])), laNina: round(mean(byPhase["La Nina"])), strongElNino: round(mean(byPhase.__strong)), n: { elNino: byPhase["El Nino"].length, laNina: byPhase["La Nina"].length, strong: byPhase.__strong.length } };
}

const artifact = createTableArtifact({
  indicatorId: "climate.el_nino.rabi_heat",
  title: "El Nino does not just take the water. It also brings the heat.",
  sourceId: "derived",
  sourceIndicatorId: "derived.climate.el_nino.rabi_heat",
  sourceUrl: SOURCE_URL,
  unit: "°C above or below normal for its own decade",
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt: new Date().toISOString(),
  rows,
  dimensions: Object.keys(rows[0] || {}),
  metadata: {
    generatedFor: "q.climate.el_nino_2026",
    method: `All-India ERA5 temperature anomalies against a 1991-2020 base, detrended by expressing each year against the mean of the ${HALF_WINDOW * 2 + 1}-year window centred on it, then grouped by the ENSO phase of that year's monsoon. The winter-crop window is Oct-Dec plus the following Jan-Feb, assembled from two existing seasonal artifacts.`,
    whyDetrended: "El Nino years sit scattered through a warming record. Without detrending, any subset weighted towards recent years looks hotter for reasons unrelated to the Pacific, and the comparison means nothing.",
    significanceTest: stats,
    headline: `India's winter crop season runs about ${stats.rabi.elNino}C above its own decade after an El Nino monsoon and ${stats.rabi.laNina}C below after a La Nina one, a gap of ${round(stats.rabi.elNino - stats.rabi.laNina)}C (p = ${stats.rabi.p}). The monsoon season itself shows a smaller gap.`,
    crossCheck: "Our World in Data's per-country ERA5 series, used as an independent check only and not ingested, gives +0.49C for a November-to-March window against +0.54C here for October-to-February.",
    honestyRules: [
      "A correlation across 17 El Nino seasons, not a causal attribution for any single year.",
      "The narrower grain-filling window (Feb-Mar), which is what actually decides a wheat yield, is NOT separable from noise (p about 0.10 on the monthly series). Report the season, never the critical fortnight.",
      "ERA5 is a reanalysis, a model-observation blend, not a station record.",
      "This window approximates the rabi growing season. It is not a sowing-to-harvest window for any particular crop or state.",
      "The heat signal is the SECOND channel onto the winter crop. The first is water, and the article should not let this one crowd it out."
    ]
  }
});
const path = await writeSeriesArtifact({ sourceId: "derived", name: "derived.IN.climate.el_nino.rabi_heat", artifact });
await writeSourceManifest("derived-el-nino-rabi-heat", [{ status: "ready", indicatorId: "climate.el_nino.rabi_heat", artifact: path, rows: rows.length, fetchedAt: artifact.fetchedAt }]);

console.log("El Nino and India's winter heat (ERA5, detrended):");
for (const w of WINDOWS) {
  const s = stats[w.key];
  console.log(`  ${w.group}`);
  console.log(`     El Nino ${s.elNino >= 0 ? "+" : ""}${s.elNino}C (n=${s.n.elNino})  |  strong El Nino ${s.strongElNino >= 0 ? "+" : ""}${s.strongElNino}C (n=${s.n.strong})  |  La Nina ${s.laNina}C (n=${s.n.laNina})`);
  console.log(`     gap ${round(s.elNino - s.laNina)}C   t=${s.t} df=${s.df} p=${s.p}`);
}
