import { loadEnv } from "../env.mjs";

loadEnv();

export function absolutizeUrl(link, baseUrl) {
  try {
    return new URL(link, baseUrl).toString();
  } catch {
    return link;
  }
}

export function classifyLink(url) {
  const lower = String(url).toLowerCase();
  if (lower.includes("wp-json") || lower.includes("/api/") || lower.includes("api.") || lower.includes("webapi")) return "api";
  if (lower.includes("download.php") || lower.includes("/download")) return "download";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.includes("report")) return "report";
  return "page";
}

export function extractLinks(html, baseUrl) {
  const matches = [...String(html).matchAll(/(?:href|src)=["']([^"']+)["']/gi)]
    .map((match) => absolutizeUrl(match[1], baseUrl))
    .filter((url) => !url.startsWith("javascript:") && !url.startsWith("mailto:"));
  const seen = new Set();
  return matches
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .map((url) => ({ url, kind: classifyLink(url) }));
}

export async function fetchDiscoveryPage(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/json",
      "user-agent": "Mozilla/5.0 Indica/0.1 source discovery"
    }
  });
  const body = await response.text();
  return {
    url,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get("content-type") || "",
    bytes: Buffer.byteLength(body),
    links: response.ok && /html|xml|json|text/i.test(response.headers.get("content-type") || "")
      ? extractLinks(body, url)
      : [],
    bodySample: body.slice(0, 500)
  };
}

