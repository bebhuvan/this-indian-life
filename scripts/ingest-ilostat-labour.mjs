// Ingest ILOSTAT (ILO official) labour indicators that strengthen the "How India
// Works" flagship beyond World Bank's modelled proxies: the real informal-
// employment rate (SDG 8.3.1, ~90% in India), working-poverty rate (SDG 1.1.1),
// and youth NEET (SDG 8.6.1) — plus cross-country informality for peers.
// Source: ILOSTAT rplumber API (open, no auth). See indica-how-india-works-flagship.
import { fetchIlostatIndicator, ilostatObservations } from "./adapters/ilostat.mjs";
import { createSeriesArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE = "ilostat";
const dataUrl = (id, area) => `https://rplumber.ilo.org/data/indicator?id=${id}&ref_area=${area}&format=.json`;

const manifest = [];
const failures = [];

async function emit({ id, indicatorId, title, unit, rows, predicate, geography = { type: "country", id: "IN", name: "India" }, srcId, srcArea, metadata = {} }) {
  try {
    const observations = ilostatObservations(rows, predicate);
    if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
    const artifact = createSeriesArtifact({
      indicatorId,
      title,
      sourceId: SOURCE,
      sourceIndicatorId: srcId,
      sourceUrl: dataUrl(srcId, srcArea),
      unit,
      frequency: "annual",
      geography,
      fetchedAt,
      observations,
      metadata: { dataset: "ILOSTAT", ...metadata }
    });
    const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.${geography.id}.${id}`, artifact });
    manifest.push({ status: "ready", indicatorId, sourceIndicatorId: srcId, artifact: path, observations: observations.length, fetchedAt });
    console.log(`  ${indicatorId} (${observations.length} obs, ${observations[0].date}→${observations.at(-1).date}, latest ${observations.at(-1).value})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId, sourceIndicatorId: srcId, fetchedAt, error: error.message });
    console.warn(`  ${indicatorId} FAILED: ${error.message}`);
  }
}

// ---- Informal employment rate (SDG 8.3.1), India, total + broad sectors ----
console.log("Informal employment rate (SDG 8.3.1):");
const informIN = await fetchIlostatIndicator({ id: "SDG_0831_SEX_ECO_RT_A", refArea: "IND", sex: "SEX_T" });
await writeSnapshot(SOURCE, "SDG_0831_IND", informIN);
for (const [code, slug, label] of [
  ["ECO_SECTOR_TOTAL", "informal_rate_total", "total"],
  ["ECO_SECTOR_AGR", "informal_rate_agriculture", "agriculture"],
  ["ECO_SECTOR_IND", "informal_rate_industry", "industry"],
  ["ECO_SECTOR_SER", "informal_rate_services", "services"]
]) {
  await emit({ id: `SDG_0831.${slug}`, indicatorId: `work.ilo.${slug}`, title: `Informal employment rate — ${label}`, unit: "% of employment", rows: informIN, predicate: (r) => r.classif1 === code, srcId: "SDG_0831_SEX_ECO_RT_A", srcArea: "IND", metadata: { sdg: "8.3.1", sector: label } });
}

// ---- Working poverty rate (SDG 1.1.1), India, total + youth ----
console.log("Working poverty rate (SDG 1.1.1):");
const povIN = await fetchIlostatIndicator({ id: "SDG_0111_SEX_AGE_RT_A", refArea: "IND", sex: "SEX_T" });
await writeSnapshot(SOURCE, "SDG_0111_IND", povIN);
await emit({ id: "SDG_0111.working_poverty_total", indicatorId: "work.ilo.working_poverty", title: "Working poverty rate (employed below US$3.65/day PPP)", unit: "% of employed", rows: povIN, predicate: (r) => r.classif1 === "AGE_YTHADULT_YGE15", srcId: "SDG_0111_SEX_AGE_RT_A", srcArea: "IND", metadata: { sdg: "1.1.1" } });
await emit({ id: "SDG_0111.working_poverty_youth", indicatorId: "work.ilo.working_poverty_youth", title: "Working poverty rate, youth (15–24)", unit: "% of employed youth", rows: povIN, predicate: (r) => r.classif1 === "AGE_YTHADULT_Y15-24", srcId: "SDG_0111_SEX_AGE_RT_A", srcArea: "IND", metadata: { sdg: "1.1.1", age: "15-24" } });

// ---- Youth NEET (SDG 8.6.1), India, total + female ----
console.log("Youth NEET rate (SDG 8.6.1):");
const neetIN = await fetchIlostatIndicator({ id: "SDG_0861_SEX_RT_A", refArea: "IND", sex: "SEX_T+SEX_F+SEX_M" });
await writeSnapshot(SOURCE, "SDG_0861_IND", neetIN);
await emit({ id: "SDG_0861.neet_total", indicatorId: "work.ilo.neet_youth", title: "Youth NEET rate (not in employment, education or training)", unit: "% of youth 15–24", rows: neetIN, predicate: (r) => r.sex === "SEX_T", srcId: "SDG_0861_SEX_RT_A", srcArea: "IND", metadata: { sdg: "8.6.1" } });
await emit({ id: "SDG_0861.neet_female", indicatorId: "work.ilo.neet_youth_female", title: "Youth NEET rate — female", unit: "% of female youth 15–24", rows: neetIN, predicate: (r) => r.sex === "SEX_F", srcId: "SDG_0861_SEX_RT_A", srcArea: "IND", metadata: { sdg: "8.6.1", sex: "female" } });
await emit({ id: "SDG_0861.neet_male", indicatorId: "work.ilo.neet_youth_male", title: "Youth NEET rate — male", unit: "% of male youth 15–24", rows: neetIN, predicate: (r) => r.sex === "SEX_M", srcId: "SDG_0861_SEX_RT_A", srcArea: "IND", metadata: { sdg: "8.6.1", sex: "male" } });

// ---- Cross-country informality (SDG 8.3.1, total) for India + peers ----
console.log("Cross-country informality:");
// China does not report SDG 8.3.1 informality to ILOSTAT, so it is omitted here.
const PEERS = [["IND", "India"], ["BGD", "Bangladesh"], ["VNM", "Vietnam"], ["IDN", "Indonesia"]];
const informAll = await fetchIlostatIndicator({ id: "SDG_0831_SEX_ECO_RT_A", refArea: PEERS.map((p) => p[0]).join("+"), sex: "SEX_T", classif1: "ECO_SECTOR_TOTAL" });
await writeSnapshot(SOURCE, "SDG_0831_PEERS", informAll);
for (const [cc, name] of PEERS) {
  await emit({ id: `compare.informal_rate.${cc.toLowerCase()}`, indicatorId: `compare.informal_rate.${cc.toLowerCase()}`, title: `Informal employment rate — ${name}`, unit: "% of employment", rows: informAll, predicate: (r) => r.ref_area === cc && r.classif1 === "ECO_SECTOR_TOTAL", geography: { type: "country", id: cc, name }, srcId: "SDG_0831_SEX_ECO_RT_A", srcArea: cc, metadata: { sdg: "8.3.1", comparison: "informal_rate", country: name } });
}

await writeSourceManifest("ilostat-labour", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} ILOSTAT artifacts; ${failures.length} failure(s).`);
