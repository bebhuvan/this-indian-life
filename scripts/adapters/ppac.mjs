import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnv } from "../env.mjs";

loadEnv();

const baseUrl = process.env.PPAC_BASE_URL || "https://ppac.gov.in";
const months = [
  ["April", "april", 1],
  ["May", "may", 2],
  ["June", "june", 3],
  ["July", "july", 4],
  ["August", "august", 5],
  ["September", "september", 6],
  ["October", "october", 7],
  ["November", "november", 8],
  ["December", "december", 9],
  ["January", "january", 10],
  ["February", "february", 11],
  ["March", "march", 12],
  ["Total", "total", 13]
];

function resolveUrl(url) {
  return new URL(url, baseUrl).toString();
}

function textFromHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function numberOrNull(value) {
  const text = textFromHtml(value).replaceAll(",", "");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function execFileJson(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...options, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}${stderr ? `\n${stderr}` : ""}`;
        reject(error);
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (parseError) {
        parseError.message = `${parseError.message}\n${stdout.slice(0, 1000)}`;
        reject(parseError);
      }
    });
  });
}

export async function fetchPpacWorkbook(url, { allowLegacy = false } = {}) {
  const response = await fetch(resolveUrl(url), {
    headers: {
      "user-agent": "Indica/0.1 data ingest"
    }
  });
  if (!response.ok) throw new Error(`PPAC workbook fetch failed ${response.status} ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const isXlsx = buffer.subarray(0, 4).equals(Buffer.from("504b0304", "hex"));
  const isXls = buffer.subarray(0, 4).equals(Buffer.from("d0cf11e0", "hex"));
  if (!isXlsx && !(allowLegacy && isXls)) {
    throw new Error(`PPAC workbook fetch did not return an expected workbook payload: ${resolveUrl(url)}`);
  }
  return buffer;
}

export async function fetchPpacPage(path) {
  const response = await fetch(resolveUrl(path), {
    headers: {
      "user-agent": "Indica/0.1 data discovery"
    }
  });
  if (!response.ok) throw new Error(`PPAC page fetch failed ${response.status} ${response.statusText}: ${resolveUrl(path)}`);
  return response.text();
}

export function discoverPpacHistoryDownloads(html) {
  const updatedAt = html.match(/Last Updated On\s*:\s*<strong>\s*([^<]+)/i)?.[1]?.trim()
    || html.match(/Last Updated On\s*:\s*<\/span>\s*([^<]+)/i)?.[1]?.trim()
    || html.match(/Last Updated On\s*:\s*([^<]+)/i)?.[1]?.trim()
    || null;
  const results = [];
  const pattern = /<a\b[^>]*data-url="([^"]+)"[^>]*onclick="checkLoggedInorNot\(this,'([^']+)'\)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const fileName = match[1].trim();
    const title = match[2].trim();
    const labelHtml = match[3];
    const size = labelHtml.match(/\(([^)]+)\)/)?.[1]?.trim() || null;
    results.push({
      title,
      fileName,
      size,
      pageDownloadUrl: resolveUrl(`/download/${fileName}`),
      directCandidateUrl: resolveUrl(`/uploads/pages/${fileName}`),
      accessStatus: "login_gated",
      evidenceEligible: false
    });
  }
  return {
    pageUrl: resolveUrl("/import-export/history"),
    updatedAt,
    downloads: results
  };
}

export async function writePpacBinarySnapshot(name, buffer, extension = "xlsx") {
  const hash = createHash("sha256").update(buffer).digest("hex");
  const dir = "data/snapshots/ppac";
  await mkdir(dir, { recursive: true });
  const path = `${dir}/${name}.${hash.slice(0, 12)}.${extension}`;
  await writeFile(path, buffer);
  return { path, hash };
}

export async function fetchPpacCurrentImportExport({ financialYear = "2025-2026", reportBy = "1", pageId = "14" } = {}) {
  const response = await fetch(resolveUrl("/AjaxController/getImportExports"), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Indica/0.1 data ingest"
    },
    body: new URLSearchParams({ financialYear, reportBy: String(reportBy), pageId: String(pageId) })
  });
  if (!response.ok) throw new Error(`PPAC current import/export fetch failed ${response.status} ${response.statusText}`);
  return response.json();
}

