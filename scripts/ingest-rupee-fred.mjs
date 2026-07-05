// Pull the FRED half of the rupee article's spine: nominal INR/USD (the long
// monthly series from 1973), plus the inflation pair (US + India CPI) that
// explains WHY the nominal rate drifts, plus USD/GBP for an INR/GBP cross.
import { fetchFredSeries } from "./adapters/fred.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const SERIES = [
  {
    fred: "EXINUS",
    indicatorId: "IN.fx.inr_usd.monthly",
    name: "fred.IN.fx.inr_usd.monthly",
    title: "Indian rupees per US dollar (monthly)",
    unit: "INR per USD"
  },
  {
    fred: "CPIAUCSL",
    indicatorId: "US.prices.cpi.monthly",
    name: "fred.US.prices.cpi.monthly",
    title: "US CPI, all urban consumers (1982-84=100)",
    unit: "index 1982-84=100"
  },
  {
    fred: "INDCPIALLMINMEI",
    indicatorId: "IN.prices.cpi_oecd.monthly",
    name: "fred.IN.prices.cpi_oecd.monthly",
    title: "India CPI, all items (OECD/FRED, 2015=100)",
    unit: "index 2015=100"
  },
  {
    fred: "EXUSUK",
    indicatorId: "US.fx.usd_gbp.monthly",
    name: "fred.US.fx.usd_gbp.monthly",
    title: "US dollars per UK pound sterling (monthly)",
    unit: "USD per GBP"
  }
];

const manifest = [];
const failures = [];

for (const item of SERIES) {
  try {
    const { meta, observations } = await fetchFredSeries(item.fred);
    // Collapse FRED's YYYY-MM-01 period start to YYYY-MM for monthly series.
    const obs = observations.map((o) => ({ date: o.date.slice(0, 7), value: o.value }));
    const snapshot = await writeSnapshot("fred", item.fred, { meta, observations });
    const artifact = createSeriesArtifact({
      indicatorId: item.indicatorId,
      title: item.title,
      sourceId: "fred",
      sourceIndicatorId: item.fred,
      sourceUrl: `https://fred.stlouisfed.org/series/${item.fred}`,
      unit: item.unit,
      frequency: "monthly",
      geography: item.fred === "CPIAUCSL" || item.fred === "EXUSUK"
        ? { type: "country", id: "US", name: "United States" }
        : { type: "country", id: "IN", name: "India" },
      fetchedAt,
      observations: obs,
      metadata: { fredFrequency: meta.frequency, fredUnits: meta.units, observationStart: meta.observation_start, observationEnd: meta.observation_end }
    });
    const path = await writeSeriesArtifact({ sourceId: "fred", name: item.name, artifact });
    manifest.push({ status: "ready", indicatorId: item.indicatorId, sourceIndicatorId: item.fred, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
    console.log(`fred ${item.fred}: ${obs.length} obs (${obs[0]?.date} -> ${obs.at(-1)?.date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: item.indicatorId, sourceIndicatorId: item.fred, fetchedAt, error: error.message });
    console.warn(`fred ${item.fred} failed: ${error.message}`);
  }
}

await writeSourceManifest("fred", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} FRED artifacts; ${failures.length} failure(s).`);
