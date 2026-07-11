// Ingest AISHE — All India Survey on Higher Education — for the "education paradox"
// in q.work.women. Fetches enrolment, GER, and GPI by gender, snapshots raw payloads,
// emits clean series artifacts showing women's rising education while FLFP fell.
import { loadEnv } from "./env.mjs";
import { fetchAishe } from "./adapters/mospi.mjs";
import {
  createSeriesArtifact,
  writeSeriesArtifact,
  writeSnapshot,
  writeSourceManifest
} from "./core/artifacts.mjs";

loadEnv();
const fetchedAt = new Date().toISOString();
const SOURCE = "mospi";
const srcUrl = (ind) =>
  `https://api.mospi.gov.in/api/aishe/getAisheRecords?indicator_code=${ind}&Format=JSON`;

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const manifest = [];

async function emitSeries({ id, title, unit, observations, metadata = {} }) {
  if (!observations.length || !observations.some((o) => Number.isFinite(o.value))) return;
  const artifact = createSeriesArtifact({
    indicatorId: `edu.aishe.${id}`,
    title, sourceId: SOURCE, sourceIndicatorId: id,
    sourceUrl: metadata.sourceUrl || srcUrl(metadata.ind || 3),
    unit, frequency: "annual",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt, observations,
    metadata: { dataset: "AISHE", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.aishe.${id}`, artifact });
  manifest.push({ status: "ready", indicatorId: `edu.aishe.${id}`, sourceIndicatorId: id, artifact: path, fetchedAt, observations: observations.length });
  console.log(`  series edu.aishe.${id} (${observations.length} obs)`);
}

// Fetch the key indicators
const raw = {};
for (const ind of [3, 5, 6, 7]) {
  console.log(`Fetching AISHE indicator ${ind}`);
  const payload = await fetchAishe({ indicatorCode: ind });
  raw[ind] = payload.data || [];
  await writeSnapshot(SOURCE, `aishe.indicator_${ind}`, payload);
  console.log(`  AISHE ${ind}: ${raw[ind].length} rows`);
}

// ---- 1. Enrolment by gender (indicator 3) ----
for (const gender of ["Male", "Female"]) {
  const obs = raw[3]
    .filter((r) => r.state === "All India" && r.gender === gender && r.education_level === "All")
    .map((r) => ({ date: r.year, value: num(r.value) / 100000 }))  // lakhs -> crores
    .sort((a, b) => a.date.localeCompare(b.date));
  if (obs.length >= 2) {
    await emitSeries({
      id: `enrolment_${gender.toLowerCase()}`,
      title: `Total enrolment in higher education — ${gender}`,
      unit: "crore students",
      observations: obs,
      metadata: { ind: 3, gender }
    });
  }
}

// ---- 2. GER by gender (indicator 5) ----
// Indicator 5 has PWD/Minority — but GER overall is in indicator 3? No, let me check.
// Actually indicator 5 has social_group dimension. Let's use it for "All" social group.
const gerObs = (gender) => raw[5]
  .filter((r) => r.state === "All India" && r.gender === gender && (r.social_group === "All" || r.social_group === "All Social Groups"))
  .map((r) => ({ date: r.year, value: num(r.value) }))
  .sort((a, b) => a.date.localeCompare(b.date));

for (const gender of ["Male", "Female"]) {
  const obs = gerObs(gender);
  if (obs.length >= 2) {
    await emitSeries({
      id: `ger_${gender.toLowerCase()}`,
      title: `Gross Enrolment Ratio (GER) in higher education — ${gender}`,
      unit: "%",
      observations: obs,
      metadata: { ind: 5, gender }
    });
  }
}

// ---- 3. GER by social category + gender (indicator 6) ----
for (const cat of ["All Categories", "Scheduled Caste", "Scheduled Tribe", "Other Backward Class"]) {
  for (const gender of ["Male", "Female"]) {
    const catSlug = cat.toLowerCase().replace(/[^a-z]+/g, "_");
    const obs = raw[6]
      .filter((r) => r.state === "All India" && r.gender === gender && r.social_category === cat)
      .map((r) => ({ date: r.year, value: num(r.value) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (obs.length >= 2) {
      await emitSeries({
        id: `ger_${catSlug}_${gender.toLowerCase()}`,
        title: `GER in higher education — ${cat}, ${gender}`,
        unit: "%",
        observations: obs,
        metadata: { ind: 6, social_category: cat, gender }
      });
    }
  }
}

// ---- 4. GPI (Gender Parity Index) (indicator 7) ----
for (const cat of ["All Categories", "Scheduled Caste", "Scheduled Tribe", "Other Backward Class"]) {
  const catSlug = cat.toLowerCase().replace(/[^a-z]+/g, "_");
  const obs = raw[7]
    .filter((r) => r.state === "All India" && r.social_category === cat)
    .map((r) => ({ date: r.year, value: num(r.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (obs.length >= 2) {
    await emitSeries({
      id: `gpi_${catSlug}`,
      title: `Gender Parity Index — ${cat}`,
      unit: "GPI (female GER / male GER)",
      observations: obs,
      metadata: { ind: 7, social_category: cat }
    });
  }
}

await writeSourceManifest("mospi-aishe", manifest);
console.log(`\nWrote ${manifest.length} AISHE artifacts.`);
