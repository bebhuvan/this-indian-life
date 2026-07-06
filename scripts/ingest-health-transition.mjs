// Focused World Bank HNP + NFHS evidence for:
// q.health.transition — "Is India getting healthier?"
//
// World Bank is used for long trends and global/peer comparison. NFHS is used for
// India-native survey change between NFHS-5 (2019-21) and NFHS-6 (2023-24).
import { readFile } from "node:fs/promises";
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
import { fetchJson } from "./lib/source-http.mjs";

const fetchedAt = new Date().toISOString();

const WB_SOURCE_URL = (country, indicator, source = 16) =>
  `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?source=${source}&format=json&per_page=20000`;

const COUNTRIES = [
  { code: "IND", suffix: "ind", name: "India" },
  { code: "WLD", suffix: "wld", name: "World" },
  { code: "LMC", suffix: "lmc", name: "Lower middle income" },
  { code: "BGD", suffix: "bgd", name: "Bangladesh" },
  { code: "PAK", suffix: "pak", name: "Pakistan" },
  { code: "CHN", suffix: "chn", name: "China" },
  { code: "VNM", suffix: "vnm", name: "Vietnam" },
  { code: "IDN", suffix: "idn", name: "Indonesia" },
  { code: "LKA", suffix: "lka", name: "Sri Lanka" }
];

const WB_METRICS = [
  { slug: "life_expectancy", code: "SP.DYN.LE00.IN", title: "Life expectancy at birth", unit: "years" },
  { slug: "under5_mortality", code: "SH.DYN.MORT", title: "Under-5 mortality rate", unit: "per 1,000 live births" },
  { slug: "neonatal_mortality", code: "SH.DYN.NMRT", title: "Neonatal mortality rate", unit: "per 1,000 live births" },
  { slug: "maternal_mortality", code: "SH.STA.MMRT", title: "Maternal mortality ratio", unit: "per 100,000 live births" },
  { slug: "skilled_birth", code: "SH.STA.BRTC.ZS", title: "Births attended by skilled health staff", unit: "% of total births" },
  { slug: "measles_immunization", code: "SH.IMM.MEAS", title: "Measles immunization", unit: "% of children ages 12-23 months" },
  { slug: "dpt_immunization", code: "SH.IMM.IDPT", title: "DPT immunization", unit: "% of children ages 12-23 months" },
  { slug: "stunting", code: "SH.STA.STNT.ZS", title: "Stunting, children under 5", unit: "% of children under 5" },
  { slug: "wasting", code: "SH.STA.WAST.ZS", title: "Wasting, children under 5", unit: "% of children under 5" },
  { slug: "child_anemia", code: "SH.ANM.CHLD.ZS", title: "Anemia among children", unit: "% of children ages 6-59 months" },
  { slug: "women_anemia", code: "SH.ANM.ALLW.ZS", title: "Anemia among women", unit: "% of women ages 15-49" },
  { slug: "che_gdp", code: "SH.XPD.CHEX.GD.ZS", title: "Current health expenditure", unit: "% of GDP" },
  { slug: "oop_share", code: "SH.XPD.OOPC.CH.ZS", title: "Out-of-pocket expenditure", unit: "% of current health expenditure" },
  { slug: "health_pc_usd", code: "SH.XPD.CHEX.PC.CD", title: "Current health expenditure per capita", unit: "current US$" },
  { slug: "hospital_beds", code: "SH.MED.BEDS.ZS", title: "Hospital beds", unit: "per 1,000 people" },
  { slug: "physicians", code: "SH.MED.PHYS.ZS", title: "Physicians", unit: "per 1,000 people" }
];

const NFHS_INDICATORS = {
  "7": ["insurance_households", "Households with any member covered by health insurance/financing", "% of households"],
  "28": ["anc_first_trimester", "Mothers who had antenatal check-up in the first trimester", "% of mothers"],
  "30": ["anc_4plus", "Mothers who had at least four antenatal care visits", "% of mothers"],
  "33": ["ifa_180_days", "Mothers who consumed iron folic acid for 180 days or more", "% of mothers"],
  "35": ["institutional_births", "Institutional births", "% of births"],
  "37": ["skilled_birth_attendant", "Births assisted by skilled health personnel", "% of births"],
  "38": ["c_section", "Births delivered by caesarean section", "% of births"],
  "44": ["full_immunisation", "Children fully immunised", "% of children age 12-23 months"],
  "51": ["measles_second_dose", "Children receiving measles second dose", "% of children"],
  "53": ["rotavirus", "Children receiving rotavirus vaccine", "% of children"],
  "61": ["early_breastfeeding", "Children breastfed within one hour of birth", "% of last-born children"],
  "68": ["adequate_diet", "Children 6-23 months receiving an adequate diet", "% of children age 6-23 months"],
  "69": ["child_stunting", "Children under 5 who are stunted", "% of children under 5"],
  "70": ["child_wasting", "Children under 5 who are wasted", "% of children under 5"],
  "71": ["child_severe_wasting", "Children under 5 who are severely wasted", "% of children under 5"],
  "72": ["child_underweight", "Children under 5 who are underweight", "% of children under 5"],
  "74": ["women_thin", "Women with below-normal BMI", "% of women 15-49"],
  "76": ["women_overweight", "Women overweight or obese", "% of women 15-49"],
  "77": ["men_overweight", "Men overweight or obese", "% of men 15-49"],
  "80": ["women_high_sugar", "Women with high/very high blood sugar or on medication", "% of women 15+"],
  "83": ["men_high_sugar", "Men with high/very high blood sugar or on medication", "% of men 15+"],
  "86": ["women_high_bp", "Women with elevated blood pressure or on medication", "% of women 15+"],
  "89": ["men_high_bp", "Men with elevated blood pressure or on medication", "% of men 15+"]
};

