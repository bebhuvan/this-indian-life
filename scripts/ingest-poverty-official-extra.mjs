import {
  createSeriesArtifact,
  createTableArtifact,
  mergeSourceManifest,
  writeSeriesArtifact
} from "./core/artifacts.mjs";
import { fetchPipNational, pipMeta } from "./adapters/pip.mjs";

const fetchedAt = new Date().toISOString();
const geoIN = { type: "country", id: "IN", name: "India" };
const entries = [];

async function fetchWorldBank(code) {
  const sourceUrl = `https://api.worldbank.org/v2/country/IN/indicator/${code}?format=json&per_page=20000`;
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`World Bank API failed for ${code}: ${response.status}`);
  const payload = await response.json();
  const rows = payload?.[1] || [];
  return {
    sourceUrl,
    sourceIndicatorName: rows[0]?.indicator?.value || code,
    observations: rows
      .filter((row) => row.value !== null && row.date)
      .map((row) => ({ date: String(row.date), value: Number(row.value) }))
      .sort((a, b) => Number(a.date) - Number(b.date))
  };
}

async function writeSeries({ id, title, sourceId, sourceIndicatorId, sourceUrl, unit, observations, metadata = {} }) {
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
  console.log(`poverty official-extra series ${id} (${observations.length})`);
}

async function writeTable({ id, title, sourceId, sourceIndicatorId, sourceUrl, unit, rows, metadata = {} }) {
  const artifact = createTableArtifact({
    indicatorId: id,
    title,
    sourceId,
    sourceIndicatorId,
    sourceUrl,
    unit,
    geography: geoIN,
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata
  });
  artifact.fetchedAt = fetchedAt;
  const file = await writeSeriesArtifact({ sourceId: "poverty", name: `poverty.IN.${id.split(".").pop()}`, artifact });
  entries.push({ status: "ready", indicatorId: id, sourceIndicatorId, source: sourceId, artifact: file, rows: rows.length, fetchedAt });
  console.log(`poverty official-extra table  ${id} (${rows.length})`);
}

const wbMeta = {
  provenance: "World Bank WDI/Poverty and Inequality Platform.",
  method: "World Bank poverty estimates based on household survey data and 2021 PPP poverty lines where applicable."
};

// Poverty gaps at $3 / $4.20 / $8.30 now come straight from PIP (the canonical
// source), version-pinned, survey years only. The WDI SI.POV.*.GP codes are a
// rounded snapshot of these and could drift by a step between vintages.
const pipGaps = [
  ["econ.poverty.wb_gap_300", "Poverty gap at $3/day, 2021 PPP", "3.00"],
  ["econ.poverty.wb_gap_420", "Poverty gap at $4.20/day, 2021 PPP", "4.20"],
  ["econ.poverty.wb_gap_830", "Poverty gap at $8.30/day, 2021 PPP", "8.30"]
];

for (const [id, title, povline] of pipGaps) {
  const fetched = await fetchPipNational({ povline });
  await writeSeries({
    id,
    title,
    sourceId: "worldbank",
    sourceIndicatorId: `PIP: poverty gap, $${povline}/day (2021 PPP)`,
    sourceUrl: fetched.sourceUrl,
    unit: "% poverty gap",
    observations: fetched.gapObs,
    metadata: pipMeta({ povline, measure: "poverty gap" })
  });
}

// These stay on the WDI API: societal poverty, prosperity gap, the two
// multidimensional headcounts and learning poverty. They are official World
// Bank context, not the international consumption-line headcounts/gaps PIP is
// canonical for, so we leave them where the article already sources them.
const wbSeries = [
  ["econ.poverty.wb_societal_headcount", "Poverty headcount at societal poverty line", "SI.POV.SOPO", "% of population"],
  ["econ.poverty.wb_prosperity_gap", "Prosperity gap", "SI.SPR.PGAP", "average shortfall from $28/day standard"],
  ["econ.poverty.wb_mpm_headcount", "World Bank multidimensional poverty headcount", "SI.POV.MPWB", "% of population"],
  ["econ.poverty.undp_mpi_headcount", "UNDP multidimensional poverty headcount", "SI.POV.MPUN", "% of population"],
  ["econ.poverty.learning_poverty", "Learning poverty", "SE.LPV.PRIM", "% of end-of-primary-age children"]
];

for (const [id, title, code, unit] of wbSeries) {
  const fetched = await fetchWorldBank(code);
  await writeSeries({
    id,
    title,
    sourceId: "worldbank",
    sourceIndicatorId: code,
    sourceUrl: fetched.sourceUrl,
    unit,
    observations: fetched.observations,
    metadata: { ...wbMeta, sourceIndicatorName: fetched.sourceIndicatorName }
  });
}

await writeTable({
  id: "econ.poverty.ophi_global_mpi_profile",
  title: "Global MPI profile for India, 2019-21",
  sourceId: "ophi-undp",
  sourceIndicatorId: "OPHI Global MPI Country Briefing 2023: India, Table 1",
  sourceUrl: "https://ophi.org.uk/sites/default/files/2024-01/CB_IND_2023.pdf",
  unit: "%",
  rows: [
    { label: "MPI poor, national", value: 16.4, denominator: "population", note: "Headcount H" },
    { label: "Vulnerable to MPI poverty", value: 18.7, denominator: "population", note: "Deprived in 20-33.33% of weighted indicators" },
    { label: "Severe MPI poverty", value: 4.2, denominator: "population", note: "Deprived in at least 50% of weighted indicators" },
    { label: "MPI poor, rural", value: 21.2, denominator: "rural population", note: "Rural headcount H" },
    { label: "MPI poor, urban", value: 5.5, denominator: "urban population", note: "Urban headcount H" },
    { label: "Intensity among MPI poor", value: 42.0, denominator: "MPI poor", note: "Average weighted deprivation score among poor people" }
  ],
  metadata: {
    provenance: "OPHI Global MPI Country Briefing 2023 for India, based on DHS/NFHS 2019-21.",
    method: "Global MPI identifies people deprived in at least one third of weighted indicators across health, education and living standards. Intensity is the average deprivation score among the MPI poor.",
    caveat: "This is the global MPI, not NITI's national MPI. It uses a different indicator set and should not be treated as directly interchangeable with India's national MPI."
  }
});

await writeSeries({
  id: "econ.poverty.wb_mpm_headcount_brief_2025",
  title: "World Bank multidimensional poverty headcount, October 2025 brief",
  sourceId: "worldbank",
  sourceIndicatorId: "Poverty & Equity Brief October 2025: Multidimensional Poverty Measure",
  sourceUrl: "https://documents1.worldbank.org/curated/en/099722104222534584/pdf/IDU-25f34333-d3a3-44ae-8268-86830e3bc5a5.pdf",
  unit: "% of population",
  observations: [{ date: "2022-23", value: 15.5 }],
  metadata: {
    provenance: "World Bank Poverty & Equity Brief, India, October 2025.",
    method: "Brief-specific World Bank Multidimensional Poverty Measure estimate for India. The same brief notes data are derived from a 2022 survey/2022-23 HCES context.",
    caveat: "This differs from the WDI API SI.POV.MPWB value of 17.7% for 2022. The article keeps both as official World Bank context and does not mix either with consumption-poverty headcounts."
  }
});

await mergeSourceManifest("poverty", entries);
