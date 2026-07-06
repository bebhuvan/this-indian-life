// Ingest MOSPI GENDER statistics for "Why are Indian women missing from paid work?"
// Fetches numeric indicator_codes (1-147), snapshots raw payloads, emits cleaned series
// artifacts focused on women's work, education, literacy, and empowerment.
// See memory: indica-women-work-gender-ingest.
import { loadEnv } from "./env.mjs";
import { fetchGender } from "./adapters/mospi.mjs";
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
  `https://api.mospi.gov.in/api/gender/getGenderRecords?indicator_code=${ind}&Format=JSON`;

const num = (v) => (v === null || v === undefined || v === "" || v === "-" ? null : Number(v));

const manifest = [];

async function emitSeries({ id, title, unit, observations, metadata = {} }) {
  if (!observations.length || !observations.some((o) => Number.isFinite(o.value))) {
    console.warn(`  skip ${id}: no finite observations`);
    return;
  }
  const artifact = createSeriesArtifact({
    indicatorId: `people.gender.${id}`,
    title,
    sourceId: SOURCE,
    sourceIndicatorId: id,
    sourceUrl: metadata.sourceUrl || srcUrl(metadata.ind || 1),
    unit,
    frequency: "annual",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: { dataset: "GENDER", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.gender.${id}`, artifact });
  manifest.push({
    status: "ready",
    indicatorId: `people.gender.${id}`,
    sourceIndicatorId: id,
    artifact: path,
    fetchedAt,
    observations: observations.length
  });
  console.log(`  series people.gender.${id} (${observations.length} obs)`);
}

async function emitTable({ id, title, unit, rows, dimensions, metadata = {} }) {
  if (!rows.length) {
    console.warn(`  skip table ${id}: no rows`);
    return;
  }
  const artifact = createTableArtifact({
    indicatorId: `people.gender.${id}`,
    title,
    sourceId: SOURCE,
    sourceIndicatorId: id,
    sourceUrl: metadata.sourceUrl || srcUrl(metadata.ind || 1),
    unit,
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    rows,
    dimensions: dimensions || Object.keys(rows[0]),
    metadata: { dataset: "GENDER", ...metadata }
  });
  const path = await writeSeriesArtifact({ sourceId: SOURCE, name: `${SOURCE}.IN.gender.${id}`, artifact });
  manifest.push({
    status: "ready",
    indicatorId: `people.gender.${id}`,
    sourceIndicatorId: id,
    artifact: path,
    fetchedAt,
    rows: rows.length
  });
  console.log(`  table people.gender.${id} (${rows.length} rows)`);
}

// ---- Key GENDER indicators for the article ----
// Lower numbers = demographics, labour, education; higher numbers = crime/empowerment
// We'll fetch a targeted subset
const indicatorsToFetch = [
  // LFPR by gender (indicator 40 area: labour/work)
  40,
  // WPR by gender  
  41,
  // Unemployment rate
  42,
  // Worker status composition
  43,
  // Female literacy
  // Wages / earnings
  // Sex ratio
  // We'll discover exact codes by probing. For now get a representative set.
];

const raw = {};
for (const ind of indicatorsToFetch) {
  console.log(`Fetching GENDER indicator ${ind}`);
  try {
    const payload = await fetchGender({ indicatorCode: ind });
    raw[ind] = payload.data || [];
    await writeSnapshot(SOURCE, `gender.indicator_${ind}`, payload);
    console.log(`  GENDER ${ind}: ${raw[ind].length} rows`);
    if (raw[ind].length > 0) {
      console.log(`  sample row:`, JSON.stringify(raw[ind][0]).slice(0, 200));
      console.log(`  fields:`, Object.keys(raw[ind][0]).join(", "));
    }
  } catch (err) {
    console.warn(`  GENDER ${ind} failed: ${err.message}`);
    raw[ind] = [];
  }
}

// For now emit what we got — more targeted processing will follow after we see field names
for (const ind of indicatorsToFetch) {
  const rows = raw[ind];
  if (!rows.length) continue;

  // Try to emit as time-series if year field exists
  if (rows[0].year) {
    const allIndia = rows.filter((r) => {
      const st = r.state || r["state/UT"] || "";
      return st === "All India";
    });
    for (const gender of ["Male", "Female", "Person"]) {
      const obs = allIndia
        .filter((r) => (r.gender || "") === gender)
        .map((r) => ({ date: String(r.year), value: num(r.value) }))
        .filter((r) => Number.isFinite(r.value))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (obs.length >= 2) {
        const label = (rows[0].indicator || rows[0].sub_indicator || `indicator_${ind}`).slice(0, 60);
        await emitSeries({
          id: `ind${ind}_${gender.toLowerCase()}`,
          title: `${label} — ${gender}`,
          unit: rows[0].unit || "",
          observations: obs,
          metadata: { ind }
        });
      }
    }
  }

  // Emit as table for latest year
  const latestYear = [...new Set(rows.map((r) => r.year))].sort().at(-1);
  if (latestYear) {
    const latest = rows
      .filter((r) => r.year === latestYear)
      .map((r) => {
        const flat = {};
        for (const [k, v] of Object.entries(r)) flat[k] = v;
        return flat;
      });
    if (latest.length > 1 && latest.length <= 200) {
      await emitTable({
        id: `ind${ind}_latest`,
        title: `${rows[0].indicator || `indicator ${ind}`} — ${latestYear}`,
        unit: rows[0].unit || "",
        rows: latest,
        dimensions: Object.keys(latest[0]),
        metadata: { ind, year: latestYear }
      });
    }
  }
}

await writeSourceManifest("mospi-gender", manifest);
console.log(`\nWrote ${manifest.length} GENDER artifacts.`);
