// IMD 2026 southwest-monsoon Long Range Forecast (LRF) snapshot.
//
// Unlike the historical series (imdpune Rainfall_Data.html, 1901-2025), the 2026
// season has no outcome yet - this captures IMD's *forecast* as published, so the
// article can show "what we know in June 2026" honestly. Figures are transcribed
// from IMD's Long Range Forecast press releases (the page 403s to automated
// fetchers, so the numbers are hand-entered and triangulated across IMD/PIB,
// Down To Earth and Open). Refresh the live cumulative-departure fact at publish;
// it is a moving snapshot and is carried in metadata, not as a frozen chart.
//
// Primary source: IMD Long Range Forecast update, issued 29 May 2026 (PIB PRID 2266479);
// initial forecast issued 13 April 2026.

import { createTableArtifact, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const SOURCE_URL = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2266479";
const SOURCE_ID = "imd";
const fetchedAt = new Date().toISOString();

// LPA (long period average) of all-India SW monsoon rainfall, 1971-2020 base = 87 cm (868.6 mm).
const LPA_CM = 87;

// --- Chart 1: IMD's category probability forecast (the headline) ------------
// IMD's updated (29 May 2026) probability forecast for the season as a whole.
// Verified: 60% deficient, 24% below normal => 84% below-normal-or-less; 16% normal-or-above.
// IMD's standard five categories collapse here to the three we can verify exactly.
const categoryProbabilities = createTableArtifact({
  indicatorId: "climate.monsoon_2026.category_probabilities",
  title: "IMD's 2026 monsoon forecast: the odds tilt to a shortfall",
  sourceId: SOURCE_ID,
  sourceIndicatorId: "imd-lrf-2026-category-probability",
  sourceUrl: SOURCE_URL,
  unit: "% forecast probability",
  fetchedAt,
  rows: [
    { label: "Deficient (below 90% of normal)", value: 60 },
    { label: "Below normal (90-96%)", value: 24 },
    { label: "Normal or above (over 96%)", value: 16 }
  ],
  metadata: {
    issuedOn: "2026-05-29",
    note: "IMD updated Long Range Forecast, 29 May 2026. 'Deficient' + 'below normal' = 84% probability the season finishes below normal.",
    lpaCm: LPA_CM,
    lpaBasePeriod: "1971-2020"
  }
});

// --- Chart 2: the April -> May downgrade ------------------------------------
// IMD cut its seasonal call from 92% of LPA (13 Apr) to 90% (29 May) as El Nino
// signals firmed. Reference line at 96% = bottom of IMD's "normal" band.
const forecastEvolution = createTableArtifact({
  indicatorId: "climate.monsoon_2026.lrf_evolution",
  title: "IMD nudged its 2026 forecast down as El Nino firmed up",
  sourceId: SOURCE_ID,
  sourceIndicatorId: "imd-lrf-2026-evolution",
  sourceUrl: SOURCE_URL,
  unit: "% of long-period average",
  fetchedAt,
  rows: [
    { label: "Initial forecast (13 Apr 2026)", value: 92 },
    { label: "Updated forecast (29 May 2026)", value: 90 }
  ],
  metadata: {
    normalBandLow: 96,
    normalBandHigh: 104,
    modelErrorPctApril: 5,
    modelErrorPctMay: 4,
    note: "IMD classes 96-104% of LPA as 'normal'. Both 2026 forecasts sit below that band. Model error was +/-5% in April, tightened to +/-4% in the May update.",
    lpaCm: LPA_CM
  }
});

// --- Snapshot of the live, moving facts (carried in prose, dated) -----------
const liveSnapshot = {
  issuedSource: SOURCE_URL,
  asOf: "2026-06-16",
  seasonalForecastPctLpa: 90,
  initialForecastPctLpa: 92,
  lpaCm: LPA_CM,
  lpaMm: 868.6,
  lpaBasePeriod: "1971-2020",
  categoryProbabilities: { deficient: 60, belowNormal: 24, normalOrAbove: 16 },
  onsetKerala2026: "2026-06-04",
  onsetKeralaNormal: "2026-06-01",
  juneSoFar: {
    cumulativeDeparturePct_Jun1_10: -26,
    deficitPct_Jun4_15: -64,
    note: "Late onset (4 Jun, 3 days late) then a 'monsoon break'; large June deficit driven by a southward-shifted westerly jet stream."
  },
  drivers: {
    enso: "El Nino developing during the season (IMD MMCFS); WMO ~80% likelihood Jun-Aug 2026, ~90%+ through Nov; some models moderate-to-strong.",
    iod: "IOD neutral through the core of the season; IMD's April outlook flags a positive IOD possibly developing only towards the end of the monsoon - so the usual mid-season 'bailout' is uncertain."
  }
};

async function main() {
  const p1 = await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "imd.IN.climate.monsoon_2026.category_probabilities",
    artifact: categoryProbabilities
  });
  const p2 = await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "imd.IN.climate.monsoon_2026.lrf_evolution",
    artifact: forecastEvolution
  });
  const snap = await writeSnapshot(SOURCE_ID, "imd-monsoon-2026-lrf-snapshot", liveSnapshot);
  console.log("wrote", p1);
  console.log("wrote", p2);
  console.log("snapshot", snap.path);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
