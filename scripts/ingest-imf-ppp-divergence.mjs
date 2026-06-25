// IMF WEO GDP per capita at PPP (current international $) for the divergence series.
// The World Bank PPP series (constant 2021 int-$) lags to ~2024; IMF WEO runs to the
// current year with estimates/projections (PPPPC), and the GDP-size page already uses
// IMF, so this keeps the per-capita figures current and consistent. Honesty note lives
// in the prose: IMF recent years are estimates, and PPP rests on periodic ICP price
// benchmarks (see the transparency concept in generate-explanations.mjs).
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

const COUNTRIES = [
  { iso: "IND", cc: "in", name: "India" }, { iso: "CHN", cc: "chn", name: "China" },
  { iso: "KOR", cc: "kor", name: "South Korea" }, { iso: "VNM", cc: "vnm", name: "Vietnam" },
  { iso: "BGD", cc: "bgd", name: "Bangladesh" }, { iso: "IDN", cc: "idn", name: "Indonesia" },
  { iso: "WEOWORLD", cc: "wld", name: "World" }
];

for (const c of COUNTRIES) {
  const url = `https://www.imf.org/external/datamapper/api/v1/PPPPC/${c.iso}`;
  try {
    const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
    await writeSnapshot("imf", `weo_PPPPC_${c.iso}`, raw);
    const byYear = raw?.values?.PPPPC?.[c.iso] || {};
    const observations = Object.entries(byYear)
      .map(([y, v]) => ({ date: String(y), value: v == null ? null : Number(v) }))
      .filter((o) => o.date && o.date >= "1980" && o.date <= "2025" && Number.isFinite(o.value)) // cap at current-year estimate; 2026+ are IMF forecasts
      .sort((a, b) => a.date.localeCompare(b.date));
    if (observations.length < 2) throw new Error("insufficient observations");
    const indicatorId = `divergence.gdp_pc_imf.${c.cc}`;
    const artifact = createSeriesArtifact({
      indicatorId, title: `GDP per capita, PPP (IMF) — ${c.name}`, sourceId: "imf", sourceIndicatorId: "PPPPC",
      sourceUrl: url, unit: "current international $ (PPP)", frequency: "annual",
      geography: { type: "country", id: c.iso === "WEOWORLD" ? "WLD" : c.iso, name: c.name }, fetchedAt, observations,
      metadata: { angle: "income", metric: "gdp_pc_imf", country: c.name, source: "IMF World Economic Outlook; recent years are estimates/projections" }
    });
    await writeSeriesArtifact({ sourceId: "imf", name: `imf.divergence.${c.cc}.gdp_pc_imf`, artifact });
    manifest.push({ status: "ready", indicatorId, observations: observations.length, latest: observations.at(-1) });
    console.log(`imf-ppp ${indicatorId} (${observations.length} obs, ${observations[0].date}-${observations.at(-1).date}, latest=$${Math.round(observations.at(-1).value)})`);
  } catch (e) { failures.push({ cc: c.cc, error: e.message }); console.warn(`PPPPC ${c.iso} failed: ${e.message}`); }
}

await writeSourceManifest("imf-ppp-divergence", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} IMF PPP series; ${failures.length} failure(s).`);
