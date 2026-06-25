// Derived series for Part 3 (the engine and the future), computed from data already
// in the lake, no external fetch:
//   1) decade-by-decade real GDP-per-capita growth (from Maddison) — the sustained-
//      high-growth engine the level charts hide
//   2) a convergence projection — India's PPP income extended at its recent growth rate,
//      against flat "today's China" and "today's South Korea" goalposts, to show roughly
//      when India reaches where they are now (illustrative, not a forecast)
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const read = async (f) => JSON.parse(await readFile(`data/series/${f}`, "utf8")).observations;
const valAt = (obs, year) => { const o = obs.find((x) => String(x.date) === String(year) && x.value != null); return o ? Number(o.value) : null; };

// 1) Decade growth from Maddison (2011 int-$), 1960s..2010s
const GROWTH = [
  { cc: "in", name: "India", file: "owid.maddison.in.gdp_per_capita.json" },
  { cc: "chn", name: "China", file: "owid.maddison.chn.gdp_per_capita.json" },
  { cc: "kor", name: "South Korea", file: "owid.maddison.kor.gdp_per_capita.json" },
  { cc: "vnm", name: "Vietnam", file: "owid.maddison.vnm.gdp_per_capita.json" },
  { cc: "bgd", name: "Bangladesh", file: "owid.maddison.bgd.gdp_per_capita.json" },
  { cc: "idn", name: "Indonesia", file: "owid.maddison.idn.gdp_per_capita.json" },
  { cc: "jpn", name: "Japan", file: "owid.maddison.jpn.gdp_per_capita.json" }
];
const DECADES = [1960, 1970, 1980, 1990, 2000, 2010];
for (const g of GROWTH) {
  try {
    const obs = await read(g.file);
    const observations = DECADES.map((d) => {
      const start = valAt(obs, d), end = valAt(obs, d + 10);
      if (!start || !end || start <= 0) return null;
      return { date: String(d), value: (Math.pow(end / start, 1 / 10) - 1) * 100 };
    }).filter(Boolean);
    if (observations.length < 2) throw new Error("insufficient decades");
    const indicatorId = `divergence.decade_growth.${g.cc}`;
    const artifact = createSeriesArtifact({ indicatorId, title: `Real GDP-per-capita growth by decade — ${g.name}`, sourceId: "derived", sourceIndicatorId: "maddison gdp_pc, decade CAGR", sourceUrl: "https://ourworldindata.org/grapher/gdp-per-capita-maddison-project-database", unit: "% per year (decade average)", frequency: "annual", geography: { type: "country", id: g.cc.toUpperCase(), name: g.name }, fetchedAt, observations, metadata: { angle: "engine", metric: "decade_growth", country: g.name, note: "annualised growth over each decade, from the Maddison reconstruction" } });
    await writeSeriesArtifact({ sourceId: "derived", name: `derived.divergence.${g.cc}.decade_growth`, artifact });
    manifest.push({ status: "ready", indicatorId, observations: observations.length });
    console.log(`decade_growth ${g.cc}: ${observations.map((o) => o.date + "s=" + o.value.toFixed(1) + "%").join(" ")}`);
  } catch (e) { console.warn(`decade_growth.${g.cc} failed: ${e.message}`); }
}

// 2) Convergence projection. Deliberately uses the World Bank REAL (constant 2021 PPP)
// series, NOT the IMF current-dollar PPP: a multi-decade projection needs a real growth
// rate, and the IMF current-int$ CAGR (~8.5%/yr) conflates real growth with international-
// dollar price drift, which would overstate catch-up. The income-gap chart shows current
// IMF levels; this projection is in real terms, and the prose flags the distinction.
try {
  const inObs = await read("worldbank.divergence.in.NY_GDP_PCAP_PP_KD.json");
  const chnObs = await read("worldbank.divergence.chn.NY_GDP_PCAP_PP_KD.json");
  const korObs = await read("worldbank.divergence.kor.NY_GDP_PCAP_PP_KD.json");
  const inLatestYear = 2024, baseYear = 2014, endYear = 2055;
  const inBase = valAt(inObs, baseYear), inLatest = valAt(inObs, inLatestYear);
  const cagr = Math.pow(inLatest / inBase, 1 / (inLatestYear - baseYear)) - 1; // India's recent annual growth
  const chnToday = valAt(chnObs, inLatestYear), korToday = valAt(korObs, inLatestYear);

  // India actual (1990-2024) + projected (2025-2055)
  const inActual = inObs.filter((o) => o.value != null && Number(o.date) >= 1990 && Number(o.date) <= inLatestYear).map((o) => ({ date: String(o.date), value: Number(o.value) }));
  const proj = [];
  let v = inLatest;
  for (let y = inLatestYear + 1; y <= endYear; y += 1) { v = v * (1 + cagr); proj.push({ date: String(y), value: v }); }
  const inPath = [...inActual, ...proj];
  const crossChina = proj.find((p) => p.value >= chnToday)?.date;
  const crossKorea = proj.find((p) => p.value >= korToday)?.date;

  const mk = async (cc, name, observations, meta) => {
    const indicatorId = `divergence.income_proj.${cc}`;
    const artifact = createSeriesArtifact({ indicatorId, title: name, sourceId: "derived", sourceIndicatorId: "NY.GDP.PCAP.PP.KD projection (real)", sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.KD", unit: "GDP per capita at PPP (constant 2021 int-$, real projection)", frequency: "annual", geography: { type: "country", id: cc.toUpperCase(), name }, fetchedAt, observations, metadata: { angle: "future", metric: "income_proj", ...meta } });
    await writeSeriesArtifact({ sourceId: "derived", name: `derived.divergence.${cc}.income_proj`, artifact });
    manifest.push({ status: "ready", indicatorId, observations: observations.length });
  };
  await mk("in", "India (actual, then projected at recent growth)", inPath, { cagr: (cagr * 100).toFixed(2) + "%", projectedFrom: inLatestYear, crossesChinaToday: crossChina, crossesKoreaToday: crossKorea });
  // flat goalposts at today's level
  const flat = (val) => inPath.map((p) => ({ date: p.date, value: val }));
  await mk("china_today", "China's level today", flat(chnToday), { level: chnToday, year: inLatestYear });
  await mk("korea_today", "South Korea's level today", flat(korToday), { level: korToday, year: inLatestYear });
  console.log(`\nconvergence: India recent CAGR ${(cagr * 100).toFixed(1)}%/yr; reaches today's China ($${Math.round(chnToday)}) ~${crossChina}, today's Korea ($${Math.round(korToday)}) ~${crossKorea}`);
} catch (e) { console.warn(`convergence failed: ${e.message}`); }

await writeSourceManifest("divergence-derived", manifest);
console.log(`\nWrote ${manifest.length} derived series.`);
