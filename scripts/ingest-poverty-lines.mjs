import {
  createSeriesArtifact,
  createTableArtifact,
  writeSeriesArtifact,
  mergeSourceManifest
} from "./core/artifacts.mjs";
import { fetchPipNational, pipMeta } from "./adapters/pip.mjs";

const fetchedAt = new Date().toISOString();
const geoIN = { type: "country", id: "IN", name: "India" };
const entries = [];

async function series({ id, title, sourceId, sourceIndicatorId, sourceUrl, unit, observations, metadata = {} }) {
  const artifact = createSeriesArtifact({
    indicatorId: id,
    title,
    sourceId,
    sourceIndicatorId,
    sourceUrl,
    unit,
    frequency: "survey years",
    geography: geoIN,
    fetchedAt,
    observations,
    metadata
  });
  const file = await writeSeriesArtifact({ sourceId: "poverty", name: `poverty.IN.${id.split(".").pop()}`, artifact });
  entries.push({ status: "ready", indicatorId: id, sourceIndicatorId, source: sourceId, artifact: file, observations: observations.length, fetchedAt });
  console.log(`poverty series ${id} (${observations.length})`);
}

async function table({ id, title, sourceId, sourceIndicatorId, sourceUrl, unit, rows, metadata = {} }) {
  const artifact = createTableArtifact({
    indicatorId: id,
    title,
    sourceId,
    sourceIndicatorId,
    sourceUrl,
    unit,
    geography: geoIN,
    fetchedAt,
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata
  });
  const file = await writeSeriesArtifact({ sourceId: "poverty", name: `poverty.IN.${id.split(".").pop()}`, artifact });
  entries.push({ status: "ready", indicatorId: id, sourceIndicatorId, source: sourceId, artifact: file, rows: rows.length, fetchedAt });
  console.log(`poverty table  ${id} (${rows.length})`);
}

const wbOct2025 = "https://documents1.worldbank.org/curated/en/099722104222534584/pdf/IDU-25f34333-d3a3-44ae-8268-86830e3bc5a5.pdf";
const wbMeta = {
  provenance: "World Bank Poverty & Equity Brief: India, October 2025.",
  method: "International poverty estimates use 2011-12 CES and 2022-23 HCES, modified mixed reference period, spatial/intertemporal deflation, 2021 PPP poverty lines."
};

// The $3 and $4.20 national headcounts now come straight from PIP (the canonical
// source the brief PDF is itself an extract of), version-pinned for
// reproducibility, across PIP's full Indian survey history (1977-2022, survey
// years only). The brief PDF stays the source for the rural/urban splits and
// group cuts below, which PIP does not serve for India.
const pip300 = await fetchPipNational({ povline: "3.00" });
const pip420 = await fetchPipNational({ povline: "4.20" });

await series({
  id: "econ.poverty.wb_poverty_300",
  title: "Poverty headcount at $3/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "PIP: poverty headcount, $3.00/day (2021 PPP)",
  sourceUrl: pip300.sourceUrl,
  unit: "% of population",
  observations: pip300.headcountObs,
  metadata: pipMeta({ povline: "3.00", measure: "headcount" })
});

await series({
  id: "econ.poverty.wb_poverty_420",
  title: "Poverty headcount at $4.20/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "PIP: poverty headcount, $4.20/day (2021 PPP)",
  sourceUrl: pip420.sourceUrl,
  unit: "% of population",
  observations: pip420.headcountObs,
  metadata: pipMeta({ povline: "4.20", measure: "headcount" })
});

await series({
  id: "econ.poverty.wb_poor_300",
  title: "People below $3/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "Poverty & Equity Brief October 2025: $3 number of poor",
  sourceUrl: wbOct2025,
  unit: "million people",
  observations: [{ date: "2022", value: 75.24 }],
  metadata: wbMeta
});

await series({
  id: "econ.poverty.wb_poor_420",
  title: "People below $4.20/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "Poverty & Equity Brief October 2025: LMIC number of poor",
  sourceUrl: wbOct2025,
  unit: "million people",
  observations: [{ date: "2022", value: 342.32 }],
  metadata: wbMeta
});

await series({
  id: "econ.poverty.wb_poverty_420_rural",
  title: "Rural poverty at $4.20/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "Poverty & Equity Brief October 2025: rural LMIC poverty",
  sourceUrl: wbOct2025,
  unit: "% of rural population",
  observations: [{ date: "2011", value: 64.9 }, { date: "2022", value: 27.7 }],
  metadata: wbMeta
});

await series({
  id: "econ.poverty.wb_poverty_420_urban",
  title: "Urban poverty at $4.20/day, 2021 PPP",
  sourceId: "worldbank",
  sourceIndicatorId: "Poverty & Equity Brief October 2025: urban LMIC poverty",
  sourceUrl: wbOct2025,
  unit: "% of urban population",
  observations: [{ date: "2011", value: 39.7 }, { date: "2022", value: 14.3 }],
  metadata: wbMeta
});

