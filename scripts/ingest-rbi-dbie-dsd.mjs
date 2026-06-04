// Generic RBI DBIE SDMX Data Query (DSD) ingester.
// Cracked 2026-06: pulls any DSD element via policy->DDL->Impala, selecting ALL members
// of every dimension across the full date range. See data/catalog/rbi-dbie-dsd-working-recipe.json.
//
// Usage: node scripts/ingest-rbi-dbie-dsd.mjs <DSD_CODE> [fromDDMMYYYY] [toDDMMYYYY] [--verify]
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fetchDbieSession, postDbieJson, encryptDbiePayload } from "./adapters/rbi-dbie.mjs";

const enc = encryptDbiePayload;
const encObj = (o) => { const r = {}; for (const [k, v] of Object.entries(o)) r[enc(k)] = enc(v); return r; };

export function flattenDim(dim) {
  const items = [];
  const walk = (n) => {
    const e = n.element;
    if (e && !String(e.CL_VALUES_ID ?? "").startsWith("<")) {
      items.push({ code: e.CL_VALUE_CODE, id: e.CL_VALUES_ID, label: e.CL_VALUE_LABLE, level: e.LEVEL, parent: e.PARENT_CL_VALUES_ID_FK });
    }
    for (const c of n.children || []) walk(c);
  };
  for (const r of dim.dim_code_list_values || []) walk(r);
  return items;
}

export async function getElementMeta(session, code) {
  const tree = await postDbieJson("/dbie_getSectorAction", { body: { body: {} } }, { session, timeoutMs: 30000 });
  let found = null;
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    const e = n.element || {};
    if (e.TYPE === "ELEMENT" && e.DSD_CODE === code) {
      found = { id: String(e.ELEMENT_ID), label: e.ELEMENT_LABEL, freq: e.ELEMENT_FREQUENCY_NAME, flow: e.ELEMENT_FLOW_TYPE_NAME || e.ELEMENT_FLOW_TYPE || "Flow", start: e.ELE_START_DATE };
    }
    for (const c of n.children || []) walk(c);
  };
  walk(tree.json?.body?.result);
  if (!found) throw new Error(`element ${code} not found in sector tree`);
  found.table = `fact_ebr_${code.toLowerCase()}`;
  // normalize frequency strings the API expects
  found.freqUpper = String(found.freq || "").toUpperCase();
  found.polFreq = { "ANNUAL - FINANCIAL YEAR": "YEARLY", "MONTHLY": "MONTHLY", "FORTNIGHTLY": "FORTNIGHTLY", "WEEKLY": "WEEKLY", "QUARTERLY": "QUARTERLY", "DAILY": "DAILY" }[found.freqUpper] || "MONTHLY";
  return found;
}

export async function getDimensions(session, code, meta) {
  const eld = [encObj({ dsdCode: code, elementName: meta.label, elementId: meta.id, elementType: meta.flow, elementFrequency: meta.freq })];
  const cl = await postDbieJson("/dbie_getCodeListActionEnhanced", { body: { dimData: { elementCodes: enc(code), elementIds: enc(meta.id), elementLableDetails: eld } } }, { session, timeoutMs: 30000 });
  const data = cl.json?.body?.result?.[0]?.data || {};
  return Object.keys(data).map((k) => ({ name: data[k].dim_name, col: data[k].dim_col_name, items: flattenDim(data[k]) }));
}

export function buildRules(meta, dims) {
  const rules = [];
  const gb = (col) => encObj({ database_name: "<ALL_FACT>", rule_category: "AGGREGATION", column_name: col, rule_function: "GROUP_BY", table_name: "<ALL_FACT>", elementName: meta.label, dsdList: meta.code });
  for (const d of dims) rules.push(gb(d.col));
  // FILTER IN: one rule per (col, level, parentID) group with all member codes
  for (const d of dims) {
    const groups = new Map();
    for (const it of d.items) {
      const key = `${it.level}|${it.parent}`;
      if (!groups.has(key)) groups.set(key, { level: it.level, parent: it.parent, codes: [] });
      groups.get(key).codes.push(`'${it.code}'`);
    }
    for (const g of groups.values()) {
      rules.push(encObj({ database_name: "<ALL_FACT>", rule_category: "FILTER", column_name: d.col, rule_function: "IN", table_name: "<ALL_FACT>", attribute_value: g.codes.join(","), level: String(g.level), parentID: g.parent, elementName: meta.label, dsdList: meta.code }));
    }
  }
  rules.push(encObj({ database_name: "EBR_PUBLIC_ELEMENTS", rule_category: "AGGREGATION", column_name: "OBS_VALUE", rule_function: "SUM", table_name: meta.table, elementName: "COMMON", dsdList: meta.code }));
  return rules;
}

