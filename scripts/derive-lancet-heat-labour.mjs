import { readFileSync, writeFileSync } from "node:fs";

const lancet = JSON.parse(readFileSync("data/series/heat-mortality.IN.lancet_countdown_2025_extracted_indicators.json", "utf8"));
const byId = new Map(lancet.rows.map((row) => [row.indicatorId, row]));

function value(id) {
  const row = byId.get(id);
  if (!row || typeof row.value !== "number") throw new Error(`Missing Lancet indicator ${id}`);
  return row.value;
}

const agriculture = value("agriculture_share_labour_losses_2024");
const construction = value("construction_share_labour_losses_2024");
const other = Number(Math.max(0, 100 - agriculture - construction).toFixed(1));

const artifact = {
  schemaVersion: 1,
  artifactType: "table",
  indicatorId: "heat.work.lancet_labour_loss_sector_shares",
  title: "Heat-related labour-hour losses by sector",
  sourceId: "lancet-countdown",
  sourceIndicatorId: "India 2025 data sheet, heat-related labour-hour losses in 2024",
  sourceUrl: lancet.sourceUrl,
  unit: "% of heat-related labour-hour losses",
  geography: lancet.geography,
  fetchedAt: new Date().toISOString(),
  rows: [
    { label: "Agriculture", value: agriculture, date: "2024" },
    { label: "Construction", value: construction, date: "2024" },
    { label: "Other sectors", value: other, date: "2024", note: "Derived residual: 100 minus agriculture and construction shares." }
  ],
  metadata: {
    share: true,
    potentialLabourHoursLostBillion: value("potential_labour_hours_lost_2024"),
    potentialLabourHoursLostPerPerson: value("potential_labour_hours_lost_per_person_2024"),
    labourLossChangeSince1990sPct: value("labour_loss_change_since_1990s_2024"),
    potentialIncomeLostUsdBillion: value("potential_income_lost_heat_2024"),
    method: "Keeps Lancet's agriculture and construction shares as comparable percentages and derives the residual other-sector share.",
    caveat: "Labour hours lost are labour-capacity estimates, not a count of deaths or observed wage losses."
  }
};

writeFileSync("data/series/heat-work.IN.lancet_labour_loss_sector_shares.json", `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`wrote Lancet heat labour-loss table: ${artifact.rows.length} rows`);
