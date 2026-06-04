import { writeFile } from "node:fs/promises";
import { fetchDbieReportLink, fetchDbieSession } from "./adapters/rbi-dbie.mjs";
import { readJson, stableJson } from "./core/artifacts.mjs";

const PROBE = process.argv.includes("--probe-links");

const THEMES = [
  {
    themeId: "credit_backbone",
    title: "How much credit is outstanding?",
    priority: "v1",
    patterns: [/bank credit/i, /non-food credit/i, /credit to the commercial sector/i, /commercial bank survey/i, /scheduled commercial banks - business/i]
  },
  {
    themeId: "borrower_major_sector",
    title: "Which broad sectors borrow?",
    priority: "v1",
    patterns: [/deployment of gross bank credit by major sectors/i, /deployment of bank credit by major sectors/i]
  },
  {
    themeId: "industry_detail",
    title: "Which industries borrow?",
    priority: "v1",
    patterns: [/industry-wise deployment/i]
  },
  {
    themeId: "personal_housing",
    title: "How much is personal and housing credit?",
    priority: "v1",
    patterns: [/personal loans/i, /housing/i]
  },
  {
    themeId: "occupation",
    title: "Who borrows by occupation?",
    priority: "v1_plus",
    patterns: [/according to occupation/i]
  },
  {
    themeId: "account_type",
    title: "What forms do loans take?",
    priority: "v1_plus",
    patterns: [/type of account/i]
  },
  {
    themeId: "credit_limit_size",
    title: "How concentrated is borrowing by loan size?",
    priority: "v1_plus",
    patterns: [/size of credit limit/i, /large borrowal/i]
  },
  {
    themeId: "interest_rate_range",
    title: "What rates do borrowers pay?",
    priority: "v1_plus",
    patterns: [/interest rate range/i]
  },
  {
    themeId: "state_district",
    title: "Where is credit concentrated?",
    priority: "v1_plus",
    patterns: [/state-wise.*credit/i, /district-wise.*credit/i, /spatial distribution.*credit/i]
  },
  {
    themeId: "gender_individuals",
    title: "Who borrows by gender?",
    priority: "v1_plus",
    patterns: [/gender wise outstanding credit/i, /outstanding credit to individuals/i]
  },
  {
    themeId: "small_borrowal",
    title: "What share is small borrower credit?",
    priority: "later",
    patterns: [/small borrowal/i]
  },
  {
    themeId: "asset_quality",
    title: "How risky is bank lending?",
    priority: "context",
    patterns: [/non-performing assets/i, /\bNPA\b/i, /gross advances/i]
  },
  {
    themeId: "non_bank_credit",
    title: "What lies outside banks?",
    priority: "later",
    patterns: [/nbfc/i, /non-banking/i, /financial institutions/i]
  },
  {
    themeId: "external_borrowing",
    title: "How does India borrow abroad?",
    priority: "context",
    patterns: [/external commercial borrowings/i, /external debt/i]
  }
];

const EXACT_TARGETS = new Map([
  [40, { themeId: "borrower_major_sector", articleValue: "core", adapterPriority: 1 }],
  [44, { themeId: "industry_detail", articleValue: "core", adapterPriority: 1 }],
  [540, { themeId: "industry_detail", articleValue: "core", adapterPriority: 1 }],
  [541, { themeId: "borrower_major_sector", articleValue: "core", adapterPriority: 2 }],
  [944, { themeId: "occupation", articleValue: "high", adapterPriority: 3 }],
  [945, { themeId: "account_type", articleValue: "high", adapterPriority: 4 }],
  [947, { themeId: "credit_limit_size", articleValue: "high", adapterPriority: 4 }],
  [948, { themeId: "interest_rate_range", articleValue: "high", adapterPriority: 4 }],
  [954, { themeId: "interest_rate_range", articleValue: "high", adapterPriority: 5 }],
  [955, { themeId: "interest_rate_range", articleValue: "high", adapterPriority: 5 }],
  [959, { themeId: "interest_rate_range", articleValue: "high", adapterPriority: 5 }],
  [963, { themeId: "state_district", articleValue: "high", adapterPriority: 6 }],
  [1085, { themeId: "credit_limit_size", articleValue: "high", adapterPriority: 4 }],
  [1086, { themeId: "account_type", articleValue: "high", adapterPriority: 4 }],
  [1129, { themeId: "interest_rate_range", articleValue: "high", adapterPriority: 5 }],
  [1153, { themeId: "state_district", articleValue: "high", adapterPriority: 6 }],
  [1456, { themeId: "state_district", articleValue: "high", adapterPriority: 6 }],
  [1553, { themeId: "gender_individuals", articleValue: "high", adapterPriority: 7 }],
  [1555, { themeId: "gender_individuals", articleValue: "high", adapterPriority: 7 }]
]);

function textFor(report) {
  return [
    report.reportName,
    report.menuDescription,
    report.section,
    report.subSection,
    report.frequency
  ].filter(Boolean).join(" ");
}

