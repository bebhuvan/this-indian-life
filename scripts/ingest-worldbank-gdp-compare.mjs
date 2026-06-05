// World Bank cross-country GDP context for "How big is India's economy?":
//  - total GDP at market exchange rate (NY.GDP.MKTP.CD) — the "size / 5th largest" story
//  - GDP per capita at market rate (NY.GDP.PCAP.CD) — the "but poor per person" story
// One series per (country, metric); indicatorId econ.world.cmp.<metric>.<cc>.
// MOSPI stays the source of truth for India's own rupee accounts; this is context only.
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const sourceUrl = "https://data.worldbank.org/indicator";
const manifest = [];

// Superset of both charts' peers (alpha-2/alpha-3 both accepted by the WB API).
const COUNTRIES = [
  { code: "IN", cc: "in", name: "India" },
  { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" },
  { code: "BGD", cc: "bgd", name: "Bangladesh" },
  { code: "IDN", cc: "idn", name: "Indonesia" },
  { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "JPN", cc: "jpn", name: "Japan" },
  { code: "DEU", cc: "deu", name: "Germany" },
  { code: "USA", cc: "usa", name: "United States" },
  { code: "GBR", cc: "gbr", name: "United Kingdom" }
];

const METRICS = [
  { slug: "gdp_total", code: "NY.GDP.MKTP.CD", title: "GDP (market exchange rate)", unit: "current US$" },
  { slug: "gdp_pc", code: "NY.GDP.PCAP.CD", title: "GDP per capita (market exchange rate)", unit: "current US$ per person" }
];

try {
  for (const metric of METRICS) {
    for (const country of COUNTRIES) {
      const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${metric.code}?format=json&per_page=20000`;
      const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
      await writeSnapshot("worldbank", `cmp_${metric.code}_${country.cc}`, raw);
      const rows = Array.isArray(raw) && Array.isArray(raw[1]) ? raw[1] : [];
      const observations = rows
        .filter((r) => r.value != null)
        .map((r) => ({ date: String(r.date), value: Number(r.value) }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (observations.length < 2) { console.warn(`  skip ${metric.slug}.${country.cc}: <2 obs`); continue; }
      const indicatorId = `econ.world.cmp.${metric.slug}.${country.cc}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${country.name} — ${metric.title}`,
        sourceId: "worldbank",
        sourceIndicatorId: metric.code,
        sourceUrl,
        unit: metric.unit,
        frequency: "annual",
        geography: { type: "country", id: country.code, name: country.name },
        fetchedAt,
        observations,
        metadata: { sourceCategory: "National Accounts", sourceSubcategory: "World comparison", sourceOwner: "World Bank", country: country.name }
      });
      const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.${country.cc}.${indicatorId}`, artifact });
      manifest.push({ status: "ready", indicatorId, observations: observations.length, artifact: path, fetchedAt, latest: observations[observations.length - 1] });
      console.log(`  ${indicatorId}: ${observations.length} obs, latest ${observations[observations.length - 1].date} = ${Math.round(observations[observations.length - 1].value)}`);
    }
  }
  await writeSourceManifest("worldbank-gdp-compare", manifest);
  console.log(`\nWrote ${manifest.length} World Bank GDP-comparison series.`);
} catch (error) {
  console.error("World Bank GDP-compare ingest failed:", error.message);
  process.exit(1);
}
