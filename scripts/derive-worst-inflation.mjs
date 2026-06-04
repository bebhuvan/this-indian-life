// "The world's worst inflations vs India" — peak annual CPI inflation per country
// (World Bank), as single-value artifacts for one big bar chart. Shock-value context:
// India's worst year is a rounding error next to history's hyperinflations.
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
const fetchedAt = new Date().toISOString();
const COUNTRIES = { IND: "India", BRA: "Brazil", ARG: "Argentina", PER: "Peru", BOL: "Bolivia", NIC: "Nicaragua", TUR: "Türkiye", AGO: "Angola", ZWE: "Zimbabwe", VEN: "Venezuela", ISR: "Israel", COD: "DR Congo" };
const raw = await fetchJson(`https://api.worldbank.org/v2/country/${Object.keys(COUNTRIES).join(";")}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20000`);
await writeSnapshot("world-context", "wb_cpi_worst", raw);
const rows = raw[1] || [];
const man = [];
for (const [iso, name] of Object.entries(COUNTRIES)) {
  const pts = rows.filter((r) => r.countryiso3code === iso && r.value != null).map((r) => ({ year: r.date, v: Number(r.value) }));
  if (!pts.length) { console.warn(`  no data: ${name}`); continue; }
  const peak = pts.reduce((m, p) => (p.v > m.v ? p : m), pts[0]);
  const a = createSeriesArtifact({ indicatorId: `compare.cpi_peak.${iso.toLowerCase()}`, title: `Peak annual inflation — ${name}`,
    sourceId: "world-context", sourceIndicatorId: `FP.CPI.TOTL.ZG.PEAK.${iso}`, sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG",
    unit: "% in peak year", frequency: "annual", geography: { type: "country", id: iso, name }, fetchedAt,
    observations: [{ date: peak.year, value: Math.round(peak.v) }], metadata: { sourceCategory: "Inflation", country: name, peakYear: peak.year } });
  const p = await writeSeriesArtifact({ sourceId: "world-context", name: `world-context.IN.compare.cpi_peak.${iso.toLowerCase()}`, artifact: a });
  man.push({ status: "ready", indicatorId: `compare.cpi_peak.${iso.toLowerCase()}`, peak: Math.round(peak.v), year: peak.year, artifact: p, fetchedAt });
  console.log(`  ${name.padEnd(12)} peak ${Math.round(peak.v)}% in ${peak.year}`);
}
await writeSourceManifest("india-worst-inflation", man);
console.log(`wrote ${man.length} peak-inflation artifacts`);
