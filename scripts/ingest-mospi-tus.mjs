// Ingest MOSPI TUS (Time Use Survey) for "Why are Indian women missing from paid work?"
// Fetches indicators via the string-based indicator_code parameter, snapshots raw
// payloads, then emits clean series artifacts:
//   - Time spent in unpaid/paid/other activities by gender & sector         [series]
//   - Time spent by gender × marital status                                 [series]
//   - Time spent by gender × education level                                [series]
//   - Unpaid domestic + caregiving breakdown                                [series]
//   - Activity participation rates by gender                                [series]
// See memory: indica-women-work-tus-ingest.
import { loadEnv } from "./env.mjs";
import { fetchTus } from "./adapters/mospi.mjs";
import {
  createSeriesArtifact,
  createTableArtifact,
  writeSeriesArtifact,
  writeSnapshot,
  writeSourceManifest
} from "./core/artifacts.mjs";

loadEnv();
const fetchedAt = new Date().toISOString();
const SOURCE = "mospi";
const srcUrl = (ind) =>
  `https://api.mospi.gov.in/api/tus/getTusRecords?indicator_code=${encodeURIComponent(ind)}&Format=JSON`;

const num = (v) => (v === null || v === undefined || v === "" || v === "-" ? null : Number(v));

// ---- Indicator code constants ----
const IND = {
  paidUnpaidMajorPct:    "Percentage of persons in unpaid activities, paid activities and other activities as major activity (age 6 years and above)",
  paidUnpaidMajorMinP:   "Minutes spent in a day on an average per participant in unpaid activities, paid activities and other activtities as major activity (age 6 years and above)",
  paidUnpaidMajorMinPer: "Minutes spent in a day on an average per person in unpaid activities, paid activities and other activtities as a major activity (age 6 years and above)",
  paidUnpaidAnyPct:      "Percentage of persons in unpaid activities, paid activities and other activtities irrespective of major activity (age 6 years and above)",
  paidUnpaidAnyMinPer:   "Minutes spent in a day on an average per person in unpaid activities, paid activities and other activtities irrespective of major activity (age 6 years and above)",
  paidUnpaidAnyMinP:     "Minutes spent in a day on an average per participant in unpaid activities, paid activities and other activtities irrespective of major activity (age 6 years and above)",

  maritalMajorPct:       "Percentage of persons in different activity as major activity in a day for each marital status of the person (age 6 years and above)",
  maritalAnyPct:         "Percentage of persons in different activity in a day irrespective of major activity for each marital status of the person (age 6 years and above)",
  maritalAnyMinP:        "Minutes spent in a day on an average per participant in different activity irrespective of major activity for each marital status of the person (age 6 years and above)",

  eduMajorPct:           "Percentage of persons in different activity where the activity was a major activity for different level of education (age 6 years and above)",
  eduAnyPct:             "Percentage of persons in different activity irrespective of major activity for different level of education (age 6 years and above)",
  eduAnyMinP:            "Minutes spent in a day on an average per participant in different activity irrespective of major activity for different level of education (age 6 years and above)",

  socialMajorPct:        "Percentage of persons in different activity as major activity in a day for different household social groups ",
  socialAnyPct:          "Percentage of persons in different activity irrespective of major activity in a day for different household social groups",

  caregiving:            "Percentage of time spent in a day per person in Unpaid domestic services for household members and Unpaid caregiving services for household members by sex, age group and usual principal activity status (age 6 years and above)",
};

const manifest = [];