await table({
  id: "econ.poverty.wb_group_poverty_420",
  title: "Poverty by group at $4.20/day, 2022-23",
  sourceId: "worldbank",
  sourceIndicatorId: "Poverty & Equity Brief October 2025: Poverty by Group",
  sourceUrl: wbOct2025,
  unit: "% below $4.20/day",
  rows: [
    { label: "Children 0-14", value: 31.2 },
    { label: "No education (16+)", value: 30.2 },
    { label: "Rural population", value: 27.7 },
    { label: "Primary education (16+)", value: 25.0 },
    { label: "Females", value: 24.5 },
    { label: "Males", value: 23.3 },
    { label: "Working age 15-64", value: 21.7 },
    { label: "Secondary education (16+)", value: 19.4 },
    { label: "Urban population", value: 14.3 },
    { label: "Tertiary/post-secondary (16+)", value: 8.7 }
  ],
  metadata: { ...wbMeta, note: "The World Bank brief states these group rates are at the $4.20 lower-middle-income poverty line." }
});

await table({
  id: "econ.poverty.wb_mpm_components",
  title: "World Bank multidimensional poverty components, 2022-23",
  sourceId: "worldbank",
  sourceIndicatorId: "Poverty & Equity Brief October 2025: MPM components",
  sourceUrl: wbOct2025,
  unit: "% of population",
  rows: [
    { label: "No limited-standard sanitation", value: 29.9 },
    { label: "No adult completed primary education", value: 13.8 },
    { label: "No limited-standard drinking water", value: 11.2 },
    { label: "Daily consumption below $3", value: 5.3 },
    { label: "No electricity", value: 1.0 }
  ],
  metadata: { ...wbMeta, note: "World Bank MPM is adapted from OPHI MPI; the brief notes it excludes nutrition and health deprivation." }
});

const planningUrl = "https://www.niti.gov.in/sites/default/files/2020-05/press-note-poverty-2011-12-23-08-16.pdf";
const planningMeta = {
  provenance: "Planning Commission press note on poverty estimates, 2011-12, Tendulkar methodology.",
  method: "Official poverty headcount ratios based on NSS consumption expenditure and Tendulkar poverty lines."
};

await series({
  id: "econ.poverty.tendulkar_headcount",
  title: "Official poverty headcount, Tendulkar methodology",
  sourceId: "planning-commission",
  sourceIndicatorId: "Poverty Estimates 2011-12: all-India poverty ratio",
  sourceUrl: planningUrl,
  unit: "% of population",
  observations: [
    { date: "1993", value: 45.3 },
    { date: "2004", value: 37.2 },
    { date: "2009", value: 29.8 },
    { date: "2011", value: 21.9 }
  ],
  metadata: planningMeta
});

await table({
  id: "econ.poverty.committee_headcount_2011",
  title: "Tendulkar vs Rangarajan poverty headcount, 2011-12",
  sourceId: "planning-commission",
  sourceIndicatorId: "Tendulkar press note and Rangarajan Expert Group report",
  sourceUrl: planningUrl,
  unit: "% of population",
  rows: [
    { label: "Tendulkar: all India", value: 21.9 },
    { label: "Rangarajan: all India", value: 29.5 },
    { label: "Tendulkar: rural", value: 25.7 },
    { label: "Rangarajan: rural", value: 30.9 },
    { label: "Tendulkar: urban", value: 13.7 },
    { label: "Rangarajan: urban", value: 26.4 }
  ],
  metadata: {
    provenance: "Tendulkar values from Planning Commission press note; Rangarajan values from Expert Group to Review the Methodology for Measurement of Poverty, 2014.",
    method: "Side-by-side comparison of poverty headcount ratios for 2011-12 under the official Tendulkar method and the later Rangarajan Expert Group recommendation."
  }
});

await table({
  id: "econ.poverty.committee_lines_2011",
  title: "Tendulkar vs Rangarajan poverty lines, 2011-12",
  sourceId: "planning-commission",
  sourceIndicatorId: "Tendulkar press note and Rangarajan Expert Group report",
  sourceUrl: planningUrl,
  unit: "₹ per person per month",
  rows: [
    { label: "Tendulkar rural", value: 816 },
    { label: "Tendulkar urban", value: 1000 },
    { label: "Rangarajan rural", value: 972 },
    { label: "Rangarajan urban", value: 1407 }
  ],
  metadata: {
    provenance: "Tendulkar values from Planning Commission press note; Rangarajan values from Expert Group to Review the Methodology for Measurement of Poverty, 2014.",
    method: "Monthly per-capita poverty-line comparison for 2011-12."
  }
});

const tinbergenUrl = "https://papers.tinbergen.nl/25069.pdf";
const tinbergenMeta = {
  provenance: "Himanshu, Peter Lanjouw and Philipp Schirmer, 'Has Poverty Decline in India Faltered Since 2011/12?', Tinbergen Institute Discussion Paper 2025-069/V.",
  method: "Survey-to-survey imputation using EUS 2011-12 and PLFS rounds to estimate Tendulkar-compatible poverty rates after 2011-12.",
  caveat: "These are research estimates, not official poverty rates. They rely on imputation assumptions and are used here to represent the comparability critique."
};

