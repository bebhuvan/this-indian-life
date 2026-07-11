// Ingest NSS78/79/80 for q.work.women — water, sanitation, mobile, internet,
// financial inclusion, all cut by gender. These explain the infrastructure and
// digital burdens that shape women's access to paid work.
import { loadEnv } from "./env.mjs";
import { Agent } from "undici";
import { buildUrl, fetchJson } from "./lib/source-http.mjs";
import {
  createSeriesArtifact,
  writeSeriesArtifact,
  writeSnapshot,
  writeSourceManifest
} from "./core/artifacts.mjs";

loadEnv();
const fetchedAt = new Date().toISOString();
const SOURCE = "mospi";
const disp = new Agent({ connect: { rejectUnauthorized: false } });
const h = { "user-agent": "Mozilla/5.0" };
const base = "https://api.mospi.gov.in";
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// All India state code (from probing)
const AI = 37;

const manifest = [];

async function emitSeries({ id, title, unit, observations, metadata = {} }) {
  if (!observations.some(o => Number.isFinite(o.value))) return;
  const art = createSeriesArtifact({
    indicatorId: `people.nss.${id}`, title, sourceId: SOURCE, sourceIndicatorId: id,
    sourceUrl: metadata.sourceUrl || "", unit, frequency: "survey",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt, observations: observations.sort((a,b) => a.date.localeCompare(b.date)),
    metadata
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.nss.${id}`, artifact: art });
  manifest.push({ status: "ready", indicatorId: `people.nss.${id}`, artifact: path, fetchedAt, observations: observations.length });
  console.log(`  + people.nss.${id} (${observations.length} obs)`);
}

async function fetchNss78(indicatorCode, stateCode = AI) {
  const url = buildUrl(base, "/api/nss-78/getNss78Records", { indicator_code: indicatorCode, state_code: stateCode, Format: "JSON", limit: 100000, page: 1 });
  return fetchJson(url, { headers: h, dispatcher: disp, timeoutMs: 90000, retries: 2 });
}

async function fetchNss79(indicatorCode, stateCode = AI) {
  const url = buildUrl(base, "/api/nss-79/getNSS79Records", { indicator_code: indicatorCode, state_code: stateCode, Format: "JSON", limit: 100000, page: 1 });
  return fetchJson(url, { headers: h, dispatcher: disp, timeoutMs: 90000, retries: 2 });
}

async function fetchNss80(indicatorCode, surveyCode = 1) {
  const url = buildUrl(base, "/api/nss-80/getNSS80Records", { indicator_code: indicatorCode, state_code: AI, survey_code: surveyCode, Format: "JSON", limit: 100000, page: 1 });
  return fetchJson(url, { headers: h, dispatcher: disp, timeoutMs: 90000, retries: 2 });
}

// ==== NSS78: Water, sanitation, mobile ====
console.log("Fetching NSS78...");
try {
  const rs = {};
  for (const [ind, key] of [[2, "water_access"], [3, "water_premises"], [4, "latrine_exclusive"], [6, "mobile_use"]]) {
    const r = await fetchNss78(ind);
    rs[key] = r.data || [];
    await writeSnapshot(SOURCE, `nss78.indicator_${ind}`, r);
    console.log(`  NSS78 ${ind}: ${rs[key].length} rows`);
  }

  // NSS78 water/sanitation: gender is often null (household-level). Emit overall.
  const wObs = rs.water_access
    .filter(r => r.state === "All India" && r.sector === "All")
    .filter(r => r.sub_indicator === "Improved Source of Drinking Water")
    .map(r => ({ date: "2020-21", value: num(r.value) }))
    .filter(r => Number.isFinite(r.value));
  if (wObs.length) await emitSeries({ id: "nss78_water_improved", title: "Access to improved drinking water source", unit: "%", observations: wObs, metadata: { source: "NSS78", indicator: 2 } });

  const pipedObs = rs.water_access
    .filter(r => r.state === "All India" && r.sector === "All")
    .filter(r => r.sub_indicator === "Piped Water into Dwelling or Yard/plot")
    .map(r => ({ date: "2020-21", value: num(r.value) }))
    .filter(r => Number.isFinite(r.value));
  if (pipedObs.length) await emitSeries({ id: "nss78_water_piped", title: "Piped water into dwelling or yard — All India", unit: "%", observations: pipedObs, metadata: { source: "NSS78", indicator: 2 } });

  const latObs = rs.latrine_exclusive
    .filter(r => r.state === "All India" && r.sector === "All")
    .filter(r => r.sub_indicator?.includes("exclusive access to improved latrine"))
    .map(r => ({ date: "2020-21", value: num(r.value) }))
    .filter(r => Number.isFinite(r.value));
  if (latObs.length) await emitSeries({ id: "nss78_latrine", title: "Exclusive access to improved latrine", unit: "%", observations: latObs, metadata: { source: "NSS78", indicator: 4 } });

  // Mobile phone by gender (gender IS available for ind 6)
  for (const [genderVal, genderLabel] of [["Male", "male"], ["Female", "female"]]) {
    const mObs = rs.mobile_use
      .filter(r => r.state === "All India" && r.gender === genderVal && r.sector === "All")
      .filter(r => r.sub_indicator?.includes("use of mobile phone"))
      .map(r => ({ date: "2020-21", value: num(r.value) }))
      .filter(r => Number.isFinite(r.value));
    if (mObs.length) await emitSeries({ id: `nss78_mobile_${genderLabel}`, title: `Mobile phone usage — ${genderVal}`, unit: "%", observations: mObs, metadata: { source: "NSS78", indicator: 6 } });
  }
} catch(e) { console.warn("NSS78 error:", e.message); }

// ==== NSS79: Literacy, financial inclusion ====
console.log("\nFetching NSS79...");
try {
  for (const [ind, key] of [[1, "literacy"], [5, "secondary_edu"], [15, "borrowers"]]) {
    const r = await fetchNss79(ind);
    const rows = r.data || [];
    await writeSnapshot(SOURCE, `nss79.indicator_${ind}`, r);
    console.log(`  NSS79 ${ind}: ${rows.length} rows`);

    for (const gender of ["Male", "Female", "Person"]) {
      const allR = rows.filter(r => r.state === "All India" && r.gender === gender && r.sector === "All");
      const obs = allR.map(r => ({ date: "2022-23", value: num(r.value) })).filter(r => Number.isFinite(r.value));
      if (obs.length) {
        let label = { 1: "literacy", 5: "secondary_edu", 15: "borrowers" }[ind];
        await emitSeries({ id: `nss79_${label}_${gender}`, title: `NSS79 ${key} — ${gender}`, unit: "%", observations: obs, metadata: { source: "NSS79", indicator: ind } });
      }
    }
  }
} catch(e) { console.warn("NSS79 error:", e.message); }

// ==== NSS80: Mobile ownership, internet, online banking ====
console.log("\nFetching NSS80...");
try {
  for (const [ind, key, surCode] of [[3, "own_mobile", 1], [5, "internet_use", 1], [15, "online_banking", 1]]) {
    const r = await fetchNss80(ind, surCode);
    const rows = r.data || [];
    await writeSnapshot(SOURCE, `nss80.indicator_${ind}`, r);
    console.log(`  NSS80 ${ind}: ${rows.length} rows`);

    for (const gender of ["Male", "Female"]) {
      const allR = rows.filter(r => r.state === "All-India" && r.gender === gender && r.sector === "All");
      const obs = allR.map(r => ({ date: "2025", value: num(r.value) })).filter(r => Number.isFinite(r.value));
      if (obs.length) {
        await emitSeries({ id: `nss80_${key}_${gender}`, title: `NSS80 ${key.replace(/_/g, " ")} — ${gender}`, unit: "%", observations: obs, metadata: { source: "NSS80", indicator: ind } });
      }
    }
  }
} catch(e) { console.warn("NSS80 error:", e.message); }

await writeSourceManifest("mospi-nss", manifest);
console.log(`\nWrote ${manifest.length} NSS artifacts.`);
