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
  for (const key of ["api_key", "token", "key"]) {
    if (copy.searchParams.has(key)) copy.searchParams.set(key, "REDACTED");
  }
  return copy.toString();
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "user-agent": "Indica/0.1 data ingest",
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${redactUrl(url)}`);
  }

  return response.json();
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