export function parsePpacCurrentImportExport(raw, { financialYear = "2025-2026", reportBy = "1" } = {}) {
  const sourceRows = Object.entries(raw?.result || {})
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, row]) => row);
  const rows = [];
  let section = null;
  let modifiedDate = "";
  let fileName = "";

  for (const row of sourceRows) {
    const title = textFromHtml(row.title).replace(/\^/g, "").trim();
    if (!title) continue;
    const upper = title.toUpperCase();
    modifiedDate ||= textFromHtml(row.modified_date);
    fileName ||= textFromHtml(row.file_name);
    if (upper === "IMPORT") {
      section = "import";
      continue;
    }
    if (upper === "PRODUCTS") continue;
    if (upper.startsWith("PRODUCT EXPORT")) {
      section = "export";
      continue;
    }
    if (!section) continue;
    for (const [month, key, monthIndex] of months) {
      const value = numberOrNull(row[key]);
      if (value === null) continue;
      rows.push({
        section,
        item: title,
        month,
        monthIndex,
        value,
        financialYear,
        reportBy: String(reportBy)
      });
    }
  }

  return {
    financialYear,
    reportBy: String(reportBy),
    modifiedDate,
    fileName,
    rows
  };
}

export async function fetchPpacInternationalCrudeOil({ financialYear = "2025-2026", reportBy = "4", pageId = "30" } = {}) {
  const response = await fetch(resolveUrl("/AjaxController/getInternationalPricesCrudeOil"), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Indica/0.1 data ingest"
    },
    body: new URLSearchParams({ financialYear, reportBy: String(reportBy), pageId: String(pageId) })
  });
  if (!response.ok) throw new Error(`PPAC crude basket fetch failed ${response.status} ${response.statusText}`);
  return response.json();
}

export function parsePpacInternationalCrudeOil(raw, { requestedFinancialYear = "", reportBy = "4" } = {}) {
  const sourceRows = Object.entries(raw?.result || {})
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, row]) => row);
  const rows = [];
  const notes = [];
  let modifiedDate = "";
  let fileName = "";
  let fiscalYear = "";

  for (const row of sourceRows) {
    const title = textFromHtml(row.title);
    modifiedDate ||= textFromHtml(row.modified_date);
    fileName ||= textFromHtml(row.file_name);
    if (textFromHtml(row.colspan)) {
      if (title) notes.push(title);
      continue;
    }
    if (!/^\d{4}/.test(title)) continue;
    fiscalYear = title;
    for (const [month, key, monthIndex] of months.filter(([, key]) => key !== "total")) {
      const value = numberOrNull(row[key]);
      if (value === null) continue;
      rows.push({
        fiscalYear,
        requestedFinancialYear,
        month,
        monthIndex,
        value,
        unit: "$/bbl",
        reportBy: String(reportBy)
      });
    }
  }

  return {
    fiscalYear,
    requestedFinancialYear,
    reportBy: String(reportBy),
    modifiedDate,
    fileName,
    notes,
    rows
  };
}

export async function parsePpacImportExportWorkbook(buffer) {
  const dir = await mkdtemp(join(tmpdir(), "indica-ppac-"));
  const workbookPath = join(dir, "ppac.xlsx");
  await writeFile(workbookPath, buffer);
  const parserPath = join(dir, "parse_ppac.py");
  await writeFile(parserPath, `
import json
import sys
from openpyxl import load_workbook

path = sys.argv[1]
wb = load_workbook(path, read_only=True, data_only=True)
ws = wb[wb.sheetnames[0]]
rows = list(ws.iter_rows(values_only=True))
header_idx = None
for i, row in enumerate(rows):
    first = str(row[0] or '').strip().upper()
    if first == 'IMPORT/EXPORT':
        header_idx = i
        break
if header_idx is None:
    raise SystemExit('Could not find IMPORT/EXPORT header')

headers = [str(v).strip() if v is not None else '' for v in rows[header_idx]]
month_headers = headers[1:13]
out = []
section = None
for row in rows[header_idx + 1:]:
    label_raw = row[0]
    label = str(label_raw or '').strip()
    if not label:
        continue
    upper = label.upper().replace('^', '').strip()
    if upper in ('IMPORT', 'EXPORT'):
        section = upper.lower()
        continue
    if section is None:
        continue
    for idx, month in enumerate(month_headers, start=1):
        value = row[idx] if idx < len(row) else None
        if value is None or value == '':
            continue
        try:
            numeric = float(value)
        except Exception:
            continue
        out.append({
            'section': section,
            'item': label,
            'month': month.title(),
            'monthIndex': idx,
            'value': numeric
        })
    total = row[13] if len(row) > 13 else None
    if total not in (None, ''):
        try:
            out.append({
                'section': section,
                'item': label,
                'month': 'Total',
                'monthIndex': 13,
                'value': float(total)
            })
        except Exception:
            pass

print(json.dumps({
    'sheetNames': wb.sheetnames,
    'headerRow': header_idx + 1,
    'headers': headers,
    'rows': out
}))
`);
  return execFileJson("python3", [parserPath, workbookPath]);
}

