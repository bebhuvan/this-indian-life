// India + US CPI from BIS WS_LONG_CPI (long consumer-price statistics).
// One consistent base (2010=100) and methodology for both countries, so the
// inflation-differential decomposition ("why the nominal rupee drifts") is
// apples-to-apples. India monthly 1953-> ; US monthly 1913-> ; both + YoY.
// This is the inflation spine; supersedes the FRED CPI pull for the differential.
// BIS reaches 2026-03 — splice MOSPI for the final 1-2 months at publish time.
import { fetchBisData } from "./adapters/bis.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://data.bis.org/topics/LONG_CPI";

// key = FREQ.REF_AREA.UNIT  (628 = index 2010=100 ; 771 = YoY % change)
const SERIES = [
  { key: "M.IN.628", indicatorId: "IN.prices.cpi_bis.monthly", name: "bis.IN.prices.cpi.monthly", title: "India CPI, all items (BIS long CPI, 2010=100)", unit: "index 2010=100", geo: "IN" },
  { key: "M.IN.771", indicatorId: "IN.prices.cpi_yoy_bis.monthly", name: "bis.IN.prices.cpi_yoy.monthly", title: "India CPI inflation, year-on-year (BIS long CPI)", unit: "percent YoY", geo: "IN" },
  { key: "M.US.628", indicatorId: "US.prices.cpi_bis.monthly", name: "bis.US.prices.cpi.monthly", title: "US CPI, all items (BIS long CPI, 2010=100)", unit: "index 2010=100", geo: "US" },
  { key: "M.US.771", indicatorId: "US.prices.cpi_yoy_bis.monthly", name: "bis.US.prices.cpi_yoy.monthly", title: "US CPI inflation, year-on-year (BIS long CPI)", unit: "percent YoY", geo: "US" }
];

const GEO = { IN: { type: "country", id: "IN", name: "India" }, US: { type: "country", id: "US", name: "United States" } };

const manifest = [];
const failures = [];

for (const item of SERIES) {
  try {
    const { flowName, raw, series } = await fetchBisData({ flow: "WS_LONG_CPI", key: item.key });
    const s = series[0];
    if (!s) throw new Error(`no series for ${item.key}`);
    const observations = s.observations.map((o) => ({ date: o.period, value: o.value }));
    const snapshot = await writeSnapshot("bis", `WS_LONG_CPI.${item.key}`, raw);
    const artifact = createSeriesArtifact({
      indicatorId: item.indicatorId,
      title: item.title,
      sourceId: "bis",
      sourceIndicatorId: `WS_LONG_CPI/${item.key}`,
      sourceUrl,
      unit: item.unit,
      frequency: "monthly",
      geography: GEO[item.geo],
      fetchedAt,
      observations,
      metadata: { flow: "WS_LONG_CPI", flowName, seriesKey: item.key, dims: s.dims }
    });
    const path = await writeSeriesArtifact({ sourceId: "bis", name: item.name, artifact });
    manifest.push({ status: "ready", indicatorId: item.indicatorId, sourceIndicatorId: `WS_LONG_CPI/${item.key}`, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, observations: observations.length, fetchedAt });
    console.log(`bis ${item.key}: ${observations.length} obs (${observations[0]?.date} -> ${observations.at(-1)?.date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: item.indicatorId, sourceIndicatorId: `WS_LONG_CPI/${item.key}`, fetchedAt, error: error.message });
    console.warn(`bis ${item.key} failed: ${error.message}`);
  }
}

await writeSourceManifest("bis-cpi", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} BIS CPI artifacts; ${failures.length} failure(s).`);
