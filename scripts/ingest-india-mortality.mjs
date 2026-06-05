import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, sourceSlug, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { srsSeries, mccdCauseGroups, srscodCauses, srscodBroadGroups, srscodSexBroad } from "./registry/v1-indicators.mjs";

// India's own vital registration (SRS) + certified cause-of-death (MCCD), extracted
// from official RGI PDF reports into auditable JSON under data/manual/. We re-shape
// those into the standard series artifacts so the viz layer treats them like any
// other source. Counts/shares carry full page-level provenance in the artifact.
const fetchedAt = new Date().toISOString();

async function readManual(file) {
  return JSON.parse(await readFile(`data/manual/${file}`, "utf8"));
}

// ---- CRS: death-registration and medical-attention funnel, 2023 ----
async function ingestCrs() {
  const data = await readManual("crs-2023.json");
  const mccd = await readManual("mccd-2023.json");
  const registeredDeaths = data.deathRegistration.registeredDeaths;
  const estimatedDeaths = Math.round(registeredDeaths / (data.deathRegistration.deathRegistrationLevelPct / 100));
  const rows = [
    {
      step: "Estimated deaths",
      value: estimatedDeaths,
      shareOfEstimatedDeathsPct: 100,
      interpretation: "Estimated deaths used as the denominator for CRS death-registration level"
    },
    {
      step: "Registered deaths",
      value: registeredDeaths,
      shareOfEstimatedDeathsPct: data.deathRegistration.deathRegistrationLevelPct,
      interpretation: "Deaths registered in the Civil Registration System"
    },
    {
      step: "Institutional deaths",
      value: Math.round(registeredDeaths * data.medicalAttentionAtDeath.institutionalDeathSharePct / 100),
      shareOfEstimatedDeathsPct: Number((data.deathRegistration.deathRegistrationLevelPct * data.medicalAttentionAtDeath.institutionalDeathSharePct / 100).toFixed(1)),
      interpretation: "Registered deaths that occurred in institutions"
    },
    {
      step: "Medically certified cause",
      value: mccd.coverage.medicallyCertifiedDeaths2023,
      shareOfEstimatedDeathsPct: Number((data.deathRegistration.deathRegistrationLevelPct * mccd.coverage.certifiedSharePct / 100).toFixed(1)),
      interpretation: "Registered deaths medically certified by cause under MCCD"
    },
    {
      step: "No medical attention at death",
      value: Math.round(registeredDeaths * data.medicalAttentionAtDeath.noMedicalAttentionSharePct / 100),
      shareOfEstimatedDeathsPct: Number((data.deathRegistration.deathRegistrationLevelPct * data.medicalAttentionAtDeath.noMedicalAttentionSharePct / 100).toFixed(1)),
      interpretation: "Registered deaths where the deceased received no medical attention at death"
    }
  ];
  const artifact = createTableArtifact({
    indicatorId: "heat.counting.death_certification_funnel",
    title: "How far death registration gets before medical cause is known",
    sourceId: "crs-mccd",
    sourceIndicatorId: "CRS 2023 death registration + MCCD 2023 medical certification",
    sourceUrl: data.sourceUrl,
    unit: "deaths",
    fetchedAt,
    rows,
    metadata: {
      crsPublisher: data.publisher,
      crsSourceUrl: data.sourceUrl,
      mccdSourceUrl: mccd.sourceUrl,
      year: data.year,
      registeredDeaths,
      deathRegistrationLevelPct: data.deathRegistration.deathRegistrationLevelPct,
      institutionalDeathSharePct: data.medicalAttentionAtDeath.institutionalDeathSharePct,
      noMedicalAttentionSharePct: data.medicalAttentionAtDeath.noMedicalAttentionSharePct,
      medicallyCertifiedShareOfRegisteredDeathsPct: mccd.coverage.certifiedSharePct,
      note: "This is a counting-system funnel for scale and visibility. CRS registration, institutional death occurrence, medical attention at death, and MCCD cause certification are related but distinct measures."
    }
  });
  const path = await writeSeriesArtifact({ sourceId: "crs-mccd", name: "crs-mccd.IN.heat_death_certification_funnel", artifact });
  const snapshot = await writeSnapshot("crs-mccd", "death-certification-funnel-2023", { crs: data, mccdCoverage: mccd.coverage, rows });
  console.log(`crs-mccd funnel ${rows.length} rows · registered deaths ${registeredDeaths.toLocaleString()}`);
  return { status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: artifact.sourceIndicatorId, artifact: path, snapshot: snapshot.path, rawHash: snapshot.hash, fetchedAt };
}

