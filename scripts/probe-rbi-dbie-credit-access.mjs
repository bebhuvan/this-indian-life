import { mkdir, writeFile } from "node:fs/promises";
import {
  RBI_DBIE_SERVICE_BASE,
  RBI_LOGIN_SERVICE_BASE,
  decodeHtmlEntities,
  decryptDbiePayload,
  encryptDbiePayload,
  fetchDbieReportLink,
  fetchDbieSession,
  postDbieJson
} from "./adapters/rbi-dbie.mjs";
import { stableJson } from "./core/artifacts.mjs";
import { buildUrl, timeoutSignal } from "./lib/source-http.mjs";

const PROBE_POLICY = process.argv.includes("--probe-policy");
const fetchedAt = new Date().toISOString();
const CREDIT_REPORT_IDS = [40, 44, 540, 541, 944, 945, 947, 948, 954, 955, 959, 963, 1085, 1086, 1129, 1153, 1456, 1553, 1555];
const BSR_CREDIT_DSD = {
  dsdCode: "LNA_SCB_SR_OCC_BSR1_A_RN",
  elementId: "3046",
  title: "Loans and Advances of SCBs State and Occupation wise BSR1 Annual",
  tableName: "fact_ebr_lna_scb_sr_occ_bsr1_a_rn",
  elementFrequency: "ANNUAL - FINANCIAL YEAR",
  elementFlowType: "STOCK"
};

function summarizeHeader(result) {
  return {
    status: result?.json?.header?.status || null,
    errorCode: result?.json?.header?.errorCode || null,
    errorMessage: result?.json?.header?.errorMessage || null,
    transactionid: result?.json?.header?.transactionid || null
  };
}

async function fetchSapGatewayToken(session) {
  const response = await fetch(buildUrl(RBI_LOGIN_SERVICE_BASE, "/login_getSapToken"), {
    method: "POST",
    signal: timeoutSignal(15000),
    headers: {
      "Content-Type": "application/json",
      channelkey: "key2",
      datatype: "application/json",
      authorization: session.authorization,
      cookie: session.cookie || ""
    },
    body: JSON.stringify({ body: { portalCode: "DBIE", user: "", code: "" } })
  });
  const text = decodeHtmlEntities(await response.text());
  const json = JSON.parse(text);
  const encryptedGatewayToken = json.body?.status?.token || null;
  let decryptedGatewayToken = null;
  if (encryptedGatewayToken) decryptedGatewayToken = decryptDbiePayload(encryptedGatewayToken);
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    authorizationHeaderObserved: Boolean(response.headers.get("authorization")),
    responseAuthorizationMatchesDecryptedToken: response.headers.get("authorization") === decryptedGatewayToken,
    header: json.header || null,
    bodyStatus: {
      sapTokenObserved: Boolean(json.body?.status?.sapToken),
      sapLogonTokenObserved: Boolean(json.body?.status?.sapLogonToken),
      status: json.body?.status?.status ?? null,
      encryptedGatewayTokenObserved: Boolean(encryptedGatewayToken),
      decryptedGatewayTokenLength: decryptedGatewayToken ? String(decryptedGatewayToken).length : 0
    }
  };
}

function walkTree(node, callback, path = []) {
  if (!node || typeof node !== "object") return;
  const element = node.element || {};
  const label = element.SECTOR_NAME || element.ELEMENT_LABEL || element.SECTOR_SEARCH || "";
  const nextPath = element.TYPE === "ELEMENT" ? path : [...path, label].filter(Boolean);
  callback(node, path);
  for (const child of node.children || []) walkTree(child, callback, nextPath);
}

function flattenDimensionValues(dim) {
  const values = [];
  const walk = (node) => {
    if (node?.element && !String(node.element.CL_VALUE_LABLE || "").startsWith("<")) values.push(node.element);
    for (const child of node?.children || []) walk(child);
  };
  for (const root of dim.dim_code_list_values || []) walk(root);
  return values;
}

function encryptObjectKeysAndValues(obj) {
  const encrypted = {};
  for (const [key, value] of Object.entries(obj)) encrypted[encryptDbiePayload(key)] = encryptDbiePayload(value);
  return encrypted;
}

