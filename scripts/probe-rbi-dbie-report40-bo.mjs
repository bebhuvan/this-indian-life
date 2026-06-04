import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  RBI_LOGIN_SERVICE_BASE,
  decodeHtmlEntities,
  decryptDbiePayload,
  fetchDbieReportLink,
  fetchDbieSession
} from "./adapters/rbi-dbie.mjs";
import { stableJson, writeRawSnapshot } from "./core/artifacts.mjs";
import { buildUrl, timeoutSignal } from "./lib/source-http.mjs";

const REPORT_ID = Number(process.env.RBI_DBIE_BO_REPORT_ID || process.argv.find((arg) => /^--report-id=/.test(arg))?.split("=")[1] || 40);
const OUTPUT_PATH = `data/catalog/rbi-dbie-report${REPORT_ID}-bo-probe.json`;
const CHROME_PATH = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const MAX_LINK_ATTEMPTS = Number(process.env.RBI_DBIE_BO_LINK_ATTEMPTS || 8);
const CHROME_WAIT_MS = Number(process.env.RBI_DBIE_BO_CHROME_WAIT_MS || 45000);
const EXTRA_HORIZONTAL_PAGES = (process.env.RBI_DBIE_BO_EXTRA_PX || process.argv.find((arg) => /^--extra-px=/.test(arg))?.split("=")[1] || "")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 1);
const CAPTURE_FRAME_DOM = process.env.RBI_DBIE_BO_CAPTURE_FRAME_DOM === "1" || process.argv.includes("--capture-frame-dom");
const CAPTURE_HISTORICAL_WINDOWS = process.env.RBI_DBIE_BO_CAPTURE_HISTORICAL_WINDOWS === "1" || process.argv.includes("--historical-windows");

const fetchedAt = new Date().toISOString();

