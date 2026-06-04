import { createCipheriv, createDecipheriv, pbkdf2Sync } from "node:crypto";
import { buildUrl, fetchJson, redactUrl, timeoutSignal } from "../lib/source-http.mjs";

export const RBI_DBIE_HOME = "https://data.rbi.org.in/DBIE/#/dbie/home";
export const RBI_DBIE_BASE = "https://data.rbi.org.in/DBIE/";
export const RBI_DBIE_SERVICE_BASE = "https://data.rbi.org.in/CIMS_Gateway_DBIE/GATEWAY/SERVICES";
export const RBI_LOGIN_SERVICE_BASE = "https://data.rbi.org.in/CIMS_Gateway_LOGIN/GATEWAY/SERVICES";

const DEFAULT_HEADERS = {
  "user-agent": "Indica/0.1 RBI DBIE discovery",
  accept: "text/html,application/xhtml+xml,application/xml,application/json,text/plain,*/*"
};

const JSON_HEADERS = {
  "user-agent": "Indica/0.1 RBI DBIE data ingest",
  "Content-Type": "application/json",
  channelkey: "key2",
  datatype: "application/json",
  accept: "application/json,text/plain,*/*"
};

const HTML_ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: "\""
};

const RBI_DBIE_CRYPTO = {
  token: "48d6b976d7135745b47b407cd8e659a45d8ebaca4ee95f87d5d939604f472268",
  saltHex: "577bd45a17977269694908d80905c32a",
  ivHex: "dc0da04af8fee58593442bf834b30739",
  nullCiphertext: "QlAU23oEIEEvtRPWlXajsQ=="
};

const RBI_DBIE_AES_KEY = pbkdf2Sync(
  RBI_DBIE_CRYPTO.token,
  Buffer.from(RBI_DBIE_CRYPTO.saltHex, "hex"),
  1000,
  32,
  "sha1"
);

const RBI_DBIE_AES_IV = Buffer.from(RBI_DBIE_CRYPTO.ivHex, "hex");

export function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => HTML_ENTITIES[name] ?? match);
}

export function encryptDbiePayload(value) {
  const cipher = createCipheriv("aes-256-cbc", RBI_DBIE_AES_KEY, RBI_DBIE_AES_IV);
  return Buffer.concat([cipher.update(String(value ?? ""), "utf8"), cipher.final()]).toString("base64");
}

export function decryptDbiePayload(value) {
  if (value === undefined || value === null || value === RBI_DBIE_CRYPTO.nullCiphertext) return null;
  const decipher = createDecipheriv("aes-256-cbc", RBI_DBIE_AES_KEY, RBI_DBIE_AES_IV);
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(String(value), "base64")),
    decipher.final()
  ]).toString("utf8");
  if (plaintext === "true" || plaintext === "false") return JSON.parse(plaintext);
  const numeric = Number(plaintext);
  return numeric ? numeric : plaintext;
}

function parseDbieJson(text, url) {
  const decodedText = decodeHtmlEntities(text);
  try {
    return { decodedText, json: JSON.parse(decodedText) };
  } catch (error) {
    throw new Error(`Failed to parse DBIE JSON from ${redactUrl(new URL(url))}: ${error.message}; preview=${decodedText.slice(0, 200)}`);
  }
}

export async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: options.signal || timeoutSignal(options.timeoutMs),
    headers: { ...DEFAULT_HEADERS, ...options.headers }
  });
  const text = await response.text();
  return {
    url: redactUrl(new URL(url)),
    status: response.status,
    contentType: response.headers.get("content-type"),
    text
  };
}

export async function fetchDbieHome() {
  return fetchText(RBI_DBIE_HOME);
}

export async function fetchDbieAsset(path) {
  return fetchText(buildUrl(RBI_DBIE_BASE, path));
}

