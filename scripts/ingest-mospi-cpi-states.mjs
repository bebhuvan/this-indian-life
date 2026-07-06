// Ingest per-state CPI General (Combined, 2012=100) inflation time-series from
// eSankhyiki, for the academy's "inflation differs across India" angle.
import { writeFileSync } from "node:fs";
import { fetchCpiIndex } from "./adapters/mospi.mjs";

const MONTHS = { January: "01", February: "02", March: "03", April: "04", May: "05", June: "06", July: "07", August: "08", September: "09", October: "10", November: "11", December: "12" };
const STATES = [
  { code: 32, name: "Kerala", slug: "kerala" },
  { code: 36, name: "Telangana", slug: "telangana" }
];

const fetchedAt = new Date().toISOString();

for (const st of STATES) {
  const raw = await fetchCpiIndex({ baseYear: 2012, stateCode: st.code, sectorCode: 3, series: "Current" });
  const rows = Array.isArray(raw) ? raw : raw?.data || [];
  const obs = rows
    .filter((r) => /general/i.test(r.group) && r.inflation != null && r.inflation !== "" && MONTHS[r.month])
    .map((r) => ({ date: `${r.year}-${MONTHS[r.month]}`, value: Number(r.inflation) }))
    .filter((o) => Number.isFinite(o.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  // dedupe by date (keep last)
  const map = new Map(obs.map((o) => [o.date, o.value]));
  const observations = [...map.entries()].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));

  const artifact = {
    schemaVersion: "1", artifactType: "series",
    indicatorId: `prices.cpi.${st.slug}.general.inflation`,
    title: `CPI inflation — General (Combined), ${st.name}`,
    sourceId: "mospi", sourceUrl: "https://esankhyiki.mospi.gov.in/macroindicators?product=cpi",
    unit: "% YoY", frequency: "monthly", geography: st.name, fetchedAt, observations
  };
  const path = `data/series/mospi.IN.prices.cpi.${st.slug}.general.inflation.json`;
  writeFileSync(path, JSON.stringify(artifact, null, 2));
  console.log(`${st.name}: ${observations.length} obs, ${observations[0]?.date}..${observations[observations.length-1]?.date}, latest=${observations[observations.length-1]?.value}%`);
}