if (process.argv.includes("--help")) {
  console.log(`Usage: node scripts/probe-rbi-dbie-report40-bo.mjs

Environment:
  CHROME_PATH=/usr/bin/google-chrome
  RBI_DBIE_BO_LINK_ATTEMPTS=8
  RBI_DBIE_BO_CHROME_WAIT_MS=45000
  RBI_DBIE_BO_EXTRA_PX=2,3
  RBI_DBIE_BO_CAPTURE_FRAME_DOM=1
  RBI_DBIE_BO_CAPTURE_HISTORICAL_WINDOWS=1

Writes data/catalog/rbi-dbie-report<id>-bo-probe.json.`);
  process.exit(0);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function headerCookies(headers) {
  const values = headers.getSetCookie ? headers.getSetCookie() : headers.get("set-cookie") ? [headers.get("set-cookie")] : [];
  return values.map((value) => value.split(";")[0]).filter(Boolean);
}

function mergeCookies(...cookies) {
  const jar = new Map();
  for (const cookie of cookies.flat()) {
    for (const part of String(cookie || "").split(";")) {
      const item = part.trim();
      if (!item || /^path=|^domain=|^expires=|^max-age=|^secure$|^httponly$|^samesite=/i.test(item)) continue;
      const separator = item.indexOf("=");
      if (separator < 1) continue;
      jar.set(item.slice(0, separator), item.slice(separator + 1));
    }
  }
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function cookieNames(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter(Boolean)
    .sort();
}

function redactUrl(value) {
  if (!value) return value;
  try {
    const url = new URL(value);
    for (const key of url.searchParams.keys()) {
      if (/token|SerializedSession|session|password|auth/i.test(key)) url.searchParams.set(key, "REDACTED");
    }
    return url.toString();
  } catch {
    return String(value)
      .replace(/([?&](?:token|bttoken|SerializedSession|sapToken|sapLogonToken|password|auth)[^=]*=)[^&\s"']+/gi, "$1REDACTED")
      .replace(/(OpenDocumentPLATFORMSVC_COOKIE_TOKEN=)[^;\s"']+/gi, "$1REDACTED");
  }
}

function attr(tag, name) {
  const match = String(tag).match(new RegExp(`${name}=["']([^"']*)`, "i"));
  return decodeHtmlEntities(match?.[1] || "");
}

function extractForms(html) {
  return [...String(html).matchAll(/<form\b[\s\S]*?<\/form>/gi)].map((match, index) => {
    const form = match[0];
    const inputs = [...form.matchAll(/<input\b[^>]*>/gi)]
      .map((inputMatch) => ({
        name: attr(inputMatch[0], "name"),
        type: attr(inputMatch[0], "type"),
        value: attr(inputMatch[0], "value")
      }))
      .filter((input) => input.name);
    return {
      index,
      action: attr(form, "action"),
      method: attr(form, "method") || "GET",
      target: attr(form, "target"),
      inputs
    };
  });
}

function summarizeForms(forms) {
  return forms.map((form) => ({
    index: form.index,
    action: redactUrl(form.action),
    method: form.method,
    target: form.target || null,
    inputs: form.inputs.map((input) => ({
      name: input.name,
      type: input.type || null,
      valueLength: input.value.length,
      observed: input.value.length > 0
    }))
  }));
}

function summarizeTextSignals(text) {
  const body = String(text);
  return {
    bytes: Buffer.byteLength(body),
    sha256: sha256(body),
    containsWebiView: /WebiView\.do/i.test(body),
    containsAnalyticalReporting: /AnalyticalReporting\//i.test(body),
    containsBttoken: /bttoken/i.test(body),
    containsSerializedSession: /SerializedSession/i.test(body),
    containsBackurl: /backurl/i.test(body),
    containsExportText: /\b(export|xlsx?|csv|pdf)\b/i.test(body),
    containsUnauthorised: /unauthori[sz]ed|Unauthorised Access/i.test(body),
    forms: summarizeForms(extractForms(body))
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
  const decryptedGatewayToken = encryptedGatewayToken ? decryptDbiePayload(encryptedGatewayToken) : null;
  return {
    status: response.status,
    header: json.header || null,
    authorizationObserved: Boolean(response.headers.get("authorization")),
    responseAuthorizationMatchesDecryptedToken: response.headers.get("authorization") === decryptedGatewayToken,
    decryptedGatewayToken,
    cookies: headerCookies(response.headers)
  };
}

function reportLinkTokenLength(sapLink) {
  try {
    return (new URL(`https://data.rbi.org.in${sapLink}`).searchParams.get("token") || "").length;
  } catch {
    return 0;
  }
}

async function fetchReportLinkWithRetry(session) {
  const attempts = [];
  for (let attempt = 1; attempt <= MAX_LINK_ATTEMPTS; attempt += 1) {
    const link = await fetchDbieReportLink(REPORT_ID, { session, timeoutMs: 15000 });
    const tokenLength = reportLinkTokenLength(link.sapLink);
    attempts.push({
      attempt,
      status: link.status,
      header: link.json?.header || null,
      sapLinkLength: link.sapLink?.length || 0,
      tokenLength,
      redactedSapLink: redactUrl(`https://data.rbi.org.in${link.sapLink}`)
    });
    if (tokenLength > 0) return { link, attempts };
    await wait(500 * attempt);
  }
  return { link: null, attempts };
}

async function fetchOpenDocumentHttp(openDocumentUrl, cookieHeader) {
  const steps = [];
  let activeCookie = cookieHeader || "";
  const firstResponse = await fetch(openDocumentUrl, {
    redirect: "manual",
    signal: timeoutSignal(30000),
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
      "user-agent": "Mozilla/5.0 Indica RBI DBIE BO probe",
      ...(activeCookie ? { cookie: activeCookie } : {})
    }
  });
  activeCookie = mergeCookies(activeCookie, headerCookies(firstResponse.headers));
  const firstText = await firstResponse.text();
  steps.push({
    step: "initial-open-document-get",
    url: redactUrl(openDocumentUrl),
    status: firstResponse.status,
    location: redactUrl(firstResponse.headers.get("location")),
    contentType: firstResponse.headers.get("content-type"),
    setCookieNames: cookieNames(headerCookies(firstResponse.headers).join("; ")),
    body: summarizeTextSignals(firstText)
  });

  const firstForm = extractForms(firstText)[0];
  if (!firstForm) return { steps, cookieNames: cookieNames(activeCookie) };

  const scriptedBody = new URLSearchParams();
  for (const input of firstForm.inputs) scriptedBody.append(input.name, input.value);
  scriptedBody.set("isApplication", "true");
  scriptedBody.set("appKind", "OpenDocument");
  scriptedBody.set("userParamsList", "null");

  const postUrl = new URL(firstForm.action || openDocumentUrl, openDocumentUrl).toString();
  const postResponse = await fetch(postUrl, {
    method: "POST",
    redirect: "manual",
    signal: timeoutSignal(30000),
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Mozilla/5.0 Indica RBI DBIE BO probe",
      origin: "https://data.rbi.org.in",
      referer: openDocumentUrl,
      ...(activeCookie ? { cookie: activeCookie } : {})
    },
    body: scriptedBody
  });
  activeCookie = mergeCookies(activeCookie, headerCookies(postResponse.headers));
  const postText = await postResponse.text();
  steps.push({
    step: "scripted-first-form-post",
    url: redactUrl(postUrl),
    status: postResponse.status,
    location: redactUrl(postResponse.headers.get("location")),
    contentType: postResponse.headers.get("content-type"),
    setCookieNames: cookieNames(headerCookies(postResponse.headers).join("; ")),
    postedInputNames: [...scriptedBody.keys()].sort(),
    postedTokenLength: scriptedBody.get("token")?.length || 0,
    body: summarizeTextSignals(postText)
  });

  return { steps, cookieNames: cookieNames(activeCookie) };
}

async function readDevToolsPort(userDataDir) {
  const activePortPath = join(userDataDir, "DevToolsActivePort");
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const [port] = String(await readFile(activePortPath, "utf8")).trim().split(/\n/);
      if (port) return port;
    } catch {
      await wait(250);
    }
  }
  throw new Error("Chrome did not publish DevToolsActivePort");
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
        else resolve(message.result || {});
        return;
      }
      const handlers = this.handlers.get(message.method) || [];
      for (const handler of handlers) handler(message.params || {});
    });
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
  }

  send(method, params = {}, timeoutMs = 15000) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMs);
    });
  }

  close() {
    this.ws.close();
  }
}

