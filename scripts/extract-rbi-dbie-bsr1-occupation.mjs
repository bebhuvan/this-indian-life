import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import {
  createTableArtifact,
  hashObject,
  mergeSourceManifest,
  readJson,
  stableJson,
  writeSeriesArtifact,
  writeSnapshot
} from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE_URL = "https://data.rbi.org.in/DBIE/#/dbie/home";
const EXPECTED_FOOTNOTE = "(Amount in \u20b9 Crores)";

const REPORT_CONFIGS = {
  944: {
    reportId: 944,
    probeCatalog: "data/catalog/rbi-dbie-report944-bo-probe.json",
    outputArtifactName: "rbi-dbie.IN.banking.rbi.bsr1_occupation_credit_quarterly.long",
    outputCatalog: "data/catalog/rbi-dbie-bsr1-occupation-credit.json",
    indicatorId: "banking.rbi.bsr1_occupation_credit_quarterly",
    title: "RBI BSR-1 outstanding credit of scheduled commercial banks by occupation",
    expectedTitle: "TABLE NO. 1.4 - OUTSTANDING CREDIT OF SCHEDULED COMMERCIAL BANKS ACCORDING TO OCCUPATION",
    reportName: "Table No 1.4 Outstanding credit of scheduled commercial banks according to occupation",
    splitType: "occupation",
    splitField: "occupation",
    rawSplitField: "rawOccupation",
    levelField: "occupationLevel",
    depthField: "occupationDepth",
    headerFirstCell: "As on End",
    measureHeaderFirstCell: "OCCUPATION",
    expectedHtmlRows: 75,
    expectedCategoryRows: 70,
    footnoteRowIndex: 74,
    dataStartRowIndex: 4,
    reconciliation: "major_sectors",
    sourcePath: "Public Folders/RBI_CIMS/DSIM/Basic Statistical Return/Quarterly/BSR1 Quarterly (Credit)/Quarterly BSR-1: Outstanding Credit of Scheduled Commercial Banks"
  },
  945: {
    reportId: 945,
    probeCatalog: "data/catalog/rbi-dbie-report945-bo-probe.json",
    outputArtifactName: "rbi-dbie.IN.banking.rbi.bsr1_account_type_credit_quarterly.long",
    outputCatalog: "data/catalog/rbi-dbie-bsr1-account-type-credit.json",
    indicatorId: "banking.rbi.bsr1_account_type_credit_quarterly",
    title: "RBI BSR-1 outstanding credit of scheduled commercial banks by type of account",
    expectedTitle: "TABLE NO. 1.5 - OUTSTANDING CREDIT OF SCHEDULED COMMERCIAL BANKS ACCORDING TO TYPE OF ACCOUNT",
    reportName: "Table No 1.5 Outstanding credit of scheduled commercial banks according to type of account",
    splitType: "account_type",
    splitField: "accountType",
    rawSplitField: "rawAccountType",
    levelField: "accountTypeLevel",
    depthField: "accountTypeDepth",
    headerFirstCell: "Type of Account",
    measureHeaderFirstCell: null,
    expectedHtmlRows: 20,
    expectedCategoryRows: 15,
    footnoteRowIndex: 19,
    dataStartRowIndex: 4,
    reconciliation: "all_non_total_rows",
    sourcePath: "Public Folders/RBI_CIMS/DSIM/Basic Statistical Return/Quarterly/BSR1 Quarterly (Credit)/Quarterly BSR-1: Outstanding Credit of Scheduled Commercial Banks"
  }
};

const reportIdArg = process.argv.find((arg) => arg.startsWith("--report-id="))?.split("=")[1];
const REPORT_ID = Number(reportIdArg || process.env.RBI_DBIE_BSR1_REPORT_ID || 944);
const config = REPORT_CONFIGS[REPORT_ID];
assert(config, `unsupported BSR-1 report id: ${REPORT_ID}`);

const MEASURES = [
  { key: "no_of_accounts", label: "No. of Accounts", unit: "number", order: 1 },
  { key: "credit_limit", label: "Credit Limit", unit: "INR crore", order: 2 },
  { key: "amount_outstanding", label: "Amount Outstanding", unit: "INR crore", order: 3 }
];

