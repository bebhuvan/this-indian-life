// Ingest IndiaDataHub "Labour Market" series for the "How India Works" flagship:
// NREGA (rural employment-guarantee demand — the labour market's shock absorber),
// EPFO payroll (formal-job creation), high-frequency monthly PLFS, rural wages,
// and the Naukri JobSpeak private-hiring index. Series codes discovered via
// /economy/filter_category. See memory: indica-how-india-works-flagship.
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createSeriesArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";

const indicators = [
  // NREGA — the fallback / distress signal
  { id: "work.idh.nrega_persons_demanding", sourceIndicatorId: "LAEMNREGWD11M", title: "Persons demanding work under MGNREGA", unit: "persons", frequency: "monthly", sub: "NREGA" },
  { id: "work.idh.nrega_person_days_created", sourceIndicatorId: "LAEMNREGPD11M", title: "Person-days of work created under MGNREGA", unit: "person-days", frequency: "monthly", sub: "NREGA" },
  { id: "work.idh.nrega_active_workers", sourceIndicatorId: "LAEMNRGAWR11M", title: "Active workers under MGNREGA", unit: "persons", frequency: "monthly", sub: "NREGA" },
  { id: "work.idh.nrega_persons_provided_annual", sourceIndicatorId: "LAEMNREGPN11A", title: "Persons provided work under MGNREGA (annual)", unit: "persons", frequency: "annual", sub: "NREGA" },
  { id: "work.idh.nrega_avg_days_per_household", sourceIndicatorId: "LAEMNREGAD11A", title: "Average days of work per household under MGNREGA", unit: "days", frequency: "annual", sub: "NREGA" },
  // EPFO payroll — formal-job creation
  { id: "work.idh.epfo_net_new_subscribers_monthly", sourceIndicatorId: "LAEMNETNSB11M", title: "Net new EPF subscribers (monthly)", unit: "persons", frequency: "monthly", sub: "Payroll" },
  { id: "work.idh.epfo_net_new_subscribers_annual", sourceIndicatorId: "LAEMNETNSB11A", title: "Net new EPF subscribers (annual)", unit: "persons", frequency: "annual", sub: "Payroll" },
  // Monthly PLFS — high-frequency labour market
  { id: "work.idh.plfs_monthly_ur", sourceIndicatorId: "LAPLURARTT11M", title: "Unemployment rate, all-India (monthly PLFS)", unit: "%", frequency: "monthly", sub: "Monthly PLFS" },
  { id: "work.idh.plfs_monthly_lfpr_female", sourceIndicatorId: "LAPLLPARFA11M", title: "Female labour force participation rate, all-India (monthly PLFS)", unit: "%", frequency: "monthly", sub: "Monthly PLFS" },
  // Rural wages
  { id: "work.idh.rural_wage_men", sourceIndicatorId: "LAWRAGGAVG13M", title: "Daily average rural wage rate, men (blended series)", unit: "₹/day", frequency: "monthly", sub: "Rural Wages" },
  { id: "work.idh.rural_wage_women", sourceIndicatorId: "LAWRWTTAVG13M", title: "Daily average rural wage rate, women (blended series)", unit: "₹/day", frequency: "monthly", sub: "Rural Wages" },
  // JobSpeak — private white-collar hiring
  { id: "work.idh.jobspeak_total", sourceIndicatorId: "LANJSITTOT11M", title: "Naukri JobSpeak hiring index — total", unit: "index", frequency: "monthly", sub: "JobSpeak Index" }
];

function rowsFromPayload(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  return Array.isArray(dataset?.data) ? dataset.data : [];
}

function observationsFromRows(rows) {
  return rows
    .map((row) => ({
      date: String(row.Date || row.date || ""),
      value: row.India === null || row.India === undefined || row.India === "" ? null : Number(row.India)
    }))
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

const manifest = [];
const failures = [];

for (const indicator of indicators) {
  try {
    const raw = await fetchIndiaEconomySeries({ id: indicator.sourceIndicatorId, fields: "India" });
    const rows = rowsFromPayload(raw);
    const observations = observationsFromRows(rows);
    if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
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
      metadata: { sourceCategory: "Labour Market", sourceSubcategory: indicator.sub }
    });
    const artifactPath = await writeSeriesArtifact({ sourceId: "indiadatahub", name: `indiadatahub.IN.${indicator.sourceIndicatorId}`, artifact });
    manifest.push({
      status: "ready",
      indicatorId: indicator.id,
      sourceIndicatorId: indicator.sourceIndicatorId,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      observations: observations.length,
      fetchedAt
    });
    console.log(`indiadatahub ${sourceSlug(indicator.id)} ${observations.length} obs (${observations[0]?.date}→${observations.at(-1)?.date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: indicator.id, sourceIndicatorId: indicator.sourceIndicatorId, fetchedAt, error: error.message });
    console.warn(`indiadatahub ${sourceSlug(indicator.id)} failed: ${error.message}`);
  }
}

await writeSourceManifest("indiadatahub-labour", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} IndiaDataHub labour artifacts; ${failures.length} failure(s).`);