function responseHeadersSubset(headers = {}) {
  const wanted = {};
  for (const [key, value] of Object.entries(headers)) {
    if (/^(content-type|content-disposition|location|x-frame-options|set-cookie)$/i.test(key)) wanted[key] = value;
  }
  return wanted;
}

function interestingUrl(url) {
  return /OpenDocument|AnalyticalReporting|WebiView|Raylight|Export|export|xls|xlsx|csv|pdf|bttoken|SerializedSession/i.test(url);
}

function shouldSnapshotBody(response) {
  const url = response.url || "";
  const mimeType = response.mimeType || "";
  if (/biprwsproxy\/biprws\/raylight\/v1/i.test(url)) return true;
  if (/AnalyticalReporting\/WebiView\.do/i.test(url)) return true;
  if (/excel|spreadsheet|csv|pdf|multipart/i.test(mimeType)) return true;
  return false;
}

function extensionForMime(mimeType) {
  if (/json/i.test(mimeType)) return "json";
  if (/xml/i.test(mimeType)) return "xml";
  if (/multipart/i.test(mimeType)) return "multipart";
  if (/html/i.test(mimeType)) return "html";
  if (/csv/i.test(mimeType)) return "csv";
  if (/pdf/i.test(mimeType)) return "pdf";
  if (/excel|spreadsheet/i.test(mimeType)) return "xlsx";
  return "bin";
}