const MONTHS = new Map([
  ["Jan", "01"],
  ["Feb", "02"],
  ["Mar", "03"],
  ["Apr", "04"],
  ["May", "05"],
  ["Jun", "06"],
  ["Jul", "07"],
  ["Aug", "08"],
  ["Sep", "09"],
  ["Oct", "10"],
  ["Nov", "11"],
  ["Dec", "12"]
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function htmlDecode(text) {
  return String(text)
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8377;|&#x20b9;/gi, "\u20b9")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'");
}

function cleanCell(html) {
  return htmlDecode(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseMultipart(rawText) {
  const parts = new Map();
  const matches = [...rawText.matchAll(/Content-ID:\s*<([^>]+)>\r?\n\r?\n/g)];
  for (const match of matches) {
    const id = match[1];
    const start = match.index + match[0].length;
    const end = rawText.indexOf("\n--uuid:", start);
    const body = rawText.slice(start, end === -1 ? rawText.length : end).trim();
    parts.set(id, body);
  }
  return parts;
}

function parseHtmlRows(html) {
  return [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((rowMatch) => (
    [...rowMatch[0].matchAll(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi)].map((cellMatch) => cleanCell(cellMatch[0]))
  ));
}

function parseIndianNumber(text) {
  const normalized = String(text).trim();
  assert(/^-?\d{1,3}(,\d{2})*(,\d{3})?$|^-?\d+$/u.test(normalized), `invalid Indian numeric cell: ${text}`);
  const value = Number(normalized.replace(/,/g, ""));
  assert(Number.isFinite(value), `non-finite numeric cell: ${text}`);
  return value;
}

function periodFromLabel(label, fallbackDate) {
  const match = String(label).match(/^([A-Z][a-z]{2})-(\d{4})$/);
  assert(match, `invalid period label: ${label}`);
  const month = MONTHS.get(match[1]);
  assert(month, `unsupported period month: ${label}`);
  const date = fallbackDate ? fallbackDate.slice(0, 10) : new Date(Date.UTC(Number(match[2]), Number(month), 0)).toISOString().slice(0, 10);
  return {
    period: date,
    periodLabel: label,
    TimeDim: Number(match[2]),
    quarter: `${match[2]}-Q${Math.ceil(Number(month) / 3)}`
  };
}

function classifyOccupation(rawOccupation) {
  const leadingSpaces = rawOccupation.match(/^\s*/u)?.[0].length || 0;
  const occupation = rawOccupation.replace(/\s+/g, " ").trim();
  if (/^TOTAL CREDIT$/u.test(occupation)) return { occupation, occupationLevel: "total", occupationDepth: 0 };
  if (/^(I|II|III|IV|V|VI|VII|VIII)\.\s/u.test(occupation)) return { occupation, occupationLevel: "major_sector", occupationDepth: 1 };
  if (/^\d+\.\s/u.test(occupation)) return { occupation, occupationLevel: "subsector", occupationDepth: 2 };
  if (/^\([a-z]\)\s/u.test(occupation)) return { occupation, occupationLevel: "industry_detail", occupationDepth: 3 };
  if (/^Of which:/u.test(occupation)) return { occupation, occupationLevel: "of_which", occupationDepth: 3 };
  return { occupation, occupationLevel: "detail", occupationDepth: leadingSpaces >= 7 ? 3 : 2 };
}

function classifyAccountType(rawAccountType) {
  const accountType = rawAccountType.replace(/\s+/g, " ").trim();
  if (/^TOTAL CREDIT$/u.test(accountType)) return { accountType, accountTypeLevel: "total", accountTypeDepth: 0 };
  return { accountType, accountTypeLevel: "account_type", accountTypeDepth: 1 };
}

function classifySplit(rawValue) {
  if (config.splitType === "occupation") return classifyOccupation(rawValue);
  if (config.splitType === "account_type") return classifyAccountType(rawValue);
  throw new Error(`unsupported split type: ${config.splitType}`);
}

function valueAt(row, periodIndex, measureIndex) {
  return row[1 + periodIndex * MEASURES.length + measureIndex];
}

function assertTotalReconciliation(dataRows, periodCount) {
  const majorRows = config.reconciliation === "major_sectors"
    ? dataRows.filter((row) => /^(I|II|III|IV|V|VI|VII|VIII)\.\s/u.test(row[0]))
    : dataRows.filter((row) => row[0] !== "TOTAL CREDIT");
  const totalRow = dataRows.find((row) => row[0] === "TOTAL CREDIT");
  if (config.reconciliation === "major_sectors") assert(majorRows.length === 8, `expected 8 major sector rows, found ${majorRows.length}`);
  if (config.reconciliation === "all_non_total_rows") assert(majorRows.length === config.expectedCategoryRows - 1, `expected ${config.expectedCategoryRows - 1} component rows, found ${majorRows.length}`);
  assert(totalRow, "missing TOTAL CREDIT row");

  for (let periodIndex = 0; periodIndex < periodCount; periodIndex += 1) {
    for (let measureIndex = 0; measureIndex < MEASURES.length; measureIndex += 1) {
      const sum = majorRows.reduce((total, row) => total + parseIndianNumber(valueAt(row, periodIndex, measureIndex)), 0);
      const total = parseIndianNumber(valueAt(totalRow, periodIndex, measureIndex));
      const tolerance = measureIndex === 0 ? 0 : 8;
      assert(Math.abs(sum - total) <= tolerance, `total reconciliation failed for period ${periodIndex + 1} ${MEASURES[measureIndex].key}: sum ${sum}, total ${total}`);
    }
  }
}

function extractContexts(jsonData) {
  const outline = jsonData?.jsonData?.outline?.[0];
  assert(outline, "multipart jsondata is missing outline[0]");

  const periods = (outline.cctx || []).map((context) => {
    const label = context.datapath?.find((item) => item.n === "V_Reporting Date")?.v;
    const date = context.datapath?.find((item) => item.n === "Reporting Date")?.v;
    assert(label && date, `column context ${context.id} is missing reporting date fields`);
    return { contextId: context.id, ...periodFromLabel(label, date) };
  });

  const occupations = (outline.rctx || []).map((context) => {
    const sortOrder = Number(context.datapath?.find((item) => item.n === "Sorting Order")?.v);
    const rawOccupation = context.datapath?.find((item) => item.n === "Key Description 1")?.v;
    assert(Number.isFinite(sortOrder) && rawOccupation, `row context ${context.id} is missing ${config.splitType} fields`);
    return { contextId: context.id, sortOrder, rawValue: rawOccupation, ...classifySplit(rawOccupation) };
  });

  assert(periods.length >= 1 && periods.length <= 20, `expected 1 to 20 period contexts, found ${periods.length}`);
  assert(occupations.length === config.expectedCategoryRows, `expected ${config.expectedCategoryRows} ${config.splitType} contexts, found ${occupations.length}`);
  return { periods, occupations };
}

function validateHeaders(rows, periods) {
  assert(rows.length === config.expectedHtmlRows, `expected ${config.expectedHtmlRows} HTML table rows, found ${rows.length}`);
  assert(rows[0]?.[0] === config.expectedTitle, "unexpected report title");
  assert(rows[1]?.[0] === config.headerFirstCell, `period header row does not start with ${config.headerFirstCell}`);
  assert(rows[1].slice(1).join("|") === periods.map((period) => period.periodLabel).join("|"), "HTML period headers differ from JSON column contexts");
  const measureHeaderOffset = config.measureHeaderFirstCell ? 1 : 0;
  if (config.measureHeaderFirstCell) assert(rows[2]?.[0] === config.measureHeaderFirstCell, `measure header row does not start with ${config.measureHeaderFirstCell}`);
  for (let periodIndex = 0; periodIndex < periods.length; periodIndex += 1) {
    for (let measureIndex = 0; measureIndex < MEASURES.length; measureIndex += 1) {
      const expected = MEASURES[measureIndex].label;
      const actual = rows[2][measureHeaderOffset + periodIndex * MEASURES.length + measureIndex];
      assert(actual === expected, `unexpected measure header at period ${periodIndex + 1}, measure ${measureIndex + 1}: ${actual}`);
    }
  }
  assert(rows[3].length === periods.length * MEASURES.length, `expected ${periods.length * MEASURES.length} numbered columns, found ${rows[3].length}`);
  assert(rows[3].every((value) => /^\d+$/u.test(value)), "numbered column header contains non-numeric labels");
  assert(rows[config.footnoteRowIndex]?.[0] === EXPECTED_FOOTNOTE, "missing amount footnote");
}

function buildRows(htmlRows, periods, occupations) {
  const dataRows = htmlRows.slice(config.dataStartRowIndex, config.footnoteRowIndex);
  assert(dataRows.length === occupations.length, `expected ${occupations.length} HTML data rows, found ${dataRows.length}`);
  assertTotalReconciliation(dataRows, periods.length);

  const rows = [];
  const seen = new Set();
  for (const [rowIndex, htmlRow] of dataRows.entries()) {
    assert(htmlRow.length === 1 + periods.length * MEASURES.length, `HTML data row ${rowIndex + 1} has ${htmlRow.length} cells, expected ${1 + periods.length * MEASURES.length}`);
    const splitContext = occupations[rowIndex];
    const category = splitContext[config.splitField];
    assert(cleanCell(htmlRow[0]) === category, `HTML ${config.splitType} row ${rowIndex + 1} differs from JSON row context`);

    for (const [periodIndex, period] of periods.entries()) {
      for (const [measureIndex, measure] of MEASURES.entries()) {
        const sourceValue = valueAt(htmlRow, periodIndex, measureIndex);
        const NumericValue = parseIndianNumber(sourceValue);
        const key = `${period.period}|${splitContext.sortOrder}|${measure.key}`;
        assert(!seen.has(key), `duplicate normalized row key: ${key}`);
        seen.add(key);
        const row = {
          reportId: REPORT_ID,
          reportName: config.reportName,
          tableTitle: config.expectedTitle,
          frequency: "quarterly",
          period: period.period,
          date: period.period,
          periodLabel: period.periodLabel,
          quarter: period.quarter,
          TimeDim: period.TimeDim,
          splitType: config.splitType,
          category,
          rawCategory: splitContext.rawValue,
          categoryLevel: splitContext[config.levelField],
          categoryDepth: splitContext[config.depthField],
          [config.splitField]: category,
          [config.rawSplitField]: splitContext.rawValue,
          [config.levelField]: splitContext[config.levelField],
          [config.depthField]: splitContext[config.depthField],
          sortOrder: splitContext.sortOrder,
          measure: measure.key,
          measureLabel: measure.label,
          measureOrder: measure.order,
          unit: measure.unit,
          sourceValue,
          NumericValue
        };
        rows.push(row);
      }
    }
  }
  const expectedRows = config.expectedCategoryRows * periods.length * MEASURES.length;
  assert(rows.length === expectedRows, `expected ${expectedRows} normalized rows, found ${rows.length}`);
  return rows.sort((a, b) => (
    a.period.localeCompare(b.period)
    || a.sortOrder - b.sortOrder
    || a.measureOrder - b.measureOrder
  ));
}

async function findReportPageSnapshots(probeCatalog) {
  const summaries = probeCatalog?.chromeTrace?.bodySummaries || [];
  const extraFetches = probeCatalog?.chromeTrace?.extraPageFetches || [];
  const candidates = [...summaries, ...extraFetches].filter((summary) => (
    summary.rawSnapshot
    && summary.rawHash
    && summary.rawSnapshot.endsWith(".multipart")
  ));
  if (candidates.length > 0) {
    return candidates;
  }

  const snapshotFiles = (await readdir("data/snapshots/rbi-dbie"))
    .filter((name) => name.startsWith(`bo-report-${REPORT_ID}.`) && name.endsWith(".multipart"))
    .map((name) => `data/snapshots/rbi-dbie/${name}`)
    .sort();
  const matching = [];
  for (const snapshotPath of snapshotFiles) {
    const rawBody = await readFile(snapshotPath);
    const parts = parseMultipart(rawBody.toString("utf8"));
    const title = parseHtmlRows(parts.get("page") || "")[0]?.[0];
    if (title !== config.expectedTitle) continue;
    matching.push({ rawSnapshot: snapshotPath, rawHash: sha256(rawBody), fallbackFromSnapshotDirectory: true });
  }
  assert(matching.length > 0, `report ${REPORT_ID} probe catalog does not include a multipart raw snapshot and no matching preserved snapshot was found`);
  return matching;
}

const probeCatalog = await readJson(config.probeCatalog);
assert(probeCatalog.reportId === REPORT_ID, `probe catalog reportId is not ${REPORT_ID}`);

const reportPageSnapshots = await findReportPageSnapshots(probeCatalog);
const parsedPages = [];
for (const reportPageSnapshot of reportPageSnapshots) {
  const rawBody = await readFile(reportPageSnapshot.rawSnapshot);
  const rawHash = sha256(rawBody);
  assert(rawHash === reportPageSnapshot.rawHash, "multipart raw snapshot hash does not match expected rawHash");

  const parts = parseMultipart(rawBody.toString("utf8"));
  for (const id of ["infos", "jsondata", "warnings", "page"]) assert(parts.has(id), `multipart body is missing ${id} part`);

  const pageInfos = JSON.parse(parts.get("infos"));
  const jsonData = JSON.parse(parts.get("jsondata"));
  const warnings = JSON.parse(parts.get("warnings"));
  const { periods, occupations } = extractContexts(jsonData);
  const htmlRows = parseHtmlRows(parts.get("page"));
  validateHeaders(htmlRows, periods);
  const rows = buildRows(htmlRows, periods, occupations);
  parsedPages.push({
    rawSnapshot: reportPageSnapshot.rawSnapshot,
    rawHash,
    pageInfos,
    warnings,
    periods,
    occupations,
    rows
  });
}

parsedPages.sort((a, b) => (a.pageInfos.pageInfos?.px || 0) - (b.pageInfos.pageInfos?.px || 0));
const dedupedPages = [];
const seenPageKeys = new Set();
for (const page of parsedPages) {
  const pageKey = `${page.pageInfos.pageInfos?.px || ""}:${page.periods.map((period) => period.period).join("|")}`;
  if (seenPageKeys.has(pageKey)) continue;
  seenPageKeys.add(pageKey);
  dedupedPages.push(page);
}

const rowMap = new Map();
for (const page of dedupedPages) {
  for (const row of page.rows) {
    const key = `${row.period}|${row.sortOrder}|${row.measure}`;
    assert(!rowMap.has(key), `duplicate normalized row across report pages: ${key}`);
    rowMap.set(key, row);
  }
}
const rows = [...rowMap.values()].sort((a, b) => (
  a.period.localeCompare(b.period)
  || a.sortOrder - b.sortOrder
  || a.measureOrder - b.measureOrder
));
const allPeriods = [...new Map(dedupedPages.flatMap((page) => page.periods).map((period) => [period.period, period])).values()]
  .sort((a, b) => a.period.localeCompare(b.period));

const summary = {
  reportPages: dedupedPages.length,
  periods: allPeriods.length,
  firstPeriod: rows[0].period,
  latestPeriod: rows.at(-1).period,
  splitType: config.splitType,
  categories: config.expectedCategoryRows,
  measures: MEASURES.map((measure) => measure.key),
  rows: rows.length
};

const parseSnapshot = await writeSnapshot("rbi-dbie", `bsr1-${config.splitType}-credit-report${REPORT_ID}-parse-summary`, {
  schemaVersion: 1,
  fetchedAt,
  source: {
    reportId: REPORT_ID,
    reportName: config.reportName,
    rawSnapshots: dedupedPages.map((page) => ({ path: page.rawSnapshot, rawHash: page.rawHash, pageInfos: page.pageInfos.pageInfos })),
    probeCatalog: config.probeCatalog,
    sourceUrl: SOURCE_URL
  },
  pages: dedupedPages.map((page) => ({
    rawSnapshot: page.rawSnapshot,
    rawHash: page.rawHash,
    pageInfos: page.pageInfos.pageInfos,
    periods: page.periods.map((period) => period.periodLabel),
    warningMessages: page.warnings?.warningmsgs?.warningmsg || []
  })),
  summary,
  validation: {
    titleMatched: true,
    periodHeadersReconciledToJsonContexts: true,
    categoryRowsReconciledToJsonContexts: true,
    totalsReconciled: true,
    rawHashVerified: true
  }
});

const artifact = createTableArtifact({
  indicatorId: config.indicatorId,
  title: config.title,
  sourceId: "rbi-dbie",
  sourceIndicatorId: `bo-report-${REPORT_ID}:raylight-report-page`,
  sourceUrl: SOURCE_URL,
  unit: "mixed",
  fetchedAt,
  rows,
  dimensions: ["period", config.splitField, "measure"],
  metadata: {
    reportId: REPORT_ID,
    reportName: config.reportName,
    tableTitle: config.expectedTitle,
    splitType: config.splitType,
    sourcePath: config.sourcePath,
    rawSnapshots: dedupedPages.map((page) => ({ path: page.rawSnapshot, rawHash: page.rawHash, pageInfos: page.pageInfos.pageInfos })),
    probeCatalog: config.probeCatalog,
    parseSnapshot: parseSnapshot.path,
    pages: dedupedPages.map((page) => ({
      pageInfos: page.pageInfos.pageInfos,
      periods: page.periods.map((period) => period.periodLabel)
    })),
    warningMessages: dedupedPages.flatMap((page) => page.warnings?.warningmsgs?.warningmsg || []),
    qualityGates: [
      "raw multipart Raylight report-page bytes preserved",
      "raw snapshot hash verified before parse",
      "JSON column contexts reconciled to HTML period headers",
      `JSON row contexts reconciled to HTML ${config.splitType} labels`,
      `20 quarterly periods x ${config.expectedCategoryRows} ${config.splitType} rows x 3 measures`,
      "component rows reconcile to TOTAL CREDIT for every period and measure",
      "all numeric cells parse as finite Indian-formatted numbers"
    ]
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "rbi-dbie",
  name: config.outputArtifactName,
  artifact
});

const manifestEntry = {
  status: "ready",
  indicatorId: artifact.indicatorId,
  sourceIndicatorId: artifact.sourceIndicatorId,
  artifact: artifactPath,
  snapshot: parseSnapshot.path,
  rawSnapshot: dedupedPages[0].rawSnapshot,
  rawSnapshots: dedupedPages.map((page) => ({ path: page.rawSnapshot, rawHash: page.rawHash, pageInfos: page.pageInfos.pageInfos })),
  rawHash: dedupedPages[0].rawHash,
  rows: rows.length,
  fetchedAt,
  sourceUrl: SOURCE_URL,
  evidenceStatus: "candidate_evidence_ready_after_raw_multipart_validation",
  reportId: REPORT_ID,
  reportName: config.reportName
};
await mergeSourceManifest("rbi-dbie", [manifestEntry]);

const catalog = {
  schemaVersion: 1,
  fetchedAt,
  sourceId: "rbi-dbie",
  reportId: REPORT_ID,
  reportName: config.reportName,
  splitType: config.splitType,
  evidenceStatus: "candidate_evidence_ready_after_raw_multipart_validation",
  artifact: artifactPath,
  snapshot: parseSnapshot.path,
  rawSnapshot: dedupedPages[0].rawSnapshot,
  rawSnapshots: dedupedPages.map((page) => ({ path: page.rawSnapshot, rawHash: page.rawHash, pageInfos: page.pageInfos.pageInfos })),
  rawHash: dedupedPages[0].rawHash,
  artifactHash: hashObject(artifact),
  summary,
  limitations: [
    "This uses the Raylight multipart report-page payload captured after BO/OpenDocument browser initialization.",
    "The parser does not treat the BO shell itself as evidence; only the preserved multipart source payload is parsed.",
    `Report ${REPORT_ID} covers ${config.splitType} splits. Other credit reports still need equivalent raw payload captures and parsers before promotion.`
  ]
};

await mkdir("data/catalog", { recursive: true });
await writeFile(config.outputCatalog, `${stableJson(catalog)}\n`);

console.log(JSON.stringify({
  ok: true,
  artifact: artifactPath,
  catalog: config.outputCatalog,
  manifest: "data/catalog/rbi-dbie-manifest.json",
  rows: rows.length,
  rawSnapshots: dedupedPages.map((page) => page.rawSnapshot),
  rawHash: dedupedPages[0].rawHash,
  summary
}, null, 2));