export function extractAssetPaths(html) {
  return [...new Set(
    [...String(html).matchAll(/(?:href|src)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((path) => /\.(?:js|css)(?:$|\?)/i.test(path))
  )].sort();
}

export function extractDbieEndpointPaths(text) {
  return [...new Set(
    [...String(text).matchAll(/\/(?:download\/)?dbie_[A-Za-z0-9_/-]+/g)]
      .map((match) => match[0])
  )].sort();
}

export function extractServiceRoots(text) {
  return [...new Set(
    [...String(text).matchAll(/\/CIMS_Gateway_[A-Za-z0-9_/-]+\/GATEWAY\/SERVICES/g)]
      .map((match) => match[0])
  )].sort();
}

export async function fetchDbieSession({ timeoutMs } = {}) {
  const url = buildUrl(RBI_DBIE_SERVICE_BASE, "/security_generateSessionToken");
  const response = await fetch(url, {
    method: "POST",
    signal: timeoutSignal(timeoutMs),
    headers: JSON_HEADERS,
    body: JSON.stringify({ body: {} })
  });
  const text = await response.text();
  const { json } = parseDbieJson(text, url);
  const authorization = response.headers.get("authorization");
  if (!response.ok) throw new Error(`DBIE session token failed ${response.status} ${response.statusText}`);
  if (!authorization) throw new Error("DBIE session token response did not include an authorization header");
  return {
    generatedAt: new Date().toISOString(),
    authorization,
    cookie: response.headers.get("set-cookie") || "",
    status: response.status,
    contentType: response.headers.get("content-type"),
    header: json?.header || null
  };
}

export async function postDbieJson(path, body = { body: {} }, { session, serviceBase = RBI_DBIE_SERVICE_BASE, timeoutMs } = {}) {
  const url = buildUrl(serviceBase, path);
  const activeSession = session || await fetchDbieSession({ timeoutMs });
  const headers = { ...JSON_HEADERS, authorization: activeSession.authorization };
  if (activeSession.cookie) headers.cookie = activeSession.cookie;

  const response = await fetch(url, {
    method: "POST",
    signal: timeoutSignal(timeoutMs),
    headers,
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const { decodedText, json } = parseDbieJson(text, url);
  if (!response.ok) throw new Error(`DBIE endpoint failed ${response.status} ${response.statusText}: ${redactUrl(url)}`);
  return {
    path,
    url: redactUrl(url),
    status: response.status,
    contentType: response.headers.get("content-type"),
    decodedText,
    json
  };
}

export async function fetchDbieReportLink(reportId, { lang = "en", session, timeoutMs } = {}) {
  const result = await postDbieJson(
    "/dbie_getReportLink",
    {
      body: {
        reportId: encryptDbiePayload(reportId),
        lang: encryptDbiePayload(lang)
      }
    },
    { session, timeoutMs }
  );
  const encryptedSapLink = result.json?.body?.sapLink;
  return {
    ...result,
    reportId,
    lang,
    encryptedSapLink,
    sapLink: decryptDbiePayload(encryptedSapLink)
  };
}

export async function downloadDbieHdfsFile(filename, { session, timeoutMs } = {}) {
  const url = buildUrl(RBI_DBIE_SERVICE_BASE, "/download/dbie_FileDownloadHDFSAction");
  const activeSession = session || await fetchDbieSession({ timeoutMs });
  const form = new FormData();
  form.append("requestMessage", JSON.stringify({ body: { Filename: filename } }));
  const headers = { channelkey: "key2", authorization: activeSession.authorization };
  if (activeSession.cookie) headers.cookie = activeSession.cookie;

  const response = await fetch(url, {
    method: "POST",
    signal: timeoutSignal(timeoutMs),
    headers,
    body: form
  });
  const body = Buffer.from(await response.arrayBuffer());
  if (!response.ok) throw new Error(`DBIE HDFS download failed ${response.status} ${response.statusText}: ${redactUrl(url)}`);
  return {
    filename,
    url: redactUrl(url),
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentDisposition: response.headers.get("content-disposition"),
    bytes: body.length,
    body
  };
}

export async function probeDbieEndpoint(path, { body = { body: {} }, session } = {}) {
  const result = await postDbieJson(path, body, { session });
  return {
    path,
    url: result.url,
    status: result.status,
    contentType: result.contentType,
    header: result.json?.header || null,
    bodyKeys: result.json?.body && typeof result.json.body === "object" ? Object.keys(result.json.body).sort() : [],
    bodyPreview: result.decodedText.slice(0, 500)
  };
}

export async function fetchSapTokenProbe() {
  return fetchJson(buildUrl(RBI_LOGIN_SERVICE_BASE, "/login_getSapToken"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      channelkey: "key2",
      datatype: "application/json"
    },
    body: JSON.stringify({ body: { portalCode: "DBIE", user: "", code: "" } })
  });
}