// ---- SRS: birth/death/IMR + TFR, India national, 2018-2024 ----
async function ingestSrs() {
  const data = await readManual("srs-2024.json");
  const manifest = [];
  for (const item of srsSeries) {
    const series = data.series[item.key];
    if (!series) {
      manifest.push({ status: "failed", indicatorId: item.id, error: `key ${item.key} missing` });
      continue;
    }
    // Each series carries its own year axis (the SRS trend tables span different ranges).
    const axis = series.years ?? series.periods;
    const observations = axis.map((period, i) => ({ date: String(period), value: series.values[i] }));
    const artifact = createSeriesArtifact({
      indicatorId: item.id,
      title: item.title,
      sourceId: "srs",
      sourceIndicatorId: item.key,
      sourceUrl: data.sourceUrl,
      unit: series.unit,
      frequency: "annual",
      fetchedAt,
      observations,
      metadata: { publisher: data.publisher, sourceFile: data.sourceFile, extractedFrom: data.extractedFrom, note: data.note, label: series.label }
    });
    const path = await writeSeriesArtifact({ sourceId: "srs", name: `srs.IN.${sourceSlug(item.id)}`, artifact });
    const snapshot = await writeSnapshot("srs", item.key, { source: data.source, years: axis, values: series.values });
    const latest = observations.at(-1);
    manifest.push({ status: "ready", indicatorId: item.id, sourceIndicatorId: item.key, artifact, snapshot: snapshot.path, rawHash: snapshot.hash, fetchedAt, observations: observations.length, latestYear: latest.date, latestValue: latest.value });
    console.log(`srs ${sourceSlug(item.id)} ${observations.length} obs · ${latest.date}=${latest.value}`);
  }
  await writeSourceManifest("srs", manifest);
  return manifest.filter((m) => m.status === "ready").length;
}

// ---- MCCD: certified cause-group shares, 2023 snapshot ----
async function ingestMccd() {
  const data = await readManual("mccd-2023.json");
  const stateArtifact = JSON.parse(await readFile("data/series/era5.IN.state_warming.json", "utf8"));
  const byLabel = new Map(data.causeGroups.map((group) => [group.label, group]));
  const manifest = [];
  for (const item of mccdCauseGroups) {
    const group = byLabel.get(item.label);
    if (!group) {
      manifest.push({ status: "failed", indicatorId: item.id, error: `cause group "${item.label}" missing` });
      continue;
    }
    const observations = [{ date: String(data.year), value: group.sharePct }];
    const artifact = createSeriesArtifact({
      indicatorId: item.id,
      title: `${group.label} — share of certified deaths`,
      sourceId: "mccd",
      sourceIndicatorId: group.icd,
      sourceUrl: data.sourceUrl,
      unit: "% of medically certified deaths",
      frequency: "annual",
      fetchedAt,
      observations,
      metadata: { publisher: data.publisher, sourceFile: data.sourceFile, extractedFrom: data.extractedFrom, label: group.label, icd: group.icd, deaths: group.number, year: data.year, coverageNote: data.coverage.note, certifiedSharePct: data.coverage.certifiedSharePct }
    });
    const path = await writeSeriesArtifact({ sourceId: "mccd", name: `mccd.IN.${sourceSlug(item.id)}`, artifact });
    manifest.push({ status: "ready", indicatorId: item.id, sourceIndicatorId: group.icd, artifact, fetchedAt, deaths: group.number, sharePct: group.sharePct });
    console.log(`mccd ${sourceSlug(item.id)} ${data.year} ${group.sharePct}% (${group.number.toLocaleString()})`);
  }
  if (data.stateCertification?.byState?.length) {
    const byName = new Map(data.stateCertification.byState.map((row) => [row.state, row]));
    const regions = stateArtifact.regions.map((region) => {
      const row = byName.get(region.name);
      return {
        name: region.name,
        value: row ? row.certifiedSharePct : null,
        path: region.path,
        registeredDeaths: row?.registeredDeaths ?? null,
        medicallyCertifiedDeaths: row?.medicallyCertifiedDeaths ?? null
      };
    });
    const values = regions.map((region) => region.value).filter((value) => value !== null);
    const choropleth = {
      schemaVersion: 1,
      artifactType: "choropleth",
      indicatorId: "heat.mccd.certified_deaths_by_state",
      title: "Medical certification of deaths by state",
      sourceId: "mccd",
      sourceIndicatorId: "Statement 2.8: Ranking of States/UTs in Medical Certification of Cause of Death, 2023",
      sourceUrl: data.sourceUrl,
      unit: "% of registered deaths medically certified",
      geography: { type: "subnational", id: "IND-states", name: "India states" },
      fetchedAt,
      viewBox: stateArtifact.viewBox,
      min: 0,
      max: 100,
      regions,
      metadata: {
        publisher: data.publisher,
        sourceFile: data.sourceFile,
        extractedFrom: data.stateCertification.extractedFrom,
        nationalCertifiedSharePct: data.coverage.certifiedSharePct,
        registeredDeaths2023: data.coverage.registeredDeaths2023,
        medicallyCertifiedDeaths2023: data.coverage.medicallyCertifiedDeaths2023,
        note: data.stateCertification.note
      }
    };
    const path = await writeSeriesArtifact({ sourceId: "mccd", name: "mccd.IN.heat_mccd_certified_deaths_by_state", artifact: choropleth });
    manifest.push({ status: "ready", indicatorId: choropleth.indicatorId, sourceIndicatorId: choropleth.sourceIndicatorId, artifact: path, fetchedAt, regions: regions.length, matched: values.length });
    console.log(`mccd state certification choropleth ${values.length}/${regions.length} states`);
  }
  const snapshot = await writeSnapshot("mccd", "cause-groups-2023", data);
  manifest.push({ status: "meta", snapshot: snapshot.path, rawHash: snapshot.hash, fetchedAt });
  await writeSourceManifest("mccd", manifest);
  return manifest.filter((m) => m.status === "ready").length;
}

