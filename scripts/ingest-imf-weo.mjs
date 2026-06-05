// IMF World Economic Outlook (WEO) cross-country GDP context for "How big is
// India's economy?". IMF is more current than the World Bank (it carries the
// current-year estimate, not just completed years) and is the standard source for
// "Nth-largest economy" rankings. Replaces the World Bank econ.world.* series
// (same indicatorIds, so the registry/visualPlan are unchanged). MOSPI stays the
// source of truth for India's own rupee accounts; this is the world lens only.
//
// IMF DataMapper API (open, no auth): /api/v1/{indicator}/{ISO3}. NGDPD and
// PPPGDP are in US$ billions; NGDPDPC is US$ per person. We cap at the current
// estimate year (no multi-year-ahead projections shown as fact).
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://www.imf.org/external/datamapper/NGDPD@WEO";
const BN = 1e9; // US$ billions -> US$
const MAX_YEAR = 2025; // latest estimate year; exclude pure projections (2026+)
const manifest = [];

const COUNTRIES = [
  { iso: "IND", cc: "in", name: "India" },
  { iso: "CHN", cc: "chn", name: "China" },
  { iso: "KOR", cc: "kor", name: "South Korea" },
  { iso: "BGD", cc: "bgd", name: "Bangladesh" },
  { iso: "IDN", cc: "idn", name: "Indonesia" },
  { iso: "VNM", cc: "vnm", name: "Vietnam" },
  { iso: "JPN", cc: "jpn", name: "Japan" },
  { iso: "DEU", cc: "deu", name: "Germany" },
  { iso: "USA", cc: "usa", name: "United States" },
  { iso: "GBR", cc: "gbr", name: "United Kingdom" }
];

async function fetchWeo(indicator, iso) {
  const raw = await fetchJson(`https://www.imf.org/external/datamapper/api/v1/${indicator}/${iso}`, {
    headers: { "user-agent": "Mozilla/5.0" },
    timeoutMs: 60000,
    retries: 3
  });
  await writeSnapshot("imf", `weo_${indicator}_${iso}`, raw);
  const byYear = raw?.values?.[indicator]?.[iso] || {};
  return Object.entries(byYear)
    .filter(([year, value]) => value != null && Number(year) <= MAX_YEAR)
    .map(([year, value]) => ({ date: String(year), value: Number(value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function write(indicatorId, title, unit, observations, geo, sourceIndicatorId) {
  if (observations.length < 2) { console.warn(`  skip ${indicatorId}: <2 obs`); return; }
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId: "imf", sourceIndicatorId, sourceUrl, unit, frequency: "annual",
    geography: geo, fetchedAt, observations,
    metadata: { sourceCategory: "National Accounts", sourceSubcategory: "World comparison", sourceOwner: "IMF World Economic Outlook" }
  });
  const path = await writeSeriesArtifact({ sourceId: "imf", name: `imf.${geo.id}.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, observations: observations.length, artifact: path, fetchedAt, latest: observations[observations.length - 1] });
  console.log(`  ${indicatorId}: ${observations.length} obs, latest ${observations.at(-1).date} = ${Math.round(observations.at(-1).value)}`);
}

try {
  for (const c of COUNTRIES) {
    const geo = { type: "country", id: c.iso, name: c.name };
    const total = (await fetchWeo("NGDPD", c.iso)).map((o) => ({ date: o.date, value: o.value * BN }));
    const pc = await fetchWeo("NGDPDPC", c.iso);
    await write(`econ.world.cmp.gdp_total.${c.cc}`, `${c.name} — GDP (market exchange rate)`, "current US$", total, geo, "NGDPD");
    await write(`econ.world.cmp.gdp_pc.${c.cc}`, `${c.name} — GDP per capita (market exchange rate)`, "current US$ per person", pc, geo, "NGDPDPC");
    if (c.iso === "IND") {
      const ppp = (await fetchWeo("PPPGDP", c.iso)).map((o) => ({ date: o.date, value: o.value * BN }));
      await write("econ.world.gdp_market_usd", "India GDP at market exchange rate", "current US$", total, geo, "NGDPD");
      await write("econ.world.gdp_ppp_intl", "India GDP at purchasing-power parity", "current international $", ppp, geo, "PPPGDP");
    }
  }
  await writeSourceManifest("imf-weo", manifest);
  console.log(`\nWrote ${manifest.length} IMF WEO series.`);
} catch (error) {
  console.error("IMF WEO ingest failed:", error.message);
  process.exit(1);
}
