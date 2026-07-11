// Ingest DPIIT cumulative FDI-equity-inflow by source country (via IndiaDataHub, normalized) -> table.
// "Where India's FDI comes from": the Mauritius/Singapore/Netherlands treaty-routing story.
// Cumulative equity inflow since Apr-2000 (DPIIT basis), latest available year.
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SRC_URL = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";
const IN = { type: "multi", id: "MULTI", name: "Selected source countries" };

const countries = [
  ["Mauritius", "EXFIDIPMAU11A"], ["Singapore", "EXFIDIPSIG11A"], ["United States", "EXFIDIPUSA11A"],
  ["Netherlands", "EXFIDIPNET11A"], ["Japan", "EXFIDIPJAP11A"], ["United Kingdom", "EXFIDIPUKG11A"],
  ["UAE", "EXFIDIPUAE11A"], ["Cayman Islands", "EXFIDIPCAY11A"], ["Germany", "EXFIDIPGER11A"],
  ["Cyprus", "EXFIDIPCYP11A"], ["France", "EXFIDIPFRA11A"], ["Switzerland", "EXFIDIPSWI11A"]
];
const TOTAL = ["Total", "EXFIDIPALL11A"];

function latest(dataset) {
  const data = (dataset?.dataset?.[0]?.data || []).filter((d) => d.India !== null && d.India !== undefined);
  if (!data.length) return null;
  data.sort((a, b) => b.Date.localeCompare(a.Date));
  return { date: data[0].Date, value: Number(data[0].India) };
}

const raw = {};
const rows = [];
for (const [name, id] of [...countries, TOTAL]) {
  const ds = await fetchIndiaEconomySeries({ id, fields: "India" });
  raw[id] = ds;
  const l = latest(ds);
  if (!l) { console.warn(`  no data: ${name}`); continue; }
  rows.push({
    country: name, code: id, cumulative_fdi_usd_million: Math.round(l.value / 1e6 * 10) / 10,
    as_of: l.date.slice(0, 10), share_pct: null,
    label: name === "Total" ? undefined : name, // Total excluded from bars
    value: Math.round(l.value / 1e6 * 10) / 10
  });
}
await writeSnapshot("indiadatahub", "dpiit_fdi_equity_by_country", raw);

const grand = rows.find((r) => r.country === "Total")?.cumulative_fdi_usd_million;
for (const r of rows) if (grand) r.share_pct = Math.round((r.cumulative_fdi_usd_million / grand) * 1000) / 10;
rows.sort((a, b) => (a.country === "Total" ? 1 : b.country === "Total" ? -1 : b.cumulative_fdi_usd_million - a.cumulative_fdi_usd_million));

const asOf = rows[0]?.as_of;
const artifact = createTableArtifact({
  indicatorId: "extfin.fdi.source_country.dpiit.usd",
  title: "Cumulative FDI equity inflow by source country (DPIIT)",
  sourceId: "indiadatahub", sourceIndicatorId: "EXFIDIP*11A", sourceUrl: SRC_URL, unit: "USD million",
  geography: IN, fetchedAt, rows, dimensions: [{ id: "country", label: "Source country" }],
  metadata: {
    source: "DPIIT cumulative FDI equity inflows, via IndiaDataHub (normalized)",
    basis: "cumulative equity FDI since April 2000; DPIIT basis (differs from RBI BoP)",
    asOf, note: "Mauritius/Singapore/Netherlands lead via treaty routing, not as ultimate origin",
    caveat: "DPIIT equity-inflow basis is narrower than RBI BoP gross FDI; cumulative stock, not annual flow"
  }
});
const path = await writeSeriesArtifact({ sourceId: "indiadatahub", name: "indiadatahub.IN.extfin_fdi_source_country", artifact });
await writeSourceManifest("foreign-investment-fdi-source", [{ status: "ready", indicatorId: artifact.indicatorId, artifact: path, rows: rows.length, fetchedAt }]);
console.log(`Wrote FDI source-country table: ${rows.length} rows, as of ${asOf}`);
for (const r of rows.slice(0, 6)) console.log(`  ${r.country.padEnd(16)} $${r.cumulative_fdi_usd_million.toLocaleString()}mn  ${r.share_pct}%`);
