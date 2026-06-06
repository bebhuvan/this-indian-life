// Long-run GDP per capita (Maddison Project, via OWID) for the "Why India stayed poor"
// flagship's opening "same starting line / the divergence" act. This is the one source
// that covers Taiwan, Singapore and Hong Kong — which the World Bank battery cannot —
// and reaches back far enough to show India was richer than China and Korea around 1950.
//
// One per-country series artifact (indicatorId divergence.gdp_pc_maddison.<cc>) so the
// renderer's multiLine path can plot the fan, matching the World Bank divergence lake.
import { fetchOwidCsv, fetchOwidMetadata } from "./adapters/owid.mjs";
import { parseCsv } from "./core/csv.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SLUG = "gdp-per-capita-maddison-project-database";
const VALUE_COLUMN = "GDP per capita";
const FROM_YEAR = 1900; // keep the pre-independence picture (India once richer than China)

const COUNTRIES = [
  { code: "IND", cc: "in", name: "India" },
  { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" },
  { code: "TWN", cc: "twn", name: "Taiwan" },
  { code: "SGP", cc: "sgp", name: "Singapore" },
  { code: "HKG", cc: "hkg", name: "Hong Kong" },
  { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "BGD", cc: "bgd", name: "Bangladesh" },
  { code: "IDN", cc: "idn", name: "Indonesia" },
  { code: "THA", cc: "tha", name: "Thailand" },
  { code: "MYS", cc: "mys", name: "Malaysia" },
  { code: "PAK", cc: "pak", name: "Pakistan" },
  { code: "JPN", cc: "jpn", name: "Japan" }
];

const manifest = [];
const failures = [];

const [metadata, csv] = await Promise.all([fetchOwidMetadata(SLUG), fetchOwidCsv(SLUG)]);
const allRows = parseCsv(csv);
const unit = metadata?.columns?.[VALUE_COLUMN]?.shortUnit || "int-$ (2011 prices)";

for (const country of COUNTRIES) {
  try {
    const observations = allRows
      .filter((row) => row.Code === country.code)
      .map((row) => ({ date: String(row.Year), value: row[VALUE_COLUMN] === "" || row[VALUE_COLUMN] == null ? null : Number(row[VALUE_COLUMN]) }))
      .filter((r) => r.date && Number(r.date) >= FROM_YEAR) // numeric: avoid 3-digit years (e.g. Japan 730) slipping past a string compare
      .sort((a, b) => Number(a.date) - Number(b.date));
    if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
    const indicatorId = `divergence.gdp_pc_maddison.${country.cc}`;
    const artifact = createSeriesArtifact({
      indicatorId,
      title: `GDP per capita (Maddison, long run) — ${country.name}`,
      sourceId: "owid",
      sourceIndicatorId: SLUG,
      sourceUrl: `https://ourworldindata.org/grapher/${SLUG}`,
      unit,
      frequency: "annual",
      geography: { type: "country", id: country.code, name: country.name },
      fetchedAt,
      observations,
      metadata: { angle: "divergence", metric: "gdp_pc_maddison", country: country.name }
    });
    const path = await writeSeriesArtifact({ sourceId: "owid", name: `owid.maddison.${country.cc}.gdp_per_capita`, artifact });
    const last = observations.filter((o) => Number.isFinite(o.value)).at(-1);
    manifest.push({ status: "ready", indicatorId, sourceIndicatorId: SLUG, artifact: path, observations: observations.length, latest: last?.date, fetchedAt });
    console.log(`maddison ${indicatorId} (${observations.length} obs, →${last?.date})`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: `divergence.gdp_pc_maddison.${country.cc}`, sourceIndicatorId: SLUG, fetchedAt, error: error.message });
    console.warn(`maddison ${country.code} failed: ${error.message}`);
  }
}

await writeSnapshot("owid", `${SLUG}.divergence-countries`, { metadata, rows: allRows.filter((r) => COUNTRIES.some((c) => c.code === r.Code)) });
await writeSourceManifest("maddison-divergence", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} Maddison series; ${failures.length} failure(s).`);
