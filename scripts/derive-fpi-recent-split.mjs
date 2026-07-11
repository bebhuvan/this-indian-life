// Derive a small "recent FPI equity vs debt vs FAR" snapshot table so the bond-index
// story's standout year (2024-25) is available as LOCKED NUMBERS to the article generator.
// The evidence builder only locks each series' earliest+latest; this table surfaces the
// specific recent-year values the equity-vs-debt and bond-index sections need.
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const EXT = "/home/bhuvanesh.r/Documents/Bhuvan projects/RBI DBIE/NSDL_FII";

const text = await readFile(`${EXT}/nsdl_fii_annual_reconciled.csv`, "utf8");
const lines = text.trim().split(/\r?\n/);
const head = lines[0].split(",");
const idx = (n) => head.indexOf(n);
const rows = lines.slice(1).map((l) => l.split(","));
const num = (v) => (v === "" || v === undefined ? null : Number(v));

const years = ["2023-24", "2024-25", "2025-26"]; // complete fiscal years, ending at latest complete
const out = [];
for (const fy of years) {
  const r = rows.find((c) => c[idx("fiscal_year")] === fy && c[idx("currency")] === "INR");
  if (!r) continue;
  const equity = num(r[idx("equity")]);
  const debt = num(r[idx("debt")]);
  const far = num(r[idx("debt_far")]);
  out.push({ fiscal_year: fy, instrument: "Equity", inr_crore: equity, label: `Net FPI equity, ${fy}`, value: equity });
  out.push({ fiscal_year: fy, instrument: "Debt", inr_crore: debt, label: `Net FPI debt, ${fy}`, value: debt });
  out.push({ fiscal_year: fy, instrument: "Debt via FAR", inr_crore: far, label: `Net FPI debt via FAR, ${fy}`, value: far });
}

const artifact = createTableArtifact({
  indicatorId: "extfin.fpi.recent_split.nsdl.inr",
  title: "Recent FPI net investment by instrument (NSDL)",
  sourceId: "nsdl", sourceIndicatorId: "extfin.fpi.recent_split.nsdl.inr",
  sourceUrl: "https://www.fpi.nsdl.co.in/web/Reports/Yearwise.aspx?RptType=5",
  unit: "INR crore", geography: { type: "country", id: "IN", name: "India" }, fetchedAt, rows: out,
  dimensions: [{ id: "fiscal_year", label: "Fiscal year" }, { id: "instrument", label: "Instrument" }],
  metadata: {
    source: "NSDL FPI Net Investment (reconciled annual), recent complete fiscal years",
    note: "2024-25 is the bond-index year: equity net about -1.27 lakh crore, debt net about +1.43 lakh crore (of which about +80,691 crore via the Fully Accessible Route).",
    purpose: "Surface recent-year equity/debt/FAR values as locked numbers for prose; not necessarily charted."
  }
});
const path = await writeSeriesArtifact({ sourceId: "nsdl", name: "nsdl.IN.extfin_fpi_recent_split", artifact });
await writeSourceManifest("foreign-investment-recent-split", [{ status: "ready", indicatorId: artifact.indicatorId, artifact: path, rows: out.length, fetchedAt }]);
console.log(`Wrote recent-split table: ${out.length} rows`);
for (const r of out) console.log(`  ${r.label.padEnd(34)} ${r.value}`);
