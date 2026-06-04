import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Add it to .env.`);
  return value;
}

export function buildUrl(baseUrl, path = "", params = {}) {
  const url = path
    ? new URL(path.replace(/^\/+/, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`)
    : new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url;
}

export function redactUrl(url) {
  const copy = new URL(url.toString());
  for (const key of ["api_key", "apikey", "token", "key"]) {
    if (copy.searchParams.has(key)) copy.searchParams.set(key, "REDACTED");
  }
  return copy.toString();
}

export function timeoutSignal(timeoutMs = Number(process.env.INDICA_FETCH_TIMEOUT_MS || 30000)) {
  if (!timeoutMs) return undefined;
  if (typeof globalThis.AbortSignal?.timeout === "function") return globalThis.AbortSignal.timeout(timeoutMs);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson(url, options = {}) {
  const {
    timeoutMs,
    retries = 2,
    retryDelayMs = 1200,
    headers,
    ...fetchOptions
  } = options;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: fetchOptions.signal || timeoutSignal(timeoutMs),
        headers: {
          accept: "application/json",
          "user-agent": "Indica/0.1 data ingest",
          ...headers
        }
      });

      if (response.ok) return response.json();
      if (![429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${redactUrl(url)}`);
      }
      if (attempt === retries) {
        throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${redactUrl(url)}`);
      }
    } catch (error) {
      if (attempt === retries || error.name === "AbortError" || error.message.startsWith("Fetch failed 4")) throw error;
    }

    await wait(retryDelayMs * (attempt + 1));
  }

  throw new Error(`Fetch failed after retries: ${redactUrl(url)}`);
}

export async function fetchText(url, options = {}) {
  const { timeoutMs, retries = 2, retryDelayMs = 1200, headers, ...fetchOptions } = options;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: fetchOptions.signal || timeoutSignal(timeoutMs),
        headers: { "user-agent": "Indica/0.1 data ingest", ...headers }
      });
      if (response.ok) return response.text();
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === retries) {
        throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${redactUrl(url)}`);
      }
    } catch (error) {
      if (attempt === retries || error.name === "AbortError" || error.message.startsWith("Fetch failed 4")) throw error;
    }
    await wait(retryDelayMs * (attempt + 1));
  }
  throw new Error(`Fetch failed after retries: ${redactUrl(url)}`);
}

export async function writeJsonSnapshot(sourceId, name, payload) {
  const body = JSON.stringify(payload, null, 2);
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
  const dir = `data/snapshots/${sourceId}`;
  await mkdir(dir, { recursive: true });
  const path = `${dir}/${name}.${hash}.json`;
  await writeFile(path, `${body}\n`);
  return { path, hash };
}