await series({
  id: "econ.poverty.tinbergen_plfs_tendulkar_sfe",
  title: "Tinbergen PLFS-imputed poverty, Tendulkar-compatible, sector-wide model",
  sourceId: "tinbergen",
  sourceIndicatorId: "Table 5: Economic Reasoning + SFE, total",
  sourceUrl: tinbergenUrl,
  unit: "% of population",
  observations: [
    { date: "2017", value: 19.5 },
    { date: "2018", value: 18.9 },
    { date: "2019", value: 18.5 },
    { date: "2020", value: 18.1 },
    { date: "2021", value: 19.4 },
    { date: "2022", value: 19.9 }
  ],
  metadata: tinbergenMeta
});

await series({
  id: "econ.poverty.tinbergen_plfs_tendulkar_state",
  title: "Tinbergen PLFS-imputed poverty, Tendulkar-compatible, state-level model",
  sourceId: "tinbergen",
  sourceIndicatorId: "Table 5: Economic Reasoning imputed at state level, total",
  sourceUrl: tinbergenUrl,
  unit: "% of population",
  observations: [
    { date: "2017", value: 18.0 },
    { date: "2018", value: 17.0 },
    { date: "2019", value: 17.0 },
    { date: "2020", value: 16.3 },
    { date: "2021", value: 16.9 },
    { date: "2022", value: 17.5 }
  ],
  metadata: tinbergenMeta
});

await series({
  id: "econ.poverty.tinbergen_plfs_tendulkar_lasso",
  title: "Tinbergen PLFS-imputed poverty, Tendulkar-compatible, state LASSO model",
  sourceId: "tinbergen",
  sourceIndicatorId: "Table 5: Individual model per state, total",
  sourceUrl: tinbergenUrl,
  unit: "% of population",
  observations: [
    { date: "2017", value: 18.4 },
    { date: "2018", value: 17.5 },
    { date: "2019", value: 17.4 },
    { date: "2020", value: 16.6 },
    { date: "2021", value: 17.5 },
    { date: "2022", value: 18.3 }
  ],
  metadata: tinbergenMeta
});

await table({
  id: "econ.poverty.tinbergen_estimates_2022",
  title: "Alternative poverty estimates for India, 2022-23",
  sourceId: "tinbergen",
  sourceIndicatorId: "Tinbergen Institute Discussion Paper 2025-069/V",
  sourceUrl: tinbergenUrl,
  unit: "% of population",
  rows: [
    { label: "Naive HCES direct comparison, Rangarajan", value: 7.2 },
    { label: "CES imputation, Tendulkar, lowest model", value: 11.3 },
    { label: "CES imputation, Tendulkar, highest model", value: 13.6 },
    { label: "CES imputation, Rangarajan/MMRP", value: 17.5 },
    { label: "PLFS imputation, Tendulkar, lowest model", value: 17.5 },
    { label: "PLFS imputation, Tendulkar, highest model", value: 19.9 },
    { label: "PLFS imputation, Rangarajan/MMRP, middle model", value: 23.3 },
    { label: "PLFS imputation, Rangarajan/MMRP, highest model", value: 25.9 }
  ],
  metadata: {
    provenance: tinbergenMeta.provenance,
    method: "Selected national poverty estimates reported in Tables 1, 3, 4, 5 and 6. The paper uses survey-to-survey imputation to address non-comparability between 2011-12 and 2022-23 consumption surveys.",
    caveat: "Rows mix different definitions and methods and should be read as a controversy map, not as one internally comparable official series."
  }
});

const nitiMpiUrl = "https://www.niti.gov.in/sites/default/files/2024-01/MPI-22_NITI-Aayog20254.pdf";
await series({
  id: "econ.poverty.niti_mpi_headcount",
  title: "National multidimensional poverty headcount",
  sourceId: "niti",
  sourceIndicatorId: "Multidimensional Poverty in India since 2005-06",
  sourceUrl: nitiMpiUrl,
  unit: "% multidimensionally poor",
  observations: [
    { date: "2005-06", value: 55.34 },
    { date: "2013-14", value: 29.17 },
    { date: "2015-16", value: 24.85 },
    { date: "2019-21", value: 14.96 },
    { date: "2022-23", value: 11.28 }
  ],
  metadata: {
    provenance: "NITI Aayog discussion paper, Multidimensional Poverty in India since 2005-06.",
    method: "National MPI headcount based on NFHS rounds and NITI's interpolated/projected estimates for non-survey years; measures health, education and living-standard deprivation, not cash poverty."
  }
});

await mergeSourceManifest("poverty", entries);
console.log(`\nMerged ${entries.length} poverty artifacts.`);
