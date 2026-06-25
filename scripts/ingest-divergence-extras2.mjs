// Round-two enrichment for the divergence series (Part 1 inputs + Part 3 equity):
//   - working-age share (the demographic-dividend window: East Asia used it early)
//   - public spending on people (health + education as % of GDP) — the input behind
//     India's human-capital gap
//   - inequality during growth: WB Gini + WID top-10% income share (the East Asian
//     "growth with equity" thesis vs India)
// World Bank indicators via the WDI API; WID top-10% via the OWID grapher (same path
// as the Maddison ingest). All in the divergence.* namespace.
import { fetchJson } from "./lib/source-http.mjs";
import { fetchOwidCsv } from "./adapters/owid.mjs";
import { parseCsv } from "./core/csv.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];
const failures = [];

const WB_COUNTRIES = [
  { code: "IN", cc: "in", name: "India" }, { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" }, { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "BGD", cc: "bgd", name: "Bangladesh" }, { code: "IDN", cc: "idn", name: "Indonesia" },
  { code: "JPN", cc: "jpn", name: "Japan" }, { code: "WLD", cc: "wld", name: "World" }
];
const WB_METRICS = [
  { slug: "working_age", code: "SP.POP.1564.TO.ZS", title: "Working-age population", unit: "% of total (15-64)" },
  { slug: "health_spend", code: "SH.XPD.CHEX.GD.ZS", title: "Health expenditure", unit: "% of GDP" },
  { slug: "edu_spend", code: "SE.XPD.TOTL.GD.ZS", title: "Government education expenditure", unit: "% of GDP" },
  { slug: "gini", code: "SI.POV.GINI", title: "Gini index", unit: "index (0-100)" }
];

for (const metric of WB_METRICS) {
  for (const c of WB_COUNTRIES) {
    const url = `https://api.worldbank.org/v2/country/${c.code}/indicator/${metric.code}?format=json&per_page=20000`;
    try {
      const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
      const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
      const observations = rows.map((r) => ({ date: String(r.date), value: r.value == null ? null : Number(r.value) }))
        .filter((r) => r.date && r.date >= "1960").sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
      const indicatorId = `divergence.${metric.slug}.${c.cc}`;
      const artifact = createSeriesArtifact({ indicatorId, title: `${metric.title} — ${c.name}`, sourceId: "worldbank", sourceIndicatorId: metric.code, sourceUrl: url, unit: metric.unit, frequency: "annual", geography: { type: "country", id: c.code, name: c.name }, fetchedAt, observations, metadata: { angle: "round2", metric: metric.slug, country: c.name } });
      await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${c.cc}.${metric.code.replaceAll(".", "_")}`, artifact });
      manifest.push({ status: "ready", indicatorId, observations: observations.filter((o) => Number.isFinite(o.value)).length });
      console.log(`extras2 ${indicatorId} (${observations.filter((o) => Number.isFinite(o.value)).length} real)`);
    } catch (e) { failures.push({ indicatorId: `divergence.${metric.slug}.${c.cc}`, error: e.message }); console.warn(`${metric.slug}.${c.code} failed: ${e.message}`); }
  }
}

// WID top-10% income share (before tax) via OWID grapher
const WID_SLUG = "income-share-top-10-before-tax-wid";
const WID_COL = "Share (top 10%, before tax)";
const WID_COUNTRIES = [
  { code: "IND", cc: "in", name: "India" }, { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" }, { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "IDN", cc: "idn", name: "Indonesia" }, { code: "JPN", cc: "jpn", name: "Japan" },
  { code: "TWN", cc: "twn", name: "Taiwan" }
];
try {
  const allRows = parseCsv(await fetchOwidCsv(WID_SLUG));
  if (!allRows.length || !(WID_COL in allRows[0])) throw new Error(`WID column "${WID_COL}" not found; cols: ${Object.keys(allRows[0] || {})}`);
  await writeSnapshot("owid", `${WID_SLUG}.divergence`, { rows: allRows.filter((r) => WID_COUNTRIES.some((c) => c.code === r.Code)) });
  for (const c of WID_COUNTRIES) {
    try {
      const observations = allRows.filter((r) => r.Code === c.code)
        .map((r) => ({ date: String(r.Year), value: r[WID_COL] === "" || r[WID_COL] == null ? null : Number(r[WID_COL]) }))
        .filter((o) => o.date && Number(o.date) >= 1960 && Number.isFinite(o.value)).sort((a, b) => Number(a.date) - Number(b.date));
      if (observations.length < 2) throw new Error("insufficient observations");
      const indicatorId = `divergence.top10_share.${c.cc}`;
      const artifact = createSeriesArtifact({ indicatorId, title: `Top 10% income share — ${c.name}`, sourceId: "owid", sourceIndicatorId: WID_SLUG, sourceUrl: `https://ourworldindata.org/grapher/${WID_SLUG}`, unit: "% of pre-tax national income", frequency: "annual", geography: { type: "country", id: c.code, name: c.name }, fetchedAt, observations, metadata: { angle: "equity", metric: "top10_share", country: c.name, originalSource: "World Inequality Database via OWID" } });
      await writeSeriesArtifact({ sourceId: "owid", name: `owid.divergence.${c.cc}.top10_share`, artifact });
      manifest.push({ status: "ready", indicatorId, observations: observations.length });
      console.log(`extras2 ${indicatorId} (${observations.length} obs, ${observations[0].date}-${observations.at(-1).date})`);
    } catch (e) { failures.push({ indicatorId: `divergence.top10_share.${c.cc}`, error: e.message }); console.warn(`top10.${c.code} failed: ${e.message}`); }
  }
} catch (e) { failures.push({ step: "wid_top10", error: e.message }); console.warn(`wid_top10 failed: ${e.message}`); }

await writeSourceManifest("divergence-extras2", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} series; ${failures.length} failure(s).`);
