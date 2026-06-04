import { readFileSync, writeFileSync } from "node:fs";

const hces = JSON.parse(readFileSync("data/manual/hces-2023-24-mpce.json", "utf8"));
const allIndia = hces.rows.find((row) => row.state === "All-India");
if (!allIndia) throw new Error("Missing All-India row in HCES MPCE manual data.");

const lowest = hces.rows
  .filter((row) => row.state !== "All-India" && Number.isFinite(row.ruralMpce))
  .sort((a, b) => a.ruralMpce - b.ruralMpce)
  .slice(0, 10)
  .map((row) => ({
    label: row.state,
    value: row.ruralMpce,
    date: hces.year,
    urbanMpce: row.urbanMpce,
    ruralGini: row.ruralGini,
    urbanGini: row.urbanGini
  }));

const rows = [
  ...lowest,
  {
    label: "All-India rural average",
    value: allIndia.ruralMpce,
    date: hces.year,
    urbanMpce: allIndia.urbanMpce,
    ruralGini: allIndia.ruralGini,
    urbanGini: allIndia.urbanGini
  }
];

const artifact = {
  schemaVersion: 1,
  artifactType: "table",
  indicatorId: "heat.affordability.lowest_rural_mpce_states",
  title: "Lowest rural monthly per capita consumption expenditure",
  sourceId: "hces",
  sourceIndicatorId: "MoSPI HCES 2023-24 Statement 9, rural MPCE",
  sourceUrl: hces.source.sourceUrl,
  unit: "Rs per person per month",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt: new Date().toISOString(),
  rows,
  metadata: {
    method: "Ranks states by rural MPCE and keeps the ten lowest values, plus the All-India rural average as a benchmark.",
    caveat: "MPCE is consumption expenditure, not income. Values exclude imputation of items received free through social welfare programmes."
  }
};

writeFileSync("data/series/heat-affordability.IN.lowest_rural_mpce_states.json", `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`wrote heat affordability MPCE table: ${rows.length} rows`);