// ---- SRS-CoD: nationally representative cause-of-death, 2022-2024 snapshot ----
async function ingestSrsCod() {
  const data = await readManual("srs-cod-2022-2024.json");
  const byLabel = new Map(data.leadingCauses.map((cause) => [cause.label, cause]));
  const manifest = [];
  const emit = async (id, title, sharePct, meta) => {
    const observations = [{ date: "2024", value: sharePct }];
    const artifact = createSeriesArtifact({
      indicatorId: id,
      title,
      sourceId: "srscod",
      sourceIndicatorId: id.split(".").pop(),
      sourceUrl: data.sourceUrl,
      unit: "% of all deaths",
      frequency: "annual",
      fetchedAt,
      observations,
      metadata: { publisher: data.publisher, sourceFile: data.sourceFile, period: data.period, method: data.method, ...meta }
    });
    const artifactPath = await writeSeriesArtifact({ sourceId: "srscod", name: `srscod.IN.${sourceSlug(id)}`, artifact });
    manifest.push({ status: "ready", indicatorId: id, sourceIndicatorId: id.split(".").pop(), artifact: artifactPath, fetchedAt, sharePct });
  };
  for (const item of srscodCauses) {
    const cause = byLabel.get(item.label);
    if (!cause) { manifest.push({ status: "failed", indicatorId: item.id, error: `cause "${item.label}" missing` }); continue; }
    await emit(item.id, `${cause.label} — share of all deaths`, cause.sharePct, { label: cause.label, male: cause.male, female: cause.female });
    console.log(`srscod ${sourceSlug(item.id)} ${cause.sharePct}%`);
  }
  for (const item of srscodBroadGroups) {
    const value = data.broadGroups.person[item.key];
    if (value == null) { manifest.push({ status: "failed", indicatorId: item.id, error: `broad "${item.key}" missing` }); continue; }
    await emit(item.id, `${item.label} diseases — share of all deaths`, value, { label: item.label, rural: data.broadGroups.rural?.[item.key], urban: data.broadGroups.urban?.[item.key] });
    console.log(`srscod ${sourceSlug(item.id)} ${value}%`);
  }
  for (const item of srscodSexBroad) {
    const value = data.broadGroups[item.sex]?.[item.key];
    if (value == null) { manifest.push({ status: "failed", indicatorId: item.id, error: `${item.sex} "${item.key}" missing` }); continue; }
    await emit(item.id, `${item.label} — share of ${item.sex} deaths`, value, { label: item.label, sex: item.sex });
    console.log(`srscod ${sourceSlug(item.id)} ${value}%`);
  }
  const snapshot = await writeSnapshot("srscod", "cause-of-death-2022-2024", data);
  manifest.push({ status: "meta", snapshot: snapshot.path, rawHash: snapshot.hash, fetchedAt });
  await writeSourceManifest("srscod", manifest);
  return manifest.filter((m) => m.status === "ready").length;
}

const crsEntry = await ingestCrs();
const srsCount = await ingestSrs();
const mccdCount = await ingestMccd();
const srscodCount = await ingestSrsCod();
await writeSourceManifest("crs-mccd", [crsEntry]);
console.log(`\nWrote 1 CRS/MCCD + ${srsCount} SRS + ${mccdCount} MCCD + ${srscodCount} SRS-CoD series artifacts.`);
