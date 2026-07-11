// Health-system and health-financing indicators for "How healthy is India?"
// (q.health.overview). Two sources, cross-country comparator set:
//   - WHO GHO OData API: UHC coverage, catastrophic spending (SDG 3.8.2),
//     raised blood pressure, diabetes prevalence, doctor/nurse density.
//   - World Bank API: health expenditure (% GDP, per capita, OOP share,
//     government), hospital beds, physicians.
// One series artifact per (country, metric), mirroring ingest-worldbank-compare.mjs:
//   indicatorId health.who.<slug>.<cc>  /  health.wb.<slug>.<cc>
// (cc = "in" for India, lowercase ISO3 otherwise, "wld" for World).
import { whoGhoUrl } from "./adapters/who-gho.mjs";
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

// cc = indicatorId suffix + WB API code; who = WHO GHO SpatialDim (ISO3).
const COUNTRIES = [
  { cc: "IN", who: "IND", name: "India" },
  { cc: "BGD", who: "BGD", name: "Bangladesh" },
  { cc: "CHN", who: "CHN", name: "China" },
  { cc: "IDN", who: "IDN", name: "Indonesia" },
  { cc: "VNM", who: "VNM", name: "Vietnam" },
  { cc: "LKA", who: "LKA", name: "Sri Lanka" },
  { cc: "NGA", who: "NGA", name: "Nigeria" },
  { cc: "USA", who: "USA", name: "United States" }
];

// WHO GHO. `pick` filters the raw rows down to one observation per year
// (drops sex/age/residence disaggregations, keeps the national total).
const WHO_METRICS = [
  {
    slug: "uhc_index",
    code: "UHC_INDEX_REPORTED",
    title: "UHC service coverage index (SDG 3.8.1)",
    unit: "index (0-100)",
    pick: (r) => r.Dim1 == null
  },
  {
    slug: "catastrophic_10",
    code: "FINPROTECTION_CATA_TOT_10_POP",
    title: "Population spending >10% of household budget on health (SDG 3.8.2)",
    unit: "% of population",
    pick: (r) => r.Dim1 === "RESIDENCEAREATYPE_TOTL"
  },
  {
    slug: "raised_bp",
    code: "BP_04",
    title: "Raised blood pressure, adults 30-79 (age-standardized)",
    unit: "% of adults 30-79",
    pick: (r) => r.Dim1 === "SEX_BTSX"
  },
  {
    slug: "diabetes",
    code: "NCD_DIABETES_PREVALENCE_AGESTD",
    title: "Diabetes prevalence, adults 18+ (age-standardized)",
    unit: "% of adults 18+",
    pick: (r) => r.Dim1 === "SEX_BTSX" && r.Dim2 === "AGEGROUP_YEARS18-PLUS"
  },
  {
    slug: "doctors",
    code: "HWF_0001",
    title: "Medical doctors",
    unit: "per 10,000 population",
    pick: (r) => r.Dim1 == null
  },
  {
    slug: "nurses",
    code: "HWF_0006",
    title: "Nursing and midwifery personnel",
    unit: "per 10,000 population",
    pick: (r) => r.Dim1 == null
  }
];

// World Bank (also fetched for the World aggregate).
const WB_METRICS = [
  { slug: "che_gdp", code: "SH.XPD.CHEX.GD.ZS", title: "Current health expenditure", unit: "% of GDP" },
  { slug: "oop_che", code: "SH.XPD.OOPC.CH.ZS", title: "Out-of-pocket spending", unit: "% of current health expenditure" },
  { slug: "govt_gdp", code: "SH.XPD.GHED.GD.ZS", title: "Government health expenditure", unit: "% of GDP" },
  { slug: "che_pc_usd", code: "SH.XPD.CHEX.PC.CD", title: "Health expenditure per capita", unit: "current US$" },
  { slug: "che_pc_ppp", code: "SH.XPD.CHEX.PP.CD", title: "Health expenditure per capita, PPP", unit: "current international $" },
  { slug: "beds", code: "SH.MED.BEDS.ZS", title: "Hospital beds", unit: "per 1,000 people" },
  { slug: "physicians", code: "SH.MED.PHYS.ZS", title: "Physicians", unit: "per 1,000 people" }
];