function classifyTheme(report) {
  const exact = EXACT_TARGETS.get(report.reportId);
  if (exact) return exact.themeId;
  const text = textFor(report);
  for (const theme of THEMES) {
    if (theme.patterns.some((pattern) => pattern.test(text))) return theme.themeId;
  }
  return null;
}

function classifyAccess(report, probe) {
  if (probe?.sapLink) return "businessobjects_viewer_link";
  if (/Monthly RBI Bulletin|Handbook|Banking - Sectoral Statistics|Monetary Statistics/.test(report.menuDescription || "")) return "report_gateway_unprobed";
  if (/Basic Statistical Return/.test(report.menuDescription || "")) return "bsr_report_gateway_unprobed";
  return "inventory_only_unprobed";
}

function evidenceStatus(accessMode) {
  if (accessMode === "derived_series") return "evidence_ready";
  if (accessMode === "businessobjects_viewer_link") return "discovery_only";
  return "adapter_needed";
}

const inventory = await readJson("data/catalog/rbi-dbie-report-inventory.json");
const derived = await readJson("data/catalog/rbi-dbie-derived-series.json");
const reports = inventory.reports || [];

const existingSeries = derived.series
  .filter((series) => series.indicatorId.startsWith("banking.rbi."))
  .map((series) => ({
    indicatorId: series.indicatorId,
    title: series.title,
    frequency: series.frequency,
    unit: series.unit,
    observations: series.observations,
    firstPeriod: series.firstPeriod,
    latestPeriod: series.latestPeriod,
    latestValue: series.latestValue,
    artifact: series.artifact,
    accessMode: "derived_series",
    evidenceStatus: "evidence_ready"
  }));

const candidateReports = reports
  .map((report) => {
    const exact = EXACT_TARGETS.get(report.reportId) || {};
    const themeId = exact.themeId || classifyTheme(report);
    if (!themeId) return null;
    const theme = THEMES.find((item) => item.themeId === themeId);
    return {
      reportId: report.reportId,
      reportName: report.reportName,
      themeId,
      theme: theme?.title || themeId,
      priority: exact.adapterPriority || 20,
      articleValue: exact.articleValue || (theme?.priority === "v1" ? "high" : "medium"),
      frequency: report.frequency,
      fromDate: report.fromDate,
      toDate: report.toDate,
      menuDescription: report.menuDescription,
      section: report.section,
      subSection: report.subSection,
      count: report.count,
      tags: report.tags || []
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.priority - b.priority || (a.reportId || 0) - (b.reportId || 0));

let linkProbes = {};
if (PROBE) {
  const session = await fetchDbieSession();
  const probeTargets = candidateReports
    .filter((report) => report.priority <= 7)
    .slice(0, 30);
  for (const report of probeTargets) {
    try {
      const result = await fetchDbieReportLink(report.reportId, { session, timeoutMs: 15000 });
      linkProbes[report.reportId] = {
        status: result.status,
        sapLink: result.sapLink,
        encryptedSapLinkObserved: Boolean(result.encryptedSapLink)
      };
    } catch (error) {
      linkProbes[report.reportId] = { error: error.message };
    }
  }
}

const reportRows = candidateReports.map((report) => {
  const accessMode = classifyAccess(report, linkProbes[report.reportId]);
  return {
    ...report,
    accessMode,
    evidenceStatus: evidenceStatus(accessMode),
    probe: linkProbes[report.reportId] || null
  };
});

const themeSummary = THEMES.map((theme) => {
  const rows = reportRows.filter((report) => report.themeId === theme.themeId);
  const readySeries = existingSeries.filter((series) => {
    const text = `${series.indicatorId} ${series.title}`;
    return theme.patterns.some((pattern) => pattern.test(text));
  });
  return {
    themeId: theme.themeId,
    title: theme.title,
    priority: theme.priority,
    evidenceReadySeries: readySeries.length,
    candidateReports: rows.length,
    adapterNeeded: rows.filter((row) => row.evidenceStatus !== "evidence_ready").length,
    firstTargets: rows.slice(0, 8).map((row) => ({
      reportId: row.reportId,
      reportName: row.reportName,
      frequency: row.frequency,
      toDate: row.toDate,
      accessMode: row.accessMode,
      evidenceStatus: row.evidenceStatus
    }))
  };
});

const matrix = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceId: "rbi-dbie",
  articleGoal: "How India borrows",
  status: {
    existingEvidenceReadySeries: existingSeries.length,
    candidateCreditReports: reportRows.length,
    probedReports: Object.keys(linkProbes).length,
    warning: "BusinessObjects viewer links are discovery-only until a stable downloadable or JSON payload is available and validated."
  },
  existingSeries,
  themeSummary,
  candidateReports: reportRows,
  recommendedFirstAdapters: reportRows
    .filter((row) => row.priority <= 7)
    .slice(0, 30)
};

await writeFile("data/catalog/rbi-dbie-credit-coverage-matrix.json", `${stableJson(matrix)}\n`);
console.log(JSON.stringify({
  ok: true,
  output: "data/catalog/rbi-dbie-credit-coverage-matrix.json",
  existingEvidenceReadySeries: existingSeries.length,
  candidateCreditReports: reportRows.length,
  probedReports: Object.keys(linkProbes).length
}, null, 2));
