import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const nfhs = JSON.parse(await readFile("data/nfhs6/nfhs6_clean.json", "utf8"));
const nfhsSourceUrl = "https://rchiips.org/nfhs/factsheet_NFHS-6.shtml";

const stateAreas = Object.entries(nfhs.areas).filter(([area]) => area !== "India");

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function spreadRow(label, indicatorNumber) {
  const rows = stateAreas
    .map(([area, values]) => ({ area, value: finite(values[indicatorNumber]?.total) }))
    .filter((row) => row.value !== null)
    .sort((a, b) => a.value - b.value);
  const low = rows[0];
  const high = rows.at(-1);
  if (!low || !high) return null;
  return {
    label,
    value: +(high.value - low.value).toFixed(1),
    group: "state spread",
    lowArea: low.area,
    lowValue: low.value,
    highArea: high.area,
    highValue: high.value,
    unit: "percentage points"
  };
}

function ruralUrbanRow(label, indicatorNumber, worseSide = "higher") {
  const values = nfhs.areas.India[indicatorNumber] || {};
  const rural = finite(values.rural);
  const urban = finite(values.urban);
  if (rural === null || urban === null) return null;
  const gap = +(Math.abs(rural - urban)).toFixed(1);
  const higher = rural > urban ? "rural" : "urban";
  return {
    label,
    value: gap,
    group: `${higher} higher`,
    rural,
    urban,
    higher,
    worseSide,
    unit: "percentage points"
  };
}

const stateSpreadRows = [
  spreadRow("Stunting", "69"),
  spreadRow("Wasting", "70"),
  spreadRow("Underweight", "72"),
  spreadRow("Adequate diet", "68"),
  spreadRow("C-section births", "38"),
  spreadRow("Women overweight", "76"),
  spreadRow("Men high blood sugar", "83"),
  spreadRow("Health insurance", "7")
].filter(Boolean);

const ruralUrbanRows = [
  ruralUrbanRow("C-section births", "38"),
  ruralUrbanRow("4+ antenatal visits", "30"),
  ruralUrbanRow("IFA for 180+ days", "33"),
  ruralUrbanRow("Stunting", "69"),
  ruralUrbanRow("Underweight", "72"),
  ruralUrbanRow("Men high blood sugar", "83"),
  ruralUrbanRow("Health insurance", "7")
].filter(Boolean);

const artifacts = [
  createTableArtifact({
    indicatorId: "health.transition.nfhs.state_spread",
    title: "NFHS-6 state spread in health indicators",
    sourceId: "nfhs",
    sourceIndicatorId: "NFHS-6 state fact-sheet indicators 7, 38, 68, 69, 70, 72, 76, 83",
    sourceUrl: nfhsSourceUrl,
    unit: "percentage-point spread",
    geography: { type: "subnational", id: "IN-states", name: "India states and union territories" },
    fetchedAt,
    rows: stateSpreadRows,
    dimensions: ["indicator", "state"],
    metadata: {
      method: "For each selected NFHS-6 indicator, subtract the lowest state/UT total value from the highest state/UT total value. Manipur is not included in the local NFHS-6 artifact."
    }
  }),
  createTableArtifact({
    indicatorId: "health.transition.nfhs.rural_urban_gaps",
    title: "NFHS-6 rural-urban gaps in health indicators",
    sourceId: "nfhs",
    sourceIndicatorId: "NFHS-6 India rural and urban fact-sheet values",
    sourceUrl: nfhsSourceUrl,
    unit: "percentage-point gap",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    rows: ruralUrbanRows,
    dimensions: ["indicator", "residence"],
    metadata: {
      method: "Absolute rural-urban gap in NFHS-6 India fact-sheet values. Row metadata keeps the rural value, urban value, and which side is higher."
    }
  })
];

const manifest = [];
for (const artifact of artifacts) {
  const path = await writeSeriesArtifact({
    sourceId: artifact.sourceId,
    name: `nfhs.health-transition.${artifact.indicatorId.split(".").at(-1)}`,
    artifact
  });
  manifest.push({
    status: "ready",
    indicatorId: artifact.indicatorId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    artifact: path,
    rows: artifact.rows.length,
    fetchedAt
  });
  console.log(`${artifact.indicatorId} -> ${artifact.rows.length} rows`);
}

await writeSourceManifest("health-transition-nfhs-derived", manifest);