const WEALTH = [
  ["SH.STA.STNT.Q1.ZS", "stunting_poorest", "Stunting, poorest quintile", "% of children under 5"],
  ["SH.STA.STNT.Q5.ZS", "stunting_richest", "Stunting, richest quintile", "% of children under 5"],
  ["SH.STA.WAST.Q1.ZS", "wasting_poorest", "Wasting, poorest quintile", "% of children under 5"],
  ["SH.STA.WAST.Q5.ZS", "wasting_richest", "Wasting, richest quintile", "% of children under 5"],
  ["SH.STA.BRTC.Q1.ZS", "skilled_birth_poorest", "Skilled birth attendance, poorest quintile", "% of births"],
  ["SH.STA.BRTC.Q5.ZS", "skilled_birth_richest", "Skilled birth attendance, richest quintile", "% of births"],
  ["SH.ACS.MONY.Q1.ZS", "money_barrier_poorest", "Money barrier to care, poorest quintile women", "% of women"],
  ["SH.ACS.MONY.Q5.ZS", "money_barrier_richest", "Money barrier to care, richest quintile women", "% of women"],
  ["SH.ACS.DIST.Q1.ZS", "distance_barrier_poorest", "Distance barrier to care, poorest quintile women", "% of women"],
  ["SH.ACS.DIST.Q5.ZS", "distance_barrier_richest", "Distance barrier to care, richest quintile women", "% of women"]
];

function observationsFromWorldBank(raw, fromYear = 1960) {
  const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
  return rows
    .map((row) => ({ date: String(row.date), value: row.value == null ? null : Number(row.value) }))
    .filter((row) => row.date >= String(fromYear))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function latestFinite(observations) {
  return [...observations].reverse().find((row) => Number.isFinite(row.value));
}

const manifest = [];
const failures = [];

for (const metric of WB_METRICS) {
  for (const country of COUNTRIES) {
    const url = WB_SOURCE_URL(country.code, metric.code, 16);
    const indicatorId = `health.transition.wb.${metric.slug}.${country.suffix}`;
    try {
      const raw = await fetchJson(url);
      const observations = observationsFromWorldBank(raw, 1960);
      const latest = latestFinite(observations);
      if (!latest) throw new Error("no finite observations");
      await writeSnapshot("worldbank", `health-transition.${country.code}.${metric.code}`, raw);
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
        metadata: {
          country: country.name,
          sourceDatabase: "Health Nutrition and Population Statistics",
          method: "World Bank HNP/WDI annual series. Values may be observed, estimated, modelled, or harmonised depending on the indicator; use the source vintage and latest non-null year, not the database update date, as the data date."
        }
      });
      const path = await writeSeriesArtifact({
        sourceId: "worldbank",
        name: `worldbank.health-transition.${country.suffix}.${metric.code.replaceAll(".", "_")}`,
        artifact
      });
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: metric.code, artifact: path, observations: observations.length, latest, fetchedAt });
      console.log(`wb ${indicatorId} -> ${latest.date}: ${latest.value}`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId, sourceIndicatorId: metric.code, error: error.message, fetchedAt });
      console.warn(`wb ${indicatorId} failed: ${error.message}`);
    }
  }
}

for (const [code, slug, title, unit] of WEALTH) {
  const url = WB_SOURCE_URL("IND", code, 39);
  const indicatorId = `health.transition.wbq.${slug}`;
  try {
    const raw = await fetchJson(url);
    const observations = observationsFromWorldBank(raw, 1990);
    const latest = latestFinite(observations);
    if (!latest) throw new Error("no finite observations");
    await writeSnapshot("worldbank", `health-transition-wealth.IND.${code}`, raw);
    const artifact = createSeriesArtifact({
      indicatorId,
      title,
      sourceId: "worldbank",
      sourceIndicatorId: code,
      sourceUrl: url,
      unit,
      frequency: "irregular",
      geography: { type: "country", id: "IND", name: "India" },
      fetchedAt,
      observations,
      metadata: {
        sourceDatabase: "Health Nutrition and Population Statistics by Wealth Quintile",
        method: "World Bank quintile series from household surveys (DHS/MICS-style source tables). Latest year is the survey year available in the database, not a live current-year estimate."
      }
    });
    const path = await writeSeriesArtifact({
      sourceId: "worldbank",
      name: `worldbank.health-transition.ind.${code.replaceAll(".", "_")}`,
      artifact
    });
    manifest.push({ status: "ready", indicatorId, sourceIndicatorId: code, artifact: path, observations: observations.length, latest, fetchedAt });
    console.log(`wbq ${indicatorId} -> ${latest.date}: ${latest.value}`);
  } catch (error) {
    failures.push({ status: "failed", indicatorId, sourceIndicatorId: code, error: error.message, fetchedAt });
    console.warn(`wbq ${indicatorId} failed: ${error.message}`);
  }
}

