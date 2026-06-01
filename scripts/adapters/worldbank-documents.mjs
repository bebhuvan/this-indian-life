import { loadEnv } from "../env.mjs";
import { buildUrl, fetchJson } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.WORLD_BANK_DOCUMENTS_BASE_URL || "https://search.worldbank.org/api/v3/wds";

export async function searchWorldBankDocuments({ qterm, rows = 10, offset = 0, fields = "display_title,docdt,pdfurl,url,abstracts" }) {
  return fetchJson(buildUrl(baseUrl, "", {
    format: "json",
    qterm,
    rows,
    os: offset,
    fl: fields
  }));
}

