// Ingest RBI "Sectoral Deployment of Bank Credit" (SIBC) monthly press-release archive
// into a stitched time series (Statement 1: major sectors + Personal Loans sub-items;
// Statement 2: industry-wise). Node-only: scrapes rbi.org.in press releases (2010->now),
// downloads each month's SIBC .xlsx, and ingests every "Outstanding as on" column.
import readWorkbook from "read-excel-file/node";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { createTableArtifact, mergeSourceManifest, writeSeriesArtifact, writeSnapshot, writeRawSnapshot } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const execFileAsync = promisify(execFile);
const UA = {
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125 Safari/537.36 Indica RBI archive ingest",
  "accept-language": "en-US,en;q=0.9"
};
const XLSX_HEADERS = {
  ...UA,
  accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*"
};
const LIST_URL = "https://rbi.org.in/Scripts/Data_Sectoral_Deployment.aspx";
const PR_URL = (prid) => `https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=${prid}`;
const YEARS = [];
for (let y = 2026; y >= 2010; y -= 1) YEARS.push(String(y));
const MONTHS = { january: "01", february: "02", march: "03", april: "04", may: "05", june: "06", july: "07", august: "08", september: "09", october: "10", november: "11", december: "12" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getText(url, opts = {}) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const r = await fetch(url, { ...opts, headers: { ...UA, ...(opts.headers || {}) } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { text: await r.text(), setCookie: r.headers.get("set-cookie") || "" };
    } catch (e) { if (attempt === 2) throw e; await sleep(1500); }
  }
}

function field(html, name) { const m = html.match(new RegExp(`id="${name}"[^>]*value="([^"]*)"`)); return m ? m[1] : ""; }
function titleToMonth(title) {
  const m = title.match(/–\s*([A-Za-z]+)\s+(\d{4})/) || title.match(/\b([A-Za-z]+)\s+(\d{4})\b/);
  if (!m) return null;
  const mm = MONTHS[m[1].toLowerCase()]; if (!mm) return null;
  return `${m[2]}-${mm}`;
}

async function listReleases() {
  const { text: html, setCookie } = await getText(LIST_URL);
  const cookie = setCookie.split(";")[0];
  const vs = field(html, "__VIEWSTATE"), vg = field(html, "__VIEWSTATEGENERATOR"), ev = field(html, "__EVENTVALIDATION");
  const btnM = html.match(/<input[^>]*type="submit"[^>]*name="([^"]+)"|<input[^>]*name="([^"]+)"[^>]*type="submit"/);
  const btnName = btnM ? (btnM[1] || btnM[2]) : "UsrFontCntr$btn";
  const releases = new Map();
  const harvest = (h) => {
    for (const m of h.matchAll(/prid=(\d+)[^>]*>\s*([^<]*Sectoral Deployment of Bank Credit[^<]*)/gi)) {
      const prid = m[1];
      const title = m[2].trim();
      const period = titleToMonth(title);
      if (period && !releases.has(period)) releases.set(period, { prid, period, title });
    }
  };
  harvest(html);
  for (const year of YEARS) {
    const form = new URLSearchParams({ __VIEWSTATE: vs, __VIEWSTATEGENERATOR: vg, __EVENTVALIDATION: ev, hdnYear: year, [btnName]: "" });
    try {
      const { text: h2 } = await getText(LIST_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie }, body: form.toString() });
      harvest(h2);
    } catch (e) { console.error(`year ${year}: ${e.message}`); }
    await sleep(300);
  }
  return [...releases.values()].sort((a, b) => a.period.localeCompare(b.period));
}

