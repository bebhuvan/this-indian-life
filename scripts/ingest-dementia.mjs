import { readFile } from "node:fs/promises";
import {
  createSeriesArtifact,
  createTableArtifact,
  mergeSourceManifest,
  writeSeriesArtifact
} from "./core/artifacts.mjs";

// Dementia in India — hand-transcribed from primary sources (no machine API for any
// of these). Every value below is quoted from a named table/figure; see `metadata`.
//
//   LASI-DAD  Lee J, Meijer E, Langa KM, Ganguli M, Varghese M, et al.
//             "Prevalence of dementia in India: National and state estimates from a
//             nationwide study." Alzheimer's & Dementia 2023;19(7):2898-2912.
//             doi:10.1002/alz.12928  (read via PMC10338640). LASI wave 2018-20;
//             2,528 clinically adjudicated, modelled to 28,949 adults 60+.
//   NBER      Li J, McGarry KM, Nicholas LH, Skinner JS. "Dementia and Long-run
//             Trajectories in Household Finances." NBER WP 34659, Jan 2026.
//             US Health & Retirement Study, 2,312 dementia cases. 2018 USD.
//   ADI       Wimo A, Prince M. World Alzheimer Report 2010: The Global Economic
//             Impact of Dementia. Alzheimer's Disease International. 2010 USD.

const fetchedAt = new Date().toISOString();

const LASIDAD_URL = "https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.12928";
const NBER_URL = "https://www.nber.org/papers/w34659";
const ADI_URL = "https://www.alzint.org/resource/world-alzheimer-report-2010/";

const manifest = [];