function isoToFY(d) { return d; } // dates passed as 'YYYY-MM-DD' for time barring

export async function runDsd(session, code, meta, dims, fromISO, toISO, fromDMY, toDMY) {
  const rules = buildRules(meta, dims);
  rules.push(encObj({ database_name: "<ALL_FACT>", rule_category: "TIME_BARRING", column_name: "TIME_PERIOD_SK", rule_function: "FROM_DATE", table_name: "<ALL_FACT>", attribute_value: `'${fromISO}'`, elementName: "COMMON", dsdList: "COMMON" }));
  rules.push(encObj({ database_name: "<ALL_FACT>", rule_category: "TIME_BARRING", column_name: "TIME_PERIOD_SK", rule_function: "TO_DATE", table_name: "<ALL_FACT>", attribute_value: `'${toISO}'`, elementName: "COMMON", dsdList: "COMMON" }));
  const policyName = enc(`dq_indica_${code}_${meta.id}`);
  const policy = { body: { policyData: { policyName, username: enc("test_user"), polFreq: enc(meta.polFreq), department: enc("test_dept"), rules, elementDetails: { [enc(meta.table)]: { Element_Frequency: enc(meta.freqUpper), Element_Code: enc(code), Element_Flow_Type: enc((meta.flow || "FLOW").toUpperCase()) } } } } };
  await postDbieJson("/dbie_insertPolicyActionEnhanced", policy, { session, timeoutMs: 90000 });
  const ddl = await postDbieJson("/dbie_createDDLActionEnhanced", { body: { selection: enc("1"), policyName, scrapId: enc("4"), dsdList: enc(code) } }, { session, timeoutMs: 90000 });
  const ddlResult = ddl.json?.body?.result;
  const entitySelection = ["op_level5", "op_level4", "op_level3", "op_level2", "op_level1", "entity_name"].map((k) => ({ [enc(k)]: enc("") }));
  const impala = await postDbieJson("/dbie_getImpalaDQActionEnhanced", { body: { dimData: {
    dsdCode: enc(code.toLowerCase()), advanceOptions: enc(""), unitMultiplier: enc("actuals"), policyName,
    isFinancialYear: enc(meta.polFreq === "YEARLY" ? "true" : "false"), fromDate: enc(fromDMY), toDate: enc(toDMY),
    freqSelected: enc(meta.polFreq), entitySelection,
    elementLableDetails: [encObj({ dsdCode: code, elementName: meta.label, elementId: meta.id, elementType: meta.flow, elementFrequency: meta.freq })],
    isAlphaNumeric: false
  } } }, { session, timeoutMs: 180000 });
  const rows = impala.json?.body?.result?.[0]?.data?.result || [];
  return { ddlResult, rows };
}

export const toISO = (dmy) => { const [d, m, y] = dmy.split("-"); return `${y}-${m}-${d}`; };

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const code = process.argv[2];
  const fromDMY = process.argv[3] || "01-04-1990";
  const toDMY = process.argv[4] || "31-03-2026";
  const verify = process.argv.includes("--verify");
  if (!code) { console.error("usage: node scripts/ingest-rbi-dbie-dsd.mjs <DSD_CODE> [from DD-MM-YYYY] [to DD-MM-YYYY] [--verify]"); process.exit(1); }

  const session = await fetchDbieSession({ timeoutMs: 20000 });
  const meta = await getElementMeta(session, code); meta.code = code;
  const dims = await getDimensions(session, code, meta);
  console.error(`element: ${meta.label} | freq=${meta.freq} | dims: ${dims.map((d) => `${d.name}(${d.items.length})`).join(", ")}`);
  const { ddlResult, rows } = await runDsd(session, code, meta, dims, toISO(fromDMY), toISO(toDMY), fromDMY, toDMY);
  const periods = [...new Set(rows.map((r) => r.Time))].sort((a, b) => a - b);
  const fmt = (t) => new Date(t).toISOString().slice(0, 10);
  const summary = { code, label: meta.label, freq: meta.freq, ddlResult, rows: rows.length, periods: periods.length, firstPeriod: periods.length ? fmt(periods[0]) : null, lastPeriod: periods.length ? fmt(periods.at(-1)) : null };
  console.error(JSON.stringify(summary, null, 2));
  if (!verify) {
    await writeFile(`/tmp/dsd-${code}.json`, JSON.stringify({ summary, rows }));
    console.error(`wrote /tmp/dsd-${code}.json`);
  }
}