async function emitSeries({ id, title, unit, observations, metadata = {} }) {
  if (!observations.length || !observations.some((o) => Number.isFinite(o.value))) {
    console.warn(`  skip ${id}: no finite observations`);
    return;
  }
  const artifact = createSeriesArtifact({
    indicatorId: `work.tus.${id}`,
    title,
    sourceId: SOURCE,
    sourceIndicatorId: id,
    sourceUrl: metadata.sourceUrl || srcUrl(metadata.ind || IND.paidUnpaidAnyMinPer),
    unit,
    frequency: "annual",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: { dataset: "TUS", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.tus.${id}`, artifact });
  manifest.push({
    status: "ready",
    indicatorId: `work.tus.${id}`,
    sourceIndicatorId: id,
    artifact: path,
    fetchedAt,
    observations: observations.length
  });
  console.log(`  series work.tus.${id} (${observations.length} obs)`);
}

async function emitTable({ id, title, unit, rows, dimensions, metadata = {} }) {
  if (!rows.length) {
    console.warn(`  skip table ${id}: no rows`);
    return;
  }
  const artifact = createTableArtifact({
    indicatorId: `work.tus.${id}`,
    title,
    sourceId: SOURCE,
    sourceIndicatorId: id,
    sourceUrl: metadata.sourceUrl || srcUrl(metadata.ind || IND.paidUnpaidAnyMinPer),
    unit,
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    rows,
    dimensions: dimensions || Object.keys(rows[0]),
    metadata: { dataset: "TUS", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.tus.${id}`, artifact });
  manifest.push({
    status: "ready",
    indicatorId: `work.tus.${id}`,
    sourceIndicatorId: id,
    artifact: path,
    fetchedAt,
    rows: rows.length
  });
  console.log(`  table work.tus.${id} (${rows.length} rows)`);
}

// ---- Fetch key indicators ----
// Fetch just the indicators we need for the article
const indicatorsToFetch = [
  { key: "paidUnpaidAnyMinPer", ind: IND.paidUnpaidAnyMinPer },
  { key: "paidUnpaidMajorPct",  ind: IND.paidUnpaidMajorPct },
  { key: "paidUnpaidAnyPct",    ind: IND.paidUnpaidAnyPct },
  { key: "maritalAnyPct",       ind: IND.maritalAnyPct },
  { key: "maritalAnyMinP",      ind: IND.maritalAnyMinP },
  { key: "eduAnyPct",           ind: IND.eduAnyPct },
  { key: "eduAnyMinP",          ind: IND.eduAnyMinP },
  { key: "caregiving",          ind: IND.caregiving },
];

const raw = {};
for (const { key, ind } of indicatorsToFetch) {
  console.log(`Fetching TUS: ${key}`);
  const payload = await fetchTus({ indicatorCode: ind });
  raw[key] = payload.data || [];
  await writeSnapshot(SOURCE, `tus.${key}`, payload);
  console.log(`  TUS ${key}: ${raw[key].length} rows`);
}

// ---- 1. Time per person in unpaid/paid/other by gender × sector (indicator #10) ----
for (const gender of ["Male", "Female"]) {
  for (const sector of ["Rural", "Urban", "Rural+Urban"]) {
    for (const [activityType, activityLabel] of [
      ["Unpaid domestic services for household members", "unpaid_domestic"],
      ["Unpaid caregiving services for household members", "unpaid_care"],
      ["Employment and related activities", "paid_work"],
    ]) {
      const obs = raw.paidUnpaidAnyMinPer
        .filter((r) =>
          r.state === "All India" &&
          r.gender === gender &&
          r.sector === sector &&
          r.icatus_activity === activityType &&
          r.day_of_week === "All Day" &&
          r.age_group === "6 years & above"
        )
        .map((r) => ({ date: r.year, value: num(r.value) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (!obs.length) continue;
      const sectorCode = sector === "Rural+Urban" ? "all" : sector.toLowerCase();
      const genderCode = gender.toLowerCase();
      await emitSeries({
        id: `time_${activityLabel}_${genderCode}_${sectorCode}`,
        title: `Minutes per person — ${activityType} — ${gender}, ${sector}`,
        unit: "minutes/day per person",
        observations: obs,
        metadata: { ind: IND.paidUnpaidAnyMinPer, activityType, gender, sector }
      });
    }
  }
}

// ---- 2. Activity participation rates by gender — indicator #9 (any activity) ----
for (const gender of ["Male", "Female"]) {
  const sector = "Rural+Urban";
  for (const [activityType, activityLabel] of [
    ["Unpaid domestic services for household members", "unpaid_domestic"],
    ["Unpaid caregiving services for household members", "unpaid_care"],
    ["Employment and related activities", "paid_work"],
  ]) {
    const obs = raw.paidUnpaidAnyPct
      .filter((r) =>
        r.state === "All India" &&
        r.gender === gender &&
        r.sector === sector &&
        r.icatus_activity === activityType &&
        r.day_of_week === "All Day" &&
        r.age_group === "6 years & above"
      )
      .map((r) => ({ date: r.year, value: num(r.value) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!obs.length) continue;
    await emitSeries({
      id: `pct_${activityLabel}_${gender.toLowerCase()}`,
      title: `% participating — ${activityType} — ${gender}`,
      unit: "% of persons (age 6+)",
      observations: obs,
      metadata: { ind: IND.paidUnpaidAnyPct, activityType, gender }
    });
  }
}

// ---- 3. Time by gender × marital status — indicator #19 ----
// marital status values: "Never married", "Currently married", "Widowed", "Divorced/Separated"
for (const gender of ["Male", "Female"]) {
  for (const [activityType, activityLabel] of [
    ["Unpaid domestic services for household members", "unpaid_domestic"],
    ["Unpaid caregiving services for household members", "unpaid_care"],
    ["Employment and related activities", "paid_work"],
  ]) {
    const rows = raw.maritalAnyMinP
      .filter((r) =>
        r.state === "All India" &&
        r.gender === gender &&
        r.sector === "Rural+Urban" &&
        r.icatus_activity === activityType &&
        r.day_of_week === "All Day" &&
        r.age_group === "6 years & above"
      )
      .map((r) => ({ marital_status: r.marital_status, date: r.year, value: num(r.value) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.marital_status.localeCompare(b.marital_status));

    if (!rows.length) continue;
    await emitTable({
      id: `time_marital_${activityLabel}_${gender.toLowerCase()}`,
      title: `Minutes per participant — ${activityType} by marital status — ${gender}`,
      unit: "minutes/day per participant",
      rows,
      dimensions: ["marital_status", "date", "value"],
      metadata: { ind: IND.maritalAnyMinP, activityType, gender }
    });
  }
}

// ---- 4. Participation rates by marital status — indicator #18 ----
for (const gender of ["Male", "Female"]) {
  for (const [activityType, activityLabel] of [
    ["Unpaid domestic services for household members", "unpaid_domestic"],
    ["Unpaid caregiving services for household members", "unpaid_care"],
    ["Employment and related activities", "paid_work"],
  ]) {
    const rows = raw.maritalAnyPct
      .filter((r) =>
        r.state === "All India" &&
        r.gender === gender &&
        r.sector === "Rural+Urban" &&
        r.icatus_activity === activityType &&
        r.day_of_week === "All Day" &&
        r.age_group === "6 years & above"
      )
      .map((r) => ({ marital_status: r.marital_status, date: r.year, value: num(r.value) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.marital_status.localeCompare(b.marital_status));

    if (!rows.length) continue;
    await emitTable({
      id: `pct_marital_${activityLabel}_${gender.toLowerCase()}`,
      title: `% participating — ${activityType} by marital status — ${gender}`,
      unit: "% of persons (age 6+)",
      rows,
      dimensions: ["marital_status", "date", "value"],
      metadata: { ind: IND.maritalAnyPct, activityType, gender }
    });
  }
}

// ---- 5. Activity by education level — indicator #27 (minutes per participant) ----
for (const gender of ["Male", "Female"]) {
  for (const [activityType, activityLabel] of [
    ["Unpaid domestic services for household members", "unpaid_domestic"],
    ["Unpaid caregiving services for household members", "unpaid_care"],
    ["Employment and related activities", "paid_work"],
  ]) {
    const rows = raw.eduAnyMinP
      .filter((r) =>
        r.state === "All India" &&
        r.gender === gender &&
        r.sector === "Rural+Urban" &&
        r.icatus_activity === activityType &&
        r.day_of_week === "All Day" &&
        r.age_group === "6 years & above"
      )
      .map((r) => ({ education: r.education_level, date: r.year, value: num(r.value) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.education.localeCompare(b.education));

    if (!rows.length) continue;
    await emitTable({
      id: `time_edu_${activityLabel}_${gender.toLowerCase()}`,
      title: `Minutes per participant — ${activityType} by education — ${gender}`,
      unit: "minutes/day per participant",
      rows,
      dimensions: ["education", "date", "value"],
      metadata: { ind: IND.eduAnyMinP, activityType, gender }
    });
  }
}

// ---- 6. Caregiving breakdown — indicator #42 ----
const careRows = raw.caregiving
  .filter((r) => r.state === "All India" && r.gender === "Person" && r.sector === "Rural+Urban")
  .filter((r) => r.day_of_week === "All Day" || r.day_of_week === undefined);
for (const gender of ["Male", "Female"]) {
  const rows = raw.caregiving
    .filter((r) =>
      r.state === "All India" &&
      r.gender === gender &&
      r.sector === "Rural+Urban"
    )
    .filter((r) => r.day_of_week === "All Day" || r.day_of_week === undefined)
    .map((r) => {
      // Normalise columns — caregiving data has: activity_type, age_group, usual_principal_activity_status
      const cols = { gender, date: r.year };
      for (const col of ["activity_type", "age_group", "usual_principal_activity_status"]) {
        if (r[col] !== undefined) cols[col] = r[col];
      }
      cols.value = num(r.value);
      return cols;
    })
    .filter((r) => Number.isFinite(r.value))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  if (!rows.length) continue;
  await emitTable({
    id: `caregiving_${gender.toLowerCase()}`,
    title: `Caregiving time breakdown — ${gender}`,
    unit: "minutes/day per person",
    rows,
    dimensions: Object.keys(rows[0]),
    metadata: { ind: IND.caregiving, gender }
  });
}

await writeSourceManifest("mospi-tus", manifest);
console.log(`\nWrote ${manifest.length} TUS artifacts.`);
