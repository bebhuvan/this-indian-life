// Two long context series for the rupee article, found by probing FRED + BIS:
//  * India total reserves excluding gold (FRED TRESEGINM052N) monthly 1950->2026
//    — the reserve-accumulation backbone (Patra et al.'s "surge since 2004"),
//    far longer than the existing weekly RBI DBIE reserves series.
//  * India central-bank policy rate (BIS WS_CBPOL M.IN) monthly 1946->2026
//    — long policy-rate context spanning every exchange-rate regime.
import { fetchFredSeries } from "./adapters/fred.mjs";
import { fetchBisData } from "./adapters/bis.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

// --- FRED: India reserves ex-gold ---
{
  const { meta, observations } = await fetchFredSeries("TRESEGINM052N");
  const obs = observations.map((o) => ({ date: o.date.slice(0, 7), value: o.value == null ? null : Math.round((o.value / 1000) * 1000) / 1000 }));
  const snapshot = await writeSnapshot("fred", "TRESEGINM052N", { meta, observations });
  const artifact = createSeriesArtifact({
    indicatorId: "IN.reserves.ex_gold_usd.monthly",
    title: "India total reserves excluding gold (US$)",
    sourceId: "fred",
    sourceIndicatorId: "TRESEGINM052N",
    sourceUrl: "https://fred.stlouisfed.org/series/TRESEGINM052N",
    unit: "US$ billion",
    frequency: "monthly",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations: obs,
    metadata: { fredUnits: meta.units, observationStart: meta.observation_start, observationEnd: meta.observation_end }
  });
  const path = await writeSeriesArtifact({ sourceId: "fred", name: "fred.IN.reserves.ex_gold_usd.monthly", artifact });
  manifest.push({ status: "ready", indicatorId: "IN.reserves.ex_gold_usd.monthly", sourceIndicatorId: "TRESEGINM052N", artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
  console.log(`fred TRESEGINM052N: ${obs.length} obs (${obs[0]?.date} -> ${obs.at(-1)?.date}) unit=${meta.units}`);
}

// --- BIS: India policy rate ---
{
  const { raw, series } = await fetchBisData({ flow: "WS_CBPOL", key: "M.IN" });
  const s = series[0];
  const observations = s.observations.map((o) => ({ date: o.period, value: o.value }));
  const snapshot = await writeSnapshot("bis", "WS_CBPOL.M.IN", raw);
  const artifact = createSeriesArtifact({
    indicatorId: "IN.rates.policy_rate.monthly",
    title: "India central bank policy rate (BIS)",
    sourceId: "bis",
    sourceIndicatorId: "WS_CBPOL/M.IN",
    sourceUrl: "https://data.bis.org/topics/CBPOL",
    unit: "percent per annum",
    frequency: "monthly",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: { flow: "WS_CBPOL", seriesKey: "M.IN", dims: s.dims }
  });
  const path = await writeSeriesArtifact({ sourceId: "bis", name: "bis.IN.rates.policy_rate.monthly", artifact });
  manifest.push({ status: "ready", indicatorId: "IN.rates.policy_rate.monthly", sourceIndicatorId: "WS_CBPOL/M.IN", artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: observations.length, fetchedAt });
  console.log(`bis WS_CBPOL M.IN: ${observations.length} obs (${observations[0]?.date} -> ${observations.at(-1)?.date})`);
}

await writeSourceManifest("rupee-extras", manifest);
console.log(`Wrote ${manifest.length} extra rupee context series.`);
