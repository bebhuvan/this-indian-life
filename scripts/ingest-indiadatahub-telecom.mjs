import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createSeriesArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

// Telecom, Internet + Payments series (TRAI / RBI / NPCI via IndiaDataHub).
const series = [
  { id: "society.idh.data_per_user", sourceIndicatorId: "IFTLDATPSB11Q", title: "Mobile data used per subscriber per month", unit: "GB", frequency: "quarterly", category: "Telecom, Internet", sub: "Internet" },
  { id: "society.idh.data_cost", sourceIndicatorId: "IFTLMDCGSG11Q", title: "Cost of mobile data", unit: "rupees per GB", frequency: "quarterly", category: "Telecom, Internet", sub: "Internet" },
  { id: "society.idh.internet_subs_wireless", sourceIndicatorId: "IFTLINTWLS11Q", title: "Internet subscribers, wireless", unit: "subscribers", frequency: "quarterly", category: "Telecom, Internet", sub: "Internet" },
  { id: "society.idh.internet_subs_fixed", sourceIndicatorId: "IFTLINTFLS11Q", title: "Internet subscribers, fixed line", unit: "subscribers", frequency: "quarterly", category: "Telecom, Internet", sub: "Internet" },
  { id: "society.idh.telecom_subs_rural", sourceIndicatorId: "IFTLALSURU11M", title: "Telecom subscribers, rural", unit: "subscribers", frequency: "monthly", category: "Telecom, Internet", sub: "Telecom" },
  { id: "society.idh.telecom_subs_urban", sourceIndicatorId: "IFTLALSUUR11M", title: "Telecom subscribers, urban", unit: "subscribers", frequency: "monthly", category: "Telecom, Internet", sub: "Telecom" },
  { id: "society.idh.upi_volume", sourceIndicatorId: "PYVOUPITOT11M", title: "UPI transactions", unit: "transactions", frequency: "monthly", category: "Payments", sub: "Transactions" }
];

function rowsFromPayload(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  return Array.isArray(dataset?.data) ? dataset.data : [];
}

function observationsFromRows(rows) {
  return rows
    .map((row) => ({
      date: String(row.Date || row.date || ""),
      value: row.India === null || row.India === undefined ? null : Number(row.India)
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const sourceUrl = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";
const manifest = [];
const failures = [];

for (const indicator of series) {
  try {
    const raw = await fetchIndiaEconomySeries({ id: indicator.sourceIndicatorId, fields: "India" });
    const rows = rowsFromPayload(raw);
    const observations = observationsFromRows(rows);
    const snapshot = await writeSnapshot("indiadatahub", indicator.sourceIndicatorId, raw);
    const artifact = createSeriesArtifact({
      indicatorId: indicator.id,
      title: indicator.title,
      sourceId: "indiadatahub",
      sourceIndicatorId: indicator.sourceIndicatorId,
      sourceUrl,
      unit: indicator.unit,
      frequency: indicator.frequency,
      geography: { type: "country", id: "IN", name: "India" },
      fetchedAt,
      observations,
      metadata: { sourceCategory: indicator.category, sourceSubcategory: indicator.sub, sourceOwner: rows.length ? raw.dataset?.[0]?.Source : "" }
    });
    const artifactPath = await writeSeriesArtifact({ sourceId: "indiadatahub", name: `indiadatahub.IN.${indicator.sourceIndicatorId}`, artifact });
    manifest.push({ status: "ready", indicatorId: indicator.id, sourceIndicatorId: indicator.sourceIndicatorId, artifact: artifactPath, snapshot: snapshot.path, rawHash: snapshot.hash, observations: observations.length, fetchedAt });
    console.log(`indiadatahub ${sourceSlug(indicator.id)} ${observations.length} observations`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: indicator.id, sourceIndicatorId: indicator.sourceIndicatorId, fetchedAt, error: error.message });
    console.warn(`indiadatahub ${sourceSlug(indicator.id)} failed: ${error.message}`);
  }
}

await writeSourceManifest("indiadatahub-telecom", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} IndiaDataHub telecom/payment artifacts; ${failures.length} failure(s).`);
