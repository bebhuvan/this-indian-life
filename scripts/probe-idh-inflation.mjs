// One-off probe: enumerate IndiaDataHub economy categories and the Prices/Inflation
// series (Identifier codes), so we can pick the spliced headline CPI + sub-groups.
import { loadEnv } from "./env.mjs";
import { buildUrl, fetchJson, requireEnv } from "./lib/source-http.mjs";

loadEnv();
const baseUrl = process.env.INDIA_DATA_HUB_BASE_URL || "https://feeds.indiadatahub.com";
const key = () => ({ api_key: requireEnv("INDIA_DATA_HUB_API_KEY") });
const url = (path, params = {}) => buildUrl(baseUrl, path, { ...params, ...key() });

function pick(obj, names) {
  for (const n of names) if (obj && obj[n] != null) return obj[n];
  return undefined;
}

try {
  console.log("== /economy/category_list ==");
  const cats = await fetchJson(url("/economy/category_list"));
  const list = cats?.category_list || cats?.categories || cats;
  const catNames = Array.isArray(list) ? list : Object.keys(list || {});
  console.log(JSON.stringify(catNames, null, 0).slice(0, 1500));

  // candidate category labels for prices/inflation
  const flat = JSON.stringify(cats).toLowerCase();
  console.log("\nmentions price?", flat.includes("price"), "| inflation?", flat.includes("inflation"), "| cpi?", flat.includes("cpi"));

  // Try filter_category for likely price categories
  const candidates = ["Prices", "Prices and Inflation", "Inflation", "Prices, Inflation", "Price"];
  for (const c of candidates) {
    try {
      const r = await fetchJson(url("/economy/filter_category", { category: c }));
      const arr = r?.series || r?.data || r?.result || (Array.isArray(r) ? r : null);
      if (arr && arr.length) {
        console.log(`\n== filter_category category="${c}" -> ${arr.length} series ==`);
        for (const s of arr.slice(0, 80)) {
          console.log("  ", String(pick(s, ["Identifier", "id", "code"]) || "?").padEnd(20),
            "|", String(pick(s, ["Name", "title", "Title", "Description"]) || "").slice(0, 70),
            "|", String(pick(s, ["Subcategory", "subcategory", "SubCategory"]) || ""),
            "|", String(pick(s, ["Frequency", "frequency"]) || ""));
        }
        break;
      } else {
        console.log(`\nfilter_category category="${c}": empty/none`);
      }
    } catch (e) {
      console.log(`filter_category category="${c}" error: ${e.message}`);
    }
  }
} catch (e) {
  console.error("PROBE FAILED:", e.message);
  process.exit(2);
}
