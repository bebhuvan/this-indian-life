import { buildUrl, fetchJson, timeoutSignal } from "../lib/source-http.mjs";

const baseUrl = process.env.NADA_BASE_URL || "https://microdata.gov.in/NADA/index.php";

function textFromHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteNadaUrl(path) {
  return new URL(path, baseUrl).toString();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    signal: timeoutSignal(options.timeoutMs || 60000),
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml,application/json",
      "user-agent": "Indica/0.1 data discovery",
      ...options.headers
    }
  });
  if (!response.ok) throw new Error(`NADA fetch failed ${response.status}: ${url}`);
  return response.text();
}

export function nadaUrl(path, params = {}) {
  return buildUrl(baseUrl, path, params);
}

export async function fetchNadaCatalogPage(page = 1) {
  return fetchText(nadaUrl("/catalog/", { page }));
}

export async function fetchNadaStudyMetadata(catalogId) {
  return fetchJson(nadaUrl(`/metadata/export/${catalogId}/json`), { timeoutMs: 60000 });
}

export async function fetchNadaDataDictionary(catalogId) {
  return fetchText(nadaUrl(`/catalog/${catalogId}/data-dictionary`));
}

export async function fetchNadaRelatedMaterials(catalogId) {
  return fetchText(nadaUrl(`/catalog/${catalogId}/related-materials`));
}

export function parseNadaCatalogPage(html) {
  const totalMatch = html.match(/Showing\s*<b>[\d-]+<\/b>\s*of\s*<b>(\d+)<\/b>/i);
  const lastPageMatches = [...html.matchAll(/data-page="(\d+)"/g)].map((match) => Number(match[1])).filter(Boolean);
  const records = [];
  const rowRegex = /<div class="survey-row[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;
  for (const rowMatch of html.matchAll(rowRegex)) {
    const row = rowMatch[0];
    const url = row.match(/data-url="([^"]+)"/i)?.[1] || row.match(/href="([^"]*\/catalog\/\d+[^"]*)"/i)?.[1];
    const id = url?.match(/\/catalog\/(\d+)/)?.[1];
    const title = row.match(/title="([^"]+)"/i)?.[1] || textFromHtml(row.match(/views-field-title[\s\S]*?field-content">([\s\S]*?)<\/div>/i)?.[1] || "");
    const referenceId = row.match(/<span class="wb-label">ID:<\/span>\s*<span class="text-dark wb-value">([^<]+)<\/span>/i)?.[1];
    const lastModified = row.match(/Last modified:<\/span>\s*<span class="wb-value">([^<]+)<\/span>/i)?.[1];
    const collectionBlock = row.match(/Collection:\s*<\/span>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1];
    const collection = textFromHtml(collectionBlock || "");
    const access = /Public use data files/i.test(row) ? "public_use_data_files" : /Get Microdata/i.test(row) ? "get_microdata" : undefined;
    if (id && title) {
      records.push({
        catalogId: Number(id),
        title: textFromHtml(title),
        referenceId: textFromHtml(referenceId || ""),
        collection,
        lastModified: textFromHtml(lastModified || ""),
        access,
        url: absoluteNadaUrl(`/catalog/${id}`)
      });
    }
  }
  return {
    total: totalMatch ? Number(totalMatch[1]) : undefined,
    lastPage: lastPageMatches.length ? Math.max(...lastPageMatches) : undefined,
    records
  };
}

export function parseNadaDataDictionary(html) {
  const files = [];
  for (const rowMatch of html.matchAll(/<tr class="data-file-row[\s\S]*?<\/tr>/g)) {
    const row = rowMatch[0];
    const link = row.match(/href="([^"]*\/data-dictionary\/F\d+\?file_name=([^"]+))">([\s\S]*?)<\/a>/i);
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => textFromHtml(match[1]));
    if (link) {
      files.push({
        name: textFromHtml(link[2] || link[3]),
        url: absoluteNadaUrl(link[1]),
        cases: Number(cells.find((cell) => /^\d+$/.test(cell)) || 0) || undefined,
        variables: Number(cells.filter((cell) => /^\d+$/.test(cell))[1] || 0) || undefined
      });
    }
  }

  for (const match of html.matchAll(/href="([^"]*\/data-dictionary\/F\d+\?file_name=([^"]+))">([\s\S]*?)<\/a>[\s\S]{0,220}?<td[^>]*>\s*(\d+)\s*<\/td>[\s\S]{0,120}?<td[^>]*>\s*(\d+)\s*<\/td>/g)) {
    if (files.some((file) => file.url === absoluteNadaUrl(match[1]))) continue;
    files.push({
      name: textFromHtml(match[2] || match[3]),
      url: absoluteNadaUrl(match[1]),
      cases: Number(match[4]),
      variables: Number(match[5])
    });
  }

  if (!files.length) {
    for (const match of html.matchAll(/href="([^"]*\/data-dictionary\/F\d+\?file_name=([^"]+))">([\s\S]*?)<\/a>/g)) {
      files.push({
        name: textFromHtml(match[2] || match[3]),
        url: absoluteNadaUrl(match[1])
      });
    }
  }

  return { files };
}

export function parseNadaRelatedMaterials(html) {
  const materials = [];
  const seen = new Set();
  for (const match of html.matchAll(/([^<\n]{3,120})\s*<\/[^>]+>[\s\S]{0,600}?href="([^"]*\/catalog\/\d+\/download\/\d+)"[\s\S]{0,160}?(?:Download \[([^\]]+)\])?/g)) {
    const url = absoluteNadaUrl(match[2]);
    if (seen.has(url)) continue;
    seen.add(url);
    materials.push({
      title: textFromHtml(match[1]),
      url,
      fileInfo: textFromHtml(match[3] || "")
    });
  }

  if (!materials.length) {
    for (const match of html.matchAll(/href="([^"]*\/catalog\/\d+\/download\/\d+)"/g)) {
      const url = absoluteNadaUrl(match[1]);
      if (seen.has(url)) continue;
      seen.add(url);
      materials.push({ title: "", url, fileInfo: "" });
    }
  }

  return { materials };
}

export async function discoverNadaCatalog({ maxPages } = {}) {
  const firstHtml = await fetchNadaCatalogPage(1);
  const first = parseNadaCatalogPage(firstHtml);
  const pageCount = Math.min(maxPages || first.lastPage || 1, first.lastPage || maxPages || 1);
  const records = [...first.records];
  for (let page = 2; page <= pageCount; page += 1) {
    const html = await fetchNadaCatalogPage(page);
    records.push(...parseNadaCatalogPage(html).records);
  }
  return {
    total: first.total,
    pagesDiscovered: pageCount,
    records
  };
}