function buildMinimalBsrPolicy(policyName) {
  const dimensionColumns = [
    "measure_type_description",
    "occp_gp_item_description",
    "state_code_description",
    "unit_measure_description"
  ];
  const rules = dimensionColumns.map((columnName) => ({
    database_name: "<ALL_FACT>",
    rule_category: "AGGREGATION",
    column_name: columnName,
    rule_function: "GROUP_BY",
    table_name: "<ALL_FACT>",
    elementName: BSR_CREDIT_DSD.title,
    dsdList: BSR_CREDIT_DSD.dsdCode
  }));
  rules.push({
    database_name: "EBR_PUBLIC_ELEMENTS",
    rule_category: "AGGREGATION",
    column_name: "OBS_VALUE",
    rule_function: "SUM",
    table_name: BSR_CREDIT_DSD.tableName,
    elementName: "COMMON",
    dsdList: BSR_CREDIT_DSD.dsdCode
  });
  rules.push({
    database_name: "<ALL_FACT>",
    rule_category: "TIME_BARRING",
    column_name: "TIME_PERIOD_SK",
    rule_function: "FROM_DATE",
    table_name: "<ALL_FACT>",
    attribute_value: "'2000-03-31'",
    elementName: "COMMON",
    dsdList: "COMMON"
  });
  rules.push({
    database_name: "<ALL_FACT>",
    rule_category: "TIME_BARRING",
    column_name: "TIME_PERIOD_SK",
    rule_function: "TO_DATE",
    table_name: "<ALL_FACT>",
    attribute_value: "'2026-03-31'",
    elementName: "COMMON",
    dsdList: "COMMON"
  });

  return {
    body: {
      policyData: {
        policyName,
        username: encryptDbiePayload("test_user"),
        polFreq: encryptDbiePayload("YEARLY"),
        department: encryptDbiePayload("test_dept"),
        rules: rules.map(encryptObjectKeysAndValues),
        elementDetails: {
          [encryptDbiePayload(BSR_CREDIT_DSD.tableName)]: {
            Element_Frequency: encryptDbiePayload(BSR_CREDIT_DSD.elementFrequency),
            Element_Code: encryptDbiePayload(BSR_CREDIT_DSD.dsdCode),
            Element_Flow_Type: encryptDbiePayload(BSR_CREDIT_DSD.elementFlowType)
          }
        }
      }
    }
  };
}

async function probeMinimalBsrPolicy(session) {
  const policyName = encryptDbiePayload(`dq_indica_credit_probe_${Date.now()}`);
  const save = await postDbieJson("/dbie_insertPolicyActionEnhanced", buildMinimalBsrPolicy(policyName), { session, timeoutMs: 60000 });
  const ddl = await postDbieJson(
    "/dbie_createDDLActionEnhanced",
    {
      body: {
        selection: encryptDbiePayload(1),
        policyName,
        scrapId: encryptDbiePayload(4),
        dsdList: encryptDbiePayload([BSR_CREDIT_DSD.dsdCode])
      }
    },
    { session, timeoutMs: 60000 }
  );
  const impala = await postDbieJson(
    "/dbie_getImpalaDQActionEnhanced",
    {
      body: {
        dimData: {
          dsdCode: encryptDbiePayload([BSR_CREDIT_DSD.dsdCode.toLowerCase()]),
          advanceOptions: encryptDbiePayload([]),
          unitMultiplier: encryptDbiePayload(1),
          policyName,
          isFinancialYear: encryptDbiePayload(false),
          fromDate: encryptDbiePayload("31-03-2000"),
          toDate: encryptDbiePayload("31-03-2026"),
          freqSelected: encryptDbiePayload("YEARLY"),
          entitySelection: [],
          elementLableDetails: [],
          isAlphaNumeric: false
        }
      }
    },
    { session, timeoutMs: 120000 }
  );
  return {
    saveHeader: summarizeHeader(save),
    ddlHeader: summarizeHeader(ddl),
    ddlResult: ddl.json?.body?.result || null,
    impalaHeader: summarizeHeader(impala),
    impalaRows: Array.isArray(impala.json?.body?.result) ? impala.json.body.result.length : null
  };
}

const warnings = [];
const session = await fetchDbieSession({ timeoutMs: 15000 });
const sapGatewayToken = await fetchSapGatewayToken(session);

const reportLinkProbes = [];
for (const reportId of CREDIT_REPORT_IDS) {
  try {
    const link = await fetchDbieReportLink(reportId, { session, timeoutMs: 15000 });
    const openDocumentUrl = new URL(`https://data.rbi.org.in${link.sapLink}`);
    reportLinkProbes.push({
      reportId,
      status: link.status,
      openDocumentPath: openDocumentUrl.pathname,
      iDocID: openDocumentUrl.searchParams.get("iDocID") || null,
      tokenLength: (openDocumentUrl.searchParams.get("token") || "").length,
      evidenceStatus: (openDocumentUrl.searchParams.get("token") || "").length ? "bo_tokenized_viewer_only" : "bo_viewer_without_logon_token"
    });
  } catch (error) {
    reportLinkProbes.push({ reportId, error: error.message });
  }
}