export async function parsePpacHistoricalImportExportWorkbook(buffer, { datasetKind, unit }) {
  const dir = await mkdtemp(join(tmpdir(), "indica-ppac-history-"));
  const workbookPath = join(dir, "ppac-history.xlsx");
  await writeFile(workbookPath, buffer);
  const parserPath = join(dir, "parse_ppac_history.py");
  await writeFile(parserPath, `
import json
import math
import re
import sys
from openpyxl import load_workbook

path = sys.argv[1]
dataset_kind = sys.argv[2]
unit = sys.argv[3]

MONTHS = {
  'APRIL': 1,
  'MAY': 2,
  'JUNE': 3,
  'JULY': 4,
  'AUGUST': 5,
  'SEPTEMBER': 6,
  'OCTOBER': 7,
  'NOVEMBER': 8,
  'DECEMBER': 9,
  'JANUARY': 10,
  'FEBRUARY': 11,
  'MARCH': 12,
  'TOTAL': 13,
}

def clean(value):
  if value is None:
    return ''
  return str(value).strip()

def num(value):
  if value is None or value == '':
    return None
  try:
    out = float(value)
  except Exception:
    return None
  if not math.isfinite(out):
    return None
  return out

def section_label(label):
  normalized = re.sub(r'[^A-Z]', '', label.upper())
  if normalized == 'IMPORT':
    return 'import'
  if normalized == 'EXPORT':
    return 'export'
  return None

def find_header(rows):
  for row_index, row in enumerate(rows):
    for col_index, value in enumerate(row):
      if clean(value).upper() == 'IMPORT/EXPORT':
        return row_index, col_index
  return None, None

def fiscal_year_for_sheet(sheet_name, rows, header_index):
  candidates = [sheet_name]
  for row in rows[:max(header_index, 0)]:
    candidates.extend(clean(value) for value in row)
  for text in candidates:
    match = re.search(r'(19|20)\\d{2}-\\d{2,4}', text)
    if match:
      return match.group(0)
  return None

wb = load_workbook(path, read_only=True, data_only=True)
rows_out = []
sheets_out = []
reconciliations = []

for sheet_name in wb.sheetnames:
  ws = wb[sheet_name]
  rows = list(ws.iter_rows(values_only=True))
  header_index, header_col = find_header(rows)
  if header_index is None:
    sheets_out.append({
      'sheetName': sheet_name,
      'status': 'skipped',
      'reason': 'IMPORT/EXPORT header not found'
    })
    continue

  header = [clean(value) for value in rows[header_index]]
  period_columns = []
  for col_index in range(header_col + 1, len(header)):
    label = clean(header[col_index])
    if not label:
      continue
    upper = label.upper()
    if upper in MONTHS:
      period_columns.append({
        'colIndex': col_index,
        'periodType': 'fiscal_month',
        'period': upper.title(),
        'month': upper.title(),
        'monthIndex': MONTHS[upper],
      })
    elif re.match(r'^(19|20)\\d{2}-\\d{2,4}$', label):
      period_columns.append({
        'colIndex': col_index,
        'periodType': 'fiscal_year',
        'period': label,
        'month': None,
        'monthIndex': None,
      })

  if not period_columns:
    sheets_out.append({
      'sheetName': sheet_name,
      'status': 'skipped',
      'reason': 'no monthly or fiscal-year columns found',
      'headerRow': header_index + 1,
      'headerColumn': header_col + 1,
    })
    continue

  sheet_type = 'monthly' if any(col['periodType'] == 'fiscal_month' for col in period_columns) else 'annual_summary'
  fiscal_year = fiscal_year_for_sheet(sheet_name, rows, header_index) if sheet_type == 'monthly' else None
  section = None
  sheet_row_count = 0

  for source_row_number, row in enumerate(rows[header_index + 1:], start=header_index + 2):
    label = clean(row[header_col] if header_col < len(row) else None)
    if not label:
      continue
    next_section = section_label(label)
    if next_section:
      section = next_section
      continue
    if section is None:
      continue

    row_values = []
    for col in period_columns:
      value = num(row[col['colIndex']] if col['colIndex'] < len(row) else None)
      if value is None:
        continue
      row_values.append((col, value))
      rows_out.append({
        'datasetKind': dataset_kind,
        'sheetName': sheet_name,
        'sheetType': sheet_type,
        'sourceRow': source_row_number,
        'section': section,
        'sourceItem': label,
        'periodType': col['periodType'],
        'fiscalYear': fiscal_year if sheet_type == 'monthly' else col['period'],
        'period': col['period'],
        'month': col['month'],
        'monthIndex': col['monthIndex'],
        'unit': unit,
        'value': value,
      })
      sheet_row_count += 1

    if sheet_type == 'monthly':
      monthly_values = [value for col, value in row_values if col['monthIndex'] and col['monthIndex'] <= 12]
      total_values = [value for col, value in row_values if col['monthIndex'] == 13]
      if monthly_values and total_values:
        computed = sum(monthly_values)
        reported = total_values[-1]
        diff = reported - computed
        reconciliations.append({
          'sheetName': sheet_name,
          'sourceRow': source_row_number,
          'section': section,
          'sourceItem': label,
          'fiscalYear': fiscal_year,
          'computedMonthlyTotal': computed,
          'reportedTotal': reported,
          'absoluteDifference': abs(diff),
          'relativeDifference': abs(diff) / max(abs(reported), 1),
        })

  sheets_out.append({
    'sheetName': sheet_name,
    'status': 'parsed',
    'sheetType': sheet_type,
    'fiscalYear': fiscal_year,
    'headerRow': header_index + 1,
    'headerColumn': header_col + 1,
    'periodColumns': len(period_columns),
    'rows': sheet_row_count,
  })

print(json.dumps({
  'datasetKind': dataset_kind,
  'unit': unit,
  'sheetNames': wb.sheetnames,
  'sheets': sheets_out,
  'rows': rows_out,
  'reconciliations': reconciliations,
}))
`);
  return execFileJson("python3", [parserPath, workbookPath, datasetKind, unit]);
}

