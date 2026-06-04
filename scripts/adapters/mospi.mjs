// MOSPI eSankhyiki open REST API — CPI. No auth. See memory:
// indica-mospi-esankhyiki-api. Base years 2010/2012/2024; series Current|Back.
import { Agent } from "undici";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

// api.mospi.gov.in serves an incomplete cert chain (SELF_SIGNED_CERT_IN_CHAIN).
// Rather than disable TLS globally, relax verification for THIS host only via a
// scoped undici dispatcher; every other request in the process keeps full TLS.
const mospiDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

const baseUrl = process.env.MOSPI_BASE_URL || "https://api.mospi.gov.in";

const MONTHS = {
  January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
  July: "07", August: "08", September: "09", October: "10", November: "11", December: "12"
};

export function monthNumber(name) {
  return MONTHS[name] || "01";
}

// Group-level CPI (base 2010/2012). Returns { data: [...], meta_data, ... }.
export async function fetchCpiIndex({
  baseYear = 2012,
  stateCode = 99,
  sectorCode = 3,
  groupCode,
  subgroupCode,
  year,
  monthCode,
  series = "Current",
  limit = 100000,
  page = 1
} = {}) {
  const url = buildUrl(baseUrl, "/api/cpi/getCPIIndex", {
    base_year: baseYear,
    state_code: stateCode,
    sector_code: sectorCode,
    group_code: groupCode,
    subgroup_code: subgroupCode,
    year,
    month_code: monthCode,
    series,
    Format: "JSON",
    limit,
    page
  });
  return fetchJson(url, {
    headers: { "user-agent": "Mozilla/5.0" },
    timeoutMs: Number(process.env.MOSPI_TIMEOUT_MS || 120000),
    retries: 3,
    dispatcher: mospiDispatcher
  });
}

// Item-level CPI (base 2012): individual items (Onion, Petrol, LPG, Gold, House
// Rent, Tuition…). Returns { data:[{item,index,inflation,year,month}], ... }.
export async function fetchCpiItems({
  baseYear = 2012, stateCode = 99, sectorCode = 3, itemCode, year, monthCode, series = "Current", limit = 100000, page = 1
} = {}) {
  const url = buildUrl(baseUrl, "/api/cpi/getItemIndex", {
    base_year: baseYear, state_code: stateCode, sector_code: sectorCode,
    item_code: itemCode, year, month_code: monthCode, series, Format: "JSON", limit, page
  });
  return fetchJson(url, {
    headers: { "user-agent": "Mozilla/5.0" },
    timeoutMs: Number(process.env.MOSPI_TIMEOUT_MS || 120000), retries: 3, dispatcher: mospiDispatcher
  });
}

// WPI — Wholesale Price Index (5-level hierarchy). Returns index_value (no
// inflation field — compute YoY downstream). Filters: major_group_code, group_code…
export async function fetchWpi({
  baseYear = "2011-12", majorGroupCode, groupCode, year, monthCode, limit = 100000, page = 1
} = {}) {
  const url = buildUrl(baseUrl, "/api/wpi/getWpiRecords", {
    base_year: baseYear, major_group_code: majorGroupCode, group_code: groupCode,
    year, month_code: monthCode, Format: "JSON", limit, page
  });
  return fetchJson(url, {
    headers: { "user-agent": "Mozilla/5.0" },
    timeoutMs: Number(process.env.MOSPI_TIMEOUT_MS || 120000), retries: 3, dispatcher: mospiDispatcher
  });
}

// PLFS — Periodic Labour Force Survey. indicator_code 1=LFPR, 2=WPR, 3=UR,
// 4=worker distribution, 5=reg-wage conditions, 6=reg-wage earnings, 7=casual
// daily wage, 8=self-employment earnings. frequency_code 1=Annual, 2=Quarterly,
// 3=Monthly. year_type_code 1=survey/agriculture year (2017-18…2023-24),
// 2=calendar year (2022…). Rows carry every dimension as a column; bulk-fetch
// then pivot/filter in node.
export async function fetchPlfs({
  indicatorCode,
  frequencyCode = 1,
  yearTypeCode,
  limit = 100000,
  page = 1
} = {}) {
  const url = buildUrl(baseUrl, "/api/plfs/getData", {
    indicator_code: indicatorCode,
    frequency_code: frequencyCode,
    year_type_code: yearTypeCode,
    Format: "JSON",
    limit,
    page
  });
  return fetchJson(url, {
    headers: { "user-agent": "Mozilla/5.0" },
    timeoutMs: Number(process.env.MOSPI_TIMEOUT_MS || 120000),
    retries: 3,
    dispatcher: mospiDispatcher
  });
}

// Normalise raw CPI rows to {date:"YYYY-MM", index:number|null, inflation:number|null}
// keyed by (group, subgroup, sector). Returns a Map of key -> { meta, points[] }.
export function groupCpiRows(rows) {
  const out = new Map();
  for (const r of rows || []) {
    const key = `${r.sector}||${r.group}||${r.subgroup}`;
    if (!out.has(key)) out.set(key, { sector: r.sector, group: r.group, subgroup: r.subgroup, points: [] });
    out.get(key).points.push({
      date: `${r.year}-${monthNumber(r.month)}`,
      index: r.index == null || r.index === "" ? null : Number(r.index),
      inflation: r.inflation == null || r.inflation === "" ? null : Number(r.inflation)
    });
  }
  for (const v of out.values()) v.points.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}
