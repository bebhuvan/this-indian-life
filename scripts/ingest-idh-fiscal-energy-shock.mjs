// Where the 2026 energy shock landed on the Union budget: monthly CGA accounts.
//
// The GEP says India met the shock with "a reduction in fuel taxes" and that South
// Asian fiscal deficits would widen on energy subsidies. Both halves are testable
// against the Comptroller General of Accounts monthly series, and only one of them
// shows up.
//
// READ THIS BEFORE USING THE MONTHLY NUMBERS. April is a CGA accounting artifact:
// union excise collections post at essentially zero every April (2024-04: Rs 70 cr;
// 2025-04: MINUS Rs 39 cr; 2026-04: Rs 447 cr) because of year-end adjustment and
// refund processing. A single-month year-on-year comparison of April, or of any month
// against April, is meaningless. Compare April-June totals, where the artifact is
// symmetric across years and cancels.
//
// April-June, Rs crore, from CGA via IndiaDataHub:
//
//                        2024      2025      2026     26 vs 25
//   Union excise        51,357    55,605    43,149     -22.4%   <- the fuel tax cut
//   Customs             47,065    42,414    57,741     +36.1%
//   Urea subsidy        19,911    31,523    53,034     +68.2%   <- the fertiliser bill
//   Nutrient-based sub.  7,914     9,499    11,632     +22.5%
//   Petroleum subsidy      380       255       282     +10.4%   <- NO surge
//   Major subsidies      90,174    83,554   114,812     +37.4%
//
// TWO THINGS A CARELESS READING WOULD GET WRONG:
//
// 1. There is no petroleum subsidy blowout. India's petroleum subsidy line is close
//    to nil and stayed there (Rs 282 crore across April-June 2026). The cost of
//    holding pump prices down went through FOREGONE EXCISE and, off-budget, through
//    state oil marketing company margins - not through the subsidy line. Do not write
//    "fuel subsidies surged" from this data.
//
// 2. Excise fell 22.4% but customs rose 36.1%, so the two together were roughly flat
//    (Rs 98,019 crore -> Rs 100,890 crore, +2.9%). Union excise post-GST is
//    overwhelmingly petroleum, so attributing its fall to the fuel tax cut is sound
//    and the GEP corroborates it. Customs covers ALL imports and India levies little
//    basic customs duty on crude, so do NOT attribute the customs rise to oil without
//    separate evidence.
//
// Source: Comptroller General of Accounts monthly accounts, via IndiaDataHub.
// Run: node scripts/ingest-idh-fiscal-energy-shock.mjs