const sectorTree = await postDbieJson("/dbie_getSectorAction", { body: { body: {} } }, { session, timeoutMs: 30000 });
const creditDsdElements = [];
walkTree(sectorTree.json?.body?.result, (node, path) => {
  const element = node.element || {};
  if (element.TYPE !== "ELEMENT") return;
  const text = [element.DSD_CODE, element.ELEMENT_LABEL, element.SECTOR_NAME, element.SECTOR_SEARCH, path.join(" > ")].filter(Boolean).join(" ");
  if (!/\b(credit|loans?|borrowings?|advances?|deposits?|interest rate)\b/i.test(text)) return;
  creditDsdElements.push({
    dsdCode: element.DSD_CODE,
    elementId: element.ELEMENT_ID,
    elementLabel: element.ELEMENT_LABEL,
    frequency: element.ELEMENT_FREQUENCY_NAME,
    startDate: element.ELE_START_DATE,
    sectorName: element.SECTOR_NAME,
    path: path.join(" > ")
  });
});

let bsrDimensions = null;
let bsrPolicyProbe = null;
try {
  const codelist = await postDbieJson(
    "/dbie_getCodeListAction",
    {
      body: {
        dimData: {
          elementCodes: encryptDbiePayload(BSR_CREDIT_DSD.dsdCode),
          elementIds: encryptDbiePayload(BSR_CREDIT_DSD.elementId)
        }
      }
    },
    { session, timeoutMs: 30000 }
  );
  bsrDimensions = (codelist.json?.body?.result || []).map((dim) => ({
    dimName: dim.dim_name,
    dimCode: dim.dim_code,
    dimColumn: dim.dim_col_name,
    tableName: dim.table_name,
    valueCount: flattenDimensionValues(dim).length,
    sampleValues: flattenDimensionValues(dim).slice(0, 12).map((value) => ({
      id: value.CL_VALUES_ID,
      label: value.CL_VALUE_LABLE,
      parentId: value.PARENT_CL_VALUES_ID_FK,
      level: value.LEVEL
    }))
  }));
} catch (error) {
  warnings.push({ severity: "warning", message: `Failed to probe ${BSR_CREDIT_DSD.dsdCode} codelist: ${error.message}` });
}

if (PROBE_POLICY) {
  try {
    bsrPolicyProbe = await probeMinimalBsrPolicy(session);
    if (bsrPolicyProbe.impalaRows === 0) {
      warnings.push({
        severity: "warning",
        message: "Minimal BSR policy was accepted and DDL was created, but Impala returned zero rows. Adapter still needs exact UI-equivalent dimension filter payloads before this DSD is evidence-ready."
      });
    }
  } catch (error) {
    bsrPolicyProbe = { error: error.message };
  }
}

const result = {
  schemaVersion: 1,
  fetchedAt,
  sourceId: "rbi-dbie",
  purpose: "Credit report access probe for How India Borrows",
  serviceBase: RBI_DBIE_SERVICE_BASE,
  loginServiceBase: RBI_LOGIN_SERVICE_BASE,
  sapGatewayToken,
  reportLinkProbes,
  dataQuery: {
    sectorActionHeader: summarizeHeader(sectorTree),
    creditDsdElements,
    bsrCreditDsd: BSR_CREDIT_DSD,
    bsrDimensions,
    bsrPolicyProbe,
    evidenceStatus: "discovery_only_until_nonempty_validated_rows"
  },
  conclusion: {
    businessObjects: "After the SAP gateway-token call, report links can resolve to tokenized OpenDocument viewer URLs. Direct WebI/export fetching is still not reproduced, so these remain discovery-only.",
    dataQuery: "Structured Data Query exposes at least one BSR credit DSD and accepts policy creation, but the exact output filter payload still needs to be reproduced before ingestion."
  },
  warnings
};

await mkdir("data/catalog", { recursive: true });
await writeFile("data/catalog/rbi-dbie-credit-access-probe.json", `${stableJson(result)}\n`);

console.log(JSON.stringify({
  ok: true,
  output: "data/catalog/rbi-dbie-credit-access-probe.json",
  reportLinks: reportLinkProbes.length,
  boLinksWithToken: reportLinkProbes.filter((probe) => probe.tokenLength > 0).length,
  creditDsdElements: creditDsdElements.length,
  bsrDimensions: bsrDimensions?.length || 0,
  bsrPolicyRows: bsrPolicyProbe?.impalaRows ?? null,
  warnings: warnings.length
}, null, 2));
