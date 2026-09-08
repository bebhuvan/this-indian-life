// Ingest for q.econ.fdi_development — "did foreign money build India?"
//
// Three independent sources:
//   1. UNCTADstat US.FdiFlowsStock  (flows + stock, 1990-2025, 293 economies,
//      in US$, % of world, % of GDP and % of gross fixed capital formation)
//   2. UNCTADstat US.PopTotal       (population, for the per-person cut)
//   3. World Bank BX.KLT.DINV.WD.GD.ZS (FDI % of GDP, 1970-2025, regional aggregates)
//   + WIR 2026 annex table 14 (announced greenfield project value) from the local snapshot.
//
// These write a `extfin.fdi.dev.*` namespace on purpose. The older
// `extfin.fdi.*.unctad.*` series belong to q.econ.foreign_investment and are a
// 2024-vintage; refreshing them in place would move locked numbers in that
// article's prose. Same source, different vintage — do not mix the two in one chart.
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import readXlsxFile from "read-excel-file/node";
import {
  createSeriesArtifact, createTableArtifact,
  writeSeriesArtifact, writeSnapshot, mergeSourceManifest
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const UA = "Indica/0.1 data ingest";
const API = process.env.UNCTAD_API_BASE_URL || "https://unctadstat-api.unctad.org";

const UNCTAD_PAGE = "https://unctadstat.unctad.org/datacentre/dataviewer/US.FdiFlowsStock";
const POP_PAGE = "https://unctadstat.unctad.org/datacentre/dataviewer/US.PopTotal";
const WB_PAGE = "https://data.worldbank.org/indicator/BX.KLT.DINV.WD.GD.ZS";
const GREENFIELD_XLSX = "data/raw/unctad-wir/wir2026/annex/wir26_tab14.xlsx";
const GREENFIELD_PAGE = "https://unctad.org/topic/investment/world-investment-report";

function assert(cond, msg) { if (!cond) throw new Error(`[guardrail] ${msg}`); }
const yearEnd = (y) => `${y}-12-31`;
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

// ---------------------------------------------------------------- UNCTAD bulk
async function fetchUnctadBulk(report) {
  const url = `${API}/bulkdownload/${report}/${report.replace(".", "_")}`;
  const res = await fetch(url, { headers: { "user-agent": UA } });
  assert(res.ok, `${report} fetch failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  assert(buf.length > 50_000, `${report} archive suspiciously small (${buf.length} bytes)`);
  const dir = await mkdtemp(join(tmpdir(), "unctad-"));
  const archive = join(dir, "bulk.7z");
  await writeFile(archive, buf);
  try {
    execFileSync("python3", ["-c",
      `import py7zr;py7zr.SevenZipFile(${JSON.stringify(archive)},'r').extractall(${JSON.stringify(dir)})`],
      { stdio: "pipe" });
    const csv = await readFile(join(dir, `${report.replace(".", "_")}.csv`), "utf8");
    return { csv, url };
  } finally { await rm(dir, { recursive: true, force: true }); }
}

// Split a CSV line honouring quoted fields.
function splitCsv(line) {
  const out = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur); return out;
}

const FDI_HEADER_HEAD = [
  "Year", "Economy", "Economy Label", "Flow", "Flow Label", "Direction", "Direction Label",
  "Millions of US$ at current prices"
];

const { csv: fdiCsv, url: fdiUrl } = await fetchUnctadBulk("US.FdiFlowsStock");
const fdiLines = fdiCsv.split(/\r?\n/).filter((l) => l.trim());
const fdiHeader = splitCsv(fdiLines[0]);
FDI_HEADER_HEAD.forEach((h, i) =>
  assert(fdiHeader[i] === h, `FdiFlowsStock column ${i} is "${fdiHeader[i]}", expected "${h}"`));
const col = Object.fromEntries(fdiHeader.map((h, i) => [h, i]));
const cUsd = col["Millions of US$ at current prices"];
const cWorld = col["Percentage of total world"];
const cGdp = col["Percentage of gross Domestic Product"];
const cGfcf = col["Percentage of gross Fixed Capital Formation"];
assert(cWorld > 0 && cGdp > 0 && cGfcf > 0, "FdiFlowsStock is missing a share column");

assert(fdiLines.length > 30_000 && fdiLines.length < 60_000,
  `FdiFlowsStock row count ${fdiLines.length} outside expected 30k-60k band`);

const num = (s) => (s === "" || s === undefined ? null : Number(s));
const fdi = fdiLines.slice(1).map((l) => {
  const f = splitCsv(l);
  return {
    year: Number(f[0]), code: f[1], econ: f[2], kind: f[4], dir: f[6],
    usd: num(f[cUsd]), world: num(f[cWorld]), gdp: num(f[cGdp]), gfcf: num(f[cGfcf])
  };
}).filter((r) => Number.isFinite(r.year));

const YMIN = Math.min(...fdi.map((r) => r.year));
const YMAX = Math.max(...fdi.map((r) => r.year));
assert(YMIN === 1990, `FdiFlowsStock starts at ${YMIN}, expected 1990`);
assert(YMAX >= 2025, `FdiFlowsStock ends at ${YMAX}, expected 2025 or later`);

const pick = (econ, kind, dir) =>
  fdi.filter((r) => r.econ === econ && r.kind === kind && r.dir === dir)
     .sort((a, b) => a.year - b.year);

// Anchors published in WIR 2026 annex table 01 — if these move, the vintage changed.
const indIn = pick("India", "Flow", "Inward");
const a1990 = indIn.find((r) => r.year === 1990);
const a2025 = indIn.find((r) => r.year === 2025);
assert(a1990 && Math.abs(a1990.usd - 236.69) < 0.01, `India 1990 inflow ${a1990?.usd}, expected 236.69`);
assert(a2025 && Math.abs(a2025.usd - 38891.331) < 0.01, `India 2025 inflow ${a2025?.usd}, expected 38891.331`);
const indOut = pick("India", "Flow", "Outward");
assert(Math.abs(indOut.find((r) => r.year === 2025).usd - 35651) < 500, "India 2025 outflow off anchor");

const fdiSnap = await writeSnapshot("unctad", "US_FdiFlowsStock_wir2026",
  { rows: fdi.length, years: [YMIN, YMAX], fetchedFrom: fdiUrl,
    anchors: { india_1990_inward: a1990.usd, india_2025_inward: a2025.usd } });

// ---------------------------------------------------------------- population
const { csv: popCsv, url: popUrl } = await fetchUnctadBulk("US.PopTotal");
const popLines = popCsv.split(/\r?\n/).filter((l) => l.trim());
const popHeader = splitCsv(popLines[0]);
const cPop = popHeader.indexOf("Absolute value in thousands");
assert(popHeader[0] === "Year" && cPop > 0, "PopTotal header changed");
const pop2025 = new Map();
for (const l of popLines.slice(1)) {
  const f = splitCsv(l);
  if (Number(f[0]) !== 2025) continue;
  const v = num(f[cPop]);
  if (v !== null) pop2025.set(f[2], v * 1000);
}
assert(pop2025.size > 150, `PopTotal 2025 has only ${pop2025.size} economies`);
const indPop = pop2025.get("India");
assert(indPop > 1.3e9 && indPop < 1.6e9, `India 2025 population ${indPop} out of range`);
const popSnap = await writeSnapshot("unctad", "US_PopTotal_2025",
  { economies: pop2025.size, indiaPopulation: indPop, fetchedFrom: popUrl });

// ---------------------------------------------------------------- World Bank
const WB_ENTITIES = [
  { wb: "IND", key: "India", gid: "IND", label: "India" },
  { wb: "EAS", key: "East Asia & Pacific", gid: "EAS", label: "East Asia & Pacific" },
  { wb: "LCN", key: "Latin America & Caribbean", gid: "LCN", label: "Latin America & Caribbean" },
  { wb: "SSF", key: "Sub-Saharan Africa", gid: "SSF", label: "Sub-Saharan Africa" },
  { wb: "SAS", key: "South Asia", gid: "SAS", label: "South Asia" },
  { wb: "WLD", key: "World", gid: "WLD", label: "World" }
];
const wbUrl = `https://api.worldbank.org/v2/country/${WB_ENTITIES.map((e) => e.wb).join(";")}` +
  `/indicator/BX.KLT.DINV.WD.GD.ZS?format=json&per_page=20000`;
const wbRes = await fetch(wbUrl, { headers: { "user-agent": UA } });
assert(wbRes.ok, `World Bank fetch failed ${wbRes.status}`);
const wbJson = await wbRes.json();
assert(Array.isArray(wbJson) && wbJson.length === 2, "World Bank response shape changed");
const wbRows = wbJson[1];
assert(wbRows[0].indicator.id === "BX.KLT.DINV.WD.GD.ZS", "World Bank indicator id changed");
assert(wbRows.length > 300, `World Bank returned only ${wbRows.length} rows`);
const wbBy = new Map();
for (const r of wbRows) {
  if (r.value === null) continue;
  const k = r.country.value;
  if (!wbBy.has(k)) wbBy.set(k, []);
  wbBy.get(k).push({ year: Number(r.date), value: r.value });
}
for (const [, arr] of wbBy) arr.sort((a, b) => a.year - b.year);
const wbIndia = wbBy.get("India");
assert(wbIndia && wbIndia[0].year <= 1970, "World Bank India series does not reach 1970");
// Cross-source check: World Bank vs UNCTAD on India FDI/GDP, 1990 onward.
const uGdp = new Map(indIn.map((r) => [r.year, r.gdp]));
let maxDiff = 0, nCmp = 0, sumDiff = 0;
for (const o of wbIndia) {
  const u = uGdp.get(o.year);
  if (u === undefined || u === null || o.year < 1990) continue;
  const d = Math.abs(o.value - u); maxDiff = Math.max(maxDiff, d); sumDiff += d; nCmp++;
}
assert(nCmp > 30, `only ${nCmp} overlapping years for the WB/UNCTAD cross-check`);
assert(maxDiff < 0.5,
  `World Bank and UNCTAD disagree on India FDI/GDP by ${maxDiff.toFixed(3)}pp (max tolerated 0.5)`);
console.log(`cross-source WB vs UNCTAD, India FDI/GDP: n=${nCmp} max=${maxDiff.toFixed(3)}pp mean=${(sumDiff / nCmp).toFixed(3)}pp`);
const wbSnap = await writeSnapshot("worldbank", "BX_KLT_DINV_WD_GD_ZS",
  { entities: [...wbBy.keys()], rows: wbRows.length, lastUpdated: wbJson[0].lastupdated,
    crossCheckVsUnctad: { years: nCmp, maxDiffPp: r3(maxDiff), meanDiffPp: r3(sumDiff / nCmp) } });

// ---------------------------------------------------- greenfield (annex tab 14)
// read-excel-file returns either a row array or a [{sheet, data}] list depending
// on whether a sheet is named; normalise both shapes.
const gfParsed = await readXlsxFile(GREENFIELD_XLSX);
const gfRaw = Array.isArray(gfParsed[0]) ? gfParsed : gfParsed[0].data;
assert(String(gfRaw[0][0]).includes("Annex table 14"),
  `annex table 14 title row is "${gfRaw[0][0]}"`);
const gfYears = gfRaw[2].slice(1).filter((v) => v !== null).map(Number);
assert(gfYears[0] === 2003 && gfYears.at(-1) >= 2025, `greenfield years ${gfYears[0]}-${gfYears.at(-1)}`);
const gfIndiaRow = gfRaw.slice(3).find((r) => String(r[0]).trim() === "India");
assert(gfIndiaRow, "annex table 14 has no India row");
const gfIndia = gfYears.map((y, i) => ({ year: y, value: gfIndiaRow[i + 1] }))
  .filter((o) => Number.isFinite(o.value));
const gf2024 = gfIndia.find((o) => o.year === 2024);
assert(gf2024 && Math.abs(gf2024.value - 111130) < 2000,
  `India 2024 announced greenfield ${gf2024?.value}, expected ~111130`);
const gfSnap = await writeSnapshot("unctad", "wir2026_tab14_greenfield_india",
  { years: [gfYears[0], gfYears.at(-1)], india2024: gf2024.value, file: GREENFIELD_XLSX });

// ---------------------------------------------------------------- write series
async function series({ id, title, unit, obs, geography, sourceId, sourceUrl, snapshot, metadata, name }) {
  assert(obs.length > 0, `${id} has no observations`);
  const artifact = createSeriesArtifact({
    indicatorId: id, title, sourceId, sourceIndicatorId: id, sourceUrl, unit,
    frequency: "annual", geography, fetchedAt, observations: obs, metadata
  });
  const path = await writeSeriesArtifact({ sourceId, name, artifact });
  manifest.push({ status: "ready", indicatorId: id, sourceIndicatorId: id, artifact: path,
    snapshot: snapshot.path, rawHash: snapshot.hash, observations: obs.length, fetchedAt });
  console.log(`  ${id.padEnd(46)} ${String(obs.length).padStart(3)} obs  →${obs.at(-1).date}=${obs.at(-1).value}`);
  return path;
}
async function table({ id, title, unit, rows, dimensions, sourceId, sourceUrl, snapshot, metadata, name }) {
  assert(rows.length > 0, `${id} has no rows`);
  const artifact = createTableArtifact({
    indicatorId: id, title, sourceId, sourceIndicatorId: id, sourceUrl, unit,
    geography: { type: "multi", id: "MULTI", name: "Selected economies" },
    dimensions, fetchedAt, rows, metadata
  });
  const path = await writeSeriesArtifact({ sourceId, name, artifact });
  manifest.push({ status: "ready", indicatorId: id, sourceIndicatorId: id, artifact: path,
    snapshot: snapshot.path, rawHash: snapshot.hash, observations: rows.length, fetchedAt });
  console.log(`  ${id.padEnd(46)} ${String(rows.length).padStart(3)} rows (table)`);
  return path;
}

const U = { sourceId: "unctad", sourceUrl: UNCTAD_PAGE, snapshot: fdiSnap };

console.log("\nFDI as % of gross fixed capital formation (the denominator):");
const GFCF_SET = [
  { econ: "India", gid: "IND", label: "India" },
  { econ: "Viet Nam", gid: "VNM", label: "Viet Nam" },
  { econ: "China", gid: "CHN", label: "China" },
  { econ: "Republic of Korea", gid: "KOR", label: "Korea" },
  { econ: "Poland", gid: "POL", label: "Poland" },
  // South Asian peers, for the regional comparison. On this yardstick India is the
  // regional norm rather than an outlier, which is the point of the chart.
  { econ: "Pakistan", gid: "PAK", label: "Pakistan" },
  { econ: "Bangladesh", gid: "BGD", label: "Bangladesh" },
  { econ: "Sri Lanka", gid: "LKA", label: "Sri Lanka" }
];
for (const e of GFCF_SET) {
  const obs = pick(e.econ, "Flow", "Inward")
    .filter((r) => r.gfcf !== null)
    .map((r) => ({ date: yearEnd(r.year), value: r2(r.gfcf) }));
  obs.forEach((o) => assert(o.value > -60 && o.value < 200, `${e.label} GFCF share ${o.value} implausible`));
  await series({ ...U, id: `extfin.fdi.dev.gfcf_share.${e.gid}.pct`,
    title: `FDI as a share of gross fixed capital formation — ${e.label}`,
    unit: "percent of gross fixed capital formation", obs,
    geography: { type: "country", id: e.gid, name: e.label },
    name: `unctad-wir.${e.gid}.extfin_fdi_dev_gfcf_share`,
    metadata: { dataset: "UNCTADstat US.FdiFlowsStock", vintage: "WIR 2026 (updated 2026-08-10)",
      definition: "Inward FDI flows (net, BoP basis) divided by gross fixed capital formation." } });
}

console.log("\nWorld Bank FDI % of GDP, 1970-2025 (independent source, regional aggregates):");
for (const e of WB_ENTITIES) {
  const arr = wbBy.get(e.key);
  assert(arr, `World Bank returned no rows for ${e.key}`);
  const obs = arr.map((o) => ({ date: yearEnd(o.year), value: r3(o.value) }));
  await series({ sourceId: "worldbank", sourceUrl: WB_PAGE, snapshot: wbSnap,
    id: `extfin.fdi.dev.gdp_share_wb.${e.gid}.pct`,
    title: `FDI net inflows as a share of GDP — ${e.label}`,
    unit: "percent of GDP", obs,
    geography: e.gid === "IND" ? { type: "country", id: "IND", name: "India" }
                               : { type: "region", id: e.gid, name: e.label },
    name: `worldbank.${e.gid}.extfin_fdi_dev_gdp_share`,
    metadata: { dataset: "World Bank WDI BX.KLT.DINV.WD.GD.ZS", lastUpdated: wbJson[0].lastupdated,
      definition: "FDI net inflows (BoP, current US$) as a share of GDP.",
      crossCheck: `India agrees with UNCTAD to ${r3(maxDiff)}pp max, ${r3(sumDiff / nCmp)}pp mean, 1990-2025.` } });
}

console.log("\nThe reallocation (annual inflows, $ millions):");
const REALLOC = [
  { econ: "Developing economies: South-eastern Asia", gid: "SEA", label: "Southeast Asia", type: "region" },
  { econ: "China", gid: "CHN", label: "China", type: "country" },
  { econ: "India", gid: "IND", label: "India", type: "country" }
];
for (const e of REALLOC) {
  const obs = pick(e.econ, "Flow", "Inward").filter((r) => r.usd !== null)
    .map((r) => ({ date: yearEnd(r.year), value: r2(r.usd) }));
  await series({ ...U, id: `extfin.fdi.dev.inward_flow.${e.gid}.usd`,
    title: `FDI inflows — ${e.label}`, unit: "USD million", obs,
    geography: { type: e.type, id: e.gid, name: e.label },
    name: `unctad-wir.${e.gid}.extfin_fdi_dev_inward_flow`,
    metadata: { dataset: "UNCTADstat US.FdiFlowsStock", vintage: "WIR 2026",
      note: e.gid === "SEA"
        ? "UNCTAD's developing South-eastern Asia aggregate, which includes Singapore; a large share of Singapore's inflows are booked rather than built there."
        : undefined } });
}

console.log("\nIndia's stock, rank and share:");
for (const dir of ["Inward", "Outward"]) {
  const obs = pick("India", "Stock", dir).filter((r) => r.usd !== null)
    .map((r) => ({ date: yearEnd(r.year), value: r2(r.usd) }));
  await series({ ...U, id: `extfin.fdi.dev.${dir.toLowerCase()}_stock.IN.usd`,
    title: dir === "Inward" ? "What foreigners own in India (FDI stock)" : "What India owns abroad (FDI stock)",
    unit: "USD million", obs, geography: { type: "country", id: "IND", name: "India" },
    name: `unctad-wir.IND.extfin_fdi_dev_${dir.toLowerCase()}_stock`,
    metadata: { dataset: "UNCTADstat US.FdiFlowsStock", vintage: "WIR 2026",
      note: "Book value, revised often; the ratio between the two is more reliable than either level." } });
}

// India's world rank among individual economies (aggregates have 4-digit codes).
const isEconomy = (code) => /^\d{1,3}$/.test(code);
const rankObs = [];
for (let y = YMIN; y <= YMAX; y++) {
  const rows = fdi.filter((r) => r.year === y && r.kind === "Flow" && r.dir === "Inward"
    && isEconomy(r.code) && r.usd !== null).sort((a, b) => b.usd - a.usd);
  const i = rows.findIndex((r) => r.econ === "India");
  if (i >= 0) rankObs.push({ date: yearEnd(y), value: i + 1 });
}
assert(rankObs.find((o) => o.date === "1990-12-31").value === 43, "India 1990 rank is not 43");
assert(rankObs.find((o) => o.date === "2020-12-31").value === 7, "India 2020 rank is not 7");
assert(rankObs.find((o) => o.date === "2025-12-31").value === 12, "India 2025 rank is not 12");
await series({ ...U, id: "extfin.fdi.dev.world_rank.IN",
  title: "India's world rank for FDI received", unit: "rank among reporting economies", obs: rankObs,
  geography: { type: "country", id: "IND", name: "India" },
  name: "unctad-wir.IND.extfin_fdi_dev_world_rank",
  metadata: { dataset: "UNCTADstat US.FdiFlowsStock",
    definition: "Rank by inward FDI flow among the 170-203 individual economies reporting a value that year; regional and grouping aggregates excluded." } });

const devTotal = new Map(pick("Developing economies", "Flow", "Inward").map((r) => [r.year, r.usd]));
const shareObs = indIn.filter((r) => r.usd !== null && devTotal.get(r.year))
  .map((r) => ({ date: yearEnd(r.year), value: r2((r.usd / devTotal.get(r.year)) * 100) }));
await series({ ...U, id: "extfin.fdi.dev.india_share_developing.pct",
  title: "India's share of all FDI going to developing economies", unit: "percent", obs: shareObs,
  geography: { type: "country", id: "IND", name: "India" },
  name: "unctad-wir.IND.extfin_fdi_dev_india_share_developing",
  metadata: { dataset: "UNCTADstat US.FdiFlowsStock",
    note: "Denominator excludes Caribbean financial centres and special-purpose entities." } });

console.log("\nGreenfield announcements vs recorded FDI:");
await series({ sourceId: "unctad", sourceUrl: GREENFIELD_PAGE, snapshot: gfSnap,
  id: "extfin.fdi.dev.greenfield_announced.IN.usd",
  title: "Announced greenfield project value — India", unit: "USD million",
  obs: gfIndia.map((o) => ({ date: yearEnd(o.year), value: r2(o.value) })),
  geography: { type: "country", id: "IND", name: "India" },
  name: "unctad-wir.IND.extfin_fdi_dev_greenfield_announced",
  metadata: { dataset: "WIR 2026 annex table 14, value of announced greenfield FDI projects by destination",
    note: "Announcements are intentions compiled from a commercial project database, not official statistics, and are not comparable year-for-year with balance-of-payments FDI." } });
await series({ ...U, id: "extfin.fdi.dev.inward_flow_recorded.IN.usd",
  title: "FDI actually recorded in India's balance of payments", unit: "USD million",
  obs: indIn.filter((r) => r.usd !== null && r.year >= 2003)
    .map((r) => ({ date: yearEnd(r.year), value: r2(r.usd) })),
  geography: { type: "country", id: "IND", name: "India" },
  name: "unctad-wir.IND.extfin_fdi_dev_inward_flow_recorded",
  metadata: { dataset: "UNCTADstat US.FdiFlowsStock", note: "Trimmed to 2003 to align with the greenfield announcement series." } });

// ------------------------------------------------------------------- tables
console.log("\nTables:");
const PER_PERSON = ["Singapore", "Ireland", "Poland", "Malaysia", "Mexico", "Republic of Korea",
  "Brazil", "Thailand", "Viet Nam", "China", "Egypt", "Indonesia", "Sri Lanka", "India",
  "Nigeria", "Pakistan", "Bangladesh"];
const ppRows = [];
for (const e of PER_PERSON) {
  const cum = fdi.filter((r) => r.econ === e && r.kind === "Flow" && r.dir === "Inward" && r.usd !== null)
    .reduce((s, r) => s + r.usd, 0) * 1e6;
  const p = pop2025.get(e);
  if (!p) { console.warn(`  (no 2025 population for ${e}, skipped)`); continue; }
  const label = e === "Republic of Korea" ? "Korea" : e;
  ppRows.push({ economy: label, label, value: Math.round(cum / p),
    cumulative_fdi_usd_billion: Math.round(cum / 1e9), population_2025_million: Math.round(p / 1e6) });
}
ppRows.sort((a, b) => b.value - a.value);
const indRow = ppRows.find((r) => r.economy === "India");
assert(indRow && Math.abs(indRow.value - 547) < 15, `India per-person ${indRow?.value}, expected ~547`);
await table({ ...U, id: "extfin.fdi.dev.cumulative_per_person.usd",
  title: "Total FDI received per person, 1990-2025", unit: "US$ per person (36-year cumulative)",
  rows: ppRows, dimensions: [{ id: "economy", label: "Economy" }],
  name: "unctad-wir.MULTI.extfin_fdi_dev_cumulative_per_person",
  metadata: { dataset: "UNCTADstat US.FdiFlowsStock and US.PopTotal",
    method: "Sum of inward FDI flows 1990-2025 in current US$, divided by 2025 population.",
    caveat: "A 36-year cumulative flow over a single-year population — a scale intuition, not a precise ratio. Singapore and Ireland are conduit economies as much as destinations." } });

const ERAS = [["1991-2000", 1991, 2000], ["2001-2008", 2001, 2008], ["2009-2014", 2009, 2014],
  ["2015-2020", 2015, 2020], ["2021-2025", 2021, 2025]];
const eraRows = ERAS.map(([label, a, b]) => {
  const win = indIn.filter((r) => r.year >= a && r.year <= b);
  const out = indOut.filter((r) => r.year >= a && r.year <= b);
  const sum = (arr, k) => arr.reduce((s, r) => s + (r[k] ?? 0), 0);
  const meanGfcf = win.reduce((s, r) => s + (r.gfcf ?? 0), 0) / win.length;
  return { era: label, label, value: Math.round(sum(win, "usd") / 1000),
    received_usd_billion: Math.round(sum(win, "usd") / 1000),
    sent_out_usd_billion: Math.round(sum(out, "usd") / 1000),
    net_usd_billion: Math.round((sum(win, "usd") - sum(out, "usd")) / 1000),
    avg_pct_of_capital_formation: r2(meanGfcf) };
});
await table({ ...U, id: "extfin.fdi.dev.era_summary.usd",
  title: "India's FDI by era, 1991-2025", unit: "USD billion received over the period",
  rows: eraRows, dimensions: [{ id: "era", label: "Era" }],
  name: "unctad-wir.IND.extfin_fdi_dev_era_summary",
  metadata: { dataset: "UNCTADstat US.FdiFlowsStock",
    note: "Totals are period sums; the capital-formation column is the annual average within the period." } });

const STOCK_PEERS = ["Viet Nam", "Thailand", "Malaysia", "Brazil", "Poland", "Mexico",
  "Indonesia", "China", "India", "Bangladesh"];
const stockRows = STOCK_PEERS.map((e) => {
  const s = fdi.find((r) => r.econ === e && r.kind === "Stock" && r.dir === "Inward" && r.year === YMAX);
  return s && s.gdp !== null ? { economy: e, label: e, value: r2(s.gdp), year: YMAX } : null;
}).filter(Boolean).sort((a, b) => b.value - a.value);
assert(stockRows.length >= 8, "stock-vs-GDP table lost too many economies");
await table({ ...U, id: "extfin.fdi.dev.inward_stock_gdp_peers.pct",
  title: `Accumulated foreign ownership as a share of GDP, ${YMAX}`, unit: "percent of GDP",
  rows: stockRows, dimensions: [{ id: "economy", label: "Economy" }],
  name: "unctad-wir.MULTI.extfin_fdi_dev_inward_stock_gdp_peers",
  metadata: { dataset: "UNCTADstat US.FdiFlowsStock",
    definition: "Inward FDI stock at book value as a percentage of GDP.", vintage: `${YMAX}, preliminary` } });

// ---------------------------------------------- annex tables 05, 13, 20
// A generic reader for the "region/economy down the side, years across the top"
// annex-table layout. Same normalisation as the greenfield table above.
async function readAnnex(n, expectTitle) {
  const parsed = await readXlsxFile(`data/raw/unctad-wir/wir2026/annex/wir26_tab${n}.xlsx`);
  const raw = Array.isArray(parsed[0]) ? parsed : parsed[0].data;
  assert(String(raw[0][0]).includes(expectTitle), `annex table ${n} title is "${raw[0][0]}"`);
  const years = raw[2].slice(1).filter((v) => v !== null).map(Number);
  return { raw, years };
}
const rowFor = ({ raw, years }, label) => {
  const row = raw.slice(3).find((r) => String(r[0]).trim() === label);
  assert(row, `annex row "${label}" not found`);
  return years.map((y, i) => ({ year: y, value: row[i + 1] })).filter((o) => Number.isFinite(o.value));
};

console.log("\nBuild vs buy, and India as an outward investor:");
const mnaTab = await readAnnex("05", "Annex table 5");
const mnaIndia = rowFor(mnaTab, "India");
const mna2025 = mnaIndia.find((o) => o.year === 2025);
assert(mna2025 && mna2025.value < 0, `India 2025 net M&A sales ${mna2025?.value}, expected negative`);
const mnaSnap = await writeSnapshot("unctad", "wir2026_tab05_mna_sales_india",
  { years: [mnaIndia[0].year, mnaIndia.at(-1).year], india2024: mnaIndia.find((o) => o.year === 2024)?.value,
    india2025: mna2025.value, file: "wir26_tab05.xlsx" });
await series({ sourceId: "unctad", sourceUrl: GREENFIELD_PAGE, snapshot: mnaSnap,
  id: "extfin.fdi.dev.mna_sales.IN.usd",
  title: "Foreign purchases of Indian companies (net cross-border M&A sales)", unit: "USD million",
  obs: mnaIndia.map((o) => ({ date: yearEnd(o.year), value: r2(o.value) })),
  geography: { type: "country", id: "IND", name: "India" },
  name: "unctad-wir.IND.extfin_fdi_dev_mna_sales",
  metadata: { dataset: "WIR 2026 annex table 5, value of net cross-border M&As by region/economy of seller",
    definition: "Net value of foreign acquisitions of Indian companies. Negative means foreign firms sold more Indian assets than they bought.",
    note: "Deal values, compiled differently from balance-of-payments FDI and NOT a clean subset of it. Use as an indicator of how investment arrives, never as a decomposition of the FDI figure." } });

const gfSrcTab = await readAnnex("13", "Annex table 13");
const gfOut = rowFor(gfSrcTab, "India");
await series({ sourceId: "unctad", sourceUrl: GREENFIELD_PAGE, snapshot: gfSnap,
  id: "extfin.fdi.dev.greenfield_outward.IN.usd",
  title: "Greenfield projects announced abroad by Indian firms", unit: "USD million",
  obs: gfOut.map((o) => ({ date: yearEnd(o.year), value: r2(o.value) })),
  geography: { type: "country", id: "IND", name: "India" },
  name: "unctad-wir.IND.extfin_fdi_dev_greenfield_outward",
  metadata: { dataset: "WIR 2026 annex table 13, value of announced greenfield FDI projects by source",
    note: "Announcements by Indian companies investing overseas. Intentions, not recorded flows." } });

// Top 100 non-financial MNEs. Table 19 is the world list, table 20 the developing-economy
// list; the home-economy column is located by finding a known label rather than hard-coded.
async function mneCounts(n, expectTitle) {
  const parsed = await readXlsxFile(`data/raw/unctad-wir/wir2026/annex/wir26_tab${n}.xlsx`);
  const raw = Array.isArray(parsed[0]) ? parsed : parsed[0].data;
  assert(String(raw[0][0]).includes(expectTitle), `annex table ${n} title is "${raw[0][0]}"`);
  let col = -1;
  for (const r of raw) for (let j = 0; j < r.length; j += 1)
    if (String(r[j]).trim() === "Home economy") { col = j; break; }
  if (col < 0) col = 5;
  const counts = new Map();
  for (const r of raw.slice(4)) {
    const v = r[col] === null || r[col] === undefined ? "" : String(r[col]).trim();
    if (!v || v === "Home economy") continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return counts;
}
const devMne = await mneCounts("20", "Web table 20");
const worldMne = await mneCounts("19", "Web table 19");
assert(devMne.get("India") === 4, `India has ${devMne.get("India")} firms in the developing top 100, expected 4`);
assert(!worldMne.get("India"), "India unexpectedly appears in the world top 100");
assert(devMne.get("China") > 30, "China count in developing top 100 looks wrong");
const mneSnap = await writeSnapshot("unctad", "wir2026_tab19_20_top100_mnes",
  { developingTop100: Object.fromEntries(devMne), worldTop100India: worldMne.get("India") || 0 });
const mneRows = [...devMne.entries()]
  .filter(([e]) => e && e.length > 1)
  .sort((a, b) => b[1] - a[1]).slice(0, 12)
  .map(([economy, value]) => ({ economy, label: economy, value, world_top100: worldMne.get(economy) || 0 }));
await table({ sourceId: "unctad", sourceUrl: GREENFIELD_PAGE, snapshot: mneSnap,
  id: "extfin.fdi.dev.top100_mne_home_economy.count",
  title: "Firms in the top 100 multinationals from developing economies, by home economy",
  unit: "number of firms", rows: mneRows, dimensions: [{ id: "economy", label: "Home economy" }],
  name: "unctad-wir.MULTI.extfin_fdi_dev_top100_mne_home_economy",
  metadata: { dataset: "WIR 2026 web tables 19 and 20, top 100 non-financial MNEs ranked by foreign assets",
    note: `Ranked by foreign assets. India has 4 firms in the developing-economy top 100 and ${worldMne.get("India") || 0} in the world top 100.`,
    vintage: "2025 for the world list, 2024 for the developing list" } });

await mergeSourceManifest("unctad-wir-fdi", manifest);
console.log(`\nWrote ${manifest.length} artifacts for q.econ.fdi_development.`);
console.log(`Snapshots: ${fdiSnap.path}, ${popSnap.path}, ${wbSnap.path}, ${gfSnap.path}`);