const nfhs = JSON.parse(await readFile("data/nfhs6/nfhs6_clean.json", "utf8"));
const india = nfhs.areas.India;
const nfhsSourceUrl = "https://www.nfhsiips.in/nfhsuser/index.php";
for (const [num, [slug, title, unit]] of Object.entries(NFHS_INDICATORS)) {
  const values = india[num] || {};
  const observations = [];
  if (values.nfhs5 != null) observations.push({ date: "2021-03-31", value: Number(values.nfhs5) });
  if (values.total != null) observations.push({ date: "2024-03-31", value: Number(values.total) });
  if (!observations.length) continue;
  const indicatorId = `health.transition.nfhs.${slug}`;
  const artifact = createSeriesArtifact({
    indicatorId,
    title,
    sourceId: "nfhs",
    sourceIndicatorId: `NFHS factsheet indicator ${num}`,
    sourceUrl: nfhsSourceUrl,
    unit,
    frequency: "irregular",
    geography: { type: "country", id: "IN", name: "India" },
    fetchedAt,
    observations,
    metadata: {
      survey: "NFHS-5 (2019-21) and NFHS-6 (2023-24)",
      rural_urban_nfhs6: { rural: values.rural ?? null, urban: values.urban ?? null },
      method: "National Family Health Survey fact-sheet values. NFHS-5 is represented at 2021-03-31 and NFHS-6 at 2024-03-31 for charting; these are survey rounds, not annual time series."
    }
  });
  const path = await writeSeriesArtifact({
    sourceId: "nfhs",
    name: `nfhs.health-transition.${slug}`,
    artifact
  });
  manifest.push({ status: "ready", indicatorId, sourceIndicatorId: `NFHS factsheet indicator ${num}`, artifact: path, observations: observations.length, fetchedAt });
  console.log(`nfhs ${indicatorId}`);
}

const gapRows = [
  ["Stunting", "health.transition.wbq.stunting_poorest", "health.transition.wbq.stunting_richest", "pp"],
  ["Wasting", "health.transition.wbq.wasting_poorest", "health.transition.wbq.wasting_richest", "pp"],
  ["Money as barrier to care", "health.transition.wbq.money_barrier_poorest", "health.transition.wbq.money_barrier_richest", "pp"],
  ["Distance as barrier to care", "health.transition.wbq.distance_barrier_poorest", "health.transition.wbq.distance_barrier_richest", "pp"],
  ["Skilled birth attendance", "health.transition.wbq.skilled_birth_richest", "health.transition.wbq.skilled_birth_poorest", "pp"]
].map(([label, highId, lowId, unit]) => {
  const high = manifest.find((m) => m.indicatorId === highId)?.latest;
  const low = manifest.find((m) => m.indicatorId === lowId)?.latest;
  const highValue = high?.value;
  const lowValue = low?.value;
  return {
    label,
    value: Number.isFinite(highValue) && Number.isFinite(lowValue) ? +(Number(highValue) - Number(lowValue)).toFixed(1) : null,
    group: "poorest-richest gap",
    highValue,
    lowValue,
    highLabel: highId.includes("richest") ? "richest" : "poorest",
    lowLabel: lowId.includes("richest") ? "richest" : "poorest",
    latestYear: high?.date || low?.date || null,
    unit
  };
}).filter((row) => Number.isFinite(row.value));

const gapArtifact = createTableArtifact({
  indicatorId: "health.transition.wealth_gaps",
  title: "Wealth gaps in child health and access",
  sourceId: "worldbank",
  sourceIndicatorId: "HNP wealth quintile indicators",
  sourceUrl: "https://databank.worldbank.org/source/health-nutrition-and-population-statistics-by-wealth-quintile",
  unit: "percentage-point gap",
  geography: { type: "country", id: "IND", name: "India" },
  fetchedAt,
  rows: gapRows,
  dimensions: ["indicator", "wealth quintile"],
  metadata: {
    method: "Calculated as the latest available World Bank HNP wealth-quintile value for the worse-off quintile minus the better-off quintile, except skilled birth attendance where the rich-minus-poor service gap is shown. Values are percentage-point gaps and come from survey-year data."
  }
});
const gapPath = await writeSeriesArtifact({
  sourceId: "worldbank",
  name: "worldbank.health-transition.ind.wealth_gaps",
  artifact: gapArtifact
});
manifest.push({ status: "ready", indicatorId: "health.transition.wealth_gaps", sourceIndicatorId: "HNP wealth quintile indicators", artifact: gapPath, rows: gapRows.length, fetchedAt });

await writeSourceManifest("health-transition", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} health-transition entries; ${failures.length} failures.`);
