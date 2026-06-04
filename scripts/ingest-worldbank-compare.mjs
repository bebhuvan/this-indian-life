// World Bank cross-country comparison series for the "How India Works" flagship.
// The main ingest-worldbank.mjs is India-only; this fetches the same indicators
// for India + Asian peers + the world so the article can benchmark India.
// One series artifact per (country, metric); indicatorId compare.<metric>.<cc>.
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "CHN", name: "China" },
  { code: "KOR", name: "South Korea" },
  { code: "THA", name: "Thailand" },
  { code: "MYS", name: "Malaysia" },
  { code: "BGD", name: "Bangladesh" },
  { code: "VNM", name: "Vietnam" },
  { code: "IDN", name: "Indonesia" },
  { code: "WLD", name: "World" }
];

const METRICS = [
  { slug: "lfpr", code: "SL.TLF.CACT.ZS", title: "Labour force participation rate", unit: "% of population 15+" },
  { slug: "lfpr_female", code: "SL.TLF.CACT.FE.ZS", title: "Female labour force participation rate", unit: "% of female population 15+" },
  { slug: "productivity", code: "SL.GDP.PCAP.EM.KD", title: "GDP per person employed", unit: "constant 2021 PPP $" },
  { slug: "youth_unemployment", code: "SL.UEM.1524.ZS", title: "Youth unemployment (15-24)", unit: "% of youth labour force" },
  { slug: "emp_agriculture", code: "SL.AGR.EMPL.ZS", title: "Employment in agriculture", unit: "% of total employment" },
  // "How India Trades" — trade-openness comparison + population for per-capita trade.
  { slug: "exports_gdp", code: "NE.EXP.GNFS.ZS", title: "Exports of goods and services", unit: "% of GDP" },
  { slug: "imports_gdp", code: "NE.IMP.GNFS.ZS", title: "Imports of goods and services", unit: "% of GDP" },
  { slug: "population", code: "SP.POP.TOTL", title: "Population", unit: "people" }
];

const manifest = [];
const failures = [];

for (const metric of METRICS) {
  for (const country of COUNTRIES) {
    const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${metric.code}?format=json&per_page=20000`;
    try {
      const raw = await fetchJson(url);
      const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
      const observations = rows
        .map((r) => ({ date: String(r.date), value: r.value == null ? null : Number(r.value) }))
        .filter((r) => r.date && r.date >= "1990")
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
      const indicatorId = `compare.${metric.slug}.${country.code.toLowerCase()}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${metric.title} — ${country.name}`,
        sourceId: "worldbank",
        sourceIndicatorId: metric.code,
        sourceUrl: url,
        unit: metric.unit,
        frequency: "annual",
        geography: { type: "country", id: country.code, name: country.name },
        fetchedAt,
        observations,
        metadata: { comparison: metric.slug, country: country.name }
      });
      const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.compare.${country.code.toLowerCase()}.${metric.code.replaceAll(".", "_")}`, artifact });
      await writeSnapshot("worldbank", `${country.code}.${metric.code}`, raw);
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: metric.code, artifact: path, observations: observations.length, fetchedAt });
      console.log(`compare ${indicatorId} (${observations.length} obs, →${observations.at(-1).date})`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId: `compare.${metric.slug}.${country.code.toLowerCase()}`, sourceIndicatorId: metric.code, fetchedAt, error: error.message });
      console.warn(`compare ${metric.slug}.${country.code} failed: ${error.message}`);
    }
  }
}

await writeSourceManifest("worldbank-compare", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} comparison artifacts; ${failures.length} failure(s).`);
