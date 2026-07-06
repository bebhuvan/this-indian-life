// Ingest DPIIT cumulative FDI-equity-inflow by SECTOR (via IndiaDataHub) -> table.
// "Where India's FDI goes": services and computer software dominate, not factories.
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SRC_URL = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";

// DPIIT's headline sectors (cumulative equity FDI since Apr-2000). Curated to the
// largest/most-recognisable; "Services" here is DPIIT's financial+non-financial services line.
const sectors = [
  ["Services (finance, banking, insurance, etc.)", "EXFIDIPOSV11A"],
  ["Computer software & hardware", "EXFIDIPCSH11A"],
  ["Trading", "EXFIDIPTRA11A"],
  ["Telecommunications", "EXFIDIPTEL11A"],
  ["Automobile industry", "EXFIDIPAUT11A"],
  ["Infrastructure construction", "EXFIDIPINC11A"],
  ["Construction (other)", "EXFIDIPOCO11A"],
  ["Drugs & pharmaceuticals", "EXFIDIPDRU11A"],
  ["Chemicals (excl. fertilizers)", "EXFIDIPCHE11A"],
  ["Non-conventional energy", "EXFIDIPNCE11A"],
  ["Power", "EXFIDIPPOW11A"]
];
const TOTAL = ["Total", "EXFIDIPALL11A"];

function latest(ds) {
  const data = (ds?.dataset?.[0]?.data || []).filter((d) => d.India !== null && d.India !== undefined);
  if (!data.length) return null;
  data.sort((a, b) => b.Date.localeCompare(a.Date));
  return { date: data[0].Date, value: Number(data[0].India) };
}

const raw = {};
const rows = [];
for (const [name, id] of [...sectors, TOTAL]) {
  const ds = await fetchIndiaEconomySeries({ id, fields: "India" });
  raw[id] = ds;
  const l = latest(ds);
  if (!l) { console.warn(`  no data: ${name} (${id})`); continue; }
  const mn = Math.round(l.value / 1e6 * 10) / 10;
  rows.push({ sector: name, code: id, cumulative_fdi_usd_million: mn, as_of: l.date.slice(0, 10), share_pct: null, label: name === "Total" ? undefined : name, value: mn });
}
await writeSnapshot("indiadatahub", "dpiit_fdi_equity_by_sector", raw);

const grand = rows.find((r) => r.sector === "Total")?.cumulative_fdi_usd_million;
for (const r of rows) if (grand) r.share_pct = Math.round((r.cumulative_fdi_usd_million / grand) * 1000) / 10;
rows.sort((a, b) => (a.sector === "Total" ? 1 : b.sector === "Total" ? -1 : b.cumulative_fdi_usd_million - a.cumulative_fdi_usd_million));

const asOf = rows[0]?.as_of;
const artifact = createTableArtifact({
  indicatorId: "extfin.fdi.sector.dpiit.usd",
  title: "Cumulative FDI equity inflow by sector (DPIIT)",
  sourceId: "indiadatahub", sourceIndicatorId: "EXFIDIP*11A (sector)", sourceUrl: SRC_URL, unit: "USD million",
  geography: { type: "country", id: "IN", name: "India" }, fetchedAt, rows,
  dimensions: [{ id: "sector", label: "Sector" }],
  metadata: {
    source: "DPIIT cumulative FDI equity inflows by sector, via IndiaDataHub (normalized)",
    basis: "cumulative equity FDI since April 2000; DPIIT basis (differs from RBI BoP)",
    asOf, note: "Services and software dominate; India's FDI is services-heavy, not factory-heavy",
    caveat: "DPIIT equity-inflow basis is narrower than RBI BoP gross FDI; cumulative stock, not annual flow; sector definitions are DPIIT's"
  }
});
const path = await writeSeriesArtifact({ sourceId: "indiadatahub", name: "indiadatahub.IN.extfin_fdi_sector", artifact });
await writeSourceManifest("foreign-investment-fdi-sector", [{ status: "ready", indicatorId: artifact.indicatorId, artifact: path, rows: rows.length, fetchedAt }]);
console.log(`Wrote FDI sector table: ${rows.length} rows, as of ${asOf}`);
for (const r of rows.slice(0, 6)) console.log(`  ${r.sector.padEnd(38)} $${r.cumulative_fdi_usd_million.toLocaleString()}mn  ${r.share_pct}%`);
