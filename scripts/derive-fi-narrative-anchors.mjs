// Surface the intermediate-year "narrative anchor" numbers the article hinges on as
// LOCKED NUMBERS (the evidence builder only locks each series' earliest+latest). Without
// these the model tells a weaker story (e.g. the FDI "cliff" anchored on 2001 not FY2020,
// or the monthly rollercoaster missing the March-2020 COVID extreme).
import { readFile } from "node:fs/promises";
import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const EXT = "/home/bhuvanesh.r/Documents/Bhuvan projects/RBI DBIE/FDI";
const sap = JSON.parse(await readFile(`${EXT}/sap290_annual.json`, "utf8"));
const fy = (y) => sap.find((r) => r.fy === y);

const f2020 = fy("2019-20");
const rows = [
  // The FDI "cliff" baseline (FY2019-20, the peak the panic compares against)
  { anchor: "Net FDI peak, FY2019-20 (US$ mn)", label: "Net FDI, 2019-20", value: Math.round(f2020.netfdi_usd) },
  { anchor: "Gross FDI inflows, FY2019-20 (US$ mn)", label: "Gross FDI inflows, 2019-20", value: Math.round(f2020.gross_usd) },
  { anchor: "Repatriation, FY2019-20 (US$ mn)", label: "Repatriation, 2019-20", value: Math.round(f2020.repat_usd) },
  { anchor: "Outward FDI, FY2019-20 (US$ mn)", label: "FDI by India, 2019-20", value: Math.round(f2020.outward_usd) },
  // The FII rollercoaster: three wild years (net portfolio, BoP, US$ mn)
  { anchor: "Net FPI, FY2020-21 (US$ mn)", label: "Net FPI, 2020-21", value: Math.round(fy("2020-21").netport_usd) },
  { anchor: "Net FPI, FY2021-22 (US$ mn)", label: "Net FPI, 2021-22", value: Math.round(fy("2021-22").netport_usd) },
  { anchor: "Net FPI, FY2023-24 (US$ mn)", label: "Net FPI, 2023-24", value: Math.round(fy("2023-24").netport_usd) },
  // Monthly FII extremes (net portfolio, US$ mn) — the "hot money" examples
  { anchor: "Worst FII month: March 2020 (US$ mn)", label: "Net FPI, March 2020 (COVID)", value: -14635 },
  { anchor: "Best FII month: November 2020 (US$ mn)", label: "Net FPI, November 2020", value: 10929 }
];

const artifact = createTableArtifact({
  indicatorId: "extfin.narrative_anchors.usd",
  title: "Key FDI/FII reference points (RBI)",
  sourceId: "rbi", sourceIndicatorId: "extfin.narrative_anchors.usd",
  sourceUrl: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+Economy",
  unit: "USD million", geography: { type: "country", id: "IN", name: "India" }, fetchedAt, rows,
  dimensions: [{ id: "anchor", label: "Reference point" }],
  metadata: {
    source: "RBI Handbook (SAP_290) annual + RBI monthly Foreign Investment Inflows",
    note: "Intermediate-year reference points the narrative depends on: the FY2019-20 net-FDI peak (~$43bn, the 'cliff' baseline), the FY21/FY22/FY24 portfolio swings (+36/-17/+44 $bn), and the March-2020/November-2020 monthly extremes.",
    purpose: "Locked-number provider for prose; not charted."
  }
});
const path = await writeSeriesArtifact({ sourceId: "rbi", name: "rbi.IN.extfin_narrative_anchors", artifact });
await writeSourceManifest("foreign-investment-anchors", [{ status: "ready", indicatorId: artifact.indicatorId, artifact: path, rows: rows.length, fetchedAt }]);
console.log(`Wrote narrative-anchors table: ${rows.length} rows`);
for (const r of rows) console.log(`  ${r.label.padEnd(34)} ${r.value}`);
