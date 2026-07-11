import { createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const pressReleaseUrl = "https://internal.imd.gov.in/press_release/20260101_pr_4602.pdf";
const annualReport2024Url = "https://metnet.imd.gov.in/docs/imdnews/ANNUAL_REPORT2024English.pdf";

const rows = [
  {
    metric: "Annual mean land surface air temperature anomaly",
    date: "2025",
    value: 0.28,
    unit: "°C above/below normal",
    group: "Annual anomaly",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "IMD says 2025 ranked eighth warmest since nationwide records began in 1901."
  },
  {
    metric: "Annual mean land surface air temperature anomaly",
    date: "2024",
    value: 0.65,
    unit: "°C above/below normal",
    group: "Annual anomaly",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "IMD identifies 2024 as the warmest year on record for India."
  },
  {
    metric: "Annual mean temperature trend",
    date: "1901-2025",
    value: 0.68,
    unit: "C per 100 years",
    group: "Trend",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "IMD describes the 1901-2025 annual mean trend as statistically significant."
  },
  {
    metric: "Maximum temperature trend",
    date: "1901-2025",
    value: 0.89,
    unit: "C per 100 years",
    group: "Trend",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "IMD trend for all-India annual maximum temperature."
  },
  {
    metric: "Minimum temperature trend",
    date: "1901-2025",
    value: 0.47,
    unit: "C per 100 years",
    group: "Trend",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "IMD trend for all-India annual minimum temperature."
  },
  {
    metric: "Warmest-year concentration",
    date: "2011-2025",
    value: 10,
    unit: "of 15 warmest years",
    group: "Ranking",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "IMD says 10 of India's 15 warmest years occurred in 2011-2025."
  },
  {
    metric: "Decadal mean annual temperature anomaly",
    date: "2016-2025",
    value: 0.32,
    unit: "°C above/below normal",
    group: "Decade",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "IMD says 2016-2025 emerged as India's warmest decade on record."
  },
  {
    metric: "Winter mean temperature anomaly",
    date: "2025",
    value: 1.17,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "January-February 2025 seasonal anomaly."
  },
  {
    metric: "Pre-monsoon mean temperature anomaly",
    date: "2025",
    value: 0.29,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "March-May 2025 seasonal anomaly."
  },
  {
    metric: "Southwest monsoon mean temperature anomaly",
    date: "2025",
    value: 0.09,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "June-September 2025 seasonal anomaly."
  },
  {
    metric: "Post-monsoon mean temperature anomaly",
    date: "2025",
    value: -0.1,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "Statement on the Climate of India during 2025",
    note: "October-December 2025 seasonal anomaly."
  },
  {
    metric: "Winter mean temperature anomaly",
    date: "2024",
    value: 0.37,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "IMD Annual Report 2024",
    note: "January-February 2024 seasonal anomaly."
  },
  {
    metric: "Pre-monsoon mean temperature anomaly",
    date: "2024",
    value: 0.56,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "IMD Annual Report 2024",
    note: "March-May 2024 seasonal anomaly."
  },
  {
    metric: "Southwest monsoon mean temperature anomaly",
    date: "2024",
    value: 0.71,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "IMD Annual Report 2024",
    note: "June-September 2024 seasonal anomaly."
  },
  {
    metric: "Post-monsoon mean temperature anomaly",
    date: "2024",
    value: 0.83,
    unit: "°C above/below normal",
    group: "Seasonal anomaly",
    sourceDocument: "IMD Annual Report 2024",
    note: "October-December 2024 seasonal anomaly."
  },
  {
    metric: "Decadal mean annual temperature anomaly",
    date: "2015-2024",
    value: 0.31,
    unit: "°C above/below normal",
    group: "Decade",
    sourceDocument: "IMD Annual Report 2024",
    note: "IMD says 2015-2024 was the warmest decade on record as of the 2024 report."
  }
];

const artifact = createTableArtifact({
  indicatorId: "climate.imd.temperature_official_anchors",
  title: "IMD official India temperature anchors",
  sourceId: "imd-temperature",
  sourceIndicatorId: "annual-climate-statements-temperature-anchors",
  sourceUrl: pressReleaseUrl,
  unit: "mixed",
  fetchedAt,
  rows,
  dimensions: [
    { id: "metric", label: "Metric" },
    { id: "group", label: "Group" },
    { id: "sourceDocument", label: "Source document" }
  ],
  metadata: {
    sourceUrls: [pressReleaseUrl, annualReport2024Url],
    localSnapshots: [
      "data/snapshots/imd-temperature/imd_2025_annual_climate_press_release.pdf",
      "data/snapshots/imd-temperature/imd_2025_annual_climate_press_release.txt",
      "data/snapshots/imd-temperature/imd_annual_report_2024_english.pdf",
      "data/snapshots/imd-temperature/imd_annual_report_2024_english.txt"
    ],
    method: "Manual extraction of official headline temperature facts from IMD's 2025 climate statement and 2024 annual report. This is an anchor table, not a reconstructed annual time series.",
    caveat: "Use for official cross-checks, rankings, latest-year and seasonal anchors. Use OWID/ERA5/Berkeley artifacts for continuous annual chart series unless an official IMD data table is obtained."
  }
});

const artifactPath = await writeSeriesArtifact({
  sourceId: "imd-temperature",
  name: "imd-temperature.IN.climate.imd.temperature_official_anchors",
  artifact
});

await writeSourceManifest("imd-temperature", [
  {
    indicatorId: artifact.indicatorId,
    title: artifact.title,
    sourceId: artifact.sourceId,
    sourceUrl: artifact.sourceUrl,
    sourceUrls: artifact.metadata.sourceUrls,
    artifactPath,
    fetchedAt,
    notes: artifact.metadata.method
  }
]);

console.log(JSON.stringify({ artifactPath, rows: rows.length }, null, 2));