async function fileUrlForPrid(prid) {
  const { text } = await getText(PR_URL(prid));
  const xlsx = [...text.matchAll(/https?:\/\/[^"'> ]+\.xlsx/gi)].map((m) => m[0]);
  const xls = [...text.matchAll(/https?:\/\/[^"'> ]+\.xls\b/gi)].map((m) => m[0]);
  const files = [...xlsx, ...xls];
  const pick = files.find((u) => /SIBC/i.test(u)) || files.find((u) => /\/docs\//i.test(u)) || files[0];
  return pick || null;
}

// ---- workbook parsing ----
const DATE_RE = /^(?:\d{1,2}\.[A-Za-z]{3,9}|[A-Za-z]{3,9}\.\d{1,2}),?\s*\d{4}$/;
function clean(v) { if (v == null) return null; if (v instanceof Date) return v.toISOString().slice(0, 10); const t = String(v).replace(/\s+/g, " ").trim(); return t || null; }
function num(v) { if (typeof v === "number" && Number.isFinite(v)) return v; const t = clean(v); if (!t) return null; const n = Number(t.replace(/,/g, "")); return Number.isFinite(n) ? n : null; }

const ROMAN_RE = /^[IVX]+$/i;
function normalizeSeriesName(value) {
  return String(value || "")
    .replace(/\s+of which,?$/i, "")
    .replace(/([A-Za-z)])\d+$/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function labelParts(rawLabel) {
  const m = rawLabel.match(/^([IVX]+\.|\d+(?:\.\d+)*\.?|\([ivx]+\)|\([a-z]\))\s*(.*)$/);
  if (m) return { code: m[1].replace(/\.$/, ""), name: m[2].trim() || rawLabel };
  return { code: null, name: rawLabel };
}

function codeLike(value) {
  const t = clean(value);
  return Boolean(t && (/^[IVX]+$/i.test(t) || /^\d+(?:\.\d+)*$/.test(t) || /^\([^)]+\)$/.test(t)));
}

function rowLabel(row) {
  const first = clean(row[0]);
  if (!first) return null;
  if (codeLike(first)) {
    const label = clean(row[1]) || clean(row[2]);
    if (label && !DATE_RE.test(label) && !/^%$/.test(label)) return `${first}. ${label}`;
  }
  return first;
}

function codeDepth(code) {
  if (!code) return 0;
  if (ROMAN_RE.test(code)) return 1;
  if (/^\([^)]+\)$/.test(code)) return 2;
  if (/^\d/.test(code)) return String(code).split(".").length;
  return 0;
}

function parentCode(code) {
  if (!code) return null;
  if (/^\d+\.\d/.test(code)) return code.split(".").slice(0, -1).join(".");
  return null;
}

function sectionFor(statementName, code, label, activeMemoSection) {
  if (activeMemoSection) return activeMemoSection;
  if (statementName === "industry") return "industry";
  if (ROMAN_RE.test(code || "")) return "bank_credit_totals";
  if (/^\d/.test(code || "")) {
    const top = String(code).split(".")[0];
    return ({ "1": "agriculture", "2": "industry", "3": "services", "4": "personal_loans" })[top] || "sectoral_credit";
  }
  if (/priority sector/i.test(label || "")) return "priority_sector_memo";
  return "other";
}

function slug(s) { return String(s).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 90); }

function seriesKeyFor(statement, section, code, canonical) {
  const codePart = code ? slug(String(code).replace(/[()]/g, "")) : "uncoded";
  return `rbi_sibc_deployment.${statement}.${section}.${codePart}.${slug(canonical)}`;
}

const MON3 = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
function asOnToDate(asOn) {
  const text = String(asOn || "");
  let m = text.match(/^(\d{1,2})\.([A-Za-z]{3})[A-Za-z]*,?\s*(\d{4})$/);
  if (m) {
    const mm = MON3[m[2].toLowerCase()];
    return mm ? `${m[3]}-${mm}-${m[1].padStart(2, "0")}` : null;
  }
  m = text.match(/^([A-Za-z]{3})[A-Za-z]*\.(\d{1,2}),?\s*(\d{4})$/);
  if (m) {
    const mm = MON3[m[1].toLowerCase()];
    return mm ? `${m[3]}-${mm}-${m[2].padStart(2, "0")}` : null;
  }
  return null;
}

function asOnToPeriod(asOn) {
  const date = asOnToDate(asOn);
  return date ? date.slice(0, 7) : null;
}

function noteRows(matrix) {
  const notes = [];
  for (const [idx, row] of matrix.entries()) {
    const label = clean(row[0]);
    if (!label) continue;
    if (/^(notes?:|\(\d+\)|\d+\s|since\b|with effect\b)/i.test(label)) notes.push({ row: idx + 1, text: label });
  }
  return notes;
}

function parseStatement(matrix, statementName) {
  const unitText = matrix.slice(0, 4).flat().map(clean).filter(Boolean).join(" ");
  const sourceUnit = /billion/i.test(unitText) ? "Rs. billion" : /crore/i.test(unitText) ? "Rs. crore" : "unknown";
  const unitMultiplierToCrore = sourceUnit === "Rs. billion" ? 100 : 1;
  // Outstanding columns are columns where any header cell is a bare date (no "/").
  const dateCols = new Set();
  for (const row of matrix.slice(0, 12)) {
    row.forEach((cell, c) => { const t = clean(cell); if (t && DATE_RE.test(t) && !t.includes("/")) dateCols.add(c); });
  }
  if (!dateCols.size) return [];
  const datesByCol = new Map();
  for (const col of dateCols) {
    let date = null;
    for (const row of matrix.slice(0, 12)) {
      const t = clean(row[col]);
      if (t && DATE_RE.test(t)) date = t;
    }
    if (date) datesByCol.set(col, date);
  }
  const out = [];
  let activeMemoSection = null;
  for (const [idx, row] of matrix.entries()) {
    const label = rowLabel(row);
    if (!label) continue;
    if (/^%$/.test(label)) continue;
    if (/priority sector/i.test(label) && datesByCol.size && [...datesByCol.keys()].every((col) => num(row[col]) == null)) {
      activeMemoSection = "priority_sector_memo";
      continue;
    }
    if (/^note|^\(\d+\)|^\d+\s|provisional|with effect|since\s/i.test(label) && !/^\d+(\.\d+)*\.?\s/.test(label)) continue;
    const { code, name } = labelParts(label);
    const canonical = normalizeSeriesName(name);
    const section = sectionFor(statementName, code, label, activeMemoSection);
    for (const [col, asOn] of datesByCol.entries()) {
      const v = num(row[col]);
      if (v == null) continue;
      out.push({
        statement: statementName,
        sourceRow: idx + 1,
        sourceColumn: col + 1,
        section,
        code,
        parentCode: parentCode(code),
        hierarchyDepth: codeDepth(code),
        rawLabel: label,
        series: canonical,
        value: v * unitMultiplierToCrore,
        sourceValue: v,
        sourceUnit,
        unitMultiplierToCrore,
        asOn,
        asOnDate: asOnToDate(asOn)
      });
    }
  }
  return out;
}

function parseSheets(sheets, fallbackPeriod) {
  const rows = [];
  const structures = [];
  for (const sh of sheets) {
    const name = sh.sheet;
    const sheetHeader = sh.data.slice(0, 4).flat().map(clean).filter(Boolean).join(" ");
    const stmt = /statement\s*(2|ii)|industry-wise/i.test(`${name} ${sheetHeader}`)
      ? "industry"
      : /statement\s*(1|i):|deployment of gross bank credit by major sectors/i.test(`${name} ${sheetHeader}`)
        ? "sectors"
        : null;
    if (!stmt) continue;
    const parsed = parseStatement(sh.data, stmt);
    structures.push({
      sheet: name,
      statement: stmt,
      parsedRows: parsed.length,
      lineItems: [...new Map(parsed.map((r) => [seriesKeyFor(r.statement, r.section, r.code, r.series), {
        sourceRow: r.sourceRow,
        section: r.section,
        code: r.code,
        parentCode: r.parentCode,
        hierarchyDepth: r.hierarchyDepth,
        series: r.series,
        rawLabel: r.rawLabel
      }])).values()],
      notes: noteRows(sh.data)
    });
    for (const r2 of parsed) {
      const period = asOnToPeriod(r2.asOn) || fallbackPeriod;
      if (!period) continue;
      rows.push({
        datasetKey: "rbi_sibc_deployment",
        statement: r2.statement,
        section: r2.section,
        frequency: "monthly",
        period,
        date: r2.asOnDate,
        asOn: r2.asOn,
        sourceReleasePeriod: fallbackPeriod,
        sourceRow: r2.sourceRow,
        sourceColumn: r2.sourceColumn,
        code: r2.code,
        parentCode: r2.parentCode,
        hierarchyDepth: r2.hierarchyDepth,
        series: r2.series,
        rawLabel: r2.rawLabel,
        seriesKey: seriesKeyFor(r2.statement, r2.section, r2.code, r2.series),
        unit: "INR crore",
        sourceValue: r2.sourceValue,
        sourceUnit: r2.sourceUnit,
        unitMultiplierToCrore: r2.unitMultiplierToCrore,
        NumericValue: r2.value
      });
    }
  }
  return { rows, structures };
}

async function parseBuffer(buf, fallbackPeriod) {
  if (buf.slice(0, 2).toString() !== "PK") throw new Error("not xlsx/zip");
  const sheets = await readWorkbook(buf, { getSheets: true });
  return parseSheets(sheets, fallbackPeriod);
}

function safeTmpName(url) {
  return String(url || "sibc.xls").split("/").pop().replace(/[^A-Za-z0-9_.-]+/g, "_") || "sibc.xls";
}

async function parseLegacyXls(buf, url, fallbackPeriod) {
  const dir = await mkdtemp(`${tmpdir()}/indica-sibc-xls-`);
  const input = `${dir}/${safeTmpName(url).replace(/\.xlsx?$/i, "")}.xls`;
  try {
    await writeFile(input, buf);
    const script = `
import json, sys, xlrd
book = xlrd.open_workbook(sys.argv[1])
out = []
for sh in book.sheets():
    data = []
    for r in range(sh.nrows):
        row = []
        for c in range(sh.ncols):
            v = sh.cell_value(r, c)
            if v == "":
                row.append(None)
            else:
                row.append(v)
        data.append(row)
    out.append({"sheet": sh.name, "data": data})
print(json.dumps(out))
`;
    const { stdout } = await execFileAsync("python3", ["-c", script, input], { timeout: 90000, maxBuffer: 50 * 1024 * 1024 });
    return parseSheets(JSON.parse(stdout), fallbackPeriod);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function parseFile(url, period, prid) {
  const r = await fetch(url, { headers: { ...XLSX_HEADERS, referer: PR_URL(prid) } });
  if (!r.ok) throw new Error(`download ${r.status}`);
  const rawBuf = Buffer.from(await r.arrayBuffer());
  let buf = rawBuf;
  let convertedFrom = null;
  let parsed = null;
  if (buf.slice(0, 8).toString("hex") === "d0cf11e0a1b11ae1") {
    convertedFrom = "xls";
    parsed = await parseLegacyXls(buf, url, period);
  }
  if (!parsed && buf.slice(0, 2).toString() !== "PK") {
    const preview = buf.slice(0, 160).toString().replace(/\s+/g, " ").trim();
    throw new Error(`not xlsx/zip (${r.headers.get("content-type") || "unknown content-type"}; ${preview})`);
  }
  parsed ||= await parseBuffer(buf, period);
  return { ...parsed, buf: rawBuf, convertedFrom };
}

function monthNumber(period) {
  const m = String(period || "").match(/^(\d{4})-(\d{2})$/);
  return m ? Number(m[1]) * 12 + Number(m[2]) : null;
}

function periodFromMonthNumber(n) {
  const y = Math.floor((n - 1) / 12);
  const m = ((n - 1) % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function buildStructureAudit(rows, fileLog) {
  const bySeries = new Map();
  for (const r of rows) {
    if (!bySeries.has(r.seriesKey)) {
      bySeries.set(r.seriesKey, {
        statement: r.statement,
        section: r.section,
        code: r.code,
        parentCode: r.parentCode,
        hierarchyDepth: r.hierarchyDepth,
        seriesKey: r.seriesKey,
        labels: new Set(),
        rawLabels: new Set(),
        periods: new Set(),
        dates: new Set()
      });
    }
    const s = bySeries.get(r.seriesKey);
    s.labels.add(r.series);
    s.rawLabels.add(r.rawLabel);
    s.periods.add(r.period);
    if (r.date) s.dates.add(r.date);
  }

  const seriesCoverage = [...bySeries.values()].map((s) => {
    const periods = [...s.periods].sort();
    const firstN = monthNumber(periods[0]);
    const lastN = monthNumber(periods.at(-1));
    const missingPeriods = [];
    if (firstN && lastN) {
      for (let n = firstN; n <= lastN; n += 1) {
        const p = periodFromMonthNumber(n);
        if (!s.periods.has(p)) missingPeriods.push(p);
      }
    }
    return {
      statement: s.statement,
      section: s.section,
      code: s.code,
      parentCode: s.parentCode,
      hierarchyDepth: s.hierarchyDepth,
      seriesKey: s.seriesKey,
      series: [...s.labels].sort()[0],
      labelsObserved: [...s.labels].sort(),
      rawLabelsObserved: [...s.rawLabels].sort(),
      observations: periods.length,
      firstPeriod: periods[0],
      lastPeriod: periods.at(-1),
      firstDate: [...s.dates].sort()[0] || null,
      lastDate: [...s.dates].sort().at(-1) || null,
      missingPeriods,
      continuityStatus: missingPeriods.length ? "has_gaps" : "continuous_observed_span",
      labelStatus: s.labels.size > 1 || s.rawLabels.size > 1 ? "label_changed_or_footnote_changed" : "stable_label"
    };
  }).sort((a, b) => a.statement.localeCompare(b.statement) || a.section.localeCompare(b.section) || String(a.code).localeCompare(String(b.code)));

  const periodStructures = [];
  const byPeriodStatement = new Map();
  for (const r of rows) {
    const key = `${r.period}|${r.statement}`;
    if (!byPeriodStatement.has(key)) byPeriodStatement.set(key, { period: r.period, statement: r.statement, seriesKeys: new Set(), sections: new Map() });
    const item = byPeriodStatement.get(key);
    item.seriesKeys.add(r.seriesKey);
    item.sections.set(r.section, (item.sections.get(r.section) || 0) + 1);
  }
  for (const p of byPeriodStatement.values()) {
    periodStructures.push({
      period: p.period,
      statement: p.statement,
      lineItems: p.seriesKeys.size,
      sections: Object.fromEntries([...p.sections.entries()].sort())
    });
  }
  periodStructures.sort((a, b) => a.period.localeCompare(b.period) || a.statement.localeCompare(b.statement));

  const methodologyNotes = [];
  for (const f of fileLog) {
    for (const structure of f.structures || []) {
      for (const note of structure.notes || []) {
        if (/\b(with effect|since|changed|classification|definition|provisional)\b/i.test(note.text)) {
          methodologyNotes.push({
            file: f.file,
            url: f.url,
            releasePeriod: f.period,
            sheet: structure.sheet,
            statement: structure.statement,
            row: note.row,
            text: note.text
          });
        }
      }
    }
  }

  return {
    schemaVersion: 1,
    generatedAt: fetchedAt,
    sourceId: "rbi-sibc",
    purpose: "Track line-item coverage, label drift, gaps, and RBI methodology notes for SIBC monthly credit composition data.",
    summary: {
      rows: rows.length,
      series: seriesCoverage.length,
      periods: new Set(rows.map((r) => r.period)).size,
      filesOk: fileLog.filter((f) => f.status === "ok").length,
      filesTotal: fileLog.length,
      seriesWithGaps: seriesCoverage.filter((s) => s.continuityStatus === "has_gaps").length,
      seriesWithLabelChanges: seriesCoverage.filter((s) => s.labelStatus !== "stable_label").length,
      methodologyNotes: methodologyNotes.length
    },
    methodologyNotes,
    periodStructures,
    seriesCoverage
  };
}

// ---- run ----
// Mode A (default): scrape RBI press-release archive (NOTE: file CDN rbidocs.rbi.org.in is
//   bot-protected and blocks automated xlsx downloads — this mode currently yields 0 rows).
// Mode B: --local <dir>  parse all .xlsx already on disk (period derived from each file's
//   latest "as on" column). Use this with SIBC files downloaded via a real browser.
const localIdx = process.argv.indexOf("--local");
let allRows = [];
const fileLog = [];
let snapKeep = null;
if (localIdx !== -1) {
  const dir = process.argv[localIdx + 1];
  const files = (await readdir(dir)).filter((f) => /\.xlsx?$/i.test(f)).sort();
  console.error(`local mode: ${files.length} xls/xlsx in ${dir}`);
  for (const f of files) {
    try {
      const rawBuf = await readFile(`${dir}/${f}`);
      const convertedFrom = rawBuf.slice(0, 8).toString("hex") === "d0cf11e0a1b11ae1" ? "xls" : null;
      const { rows, structures } = convertedFrom ? await parseLegacyXls(rawBuf, f, null) : await parseBuffer(rawBuf, null);
      if (!rows.length) { fileLog.push({ file: f, status: "parsed-0-rows" }); continue; }
      allRows = allRows.concat(rows);
      const months = [...new Set(rows.map((r) => r.period))].sort();
      for (const r of rows) {
        r.sourceFile = f;
        r.sourceReleasePeriod ||= months.at(-1);
      }
      fileLog.push({ file: f, status: "ok", rows: rows.length, months, convertedFrom, structures });
      snapKeep = { buf: rawBuf, url: f, extension: convertedFrom || "xlsx" };
      console.error(`${f}: ${rows.length} rows (${months.join(",")})`);
    } catch (e) { fileLog.push({ file: f, status: `err: ${e.message}` }); console.error(`${f}: ${e.message}`); }
  }
} else {
  const releases = await listReleases();
  console.error(`found ${releases.length} monthly releases: ${releases[0]?.period} -> ${releases.at(-1)?.period}`);
  for (const rel of releases) {
    try {
      const url = await fileUrlForPrid(rel.prid);
      if (!url) { fileLog.push({ ...rel, status: "no-xlsx" }); continue; }
      const { rows, structures, buf, convertedFrom } = await parseFile(url, rel.period, rel.prid);
      if (!rows.length) { fileLog.push({ ...rel, url, status: "parsed-0-rows" }); continue; }
      for (const r of rows) {
        r.sourceReleasePeriod = rel.period;
        r.sourceReleaseTitle = rel.title;
        r.sourcePrid = rel.prid;
        r.sourceUrl = url;
      }
      allRows = allRows.concat(rows);
      fileLog.push({ ...rel, url, status: "ok", rows: rows.length, convertedFrom, structures });
      snapKeep = { buf, url, extension: convertedFrom || "xlsx" };
      console.error(`${rel.period}: ${rows.length} rows`);
    } catch (e) { fileLog.push({ ...rel, status: `err: ${e.message}` }); console.error(`${rel.period}: ${e.message}`); }
    await sleep(250);
  }
}
if (!allRows.length) { console.error("No rows ingested. If using the archive, the file CDN is bot-blocked — download SIBC .xlsx files via a browser and re-run with --local <dir>."); process.exit(2); }

// Dedupe: one observation per exact date. Overlapping releases repeat comparison months.
const dedup = new Map();
for (const r of allRows) dedup.set(`${r.statement}|${r.seriesKey}|${r.date || r.period}`, r);
allRows = [...dedup.values()];
allRows.sort((a, b) => a.statement.localeCompare(b.statement) || a.seriesKey.localeCompare(b.seriesKey) || String(a.date || a.period).localeCompare(String(b.date || b.period)));
const periods = [...new Set(allRows.map((r) => r.period))].sort();
const seriesByStmt = {};
for (const r of allRows) (seriesByStmt[r.statement] ||= new Set()).add(r.series);
const structureAudit = buildStructureAudit(allRows, fileLog);
await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/rbi-sibc-structure-audit.json", `${JSON.stringify(structureAudit, null, 2)}\n`);
const summary = {
  rows: allRows.length, periods: periods.length, firstPeriod: periods[0], lastPeriod: periods.at(-1),
  filesOk: fileLog.filter((f) => f.status === "ok").length, filesTotal: fileLog.length,
  filesSkipped: fileLog.filter((f) => f.status !== "ok").map((f) => `${f.period}:${f.status}`),
  seriesCounts: Object.fromEntries(Object.entries(seriesByStmt).map(([k, v]) => [k, v.size])),
  structureAudit: "data/catalog/rbi-sibc-structure-audit.json",
  methodologyNotes: structureAudit.summary.methodologyNotes,
  seriesWithGaps: structureAudit.summary.seriesWithGaps,
  seriesWithLabelChanges: structureAudit.summary.seriesWithLabelChanges
};

let rawSnap = null;
if (snapKeep) rawSnap = await writeRawSnapshot("rbi-sibc", "sibc-latest-release", snapKeep.buf, snapKeep.extension || "xlsx");
const snapshot = await writeSnapshot("rbi-sibc", "sibc-deployment-parse-summary", { schemaVersion: 1, fetchedAt, listUrl: LIST_URL, latestFile: snapKeep?.url, rawSnapshot: rawSnap?.path, fileLog, summary });

const artifact = createTableArtifact({
  indicatorId: "banking.rbi.sibc_sectoral_deployment_monthly",
  title: "RBI Sectoral Deployment of Bank Credit (SIBC) — monthly, by sector and industry",
  sourceId: "rbi-sibc",
  sourceIndicatorId: "rbi.org.in/Data_Sectoral_Deployment:SIBC-press-release-archive",
  sourceUrl: LIST_URL,
  unit: "INR crore",
  fetchedAt,
  rows: allRows,
  dimensions: ["statement", "section", "series", "frequency", "period"],
  metadata: {
    method: "Scrape monthly SIBC press releases; ingest every 'Outstanding as on' column per file; preserve exact as-on date and source release month.",
    parseSnapshot: snapshot.path,
    latestRawSnapshot: rawSnap?.path,
    structureAudit: "data/catalog/rbi-sibc-structure-audit.json",
    fileLog
  }
});
const artifactPath = await writeSeriesArtifact({ sourceId: "rbi-sibc", name: "rbi-sibc.IN.banking.rbi.sectoral_deployment_monthly.long", artifact });
await mergeSourceManifest("rbi-sibc", [{ status: "ready", indicatorId: artifact.indicatorId, sourceIndicatorId: artifact.sourceIndicatorId, artifact: artifactPath, snapshot: snapshot.path, structureAudit: "data/catalog/rbi-sibc-structure-audit.json", rows: allRows.length, fetchedAt, sourceUrl: LIST_URL, evidenceStatus: "evidence_ready_press_release_archive" }]);

console.log(JSON.stringify({ ok: true, artifact: artifactPath, summary }, null, 2));
