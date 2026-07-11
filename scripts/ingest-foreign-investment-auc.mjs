// Ingest NSDL FPI country-wise Assets Under Custody (AUC) snapshot -> table artifact.
// "Where foreign portfolio money is actually held" (May 2026): total ₹74.8 lakh crore, US ~41%.
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const EXT = "/home/bhuvanesh.r/Documents/Bhuvan projects/RBI DBIE/FDI";
const SRC_URL = "https://www.fpi.nsdl.co.in/web/Reports/ReportDetail.aspx?RepID=14";

const text = await readFile(`${EXT}/nsdl_raw/fpi_auc_countrywise_May2026.txt`, "utf8");
await writeSnapshot("nsdl", "fpi_auc_countrywise_may2026", { text });

// data lines: "<rank|Total> <COUNTRY...> <12 numbers>"; the 12 value columns are:
// equity, debt_gen, debt_vrr, debt_far, hybrid, mf_equity, mf_debt, mf_hybrid, mf_soln, mf_others, aif, total
const rows = [];
for (const line of text.split(/\r?\n/)) {
  const tokens = line.trim().split(/\s+/);
  if (!(tokens[0] === "Total" || /^\d+$/.test(tokens[0]))) continue; // data rows start with rank or "Total"
  if (tokens.length < 13) continue;
  const nums = tokens.slice(-12).map(Number);
  if (nums.some((n) => !Number.isFinite(n))) { console.warn(`  skip (non-numeric tail): ${line.slice(0, 40)}`); continue; }
  const country = tokens[0] === "Total" ? "Total" : tokens.slice(1, -12).join(" ");
  const [equity, debtGen, debtVrr, debtFar, hybrid, mfEq, mfDebt, mfHyb, mfSoln, mfOther, aif, total] = nums;
  rows.push({
    country, equity_inr_cr: equity,
    debt_inr_cr: debtGen + debtVrr + debtFar,
    hybrid_inr_cr: hybrid,
    mutual_funds_inr_cr: mfEq + mfDebt + mfHyb + mfSoln + mfOther,
    aif_inr_cr: aif, total_inr_cr: total,
    share_pct: null, // filled below
    // tableBars binds on label/value; Total row omits label so it is excluded from the bars
    label: country === "Total" ? undefined : country,
    value: total
  });
}
const grand = rows.find((r) => r.country === "Total")?.total_inr_cr;
for (const r of rows) if (grand) r.share_pct = Math.round((r.total_inr_cr / grand) * 1000) / 10;

const artifact = createTableArtifact({
  indicatorId: "extfin.fpi.auc_by_country.nsdl.inr",
  title: "FPI assets under custody by source country (NSDL, May 2026)",
  sourceId: "nsdl", sourceIndicatorId: "extfin.fpi.auc_by_country.nsdl.inr", sourceUrl: SRC_URL,
  unit: "INR crore", geography: { type: "multi", id: "MULTI", name: "Selected countries" }, fetchedAt,
  rows,
  dimensions: [{ id: "country", label: "Country" }],
  metadata: {
    source: "NSDL FPI AUC Country-wise (top 10 + Other)", period: "May 2026",
    note: "Assets under custody = stock of FPI holdings, not flows. Debt-FAR/MF/AIF included w.e.f. Aug 2024.",
    headline: "Total ₹74.8 lakh crore (~$900bn); United States ~41% of the total"
  }
});
const path = await writeSeriesArtifact({ sourceId: "nsdl", name: "nsdl.IN.extfin_fpi_auc_by_country", artifact });
await writeSourceManifest("foreign-investment-auc", [{ status: "ready", indicatorId: artifact.indicatorId, artifact: path, rows: rows.length, fetchedAt }]);
console.log(`Wrote AUC table: ${rows.length} rows (incl. Total). US share = ${rows.find((r) => /UNITED STATES/.test(r.country))?.share_pct}%`);