function pageOutputUrlCandidates(pageOutputUrl, px) {
  const stamp = String(Date.now());
  const candidates = [];
  const withFreshC = String(pageOutputUrl).replace(/([?&])c=\d+/i, `$1c=${stamp}`);
  candidates.push(`${withFreshC}&px=${px}&py=1`);
  try {
    const pathPage = new URL(withFreshC);
    pathPage.pathname = pathPage.pathname.replace(/\/pages\/\d+$/i, `/pages/${px}`);
    candidates.push(pathPage.toString().replace("getReportPageOutput=", "getReportPageOutput"));
    candidates.push(`${pathPage.toString().replace("getReportPageOutput=", "getReportPageOutput")}&px=${px}&py=1`);
  } catch {
    return candidates;
  }
  return [...new Set(candidates)];
}

async function fetchTextInBrowser(client, url, options = {}) {
  const method = options.method || "GET";
  const headers = options.headers || {};
  const body = options.body;
  const timeoutMs = options.timeoutMs || 20000;
  const expression = `(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ${JSON.stringify(timeoutMs)});
    return fetch(${JSON.stringify(url)}, {
        method: ${JSON.stringify(method)},
        credentials: "include",
        signal: controller.signal,
        headers: ${JSON.stringify(headers)},
        ${body === undefined ? "" : `body: ${JSON.stringify(body)},`}
      })
      .then(async (response) => ({
        ok: response.ok,
        status: response.status,
        url: response.url,
        contentType: response.headers.get("content-type"),
        text: await response.text()
      }))
      .catch((error) => ({ ok: false, error: String(error && error.message || error) }))
      .finally(() => clearTimeout(timeout));
  })()`;
  const result = await client.send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression
  }, Math.max(60000, timeoutMs + 10000));
  return result.result?.value || null;
}

function parseQuarterLabel(label) {
  const months = { Mar: 3, Jun: 6, Sep: 9, Dec: 12 };
  const match = String(label).match(/^(Mar|Jun|Sep|Dec)-(\d{4})$/);
  if (!match) return null;
  return Number(match[2]) * 100 + months[match[1]];
}

async function reportingQuarterLovValues(bodySummaries) {
  const summaries = (bodySummaries || []).filter((summary) => summary.rawSnapshot && /LoadInputControlsLovs/i.test(summary.redactedUrl || ""));
  for (const summary of summaries) {
    try {
      const json = JSON.parse(await readFile(summary.rawSnapshot, "utf8"));
      const responses = json?.pool?.response || [];
      const lov = responses
        .map((response) => response?.body?.lov)
        .find((candidate) => candidate?.columns?.column?.some?.((column) => column.$ === "V_Reporting Date"));
      const values = lov?.values?.value;
      if (Array.isArray(values)) {
        return values
          .filter((value) => parseQuarterLabel(value) !== null)
          .sort((a, b) => parseQuarterLabel(a) - parseQuarterLabel(b));
      }
    } catch {
      // Keep scanning other snapshots.
    }
  }
  return [];
}

function historicalQuarterWindows(values, alreadyRenderedLabels, size = 20) {
  const rendered = new Set(alreadyRenderedLabels || []);
  const remaining = values.filter((value) => !rendered.has(value));
  const windows = [];
  for (let end = remaining.length; end > 0; end -= size) {
    windows.push(remaining.slice(Math.max(0, end - size), end));
  }
  return windows.filter((window) => window.length);
}