const manifest = [];
const failures = [];

// ---------- WHO GHO ----------
for (const metric of WHO_METRICS) {
  for (const country of COUNTRIES) {
    const url = whoGhoUrl(`/${metric.code}`, { "$filter": `SpatialDim eq '${country.who}'` });
    const indicatorId = `health.who.${metric.slug}.${country.cc.toLowerCase()}`;
    try {
      const raw = await fetchJson(url);
      const rows = (Array.isArray(raw?.value) ? raw.value : []).filter(metric.pick);
      const byYear = new Map();
      for (const r of rows) {
        if (r.NumericValue == null) continue;
        byYear.set(String(r.TimeDim), Number(r.NumericValue));
      }
      const observations = [...byYear.entries()]
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.length) throw new Error("no observations after filter");
      await writeSnapshot("who-gho", `${metric.code}.${country.who}`, raw);
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${metric.title} — ${country.name}`,
        sourceId: "who-gho",
        sourceIndicatorId: metric.code,
        sourceUrl: url,
        unit: metric.unit,
        frequency: "annual",
        geography: { type: "country", id: country.cc, name: country.name },
        fetchedAt,
        observations,
        metadata: { comparison: metric.slug, country: country.name, whoSpatialDim: country.who }
      });
      const path = await writeSeriesArtifact({
        sourceId: "who-gho",
        name: `who-gho.health.${country.cc.toLowerCase()}.${metric.slug}`,
        artifact
      });
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: metric.code, artifact: path, observations: observations.length, fetchedAt });
      console.log(`who ${indicatorId} (${observations.length} obs, →${observations.at(-1).date}: ${observations.at(-1).value})`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId, sourceIndicatorId: metric.code, fetchedAt, error: error.message });
      console.warn(`who ${indicatorId} failed: ${error.message}`);
    }
  }
}

// ---------- World Bank ----------
const WB_COUNTRIES = [...COUNTRIES, { cc: "WLD", name: "World" }];
for (const metric of WB_METRICS) {
  for (const country of WB_COUNTRIES) {
    const url = `https://api.worldbank.org/v2/country/${country.cc}/indicator/${metric.code}?format=json&per_page=20000`;
    const indicatorId = `health.wb.${metric.slug}.${country.cc.toLowerCase()}`;
    try {
      const raw = await fetchJson(url);
      const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
      const observations = rows
        .map((r) => ({ date: String(r.date), value: r.value == null ? null : Number(r.value) }))
        .filter((r) => r.date && r.date >= "2000")
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
      await writeSnapshot("worldbank", `health.${country.cc}.${metric.code}`, raw);
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${metric.title} — ${country.name}`,
        sourceId: "worldbank",
        sourceIndicatorId: metric.code,
        sourceUrl: url,
        unit: metric.unit,
        frequency: "annual",
        geography: { type: "country", id: country.cc, name: country.name },
        fetchedAt,
        observations,
        metadata: { comparison: metric.slug, country: country.name }
      });
      const path = await writeSeriesArtifact({
        sourceId: "worldbank",
        name: `worldbank.health.${country.cc.toLowerCase()}.${metric.code.replaceAll(".", "_")}`,
        artifact
      });
      const last = [...observations].reverse().find((o) => Number.isFinite(o.value));
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: metric.code, artifact: path, observations: observations.length, fetchedAt });
      console.log(`wb ${indicatorId} (→${last.date}: ${last.value})`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId, sourceIndicatorId: metric.code, fetchedAt, error: error.message });
      console.warn(`wb ${indicatorId} failed: ${error.message}`);
    }
  }
}

await writeSourceManifest("health-system", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} health-system artifacts; ${failures.length} failure(s).`);