import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { createSeriesArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
// CGA's old /MonthlyReport/Published.aspx path now redirects to CustomError.aspx, as do
// several neighbouring .aspx paths (the site root itself is fine). The live destination is
// linked from the CGA homepage as "Monthly Accounts Dashboard" and its page text reads
// "Union Government Monthly Accounts Dashboard ... Total Receipts, Total Expenditure and
// the Deficit components ... Actuals at the end of each month". It is a JavaScript app, so
// the individual line items do not appear in the fetched HTML - a text-extraction check
// will look like it failed even though the link is right.
const CGA_URL = "https://cga.nic.in/MonthDashboardReport/Published/list.aspx";

const APRIL_CAVEAT =
  "April posts as a near-zero (occasionally negative) month in the CGA excise accounts " +
  "because of year-end adjustment and refund processing. Compare April-June totals, not " +
  "single months, and never compare any month against April.";

const SERIES = [
  ["excise", "GFCFEXCISE11M", "Union excise collections", "Post-GST union excise is overwhelmingly petroleum products, so this line is the clearest read on the 2026 fuel tax cut. The GEP explicitly records 'a reduction in fuel taxes' in India."],
  ["customs", "GFCFCUSTOM11M", "Customs collections", "Covers all imports. India levies little basic customs duty on crude, so do not attribute movements here to oil without separate evidence."],
  ["urea_subsidy", "GFCFURESUB11M", "Urea subsidy expenditure", "Rose 68% year on year across April-June 2026. India imports roughly a fifth of its urea and gas is the feedstock for the rest, so a gas price shock hits this line twice."],
  ["nutrient_based_subsidy", "GFCFNBFSUB11M", "Nutrient-based fertiliser subsidy expenditure", "Covers DAP and complex fertilisers. India sources 42% of its DAP from the Gulf."],
  ["petroleum_subsidy", "GFCFPETSUB11M", "Petroleum subsidy expenditure", "Close to nil and stayed there through the shock. The cost of holding pump prices down did NOT go through this line."],
  ["major_subsidies", "GFCFMAJSUB11M", "Major subsidies expenditure", "Food, fertiliser and petroleum combined."],
  ["fiscal_deficit", "GFCFFISDEF11M", "Central government fiscal deficit", "Monthly flow, volatile and frequently negative in surplus months. Use fiscal-year cumulatives for any headline claim."],
  ["revenue_receipts", "GFCFREVREC11M", "Central government revenue receipts", "Denominator for the revenue-side claims."]
];

function observationsFrom(raw) {
  const dataset = Array.isArray(raw?.dataset) ? raw.dataset[0] : null;
  const rows = Array.isArray(dataset?.data) ? dataset.data : [];
  return {
    dataset,
    // CGA reports in rupees; convert to crore, the unit Indian readers and every
    // official press release use.
    observations: rows
      .map((row) => ({ date: String(row.Date || "").slice(0, 7), value: row.India == null ? null : Number((Number(row.India) / 1e7).toFixed(2)) }))
      .filter((row) => /^\d{4}-\d{2}$/.test(row.date) && row.value != null)
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}

const manifest = [];
const collected = {};

for (const [slug, id, title, note] of SERIES) {
  const raw = await fetchIndiaEconomySeries({ id, fields: "India" });
  await writeSnapshot("indiadatahub", `fiscal-shock.${id}`, raw);
  const { dataset, observations } = observationsFrom(raw);
  if (!observations.length) {
    console.warn(`  ${id}: no rows`);
    continue;
  }
  collected[slug] = Object.fromEntries(observations.map((o) => [o.date, o.value]));
  const artifact = createSeriesArtifact({
    indicatorId: `fiscal.cga.${slug}_monthly`,
    title: `${title}, monthly`,
    sourceId: "indiadatahub",
    sourceIndicatorId: id,
    sourceUrl: CGA_URL,
    unit: "₹ crore",
    frequency: "monthly",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: {
      idhTitle: dataset?.Title,
      idhUnitRaw: dataset?.Unit,
      unitConversion: "IndiaDataHub serves these in rupees; divided by 1e7 here to give ₹ crore.",
      upstream: dataset?.Source || "Comptroller General of Accounts",
      distributor: "https://feeds.indiadatahub.com",
      aprilCaveat: APRIL_CAVEAT,
      note,
      conflictStart: "2026-02-27"
    }
  });
  const path = await writeSeriesArtifact({ sourceId: "indiadatahub", name: `indiadatahub.IN.fiscal.cga.${slug}_monthly`, artifact });
  manifest.push({ status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: id, artifact: path, observations: observations.length, fetchedAt });
  console.log(`  ${artifact.indicatorId.padEnd(40)} ${String(observations.length).padStart(4)} obs  ${observations.at(0).date}..${observations.at(-1).date}`);
}

await mergeSourceManifest("indiadatahub", manifest);

const q1 = (year) => [`${year}-04`, `${year}-05`, `${year}-06`];
const sum = (slug, months) => months.reduce((total, m) => total + (collected[slug]?.[m] ?? 0), 0);
const complete = (slug, months) => months.every((m) => collected[slug]?.[m] != null);

console.log("\nApril-June totals, ₹ crore (April is a CGA artifact; totals cancel it):");
console.log("  series                        2024        2025        2026    26 vs 25");
for (const [slug, , title] of SERIES) {
  if (!collected[slug]) continue;
  const [a, b, c] = [2024, 2025, 2026].map((y) => sum(slug, q1(y)));
  const flag = complete(slug, q1(2026)) ? "" : "  [INCOMPLETE]";
  const change = b ? `${(100 * (c / b - 1)).toFixed(1)}%` : "-";
  console.log(`  ${title.slice(0, 28).padEnd(28)} ${a.toFixed(0).padStart(10)} ${b.toFixed(0).padStart(11)} ${c.toFixed(0).padStart(11)} ${change.padStart(11)}${flag}`);
}
const netTax25 = sum("excise", q1(2025)) + sum("customs", q1(2025));
const netTax26 = sum("excise", q1(2026)) + sum("customs", q1(2026));
console.log(`\n  Excise + customs together: ₹${netTax25.toFixed(0)} cr -> ₹${netTax26.toFixed(0)} cr (${(100 * (netTax26 / netTax25 - 1)).toFixed(1)}%)`);
console.log("  The customs rise nearly offsets the excise cut. See the header note before attributing it to oil.");
