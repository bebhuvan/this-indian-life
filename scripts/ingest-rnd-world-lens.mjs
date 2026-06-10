// World Bank / UNESCO world-lens for "How India does (and doesn't) do R&D":
// cross-country R&D intensity (GERD as % of GDP) and researcher density
// (researchers per million people). These are the comparison series behind the
// world-map bars and the "China and Korea pulled away" trajectory. India's own
// rupee R&D numbers come from DST/NSTMIS (see ingest-rnd-india.mjs); the World
// Bank supplies only this internationally-comparable lens, sourced from the
// UNESCO Institute for Statistics.
//
// Note on vintage: UNESCO/WB R&D coverage lags and is patchy — India's R&D/GDP
// series effectively ends ~2020-21 and researcher density ~2020. latestBars and
// multiLine read each country's own latest point, so the bars are a "latest
// available per country" snapshot, not a single common year.
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

// Comparator set: India + the R&D leaders (Korea/Israel/US/Japan/Germany),
// the giant that pulled away (China), and similar-income peers (Brazil, South
// Africa, Vietnam), plus the World aggregate as a baseline.
const COUNTRIES = [
  { code: "IND", cc: "in", name: "India" },
  { code: "CHN", cc: "chn", name: "China" },
  { code: "KOR", cc: "kor", name: "South Korea" },
  { code: "ISR", cc: "isr", name: "Israel" },
  { code: "USA", cc: "usa", name: "United States" },
  { code: "JPN", cc: "jpn", name: "Japan" },
  { code: "DEU", cc: "deu", name: "Germany" },
  { code: "BRA", cc: "bra", name: "Brazil" },
  { code: "ZAF", cc: "zaf", name: "South Africa" },
  { code: "VNM", cc: "vnm", name: "Vietnam" },
  { code: "WLD", cc: "wld", name: "World" }
];

const METRICS = [
  { slug: "rd_gdp", code: "GB.XPD.RSDV.GD.ZS", title: "R&D expenditure", unit: "% of GDP" },
  { slug: "researchers", code: "SP.POP.SCIE.RD.P6", title: "Researchers in R&D", unit: "per million people" }
];

try {
  for (const metric of METRICS) {
    for (const country of COUNTRIES) {
      const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${metric.code}?format=json&per_page=20000`;
      let raw;
      try {
        raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 4 });
      } catch (err) {
        // The World Bank API intermittently 400s on a valid request; don't let one
        // bad country/metric abort the whole battery. Log and skip.
        console.warn(`SKIP rnd.${metric.slug}.${country.cc}: ${err.message}`);
        manifest.push({ status: "error", indicatorId: `rnd.${metric.slug}.${country.cc}`, error: err.message });
        continue;
      }
      await writeSnapshot("worldbank", `rnd_${metric.code}_${country.code}`, raw);
      const rows = Array.isArray(raw) && Array.isArray(raw[1]) ? raw[1] : [];
      const observations = rows
        .filter((r) => r.value != null)
        .map((r) => ({ date: String(r.date), value: Number(r.value) }))
        .filter((r) => r.date >= "1996")
        .sort((a, b) => a.date.localeCompare(b.date));
      const indicatorId = `rnd.${metric.slug}.${country.cc}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${country.name} — ${metric.title}`,
        sourceId: "worldbank",
        sourceIndicatorId: metric.code,
        sourceUrl: `https://data.worldbank.org/indicator/${metric.code}?locations=${country.code}`,
        unit: metric.unit,
        frequency: "annual",
        geography: country.code === "WLD"
          ? { type: "region", id: "WLD", name: "World" }
          : { type: "country", id: country.code, name: country.name },
        fetchedAt,
        observations,
        metadata: { sourceCategory: "Science & Technology", sourceSubcategory: "World comparison", sourceOwner: "World Bank / UNESCO Institute for Statistics" }
      });
      const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.${country.cc}.${indicatorId}`, artifact });
      const latest = observations[observations.length - 1];
      manifest.push({ status: observations.length ? "ready" : "empty", indicatorId, observations: observations.length, artifact: path, fetchedAt, latest });
      console.log(`${indicatorId}: ${observations.length} obs, latest ${latest?.date} = ${latest?.value}`);
    }
  }
  await writeSourceManifest("rnd-world-lens", manifest);
  console.log(`\nWrote ${manifest.length} R&D world-lens series.`);
} catch (error) {
  console.error("R&D world-lens ingest failed:", error.message);
  process.exit(1);
}
