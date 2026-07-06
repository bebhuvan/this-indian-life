import { writeSeriesArtifact, createTableArtifact } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const SOURCE_ID = "nha-nhsrc";
const SOURCE_URL = "https://nhsrcindia.org/national-health-accounts-records";

async function main() {
  // 1. National Level Indicators
  // We compile the indicators from 2013-14 to 2022-23
  const nationalIndicators = [
    { year: "2013-14", the_gdp_pct: 4.02, the_per_capita: 3638, the_per_capita_constant: 3174, che_the_pct: 93.00, capital_the_pct: 7.00, ghe_the_pct: 28.64, ghe_gdp_pct: 1.15, ghe_gge_pct: 3.78, ghe_per_capita: 1042, ghe_union_pct: 35.53, ghe_state_pct: 59.24, oope_the_pct: 64.20, oope_gdp_pct: 2.58, oope_per_capita: 2336, social_security_the_pct: 6.00, private_insurance_the_pct: 3.40, donor_the_pct: 0.30, ayush_the_pct: 10.51, pharma_che_pct: 39.56 },
    { year: "2014-15", the_gdp_pct: 3.90, the_per_capita: 3826, the_per_capita_constant: 3231, che_the_pct: 93.40, capital_the_pct: 6.60, ghe_the_pct: 29.00, ghe_gdp_pct: 1.13, ghe_gge_pct: 3.94, ghe_per_capita: 1108, ghe_union_pct: 37.00, ghe_state_pct: 63.00, oope_the_pct: 62.58, oope_gdp_pct: 2.43, oope_per_capita: 2394, social_security_the_pct: 5.70, private_insurance_the_pct: 3.70, donor_the_pct: 0.70, ayush_the_pct: 10.80, pharma_che_pct: 37.90 },
    { year: "2015-16", the_gdp_pct: 3.84, the_per_capita: 4116, the_per_capita_constant: 3405, che_the_pct: 93.70, capital_the_pct: 6.30, ghe_the_pct: 30.63, ghe_gdp_pct: 1.18, ghe_gge_pct: 4.07, ghe_per_capita: 1261, ghe_union_pct: 35.62, ghe_state_pct: 64.38, oope_the_pct: 60.59, oope_gdp_pct: 2.33, oope_per_capita: 2494, social_security_the_pct: 6.30, private_insurance_the_pct: 4.20, donor_the_pct: 0.70, ayush_the_pct: 11.90, pharma_che_pct: 35.40 },
    { year: "2016-17", the_gdp_pct: 3.80, the_per_capita: 4381, the_per_capita_constant: 3503, che_the_pct: 92.80, capital_the_pct: 7.20, ghe_the_pct: 32.40, ghe_gdp_pct: 1.20, ghe_gge_pct: 4.40, ghe_per_capita: 1418, ghe_union_pct: 31.40, ghe_state_pct: 68.60, oope_the_pct: 58.70, oope_gdp_pct: 2.22, oope_per_capita: 2570, social_security_the_pct: 7.30, private_insurance_the_pct: 4.70, donor_the_pct: 0.60, ayush_the_pct: 10.60, pharma_che_pct: 36.80 },
    { year: "2017-18", the_gdp_pct: 3.31, the_per_capita: 4297, the_per_capita_constant: 3333, che_the_pct: 88.50, capital_the_pct: 11.50, ghe_the_pct: 40.80, ghe_gdp_pct: 1.35, ghe_gge_pct: 5.12, ghe_per_capita: 1753, ghe_union_pct: 40.80, ghe_state_pct: 59.20, oope_the_pct: 48.80, oope_gdp_pct: 1.62, oope_per_capita: 2097, social_security_the_pct: 9.00, private_insurance_the_pct: 5.80, donor_the_pct: 0.50, ayush_the_pct: 3.60, pharma_che_pct: 33.40 },
    { year: "2018-19", the_gdp_pct: 3.16, the_per_capita: 4470, the_per_capita_constant: 3314, che_the_pct: 90.60, capital_the_pct: 9.40, ghe_the_pct: 40.60, ghe_gdp_pct: 1.28, ghe_gge_pct: 4.81, ghe_per_capita: 1815, ghe_union_pct: 34.30, ghe_state_pct: 65.70, oope_the_pct: 48.20, oope_gdp_pct: 1.52, oope_per_capita: 2155, social_security_the_pct: 9.60, private_insurance_the_pct: 6.60, donor_the_pct: 0.40, ayush_the_pct: 3.90, pharma_che_pct: 33.80 },
    { year: "2019-20", the_gdp_pct: 3.27, the_per_capita: 4863, the_per_capita_constant: 3516, che_the_pct: 90.50, capital_the_pct: 9.50, ghe_the_pct: 41.40, ghe_gdp_pct: 1.35, ghe_gge_pct: 5.02, ghe_per_capita: 2014, ghe_union_pct: 35.80, ghe_state_pct: 64.20, oope_the_pct: 47.10, oope_gdp_pct: 1.54, oope_per_capita: 2289, social_security_the_pct: 9.30, private_insurance_the_pct: 7.00, donor_the_pct: 0.50, ayush_the_pct: 3.90, pharma_che_pct: 35.10 },
    { year: "2020-21", the_gdp_pct: 3.73, the_per_capita: 5436, the_per_capita_constant: 3752, che_the_pct: 89.70, capital_the_pct: 10.30, ghe_the_pct: 42.80, ghe_gdp_pct: 1.60, ghe_gge_pct: 4.98, ghe_per_capita: 2328, ghe_union_pct: 35.70, ghe_state_pct: 64.30, oope_the_pct: 44.40, oope_gdp_pct: 1.66, oope_per_capita: 2415, social_security_the_pct: 8.60, private_insurance_the_pct: 7.30, donor_the_pct: 0.70, ayush_the_pct: 3.80, pharma_che_pct: 29.20 },
    { year: "2021-22", the_gdp_pct: 3.83, the_per_capita: 6602, the_per_capita_constant: 4205, che_the_pct: 87.30, capital_the_pct: 12.70, ghe_the_pct: 48.00, ghe_gdp_pct: 1.84, ghe_gge_pct: 6.12, ghe_per_capita: 3169, ghe_union_pct: 41.80, ghe_state_pct: 58.20, oope_the_pct: 39.40, oope_gdp_pct: 1.51, oope_per_capita: 2600, social_security_the_pct: 8.70, private_insurance_the_pct: 7.40, donor_the_pct: 1.10, ayush_the_pct: 3.10, pharma_che_pct: 30.80 },
    { year: "2022-23", the_gdp_pct: 3.28, the_per_capita: 6373, the_per_capita_constant: 3831, che_the_pct: 87.00, capital_the_pct: 13.00, ghe_the_pct: 43.72, ghe_gdp_pct: 1.43, ghe_gge_pct: 4.89, ghe_per_capita: 2786, ghe_union_pct: 36.30, ghe_state_pct: 63.70, oope_the_pct: 43.40, oope_gdp_pct: 1.42, oope_per_capita: 2767, social_security_the_pct: 9.90, private_insurance_the_pct: 9.20, donor_the_pct: 0.50, ayush_the_pct: 3.10, pharma_che_pct: 29.60 }
  ];

  const nationalRows = [];
  nationalIndicators.forEach(d => {
    // Map variables into multiple rows with indicator labels
    const yearNum = parseInt(d.year.split("-")[0]);
    nationalRows.push(
      { year: yearNum, label: "THE as % of GDP", value: d.the_gdp_pct, unit: "percent", indicatorId: "the_gdp_pct" },
      { year: yearNum, label: "THE Per Capita (current)", value: d.the_per_capita, unit: "Rs.", indicatorId: "the_per_capita" },
      { year: yearNum, label: "THE Per Capita (constant)", value: d.the_per_capita_constant, unit: "Rs.", indicatorId: "the_per_capita_constant" },
      { year: yearNum, label: "GHE as % of THE", value: d.ghe_the_pct, unit: "percent", indicatorId: "ghe_the_pct" },
      { year: yearNum, label: "GHE as % of GDP", value: d.ghe_gdp_pct, unit: "percent", indicatorId: "ghe_gdp_pct" },
      { year: yearNum, label: "GHE as % of GGE", value: d.ghe_gge_pct, unit: "percent", indicatorId: "ghe_gge_pct" },
      { year: yearNum, label: "GHE Per Capita", value: d.ghe_per_capita, unit: "Rs.", indicatorId: "ghe_per_capita" },
      { year: yearNum, label: "OOPE as % of THE", value: d.oope_the_pct, unit: "percent", indicatorId: "oope_the_pct" },
      { year: yearNum, label: "OOPE as % of GDP", value: d.oope_gdp_pct, unit: "percent", indicatorId: "oope_gdp_pct" },
      { year: yearNum, label: "OOPE Per Capita", value: d.oope_per_capita, unit: "Rs.", indicatorId: "oope_per_capita" }
    );
  });

  await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "nha.IN.health_expenditure_key_indicators",
    artifact: createTableArtifact({
      indicatorId: "health.nha.key_indicators",
      title: "National Health Accounts Key Financing Indicators",
      sourceId: SOURCE_ID,
      sourceIndicatorId: "Table 1 & Table 3",
      sourceUrl: SOURCE_URL,
      unit: "mixed",
      fetchedAt,
      rows: nationalRows,
      dimensions: ["indicatorId", "year"]
    })
  });

  // 2. State Level Indicators for 2022-23
  const stateIndicators = [
    { state: "Assam", the_cr: 13137, the_gsdp: 2.7, the_pc: 3649, ghe_cr: 8012, ghe_the: 61.0, ghe_gsdp: 1.7, ghe_gge: 6.8, ghe_pc: 2226, oope_cr: 4454, oope_the: 33.9, oope_gsdp: 0.9, oope_gge: 3.8, oope_pc: 1237, pop_cr: 3.6 },
    { state: "Andhra Pradesh", the_cr: 36596, the_gsdp: 2.8, the_pc: 6905, ghe_cr: 12853, ghe_the: 35.1, ghe_gsdp: 1.0, ghe_gge: 6.2, ghe_pc: 2425, oope_cr: 21820, oope_the: 59.6, oope_gsdp: 1.7, oope_gge: 10.5, oope_pc: 4117, pop_cr: 5.3 },
    { state: "Bihar", the_cr: 27582, the_gsdp: 3.6, the_pc: 2189, ghe_cr: 13311, ghe_the: 48.3, ghe_gsdp: 1.7, ghe_gge: 6.2, ghe_pc: 1056, oope_cr: 13144, oope_the: 47.7, oope_gsdp: 1.7, oope_gge: 6.1, oope_pc: 1043, pop_cr: 12.6 },
    { state: "Chhattisgarh", the_cr: 13874, the_gsdp: 3.0, the_pc: 4625, ghe_cr: 7691, ghe_the: 55.4, ghe_gsdp: 1.7, ghe_gge: 7.8, ghe_pc: 2564, oope_cr: 4426, oope_the: 31.9, oope_gsdp: 1.0, oope_gge: 4.5, oope_pc: 1475, pop_cr: 3.0 },
    { state: "Gujarat", the_cr: 37422, the_gsdp: 1.7, the_pc: 5271, ghe_cr: 16904, ghe_the: 45.2, ghe_gsdp: 0.8, ghe_gge: 7.9, ghe_pc: 2381, oope_cr: 14767, oope_the: 39.5, oope_gsdp: 0.7, oope_gge: 6.9, oope_pc: 2080, pop_cr: 7.1 },
    { state: "Haryana", the_cr: 22991, the_gsdp: 2.4, the_pc: 7664, ghe_cr: 9622, ghe_the: 41.9, ghe_gsdp: 1.0, ghe_gge: 8.1, ghe_pc: 3207, oope_cr: 8768, oope_the: 38.1, oope_gsdp: 0.9, oope_gge: 7.4, oope_pc: 2923, pop_cr: 3.0 },
    { state: "Jammu & Kashmir", the_cr: 8027, the_gsdp: 3.7, the_pc: 5734, ghe_cr: 5483, ghe_the: 68.3, ghe_gsdp: 2.5, ghe_gge: 7.2, ghe_pc: 3916, oope_cr: 2382, oope_the: 29.7, oope_gsdp: 1.1, oope_gge: 3.1, oope_pc: 1701, pop_cr: 1.4 },
    { state: "Jharkhand", the_cr: 15916, the_gsdp: 3.8, the_pc: 4081, ghe_cr: 5991, ghe_the: 37.6, ghe_gsdp: 1.4, ghe_gge: 7.4, ghe_pc: 1536, oope_cr: 9335, oope_the: 58.7, oope_gsdp: 2.3, oope_gge: 11.6, oope_pc: 2394, pop_cr: 3.9 },
    { state: "Karnataka", the_cr: 47760, the_gsdp: 2.1, the_pc: 7024, ghe_cr: 15865, ghe_the: 33.2, ghe_gsdp: 0.7, ghe_gge: 5.8, ghe_pc: 2333, oope_cr: 13933, oope_the: 29.2, oope_gsdp: 0.6, oope_gge: 5.1, oope_pc: 2049, pop_cr: 6.8 },
    { state: "Kerala", the_cr: 47216, the_gsdp: 4.5, the_pc: 13116, ghe_cr: 12931, ghe_the: 27.4, ghe_gsdp: 1.2, ghe_gge: 8.3, ghe_pc: 3592, oope_cr: 30197, oope_the: 64.0, oope_gsdp: 2.9, oope_gge: 19.4, oope_pc: 8388, pop_cr: 3.6 },
    { state: "Madhya Pradesh", the_cr: 33376, the_gsdp: 2.7, the_pc: 3881, ghe_cr: 15715, ghe_the: 47.1, ghe_gsdp: 1.3, ghe_gge: 6.4, ghe_pc: 1827, oope_cr: 15841, oope_the: 47.5, oope_gsdp: 1.3, oope_gge: 6.5, oope_pc: 1842, pop_cr: 8.6 },
    { state: "Maharashtra", the_cr: 104419, the_gsdp: 2.9, the_pc: 8287, ghe_cr: 30537, ghe_the: 29.2, ghe_gsdp: 0.8, ghe_gge: 6.5, ghe_pc: 2424, oope_cr: 42595, oope_the: 40.8, oope_gsdp: 1.2, oope_gge: 9.1, oope_pc: 3381, pop_cr: 12.6 },
    { state: "Odisha", the_cr: 24376, the_gsdp: 3.4, the_pc: 5299, ghe_cr: 12990, ghe_the: 53.3, ghe_gsdp: 1.8, ghe_gge: 7.9, ghe_pc: 2824, oope_cr: 10329, oope_the: 42.4, oope_gsdp: 1.4, oope_gge: 6.3, oope_pc: 2245, pop_cr: 4.6 },
    { state: "Punjab", the_cr: 19595, the_gsdp: 2.8, the_pc: 6321, ghe_cr: 6033, ghe_the: 30.8, ghe_gsdp: 0.9, ghe_gge: 5.0, ghe_pc: 1946, oope_cr: 11871, oope_the: 60.6, oope_gsdp: 1.7, oope_gge: 9.9, oope_pc: 3829, pop_cr: 3.1 },
    { state: "Rajasthan", the_cr: 38512, the_gsdp: 2.8, the_pc: 4755, ghe_cr: 16943, ghe_the: 44.0, ghe_gsdp: 1.2, ghe_gge: 6.9, ghe_pc: 2092, oope_cr: 17642, oope_the: 45.8, oope_gsdp: 1.3, oope_gge: 7.2, oope_pc: 2178, pop_cr: 8.1 },
    { state: "Tamil Nadu", the_cr: 48671, the_gsdp: 2.1, the_pc: 6321, ghe_cr: 21517, ghe_the: 44.2, ghe_gsdp: 0.9, ghe_gge: 6.7, ghe_pc: 2794, oope_cr: 18848, oope_the: 38.7, oope_gsdp: 0.8, oope_gge: 5.9, oope_pc: 2448, pop_cr: 7.7 },
    { state: "Uttar Pradesh", the_cr: 114470, the_gsdp: 5.0, the_pc: 4871, ghe_cr: 33352, ghe_the: 29.1, ghe_gsdp: 1.5, ghe_gge: 7.1, ghe_pc: 1419, oope_cr: 75656, oope_the: 66.1, oope_gsdp: 3.3, oope_gge: 16.0, oope_pc: 3219, pop_cr: 23.5 },
    { state: "Uttarakhand", the_cr: 6627, the_gsdp: 2.3, the_pc: 5523, ghe_cr: 4268, ghe_the: 64.4, ghe_gsdp: 1.5, ghe_gge: 8.2, ghe_pc: 3557, oope_cr: 1911, oope_the: 28.8, oope_gsdp: 0.7, oope_gge: 3.7, oope_pc: 1593, pop_cr: 1.2 },
    { state: "West Bengal", the_cr: 66437, the_gsdp: 4.4, the_pc: 6711, ghe_cr: 20769, ghe_the: 31.3, ghe_gsdp: 1.4, ghe_gge: 8.5, ghe_pc: 2098, oope_cr: 41409, oope_the: 62.3, oope_gsdp: 2.7, oope_gge: 16.9, oope_pc: 4183, pop_cr: 9.9 },
    { state: "Telangana", the_cr: 26040, the_gsdp: 2.0, the_pc: 6853, ghe_cr: 10692, ghe_the: 41.1, ghe_gsdp: 0.8, ghe_gge: 6.2, ghe_pc: 2814, oope_cr: 10249, oope_the: 39.4, oope_gsdp: 0.8, oope_gge: 6.0, oope_pc: 2697, pop_cr: 3.8 },
    { state: "Himachal Pradesh", the_cr: 7140, the_gsdp: 3.7, the_pc: 10200, ghe_cr: 4139, ghe_the: 58.0, ghe_gsdp: 2.2, ghe_gge: 8.2, ghe_pc: 5913, oope_cr: 2833, oope_the: 39.7, oope_gsdp: 1.5, oope_gge: 5.6, oope_pc: 4047, pop_cr: 0.7 }
  ];

  await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "nha.IN.state_health_indicators_2022_23",
    artifact: createTableArtifact({
      indicatorId: "health.nha.state_indicators_2022_23",
      title: "State-wise Key Health Financing Indicators 2022-23",
      sourceId: SOURCE_ID,
      sourceIndicatorId: "Table A.6",
      sourceUrl: SOURCE_URL,
      unit: "mixed",
      fetchedAt,
      rows: stateIndicators,
      dimensions: ["state"]
    })
  });

  console.log("Derived series JSON files generated successfully.");
}

main().catch(console.error);
