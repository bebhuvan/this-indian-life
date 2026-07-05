// Chapter 7 (what depreciation costs / pays): the most visceral channels.
//  * Brent crude (FRED POILBREUSDM, monthly 1992->) — India imports ~85% of
//    its oil; priced in USD, so a weaker rupee raises the pump price even when
//    the dollar oil price is flat. We derive oil-in-INR in the chart step.
//  * Personal remittances received (World Bank, annual) — the offsetting flow:
//    a weaker rupee makes every remitted dollar worth more at home; India is
//    the world's largest recipient.
import { fetchFredSeries } from "./adapters/fred.mjs";
import { buildUrl, fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

// --- FRED Brent crude ---
{
  const { meta, observations } = await fetchFredSeries("POILBREUSDM");
  const obs = observations.map((o) => ({ date: o.date.slice(0, 7), value: o.value }));
  const snapshot = await writeSnapshot("fred", "POILBREUSDM", { meta, observations });
  const artifact = createSeriesArtifact({
    indicatorId: "GLOBAL.energy.brent_usd.monthly",
    title: "Brent crude oil price (US$/barrel)",
    sourceId: "fred",
    sourceIndicatorId: "POILBREUSDM",
    sourceUrl: "https://fred.stlouisfed.org/series/POILBREUSDM",
    unit: "US$ per barrel",
    frequency: "monthly",
    geography: { type: "region", id: "WLD", name: "World" },
    fetchedAt,
    observations: obs,
    metadata: { fredUnits: meta.units, observationStart: meta.observation_start, observationEnd: meta.observation_end }
  });
  const path = await writeSeriesArtifact({ sourceId: "fred", name: "fred.GLOBAL.energy.brent_usd.monthly", artifact });
  manifest.push({ status: "ready", indicatorId: "GLOBAL.energy.brent_usd.monthly", sourceIndicatorId: "POILBREUSDM", artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
  console.log(`fred POILBREUSDM: ${obs.length} obs (${obs[0]?.date} -> ${obs.at(-1)?.date})`);
}

// --- World Bank remittances received (current US$) ---
{
  const url = buildUrl("https://api.worldbank.org/v2", "/country/IND/indicator/BX.TRF.PWKR.CD.DT", { format: "json", per_page: "300", date: "1970:2024" });
  const raw = await fetchJson(url, { timeoutMs: 60000, retries: 3 });
  const obs = (raw?.[1] || [])
    .map((o) => ({ date: o.date, value: o.value == null ? null : Number(o.value) }))
    .filter((o) => o.value !== null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const snapshot = await writeSnapshot("worldbank", "BX.TRF.PWKR.CD.DT.IND", raw);
  const artifact = createSeriesArtifact({
    indicatorId: "IN.extfin.remittances_received_usd.annual",
    title: "Personal remittances received, India (current US$)",
    sourceId: "worldbank",
    sourceIndicatorId: "BX.TRF.PWKR.CD.DT",
    sourceUrl: "https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT?locations=IN",
    unit: "current US$",
    frequency: "annual",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations: obs,
    metadata: { worldBankIndicator: "BX.TRF.PWKR.CD.DT" }
  });
  const path = await writeSeriesArtifact({ sourceId: "worldbank", name: "worldbank.IN.extfin.remittances_received_usd.annual", artifact });
  manifest.push({ status: "ready", indicatorId: "IN.extfin.remittances_received_usd.annual", sourceIndicatorId: "BX.TRF.PWKR.CD.DT", artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
  console.log(`worldbank remittances: ${obs.length} obs (${obs[0]?.date} -> ${obs.at(-1)?.date})`);
}

await writeSourceManifest("rupee-consequences", manifest);
console.log(`Wrote ${manifest.length} consequence series.`);