export async function parsePpacLngImportWorkbook(buffer, { financialYear = "2025-2026" } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "indica-ppac-lng-"));
  const workbookPath = join(dir, "ppac-lng.xls");
  await writeFile(workbookPath, buffer);
  const parserPath = join(dir, "parse_ppac_lng.py");
  await writeFile(parserPath, `
import json
import sys
import xlrd

path = sys.argv[1]
financial_year = sys.argv[2]
book = xlrd.open_workbook(path)
sheet = book.sheet_by_index(0)
rows = [[sheet.cell_value(r, c) for c in range(sheet.ncols)] for r in range(sheet.nrows)]
header_idx = None
for i, row in enumerate(rows):
    first = str(row[0] or '').strip().lower()
    if first == 'month':
        header_idx = i
        break
if header_idx is None:
    raise SystemExit('Could not find Month header')

headers = [str(v).strip() if v != '' else '' for v in rows[header_idx]]
measure_map = {
    'Total LNG Imports (Long Term, Spot) in MMT': ('lng_imports_mmt', 'MMT'),
    'Total LNG Imports (Long Term, Spot) in MMSCM (P)': ('lng_imports_mmscm', 'MMSCM'),
    'Total LNG Imports (Long Term, Spot) in Million USD': ('lng_imports_usd_million', 'US$ million'),
    'Total LNG Imports (Long Term, Spot) in Rs Crore': ('lng_imports_rupees_crore', 'Rs crore'),
}
out = []
notes = []
source = None
for row in rows[header_idx + 1:]:
    label = str(row[0] or '').strip()
    if not label:
        continue
    if label.startswith('*') or label.startswith('MMT') or label.startswith('MMSCM') or label.startswith('1 MMT'):
        notes.append(label)
        continue
    if label.lower().startswith('source:'):
        source = label.split(':', 1)[1].strip()
        continue
    measure = measure_map.get(label)
    if not measure:
        continue
    measure_id, unit = measure
    for idx, month in enumerate(headers[1:], start=1):
        month = str(month).strip()
        if not month:
            continue
        value = row[idx] if idx < len(row) else None
        if value in ('', None):
            continue
        try:
            numeric = float(value)
        except Exception:
            continue
        out.append({
            'item': 'Total LNG Imports (Long Term, Spot)',
            'measure': measure_id,
            'unit': unit,
            'month': month,
            'monthIndex': idx,
            'value': numeric,
            'financialYear': financial_year
        })

print(json.dumps({
    'sheetNames': book.sheet_names(),
    'headerRow': header_idx + 1,
    'headers': headers,
    'notes': notes,
    'source': source,
    'rows': out
}))
`);
  return execFileJson("python3", [parserPath, workbookPath, financialYear]);
}
