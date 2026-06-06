// Cross-database enrichment for the "Why India stayed poor" flagship: multi-country
// series the World Bank battery and Maddison fan don't cover, each telling a distinct
// part of the story, all via OWID grapher CSVs (same mechanism as the Maddison ingest):
//   - mean years of schooling (Lee-Lee/Barro-Lee): the human-capital STOCK, not just
//     literacy or enrolment, back to 1900 and including Taiwan
//   - Human Development Index (UNDP): a single composite of health, schooling, income
//   - electoral democracy index (V-Dem): the honest "democracy vs coercion" trade-off,
//     with Korea's and Taiwan's autocracy-to-democracy transitions visible
//   - output per hour worked (Penn World Table): a productivity-depth measure
//   - extreme poverty, $3/day (OWID/World Bank PIP): the long, multi-country poverty arc
//
// One per-country series artifact each (indicatorId divergence.<metric>.<cc>), matching
// the World Bank divergence lake so the renderer's multiLine path can plot them directly.
import { fetchOwidCsv, fetchOwidMetadata } from "./adapters/owid.mjs";
import { parseCsv } from "./core/csv.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const COUNTRIES = [
  { code: "IND", cc: "in", name: "India" },
  { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" },
  { code: "TWN", cc: "twn", name: "Taiwan" },
  { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "BGD", cc: "bgd", name: "Bangladesh" },
  { code: "IDN", cc: "idn", name: "Indonesia" },
  { code: "THA", cc: "tha", name: "Thailand" },
  { code: "PAK", cc: "pak", name: "Pakistan" },
  { code: "SGP", cc: "sgp", name: "Singapore" },
  { code: "JPN", cc: "jpn", name: "Japan" }
];

const DATASETS = [
  { slug: "mean-years-of-schooling-long-run", metric: "schooling_years", valueColumn: "Average years of schooling", title: "Mean years of schooling", unit: "years", fromYear: 1900, source: "Lee-Lee/Barro-Lee via OWID" },
  { slug: "human-development-index", metric: "hdi", valueColumn: "Human Development Index", title: "Human Development Index", unit: "index (0-1)", fromYear: 1990, source: "UNDP via OWID" },
  { slug: "electoral-democracy-index", metric: "democracy", valueColumn: "Electoral democracy index", title: "Electoral democracy index (V-Dem)", unit: "index (0-1)", fromYear: 1900, source: "V-Dem via OWID" },
  { slug: "labor-productivity-per-hour-pennworldtable", metric: "productivity_hour", valueColumn: "Productivity: output per hour worked", title: "Output per hour worked", unit: "int-$ per hour", fromYear: 1970, source: "Penn World Table via OWID" },
  { slug: "share-of-population-in-extreme-poverty", metric: "poverty_owid", valueColumn: "Share of population in poverty ($3 a day)", title: "Extreme poverty ($3/day)", unit: "% of population", fromYear: 1977, source: "World Bank PIP via OWID" }
];

const manifest = [];
const failures = [];

for (const ds of DATASETS) {
  let allRows;
  let unit = ds.unit;
  try {
    const [metadata, csv] = await Promise.all([fetchOwidMetadata(ds.slug).catch(() => null), fetchOwidCsv(ds.slug)]);
    allRows = parseCsv(csv);
    if (!allRows.length || !(ds.valueColumn in allRows[0])) throw new Error(`value column "${ds.valueColumn}" not found`);
    await writeSnapshot("owid", `${ds.slug}.divergence-countries`, { rows: allRows.filter((r) => COUNTRIES.some((c) => c.code === r.Code)) });
    void metadata;
  } catch (error) {
    failures.push({ status: "failed", dataset: ds.slug, error: error.message });
    console.warn(`extras ${ds.slug} FETCH failed: ${error.message}`);
    continue;
  }
  for (const country of COUNTRIES) {
    try {
      const observations = allRows
        .filter((row) => row.Code === country.code)
        .map((row) => ({ date: String(row.Year), value: row[ds.valueColumn] === "" || row[ds.valueColumn] == null ? null : Number(row[ds.valueColumn]) }))
        .filter((r) => r.date && Number(r.date) >= ds.fromYear)
        .sort((a, b) => Number(a.date) - Number(b.date));
      if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
      const indicatorId = `divergence.${ds.metric}.${country.cc}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${ds.title} — ${country.name}`,
        sourceId: "owid",
        sourceIndicatorId: ds.slug,
        sourceUrl: `https://ourworldindata.org/grapher/${ds.slug}`,
        unit,
        frequency: "annual",
        geography: { type: "country", id: country.code, name: country.name },
        fetchedAt,
        observations,
        metadata: { angle: "enrichment", metric: ds.metric, country: country.name, originalSource: ds.source }
      });
      const path = await writeSeriesArtifact({ sourceId: "owid", name: `owid.divergence.${country.cc}.${ds.metric}`, artifact });
      const last = observations.filter((o) => Number.isFinite(o.value)).at(-1);
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: ds.slug, artifact: path, observations: observations.length, latest: last?.date, fetchedAt });
      console.log(`extras ${indicatorId} (${observations.length} obs, →${last?.date})`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId: `divergence.${ds.metric}.${country.cc}`, sourceIndicatorId: ds.slug, fetchedAt, error: error.message });
      console.warn(`extras ${ds.metric}.${country.code} failed: ${error.message}`);
    }
  }
}

await writeSourceManifest("divergence-extras", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} enrichment series; ${failures.length} failure(s).`);