async function writeTable({ indicatorId, title, sourceId, sourceIndicatorId, sourceUrl, unit, geography, rows, metadata }) {
  const artifact = createTableArtifact({
    indicatorId, title, sourceId, sourceIndicatorId, sourceUrl, unit,
    geography: geography || { type: "country", id: "IND", name: "India" },
    fetchedAt, rows, dimensions: ["label", "value", "group"], metadata
  });
  const path = await writeSeriesArtifact({ sourceId, name: `${sourceId}.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, sourceIndicatorId, artifact: path, rows: rows.length, fetchedAt });
  console.log(`${indicatorId}: ${rows.length} rows (table)`);
}

async function writeSeries({ indicatorId, title, sourceId, sourceIndicatorId, sourceUrl, unit, geography, observations, metadata }) {
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId, sourceIndicatorId, sourceUrl, unit, frequency: "irregular",
    geography: geography || { type: "country", id: "IND", name: "India" },
    fetchedAt, observations, metadata
  });
  const path = await writeSeriesArtifact({ sourceId, name: `${sourceId}.${indicatorId}`, artifact });
  manifest.push({ status: "ready", indicatorId, sourceIndicatorId, artifact: path, observations: observations.length, fetchedAt });
  console.log(`${indicatorId}: ${observations.length} obs (series)`);
}

// ---- LASI-DAD: prevalence by age band (Table 2 / Figure) ---------------------
await writeTable({
  indicatorId: "health.lasidad.prev_by_age",
  title: "Dementia prevalence by age, India",
  sourceId: "lasidad",
  sourceIndicatorId: "prevalence_by_age_60plus",
  sourceUrl: LASIDAD_URL,
  unit: "% of age group with dementia",
  rows: [
    { label: "60–64", value: 2.94 },
    { label: "65–69", value: 4.01 },
    { label: "70–74", value: 10.30 },
    { label: "75–79", value: 13.34 },
    { label: "80–84", value: 16.25 },
    { label: "85+", value: 25.41 }
  ],
  metadata: {
    survey: "LASI-DAD, 2018-20 (Lee et al., Alzheimer's & Dementia 2023)",
    note: "Estimated crude prevalence within each age band. National prevalence for adults 60+ is 7.4% (95% CI 6.35-8.51); age-standardised 8.0%."
  }
});

// ---- LASI-DAD: sex and rural/urban gradients ---------------------------------
await writeTable({
  indicatorId: "health.lasidad.prev_gradients",
  title: "Who carries more dementia: women, and rural India",
  sourceId: "lasidad",
  sourceIndicatorId: "prevalence_sex_residence",
  sourceUrl: LASIDAD_URL,
  unit: "% of adults 60+ with dementia",
  rows: [
    { label: "Women", value: 9.03, group: "By sex" },
    { label: "Men", value: 5.77, group: "By sex" },
    { label: "Rural", value: 8.35, group: "Where they live" },
    { label: "Urban", value: 5.34, group: "Where they live" }
  ],
  metadata: {
    survey: "LASI-DAD, 2018-20 (Lee et al. 2023)",
    note: "Crude prevalence among adults 60+. Age-standardised figures are similar (women 9.63, men 6.30; rural 8.91, urban 5.98)."
  }
});

// ---- LASI-DAD: education gradient --------------------------------------------
await writeTable({
  indicatorId: "health.lasidad.prev_by_education",
  title: "Dementia falls sharply with schooling",
  sourceId: "lasidad",
  sourceIndicatorId: "prevalence_by_education",
  sourceUrl: LASIDAD_URL,
  unit: "% of adults 60+ with dementia",
  rows: [
    { label: "No formal schooling", value: 10.29 },
    { label: "Primary or less", value: 4.52 },
    { label: "Middle school or higher", value: 1.54 }
  ],
  metadata: {
    survey: "LASI-DAD, 2018-20 (Lee et al. 2023)",
    note: "Strong inverse education gradient. Reflects both cognitive reserve and the fact that education tracks with lifelong health and income; not a clean causal estimate."
  }
});

// ---- LASI-DAD: the projection (8.8m in 2016 -> 16.9m by 2036) -----------------
await writeSeries({
  indicatorId: "health.lasidad.cases_projection",
  title: "Indians aged 60+ living with dementia",
  sourceId: "lasidad",
  sourceIndicatorId: "cases_millions_projection",
  sourceUrl: LASIDAD_URL,
  unit: "million people 60+",
  observations: [
    { date: "2016", value: 8.8 },
    { date: "2036", value: 16.9 }
  ],
  metadata: {
    survey: "LASI-DAD, 2018-20 (Lee et al. 2023)",
    note: "Estimated 8.8 million adults 60+ with dementia (2016 population base), projected to 16.9 million by 2036 as the population ages. Both are estimates carrying wide uncertainty."
  }
});

// ---- LASI-DAD: state choropleth (reuse the existing India-states SVG paths) ---
// State crude prevalence among adults 60+ (Table 2). North-eastern states other
// than Assam were reported only as a group (7.35%); that group value is applied to
// each NE state shown. UTs/states without a Census projection had no estimate (null).
const stateValue = {
  "Jammu and Kashmir": 11.04,
  "Himachal Pradesh": 8.43,
  "Punjab": 5.19,
  "Uttarakhand": 6.27,
  "Haryana": 5.78,
  "Delhi": 4.50,
  "Rajasthan": 7.30,
  "Uttar Pradesh": 7.92,
  "Bihar": 5.69,
  "Assam": 8.47,
  "West Bengal": 9.23,
  "Jharkhand": 7.17,
  "Odisha": 9.87,
  "Chhattisgarh": 6.96,
  "Madhya Pradesh": 6.75,
  "Gujarat": 6.47,
  "Maharashtra": 7.61,
  "Andhra Pradesh": 7.74,
  "Karnataka": 7.61,
  "Kerala": 8.27,
  "Tamil Nadu": 6.13,
  "Telangana": 8.27,
  // North-east (reported as one group, excl. Assam): 7.35%
  "Sikkim": 7.35,
  "Mizoram": 7.35,
  "Manipur": 7.35,
  "Nagaland": 7.35,
  "Tripura": 7.35,
  "Arunachal Pradesh": 7.35,
  "Meghalaya": 7.35
};

const coolerMap = JSON.parse(await readFile("data/series/cooling.IN.cooler_by_state.json", "utf8"));
const regions = coolerMap.regions.map((region) => ({
  name: region.name,
  value: Object.prototype.hasOwnProperty.call(stateValue, region.name) ? stateValue[region.name] : null,
  path: region.path
}));
const values = regions.map((r) => r.value).filter((v) => v != null);
const stateChoropleth = {
  schemaVersion: 1,
  sourceId: "lasidad",
  sourceIndicatorId: "prevalence_by_state_60plus",
  sourceUrl: LASIDAD_URL,
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt,
  metadata: {
    survey: "LASI-DAD, 2018-20 (Lee et al., Alzheimer's & Dementia 2023, Table 2)",
    note: "Estimated crude dementia prevalence among adults 60+ by state. North-eastern states other than Assam were published only as a single group (7.35%); that value is shown for each. States/UTs without a Census population projection had no estimate and render grey."
  },
  artifactType: "choropleth",
  indicatorId: "health.lasidad.prev_by_state",
  title: "Dementia prevalence by state",
  unit: "% of adults 60+ with dementia",
  viewBox: coolerMap.viewBox,
  min: Math.min(...values),
  max: Math.max(...values),
  regions
};
const choroPath = await writeSeriesArtifact({ sourceId: "lasidad", name: "lasidad.health.lasidad.prev_by_state", artifact: stateChoropleth });
manifest.push({ status: "ready", indicatorId: "health.lasidad.prev_by_state", sourceIndicatorId: "prevalence_by_state_60plus", artifact: choroPath, regions: regions.length, fetchedAt });
console.log(`health.lasidad.prev_by_state: ${values.length} states valued (choropleth)`);

// ---- NBER (US): wealth gap by years from dementia onset (Table A1, net worth) -
await writeTable({
  indicatorId: "ref.us.nber.wealth_gap_by_event_time",
  title: "US: wealth falls behind years before a dementia diagnosis",
  sourceId: "nber",
  sourceIndicatorId: "wealth_gap_event_study_networth",
  sourceUrl: NBER_URL,
  unit: "US$1,000s of net worth vs similar households",
  geography: { type: "country", id: "USA", name: "United States" },
  rows: [
    { label: "6 yrs before", value: 0 },
    { label: "4 yrs before", value: -16.8 },
    { label: "2 yrs before", value: -38.2 },
    { label: "Diagnosis", value: -51.2 },
    { label: "2 yrs after", value: -69.3 },
    { label: "4 yrs after", value: -124.8 }
  ],
  metadata: {
    source: "NBER WP 34659 (Li, McGarry, Nicholas, Skinner 2026), Table A1, net worth column. US Health & Retirement Study, 2018 USD.",
    note: "Event-study marginal effect on household net worth relative to 6 years before dementia onset, vs propensity-matched controls. The gap opens about 6 years before onset and widens to roughly $125,000 below similar households four years after. US evidence — shown to illustrate the mechanism, not as an India figure."
  }
});

// ---- NBER (US): where the gap sits — assets two years before onset (Table 1) --
await writeTable({
  indicatorId: "ref.us.nber.assets_cases_vs_controls",
  title: "US: the gap sits in the assets you must actively manage",
  sourceId: "nber",
  sourceIndicatorId: "asset_levels_two_years_before",
  sourceUrl: NBER_URL,
  unit: "US$1,000s held, two years before onset",
  geography: { type: "country", id: "USA", name: "United States" },
  rows: [
    { label: "Developing dementia", value: 89.4, group: "Stocks, bonds, mutual funds" },
    { label: "Similar, no dementia", value: 112.6, group: "Stocks, bonds, mutual funds" },
    { label: "Developing dementia", value: 60.0, group: "Checking & savings" },
    { label: "Similar, no dementia", value: 86.0, group: "Checking & savings" },
    { label: "Developing dementia", value: 34.0, group: "Retirement (IRA)" },
    { label: "Similar, no dementia", value: 49.4, group: "Retirement (IRA)" }
  ],
  metadata: {
    source: "NBER WP 34659, Table 1 (means two years before onset, 2018 USD).",
    note: "Households heading toward dementia already hold less than matched controls in every asset class, with the largest relative shortfall in investment accounts that need active management. Earnings barely differ ($2,132 vs $2,703), and placebo conditions (cancer, heart, lung, arthritis) show no such wealth gap — pointing to impaired financial decision-making, not overspending. US evidence."
  }
});

// ---- ADI: cost per person per year, by country income group ------------------
await writeTable({
  indicatorId: "health.adi.cost_per_person_by_income",
  title: "What a year of dementia care costs, by country income",
  sourceId: "adi",
  sourceIndicatorId: "cost_per_person_income_group_2010",
  sourceUrl: ADI_URL,
  unit: "US$ per person per year (2010)",
  geography: { type: "world", id: "WLD", name: "World" },
  rows: [
    { label: "Low income", value: 868 },
    { label: "Lower-middle (India's band)", value: 3109 },
    { label: "Upper-middle income", value: 6827 },
    { label: "High income", value: 32865 }
  ],
  metadata: {
    source: "World Alzheimer Report 2010 (ADI / Wimo & Prince), 2010 USD, current exchange rates.",
    note: "Societal cost per person with dementia (informal care + direct medical + direct social care). India was in the lower-middle-income band. The number is far lower in poorer countries largely because so much care is unpaid and there is little formal/residential care — not because the disease is less burdensome."
  }
});

// ---- ADI: informal (unpaid family) care as a share of total cost -------------
await writeTable({
  indicatorId: "health.adi.informal_care_share",
  title: "The poorer the country, the more the cost is unpaid family care",
  sourceId: "adi",
  sourceIndicatorId: "informal_care_share_income_group_2010",
  sourceUrl: ADI_URL,
  unit: "% of total dementia cost that is unpaid family care",
  geography: { type: "world", id: "WLD", name: "World" },
  rows: [
    { label: "Low income", value: 58 },
    { label: "Lower-middle (India's band)", value: 65 },
    { label: "High income", value: 40 }
  ],
  metadata: {
    source: "World Alzheimer Report 2010 (ADI).",
    note: "Informal care = unpaid time given by family and others. In lower-middle-income countries it is about 65% of all dementia cost and formal/residential social care is negligible; the burden is borne inside the household, mostly by women, and never appears in any budget."
  }
});

await mergeSourceManifest("dementia", manifest);
console.log(`\nWrote ${manifest.length} dementia artifacts.`);