function multipartPeriodLabels(text) {
  const match = String(text).match(/Content-ID:\s*<jsondata>\r?\n\r?\n([\s\S]*?)\r?\n--uuid:/);
  if (!match) return [];
  try {
    const json = JSON.parse(match[1].trim());
    return (json?.jsonData?.outline?.[0]?.cctx || [])
      .map((context) => context.datapath?.find((item) => item.n === "V_Reporting Date")?.v)
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function captureChromeNetwork(openDocumentUrl) {
  const userDataDir = await mkdtemp(join(tmpdir(), "indica-rbi-bo-"));
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  let client = null;
  try {
    const port = await readDevToolsPort(userDataDir);
    const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" });
    const target = await targetResponse.json();
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.open();

    const requests = new Map();
    const responses = new Map();
    const bodySummaries = [];
    const bodyPromises = [];
    const consoleMessages = [];
    const executionContexts = [];

    client.on("Network.requestWillBeSent", (params) => {
      requests.set(params.requestId, {
        requestId: params.requestId,
        method: params.request?.method || null,
        url: params.request?.url || null,
        redactedUrl: redactUrl(params.request?.url),
        resourceType: params.type || null,
        initiatorType: params.initiator?.type || null,
        hasPostData: Boolean(params.request?.hasPostData)
      });
    });
    client.on("Network.responseReceived", (params) => {
      responses.set(params.requestId, {
        requestId: params.requestId,
        url: params.response?.url || null,
        redactedUrl: redactUrl(params.response?.url),
        resourceType: params.type || null,
        status: params.response?.status || null,
        mimeType: params.response?.mimeType || null,
        headers: responseHeadersSubset(params.response?.headers || {})
      });
    });
    client.on("Network.loadingFinished", (params) => {
      const promise = (async () => {
        const response = responses.get(params.requestId);
        if (!response || !interestingUrl(response.url || "")) return;
        try {
          const body = await client.send("Network.getResponseBody", { requestId: params.requestId });
          const buffer = body.base64Encoded ? Buffer.from(body.body || "", "base64") : Buffer.from(body.body || "");
          let rawSnapshot = null;
          if (shouldSnapshotBody(response) && buffer.length > 0) {
            rawSnapshot = await writeRawSnapshot(
              "rbi-dbie",
              `bo-report-${REPORT_ID}.${params.requestId}.${extensionForMime(response.mimeType)}`,
              buffer,
              extensionForMime(response.mimeType)
            );
          }
          bodySummaries.push({
            requestId: params.requestId,
            redactedUrl: response.redactedUrl,
            encodedDataLength: params.encodedDataLength,
            bodyBytes: buffer.length,
            bodySha256: sha256(buffer),
            rawSnapshot: rawSnapshot?.path || null,
            rawHash: rawSnapshot?.hash || null,
            base64Encoded: Boolean(body.base64Encoded),
            textSignals: response.mimeType && /html|json|javascript|text|xml|multipart/i.test(response.mimeType)
              ? summarizeTextSignals(buffer.toString("utf8")).forms.length || interestingUrl(response.url)
                ? summarizeTextSignals(buffer.toString("utf8"))
                : null
              : null
          });
        } catch (error) {
          bodySummaries.push({ requestId: params.requestId, redactedUrl: response.redactedUrl, error: error.message });
        }
      })();
      bodyPromises.push(promise);
    });
    client.on("Runtime.consoleAPICalled", (params) => {
      consoleMessages.push({
        type: params.type,
        args: (params.args || []).map((arg) => String(arg.value ?? arg.description ?? "")).slice(0, 4)
      });
    });
    client.on("Runtime.executionContextCreated", (params) => {
      executionContexts.push({
        id: params.context?.id,
        name: params.context?.name || null,
        origin: params.context?.origin || null,
        auxData: params.context?.auxData || null
      });
    });

    await client.send("Network.enable", { maxResourceBufferSize: 10000000, maxTotalBufferSize: 50000000 });
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Page.navigate", { url: openDocumentUrl });
    await wait(CHROME_WAIT_MS);
    await Promise.allSettled(bodyPromises);

    const pageOutputResponse = [...responses.values()].find((response) => /\/reports\/\d+\/pages\/\d+\?getReportPageOutput/i.test(response.url || ""));
    const extraPageFetches = [];
    if (pageOutputResponse?.url && EXTRA_HORIZONTAL_PAGES.length) {
      for (const px of EXTRA_HORIZONTAL_PAGES) {
        for (const [variantIndex, candidateUrl] of pageOutputUrlCandidates(pageOutputResponse.url, px).entries()) {
          const fetched = await fetchTextInBrowser(client, candidateUrl);
          if (!fetched) {
            extraPageFetches.push({ px, variantIndex, redactedUrl: redactUrl(candidateUrl), ok: false, error: "empty browser fetch result" });
            continue;
          }
          const buffer = Buffer.from(fetched.text || "", "utf8");
          const rawSnapshot = fetched.status === 200 && buffer.length > 0
            ? await writeRawSnapshot(
              "rbi-dbie",
              `bo-report-${REPORT_ID}.extra-px-${px}.variant-${variantIndex + 1}.${extensionForMime(fetched.contentType || "")}`,
              buffer,
              extensionForMime(fetched.contentType || "")
            )
            : null;
          extraPageFetches.push({
            px,
            variantIndex: variantIndex + 1,
            ok: Boolean(fetched.ok),
            status: fetched.status || null,
            redactedUrl: redactUrl(fetched.url || candidateUrl),
            contentType: fetched.contentType || null,
            error: fetched.error || null,
            bodyBytes: buffer.length,
            bodySha256: buffer.length ? sha256(buffer) : null,
            rawSnapshot: rawSnapshot?.path || null,
            rawHash: rawSnapshot?.hash || null,
            textSignals: buffer.length && /html|json|javascript|text|xml|multipart/i.test(fetched.contentType || "")
              ? summarizeTextSignals(buffer.toString("utf8"))
              : null
          });
          if (fetched.status === 200 && /Content-ID:\s*<page>/i.test(fetched.text || "")) break;
        }
      }
    }

    const historicalWindowFetches = [];
    if (pageOutputResponse?.url && CAPTURE_HISTORICAL_WINDOWS) {
      const firstPageSummary = bodySummaries.find((summary) => /\/reports\/\d+\/pages\/\d+\?getReportPageOutput/i.test(summary.redactedUrl || "") && summary.rawSnapshot);
      const firstPageText = firstPageSummary?.rawSnapshot ? await readFile(firstPageSummary.rawSnapshot, "utf8") : "";
      const alreadyRenderedLabels = multipartPeriodLabels(firstPageText);
      const lovValues = await reportingQuarterLovValues(bodySummaries);
      const windows = historicalQuarterWindows(lovValues, alreadyRenderedLabels);
      const selectionUrl = pageOutputResponse.url.replace(/\/reports\/(\d+)\/pages\/\d+\?.*$/i, "/reports/$1/inputcontrols/R26.IF1/selection");
      const pageUrl = pageOutputResponse.url.replace(/([?&])c=\d+/i, `$1c=${Date.now()}`);
      for (const [windowIndex, values] of windows.entries()) {
        const selectionBody = JSON.stringify({ selection: { value: values } });
        const selectionResult = await fetchTextInBrowser(client, selectionUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: selectionBody,
          timeoutMs: 20000
        });
        const pageResult = await fetchTextInBrowser(client, pageUrl.replace(/([?&])c=\d+/i, `$1c=${Date.now() + windowIndex + 1}`), {
          headers: { Accept: "multipart/mixed,*/*" },
          timeoutMs: 30000
        });
        const buffer = Buffer.from(pageResult?.text || "", "utf8");
        const rawSnapshot = pageResult?.status === 200 && /Content-ID:\s*<page>/i.test(pageResult.text || "")
          ? await writeRawSnapshot(
            "rbi-dbie",
            `bo-report-${REPORT_ID}.historical-window-${windowIndex + 1}.multipart`,
            buffer,
            "multipart"
          )
          : null;
        historicalWindowFetches.push({
          windowIndex: windowIndex + 1,
          values,
          selection: {
            ok: Boolean(selectionResult?.ok),
            status: selectionResult?.status || null,
            contentType: selectionResult?.contentType || null,
            error: selectionResult?.error || null,
            bodyBytes: Buffer.byteLength(selectionResult?.text || "")
          },
          page: {
            ok: Boolean(pageResult?.ok),
            status: pageResult?.status || null,
            contentType: pageResult?.contentType || null,
            error: pageResult?.error || null,
            bodyBytes: buffer.length,
            bodySha256: buffer.length ? sha256(buffer) : null,
            rawSnapshot: rawSnapshot?.path || null,
            rawHash: rawSnapshot?.hash || null,
            periodLabels: multipartPeriodLabels(pageResult?.text || "")
          }
        });
      }
    }

    const frameTree = await client.send("Page.getFrameTree").catch((error) => ({ error: error.message }));
    const frameDomSummaries = [];
    if (CAPTURE_FRAME_DOM) {
      const domContexts = executionContexts
        .filter((item) => item.id && (item.auxData?.isDefault || /data\.rbi\.org\.in/i.test(item.origin || "")))
        .slice(0, 12);
      for (const context of domContexts) {
        try {
          const summary = await client.send("Runtime.evaluate", {
            contextId: context.id,
            awaitPromise: true,
            returnByValue: true,
            expression: `(() => {
              const interesting = Array.from(document.querySelectorAll("button,a,input,select,[role=button],[title],[aria-label]"))
                .map((el) => ({
                  tag: el.tagName,
                  id: el.id || "",
                  name: el.getAttribute("name") || "",
                  type: el.getAttribute("type") || "",
                  role: el.getAttribute("role") || "",
                  title: el.getAttribute("title") || "",
                  aria: el.getAttribute("aria-label") || "",
                  text: (el.innerText || el.value || "").replace(/\\s+/g, " ").trim().slice(0, 120),
                  className: String(el.className || "").slice(0, 160)
                }))
                .filter((item) => /page|next|prev|previous|arrow|right|left|first|last|export|xls|pdf|csv|refresh|input|quarter|report/i.test(Object.values(item).join(" ")))
                .slice(0, 120);
              return {
                href: location.href,
                title: document.title,
                readyState: document.readyState,
                bodyText: document.body ? document.body.innerText.replace(/\\s+/g, " ").slice(0, 3000) : "",
                interesting
              };
            })()`
          }, 5000);
          frameDomSummaries.push({ context, summary: summary.result?.value || null });
        } catch (error) {
          frameDomSummaries.push({ context, error: error.message });
        }
      }
    }

    const runtime = await client.send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => ({
        href: location.href,
        title: document.title,
        readyState: document.readyState,
        bodyText: document.body ? document.body.innerText.slice(0, 1000) : "",
        forms: Array.from(document.forms).map(form => ({ action: form.action, method: form.method, target: form.target, inputs: Array.from(form.elements).map(el => ({ name: el.name, type: el.type, valueLength: String(el.value || "").length })) })),
        frames: Array.from(document.querySelectorAll("iframe,frame")).map(frame => ({ src: frame.src, name: frame.name, id: frame.id })),
        links: Array.from(document.querySelectorAll("a[href]")).map(a => a.href).filter(href => /export|xls|csv|pdf|AnalyticalReporting|OpenDocument|Webi|Raylight/i.test(href)).slice(0, 50)
      }))()`
    }, 30000);

    const network = [...responses.values()].map((response) => ({
      ...response,
      url: undefined
    }));
    const exportCandidates = network.filter((entry) => /export|xls|xlsx|csv|pdf|Raylight/i.test(entry.redactedUrl || "") || /spreadsheet|excel|csv|pdf/i.test(entry.mimeType || ""));

    return {
      ok: true,
      chromePath: CHROME_PATH,
      waitMs: CHROME_WAIT_MS,
      requestCount: requests.size,
      responseCount: responses.size,
      network,
      exportCandidates,
      bodySummaries,
      extraPageFetches,
      historicalWindowFetches,
      frameTree,
      executionContexts,
      frameDomSummaries,
      consoleMessages: consoleMessages.slice(0, 50),
      finalPage: {
        ...runtime.result?.value,
        href: redactUrl(runtime.result?.value?.href),
        forms: (runtime.result?.value?.forms || []).map((form) => ({ ...form, action: redactUrl(form.action) })),
        frames: (runtime.result?.value?.frames || []).map((frame) => ({ ...frame, src: redactUrl(frame.src) })),
        links: (runtime.result?.value?.links || []).map(redactUrl)
      }
    };
  } finally {
    if (client) client.close();
    chrome.kill("SIGTERM");
    await wait(500);
    if (!chrome.killed) chrome.kill("SIGKILL");
    await rm(userDataDir, { recursive: true, force: true });
  }
}

const warnings = [];
const session = await fetchDbieSession({ timeoutMs: 15000 });
const sapGatewayToken = await fetchSapGatewayToken(session);
const cookieHeader = mergeCookies(session.cookie, sapGatewayToken.cookies);
const reportLink = await fetchReportLinkWithRetry(session);
const chosenLink = reportLink.link;
let httpOpenDocument = null;
let chromeTrace = null;

if (!chosenLink) {
  warnings.push({
    severity: "warning",
    message: `Report ${REPORT_ID} did not return a non-empty BO token after ${MAX_LINK_ATTEMPTS} attempts.`
  });
} else {
  const openDocumentUrl = `https://data.rbi.org.in${chosenLink.sapLink}`;
  httpOpenDocument = await fetchOpenDocumentHttp(openDocumentUrl, cookieHeader);
  try {
    chromeTrace = await captureChromeNetwork(openDocumentUrl);
  } catch (error) {
    chromeTrace = { ok: false, error: error.message, chromePath: CHROME_PATH };
    warnings.push({ severity: "warning", message: `Chrome/CDP BO trace failed: ${error.message}` });
  }
}

const result = {
  schemaVersion: 1,
  fetchedAt,
  sourceId: "rbi-dbie",
  purpose: "Detailed SAP BusinessObjects/OpenDocument probe for RBI DBIE report 40",
  reportId: REPORT_ID,
  evidenceStatus: "discovery_only_bo_viewer_trace_not_article_evidence",
  sapGatewayToken: {
    status: sapGatewayToken.status,
    header: sapGatewayToken.header,
    authorizationObserved: sapGatewayToken.authorizationObserved,
    responseAuthorizationMatchesDecryptedToken: sapGatewayToken.responseAuthorizationMatchesDecryptedToken
  },
  reportLinkAttempts: reportLink.attempts,
  selectedReportLink: chosenLink ? {
    status: chosenLink.status,
    tokenLength: reportLinkTokenLength(chosenLink.sapLink),
    redactedSapLink: redactUrl(`https://data.rbi.org.in${chosenLink.sapLink}`)
  } : null,
  httpOpenDocument,
  chromeTrace,
  conclusion: {
    plainHttp: httpOpenDocument?.steps?.some((step) => step.body?.containsWebiView || step.body?.containsAnalyticalReporting)
      ? "Plain HTTP reached a BO/WebI-bearing response; inspect body hashes before any evidence promotion."
      : "Plain HTTP did not reproduce the browser callback into WebI.",
    chrome: chromeTrace?.exportCandidates?.length
      ? "Chrome observed possible export/download candidates; these still need a deterministic adapter and raw-byte preservation before evidence use."
      : "Chrome did not observe a stable XLS/CSV/PDF/JSON export endpoint during the wait window."
  },
  warnings
};

await mkdir("data/catalog", { recursive: true });
await writeFile(OUTPUT_PATH, `${stableJson(result)}\n`);

console.log(JSON.stringify({
  ok: true,
  output: OUTPUT_PATH,
  reportId: REPORT_ID,
  linkAttempts: reportLink.attempts.length,
  selectedTokenLength: result.selectedReportLink?.tokenLength || 0,
  httpSteps: httpOpenDocument?.steps?.length || 0,
  chromeOk: Boolean(chromeTrace?.ok),
  chromeResponses: chromeTrace?.responseCount || 0,
  exportCandidates: chromeTrace?.exportCandidates?.length || 0,
  warnings: warnings.length
}, null, 2));
