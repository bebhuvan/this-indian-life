import { fetchOwidCsv, fetchOwidMetadata } from "./adapters/owid.mjs";
import { parseCsv } from "./core/csv.mjs";
import { createSeriesArtifact, createTableArtifact, stableJson, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { fetchJson } from "./lib/source-http.mjs";

const fetchedAt = new Date().toISOString();

const worldBankCountries = [
  { code: "IN", iso3: "IND", label: "India" },
  { code: "CHN", iso3: "CHN", label: "China" },
  { code: "US", iso3: "USA", label: "United States" },
  { code: "WLD", iso3: "WLD", label: "World" }
];

const comparisonIndicators = [
  {
    indicatorId: "econ.compare.gdp_current_usd",
    sourceIndicatorId: "NY.GDP.MKTP.CD",
    title: "GDP comparison",
    unit: "current US$"
  },
  {
    indicatorId: "econ.compare.gdp_per_capita_current_usd",
    sourceIndicatorId: "NY.GDP.PCAP.CD",
    title: "GDP per person comparison",
    unit: "current US$ per person"
  },
  {
    indicatorId: "econ.compare.population_total",
    sourceIndicatorId: "SP.POP.TOTL",
    title: "Population comparison",
    unit: "people"
  },
  {
    indicatorId: "econ.compare.gdp_ppp_current_intl",
    sourceIndicatorId: "NY.GDP.MKTP.PP.CD",
    title: "GDP by purchasing-power parity",
    unit: "current international $"
  },
  {
    indicatorId: "compare.health.life_expectancy",
    sourceIndicatorId: "SP.DYN.LE00.IN",
    title: "Life expectancy comparison",
    unit: "years"
  },
  {
    indicatorId: "compare.health.under5_mortality",
    sourceIndicatorId: "SH.DYN.MORT",
    title: "Under-five mortality comparison",
    unit: "per 1,000 live births"
  },
  {
    indicatorId: "compare.energy.electricity_access",
    sourceIndicatorId: "EG.ELC.ACCS.ZS",
    title: "Electricity access comparison",
    unit: "% of population"
  },
  {
    indicatorId: "compare.society.internet_users",
    sourceIndicatorId: "IT.NET.USER.ZS",
    title: "Internet use comparison",
    unit: "% of population"
  },
  {
    indicatorId: "compare.society.urban_population_share",
    sourceIndicatorId: "SP.URB.TOTL.IN.ZS",
    title: "Urban population comparison",
    unit: "% of population"
  },
  {
    indicatorId: "compare.work.female_labor_participation",
    sourceIndicatorId: "SL.TLF.CACT.FE.ZS",
    title: "Women's labour-force participation comparison",
    unit: "% ages 15+"
  }
];

// CO2 comparisons come from OWID, not World Bank: the World Bank discontinued the
// EN.ATM.CO2E.* codes (they now return empty). OWID grapher CSVs carry every country,
// so we keep India/China/US/World rows in the same shape the compare charts expect.
const owidComparisonIndicators = [
  {
    // The fairness reframe: India is huge in total but among the lowest per person.
    indicatorId: "compare.climate.co2_per_capita",
    slug: "co-emissions-per-capita",
    title: "CO2 per person comparison",
    unit: "tonnes per person"
  },
  {
    indicatorId: "compare.climate.co2_total",
    slug: "annual-co2-emissions-per-country",
    title: "Total CO2 emissions comparison",
    unit: "tonnes"
  },
  {
    // Historical responsibility: India's cumulative slice is tiny next to the West.
    indicatorId: "compare.climate.co2_cumulative",
    slug: "cumulative-co-emissions",
    title: "Cumulative CO2 emissions comparison",
    unit: "tonnes"
  }
];

async function fetchWorldBankSeries(country, indicator) {
  let url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${indicator.sourceIndicatorId}?format=json&per_page=20000`;
  let raw;
  try {
    raw = await fetchJson(url);
  } catch (error) {
    if (country.iso3 !== "CHN") throw error;
    const fallbackCode = country.code === "CHN" ? "CN" : "CHN";
    url = `https://api.worldbank.org/v2/country/${fallbackCode}/indicator/${indicator.sourceIndicatorId}?format=json&per_page=20000`;
    raw = await fetchJson(url);
  }
  const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
  return {
    url,
    raw,
    observations: rows
      .map((row) => ({
        date: String(row.date),
        value: row.value === null || row.value === undefined ? null : Number(row.value),
        countryCode: country.iso3,
        countryName: country.label
      }))
      .filter((row) => row.date && row.date >= "1960")
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}

function finiteRows(rows) {
  return rows.filter((row) => typeof row.value === "number" && Number.isFinite(row.value));
}

function latestDateWithAllCountries(rows, countryCodes) {
  const byDate = new Map();
  for (const row of finiteRows(rows)) {
    const set = byDate.get(row.date) || new Set();
    set.add(row.countryCode);
    byDate.set(row.date, set);
  }
  return [...byDate.entries()]
    .filter(([, set]) => countryCodes.every((code) => set.has(code)))
    .map(([date]) => date)
    .sort()
    .at(-1);
}

function shareSeries({ indiaRows, worldRows }) {
  const worldByDate = new Map(finiteRows(worldRows).map((row) => [row.date, row.value]));
  return finiteRows(indiaRows)
    .filter((row) => worldByDate.has(row.date) && worldByDate.get(row.date) !== 0)
    .map((row) => ({
      date: row.date,
      value: (row.value / worldByDate.get(row.date)) * 100
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function writeWorldBankComparison(indicator) {
  const fetched = await Promise.all(worldBankCountries.map((country) => fetchWorldBankSeries(country, indicator)));
  const rows = fetched.flatMap((item) => item.observations);
  const latestCommonDate = latestDateWithAllCountries(rows, worldBankCountries.map((country) => country.iso3));
  const snapshot = await writeSnapshot("world-context", `worldbank.${indicator.sourceIndicatorId}.comparison`, {
    indicator,
    countries: worldBankCountries,
    raw: fetched.map((item) => item.raw)
  });
  const artifact = createTableArtifact({
    indicatorId: indicator.indicatorId,
    title: indicator.title,
    sourceId: "worldbank",
    sourceIndicatorId: indicator.sourceIndicatorId,
    sourceUrl: `https://api.worldbank.org/v2/country/${worldBankCountries.map((country) => country.code).join(";")}/indicator/${indicator.sourceIndicatorId}?format=json&per_page=20000`,
    unit: indicator.unit,
    geography: {
      type: "country-group",
      id: "IND-CHN-USA-WLD",
      name: "India, China, United States, and world"
    },
    fetchedAt,
    rows,
    dimensions: ["date", "countryCode", "countryName", "value"],
    metadata: { latestCommonDate }
  });
  const path = await writeSeriesArtifact({
    sourceId: "world-context",
    name: `world-context.${indicator.indicatorId}`,
    artifact
  });
  return { artifact, path, snapshot };
}

async function writeWorldBankShare({ indicatorId, title, sourceIndicatorId, unit }) {
  const [india, world] = await Promise.all([
    fetchWorldBankSeries(worldBankCountries[0], { sourceIndicatorId }),
    fetchWorldBankSeries(worldBankCountries[3], { sourceIndicatorId })
  ]);
  const observations = shareSeries({ indiaRows: india.observations, worldRows: world.observations });
  const snapshot = await writeSnapshot("world-context", `worldbank.${sourceIndicatorId}.india-share`, {
    sourceIndicatorId,
    india: india.raw,
    world: world.raw
  });
  const artifact = createSeriesArtifact({
    indicatorId,
    title,
    sourceId: "worldbank",
    sourceIndicatorId,
    sourceUrl: `https://api.worldbank.org/v2/country/IN;WLD/indicator/${sourceIndicatorId}?format=json&per_page=20000`,
    unit,
    frequency: "annual",
    geography: {
      type: "derived-share",
      id: "IND/WLD",
      name: "India as share of world"
    },
    fetchedAt,
    observations,
    metadata: {
      numerator: "India",
      denominator: "World",
      formula: "India value / world value * 100"
    }
  });
  const path = await writeSeriesArtifact({
    sourceId: "world-context",
    name: `world-context.${indicatorId}`,
    artifact
  });
  return { artifact, path, snapshot };
}

async function writeOwidCo2Share() {
  const slug = "annual-co2-emissions-per-country";
  const [metadata, csv] = await Promise.all([
    fetchOwidMetadata(slug),
    fetchOwidCsv(slug)
  ]);
  const rows = parseCsv(csv);
  const key = "Annual CO₂ emissions";
  const indiaRows = rows
    .filter((row) => row.Entity === "India" || row.Code === "IND")
    .map((row) => ({ date: String(row.Year), value: Number(row[key]) }))
    .filter((row) => Number.isFinite(row.value));
  const worldRows = rows
    .filter((row) => row.Entity === "World" || row.Code === "OWID_WRL")
    .map((row) => ({ date: String(row.Year), value: Number(row[key]) }))
    .filter((row) => Number.isFinite(row.value));
  const observations = shareSeries({ indiaRows, worldRows });
  const snapshot = await writeSnapshot("world-context", "owid.annual-co2-emissions.india-share", {
    metadata,
    rows: rows.filter((row) => row.Entity === "India" || row.Entity === "World" || row.Code === "IND" || row.Code === "OWID_WRL")
  });
  const artifact = createSeriesArtifact({
    indicatorId: "world.share.co2_total",
    title: "India share of world CO2 emissions",
    sourceId: "owid",
    sourceIndicatorId: slug,
    sourceUrl: `https://ourworldindata.org/grapher/${slug}`,
    unit: "%",
    frequency: "annual",
    geography: {
      type: "derived-share",
      id: "IND/WLD",
      name: "India as share of world"
    },
    fetchedAt,
    observations,
    metadata: {
      chartTitle: metadata?.chart?.title || metadata?.title,
      numerator: "India",
      denominator: "World",
      formula: "India value / world value * 100"
    }
  });
  const path = await writeSeriesArtifact({
    sourceId: "world-context",
    name: "world-context.world.share.co2_total",
    artifact
  });
  return { artifact, path, snapshot };
}

// Build a four-country comparison table (India/China/US/World) from one OWID slug,
// in the same shape writeWorldBankComparison produces so compareBars/compareLine render it.
async function writeOwidComparison({ indicatorId, slug, title, unit }) {
  const owidEntities = [
    { code: "IND", entity: "India", iso3: "IND", label: "India" },
    { code: "CHN", entity: "China", iso3: "CHN", label: "China" },
    { code: "USA", entity: "United States", iso3: "USA", label: "United States" },
    { code: "OWID_EU27", entity: "European Union (27)", iso3: "EU27", label: "European Union (27)" },
    { code: "BRA", entity: "Brazil", iso3: "BRA", label: "Brazil" },
    { code: "IDN", entity: "Indonesia", iso3: "IDN", label: "Indonesia" },
    { code: "OWID_WRL", entity: "World", iso3: "WLD", label: "World" }
  ];
  const [metadata, csv] = await Promise.all([fetchOwidMetadata(slug), fetchOwidCsv(slug)]);
  const parsed = parseCsv(csv);
  const valueKey = Object.keys(parsed[0] || {}).find((k) => !["Entity", "Code", "Year"].includes(k));
  const rows = owidEntities.flatMap((c) =>
    parsed
      .filter((row) => row.Entity === c.entity || row.Code === c.code)
      .map((row) => ({ date: String(row.Year), value: Number(row[valueKey]), countryCode: c.iso3, countryName: c.label }))
      .filter((row) => row.date && Number.isFinite(row.value))
  );
  const latestCommonDate = latestDateWithAllCountries(rows, owidEntities.map((c) => c.iso3));
  const snapshot = await writeSnapshot("world-context", `owid.${slug}.comparison`, {
    metadata,
    rows: parsed.filter((row) => owidEntities.some((c) => row.Entity === c.entity || row.Code === c.code))
  });
  const artifact = createTableArtifact({
    indicatorId,
    title,
    sourceId: "owid",
    sourceIndicatorId: slug,
    sourceUrl: `https://ourworldindata.org/grapher/${slug}`,
    unit,
    geography: { type: "country-group", id: "IND-CHN-USA-WLD", name: "India, China, United States, and world" },
    fetchedAt,
    rows,
    dimensions: ["date", "countryCode", "countryName", "value"],
    metadata: { latestCommonDate, chartTitle: metadata?.chart?.title || metadata?.title }
  });
  const path = await writeSeriesArtifact({ sourceId: "world-context", name: `world-context.${indicatorId}`, artifact });
  return { artifact, path, snapshot };
}

const manifest = [];
const failures = [];

for (const indicator of owidComparisonIndicators) {
  try {
    const result = await writeOwidComparison(indicator);
    manifest.push({
      status: "ready",
      indicatorId: indicator.indicatorId,
      sourceIndicatorId: indicator.slug,
      artifact: result.path,
      snapshot: result.snapshot.path,
      rawHash: result.snapshot.hash,
      rows: result.artifact.rows.length,
      latestCommonDate: result.artifact.metadata.latestCommonDate,
      fetchedAt
    });
    console.log(`world-context ${indicator.indicatorId} ${result.artifact.rows.length} rows`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId: indicator.indicatorId, sourceIndicatorId: indicator.slug, fetchedAt, error: error.message });
    console.warn(`world-context ${indicator.indicatorId} failed: ${error.message}`);
  }
}

for (const indicator of comparisonIndicators) {
  try {
    const result = await writeWorldBankComparison(indicator);
    manifest.push({
      status: "ready",
      indicatorId: indicator.indicatorId,
      sourceIndicatorId: indicator.sourceIndicatorId,
      artifact: result.path,
      snapshot: result.snapshot.path,
      rawHash: result.snapshot.hash,
      rows: result.artifact.rows.length,
      latestCommonDate: result.artifact.metadata.latestCommonDate,
      fetchedAt
    });
    console.log(`world-context ${indicator.indicatorId} ${result.artifact.rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: indicator.indicatorId,
      sourceIndicatorId: indicator.sourceIndicatorId,
      fetchedAt,
      error: error.message
    });
    console.warn(`world-context ${indicator.indicatorId} failed: ${error.message}`);
  }
}

for (const share of [
  {
    indicatorId: "world.share.population",
    title: "India share of world population",
    sourceIndicatorId: "SP.POP.TOTL",
    unit: "%"
  },
  {
    indicatorId: "world.share.gdp_current_usd",
    title: "India share of world GDP",
    sourceIndicatorId: "NY.GDP.MKTP.CD",
    unit: "%"
  }
]) {
  try {
    const result = await writeWorldBankShare(share);
    manifest.push({
      status: "ready",
      indicatorId: share.indicatorId,
      sourceIndicatorId: share.sourceIndicatorId,
      artifact: result.path,
      snapshot: result.snapshot.path,
      rawHash: result.snapshot.hash,
      observations: result.artifact.observations.length,
      fetchedAt
    });
    console.log(`world-context ${share.indicatorId} ${result.artifact.observations.length} observations`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: share.indicatorId,
      sourceIndicatorId: share.sourceIndicatorId,
      fetchedAt,
      error: error.message
    });
    console.warn(`world-context ${share.indicatorId} failed: ${error.message}`);
  }
}

try {
  const result = await writeOwidCo2Share();
  manifest.push({
    status: "ready",
    indicatorId: result.artifact.indicatorId,
    sourceIndicatorId: result.artifact.sourceIndicatorId,
    artifact: result.path,
    snapshot: result.snapshot.path,
    rawHash: result.snapshot.hash,
    observations: result.artifact.observations.length,
    fetchedAt
  });
  console.log(`world-context ${result.artifact.indicatorId} ${result.artifact.observations.length} observations`);
} catch (error) {
  failures.push({
    status: "failed",
    indicatorId: "world.share.co2_total",
    sourceIndicatorId: "annual-co2-emissions-per-country",
    fetchedAt,
    error: error.message
  });
  console.warn(`world-context world.share.co2_total failed: ${error.message}`);
}

await writeSourceManifest("world-context", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} world-context artifacts; ${failures.length} failure(s).`);
