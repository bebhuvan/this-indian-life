import { createSeriesArtifact, createTableArtifact, writeRawSnapshot, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";
import { parseCsv } from "./core/csv.mjs";
import { fetchJson } from "./lib/source-http.mjs";

const fetchedAt = new Date().toISOString();

const HEAT_SOURCE_ID = "heat-mortality";

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      accept: "text/csv,text/plain,text/html,application/pdf,*/*",
      "user-agent": "Indica/0.1 heat evidence ingest",
      ...options.headers
    },
    signal: options.signal
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchBytes(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      accept: "application/pdf,application/octet-stream,*/*",
      "user-agent": "Indica/0.1 heat evidence ingest",
      ...options.headers
    },
    signal: options.signal
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function asNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function ingestOwidDisasterDeaths() {
  const sourceUrl = "https://ourworldindata.org/grapher/natural-disasters-deaths.csv";
  const csv = await fetchText(sourceUrl);
  const rows = parseCsv(csv).filter((row) => row.Entity === "India" || row.Code === "IND");
  const snapshot = await writeRawSnapshot(HEAT_SOURCE_ID, "owid-natural-disasters-deaths.csv", csv, "csv");

  const annualRows = rows
    .map((row) => ({
      year: Number(row.Year),
      reportedExtremeTemperatureDeaths: asNumber(row["Extreme temperature"]),
      allDisastersDeaths: asNumber(row["All disasters"]),
      source: "OWID Grapher, adapted from EM-DAT",
      sourceUrl
    }))
    .filter((row) => Number.isFinite(row.year))
    .sort((a, b) => a.year - b.year);

  const table = createTableArtifact({
    indicatorId: "heat.reported_extreme_temperature_deaths.owid_emdat",
    title: "India reported extreme-temperature disaster deaths",
    sourceId: "owid",
    sourceIndicatorId: "natural-disasters-deaths",
    sourceUrl,
    unit: "deaths",
    fetchedAt,
    rows: annualRows,
    dimensions: ["year", "reportedExtremeTemperatureDeaths", "allDisastersDeaths"],
    metadata: {
      note: "Event/disaster reporting comparator. This is not a full heat-attributable excess mortality estimate."
    }
  });

  const path = await writeSeriesArtifact({
    sourceId: HEAT_SOURCE_ID,
    name: "heat-mortality.IN.reported_extreme_temperature_deaths_owid_emdat",
    artifact: table
  });

  const recent = annualRows.filter((row) => row.year >= 2000 && row.year <= 2024);
  const recentWithValues = recent.filter((row) => Number.isFinite(row.reportedExtremeTemperatureDeaths));
  return {
    artifact: path,
    snapshot: snapshot.path,
    rows: annualRows.length,
    summary: {
      years2000to2024: recent.length,
      nonMissingYears2000to2024: recentWithValues.length,
      sum2000to2024: recentWithValues.reduce((sum, row) => sum + row.reportedExtremeTemperatureDeaths, 0),
      max2000to2024: recentWithValues.reduce((max, row) => (
        row.reportedExtremeTemperatureDeaths > max.value
          ? { year: row.year, value: row.reportedExtremeTemperatureDeaths }
          : max
      ), { year: null, value: -Infinity })
    }
  };
}

async function ingestHumanClimateHorizons() {
  const sourceUrl = "https://horizons.hdr.undp.org/data/CountrySummary.csv";
  // The HCH endpoint has a certificate-chain issue in this local environment.
  // Keep this scoped to this ingest so the public CSV can still be snapshotted.
  const previousTls = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const csv = await fetchText(sourceUrl);
    const rows = parseCsv(csv).filter((row) => row.ISO === "IND");
    const snapshot = await writeRawSnapshot(HEAT_SOURCE_ID, "undp-hch-country-summary.csv", csv, "csv");

    const usefulMetrics = new Set([
      "days-over-95F",
      "mortality",
      "highrisk labor",
      "lowrisk labor",
      "electricity",
      "other energy",
      "share of population",
      "share of land"
    ]);

    const hchRows = rows
      .filter((row) => usefulMetrics.has(row.metric))
      .map((row) => ({
        metric: row.metric,
        scenario: row.scenario,
        period: row.year,
        p05: asNumber(row["0.05"]),
        median: asNumber(row["0.5"]),
        p95: asNumber(row["0.95"]),
        source: "UNDP Human Climate Horizons / Climate Impact Lab",
        sourceUrl
      }))
      .sort((a, b) => `${a.metric}|${a.scenario}|${a.period}`.localeCompare(`${b.metric}|${b.scenario}|${b.period}`));

    const table = createTableArtifact({
      indicatorId: "heat.human_climate_horizons.india",
      title: "India heat-related Human Climate Horizons indicators",
      sourceId: "undp-hch",
      sourceIndicatorId: "CountrySummary.csv",
      sourceUrl,
      unit: "mixed; see metric",
      fetchedAt,
      rows: hchRows,
      dimensions: ["metric", "scenario", "period"],
      metadata: {
        note: "Projection/context indicators, not observed present-day heat death counts."
      }
    });

    const path = await writeSeriesArtifact({
      sourceId: HEAT_SOURCE_ID,
      name: "heat-mortality.IN.undp_hch_heat_context",
      artifact: table
    });

    return {
      artifact: path,
      snapshot: snapshot.path,
      rows: hchRows.length,
      summary: {
        metrics: [...new Set(hchRows.map((row) => row.metric))].sort()
      }
    };
  } finally {
    if (previousTls === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTls;
    }
  }
}

const worldBankIndicators = [
  {
    id: "population_total",
    sourceIndicatorId: "SP.POP.TOTL",
    title: "Population, total",
    unit: "people",
    relevance: "Denominator for scaling small mortality-rate changes into absolute excess deaths"
  },
  {
    id: "population_65plus_share",
    sourceIndicatorId: "SP.POP.65UP.TO.ZS",
    title: "Population ages 65 and above (% of total population)",
    unit: "percent",
    relevance: "Older adults are more vulnerable to heat"
  },
  {
    id: "crude_death_rate",
    sourceIndicatorId: "SP.DYN.CDRT.IN",
    title: "Death rate, crude",
    unit: "deaths per 1,000 population",
    relevance: "Baseline daily mortality denominator for scale checks"
  },
  {
    id: "urban_population_share",
    sourceIndicatorId: "SP.URB.TOTL.IN.ZS",
    title: "Urban population (% of total population)",
    unit: "percent",
    relevance: "Urban heat islands, density, and cooling access context"
  },
  {
    id: "electricity_access",
    sourceIndicatorId: "EG.ELC.ACCS.ZS",
    title: "Access to electricity (% of population)",
    unit: "percent",
    relevance: "Cooling precondition, though not reliability or affordability"
  },
  {
    id: "agriculture_employment_share",
    sourceIndicatorId: "SL.AGR.EMPL.ZS",
    title: "Employment in agriculture (% of total employment)",
    unit: "percent",
    relevance: "Outdoor/high-heat occupational exposure"
  },
  {
    id: "vulnerable_employment_share",
    sourceIndicatorId: "SL.EMP.VULN.ZS",
    title: "Vulnerable employment (% of total employment)",
    unit: "percent",
    relevance: "Economic vulnerability and weaker ability to avoid heat exposure"
  },
  {
    id: "pm25_exposure",
    sourceIndicatorId: "EN.ATM.PM25.MC.M3",
    title: "PM2.5 air pollution, mean annual exposure",
    unit: "micrograms per cubic meter",
    relevance: "Cardiovascular and respiratory stress modifier"
  },
  {
    id: "air_pollution_mortality_rate",
    sourceIndicatorId: "SH.STA.AIRP.P5",
    title: "Mortality rate attributed to household and ambient air pollution",
    unit: "deaths per 100,000 population",
    relevance: "Baseline respiratory/cardiovascular vulnerability context"
  }
];

async function ingestWorldBankContext() {
  const rows = [];
  const snapshots = [];

  for (const indicator of worldBankIndicators) {
    const sourceUrl = `https://api.worldbank.org/v2/country/IND/indicator/${indicator.sourceIndicatorId}?format=json&per_page=20000`;
    const raw = await fetchJson(sourceUrl);
    const snapshot = await writeSnapshot(HEAT_SOURCE_ID, `worldbank-${indicator.sourceIndicatorId}`, raw);
    snapshots.push(snapshot.path);

    const observations = (Array.isArray(raw?.[1]) ? raw[1] : [])
      .map((row) => ({
        date: String(row.date),
        value: row.value === null || row.value === undefined ? null : Number(row.value)
      }))
      .filter((row) => row.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    const latest = [...observations].reverse().find((row) => Number.isFinite(row.value));
    rows.push({
      indicatorId: indicator.id,
      sourceIndicatorId: indicator.sourceIndicatorId,
      title: indicator.title,
      latestYear: latest?.date ?? null,
      latestValue: latest?.value ?? null,
      unit: indicator.unit,
      relevance: indicator.relevance,
      source: "World Bank Indicators API",
      sourceUrl
    });

    const series = createSeriesArtifact({
      indicatorId: `heat.context.${indicator.id}`,
      title: indicator.title,
      sourceId: "worldbank",
      sourceIndicatorId: indicator.sourceIndicatorId,
      sourceUrl,
      unit: indicator.unit,
      fetchedAt,
      observations,
      metadata: {
        relevance: indicator.relevance,
        note: "Context/vulnerability indicator; not a heat-attributable mortality estimate."
      }
    });
    await writeSeriesArtifact({
      sourceId: HEAT_SOURCE_ID,
      name: `heat-mortality.IN.worldbank_context_${indicator.id}`,
      artifact: series
    });
  }

  const table = createTableArtifact({
    indicatorId: "heat.context.worldbank_latest",
    title: "Latest World Bank context indicators for India heat mortality article",
    sourceId: "worldbank",
    sourceIndicatorId: "selected indicators",
    sourceUrl: "https://api.worldbank.org/v2/",
    unit: "mixed; see row",
    fetchedAt,
    rows,
    dimensions: ["indicatorId", "latestYear"],
    metadata: {
      note: "Context indicators for exposure and vulnerability. These do not estimate heat deaths."
    }
  });
  const path = await writeSeriesArtifact({
    sourceId: HEAT_SOURCE_ID,
    name: "heat-mortality.IN.worldbank_context_latest",
    artifact: table
  });

  return { artifact: path, snapshots, rows: rows.length };
}

function buildAdministrativeAnchors() {
  return [
    {
      sourceFamily: "Frontiers model",
      yearOrPeriod: "2024 population / scenario",
      measure: "Single extreme-heat day excess deaths",
      value: 3400,
      unit: "excess deaths",
      sourceUrl: "https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full",
      interpretation: "Modelled excess-death scenario, not a direct observed death count",
      verificationStatus: "primary article"
    },
    {
      sourceFamily: "Frontiers model",
      yearOrPeriod: "2024 population / scenario",
      measure: "Five-day heatwave excess deaths",
      value: 30000,
      unit: "approximately excess deaths",
      sourceUrl: "https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full",
      interpretation: "Modelled excess-death scenario, not a direct observed death count",
      verificationStatus: "primary article"
    },
    {
      sourceFamily: "NCRB",
      yearOrPeriod: "2023",
      measure: "Heat/sunstroke deaths",
      value: 804,
      unit: "reported deaths",
      sourceUrl: "https://indianexpress.com/article/india/natural-forces-lightning-heat-stroke-killed-2023-ncrb-report-10282010/",
      interpretation: "Administrative accidental-death cause label",
      verificationStatus: "secondary report of official NCRB report; primary table still to extract"
    },
    {
      sourceFamily: "IMD DWE",
      yearOrPeriod: "2024",
      measure: "Heatwave deaths",
      value: 460,
      unit: "reported deaths",
      sourceUrl: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf",
      interpretation: "Meteorological disaster-event reporting",
      verificationStatus: "official PDF parsed locally; Table 2, Table 7, Table 22 and state/month totals reconcile"
    },
    {
      sourceFamily: "NCDC/NHRIDS",
      yearOrPeriod: "2024, March-July public reporting",
      measure: "Suspected heatstroke cases",
      value: 48000,
      unit: "approximately reported cases",
      sourceUrl: "https://www.teriin.org/index.php/article/silent-disaster-why-india-must-build-stronger-heatwave-resilience",
      interpretation: "Facility/surveillance reporting, not all heat-attributable morbidity",
      verificationStatus: "secondary policy article; NCDC aggregate feed not public in this ingest"
    },
    {
      sourceFamily: "NCDC/NHRIDS",
      yearOrPeriod: "2024, March-July public reporting",
      measure: "Confirmed heatstroke deaths",
      value: 161,
      unit: "reported deaths",
      sourceUrl: "https://www.teriin.org/index.php/article/silent-disaster-why-india-must-build-stronger-heatwave-resilience",
      interpretation: "Confirmed heatstroke deaths, not all heat-attributable deaths",
      verificationStatus: "secondary policy article; NCDC aggregate feed not public in this ingest"
    },
    {
      sourceFamily: "NCDC/NHRIDS parliamentary reporting",
      yearOrPeriod: "2024-03-01 to 2024-07-27",
      measure: "Heatstroke deaths",
      value: 374,
      unit: "reported deaths",
      sourceUrl: "https://www.theweek.in/wire-updates/national/2024/08/02/del32-lsq-health-heatstroke.html",
      interpretation: "Cutoff-specific parliamentary/public reporting",
      verificationStatus: "secondary wire report; primary Lok Sabha answer still to extract"
    },
    {
      sourceFamily: "Lancet Countdown",
      yearOrPeriod: "2024",
      measure: "Heatwave days per person in India",
      value: 19.8,
      unit: "days per person",
      sourceUrl: "https://lancetcountdown.org/wp-content/uploads/2025/10/India_Lancet-Countdown_2025_Data-Sheet-2.pdf",
      interpretation: "Exposure indicator, not deaths",
      verificationStatus: "primary data sheet"
    },
    {
      sourceFamily: "Lancet Countdown",
      yearOrPeriod: "2024",
      measure: "Potential labour hours lost due to heat exposure",
      value: 247000000000,
      unit: "potential labour hours",
      sourceUrl: "https://lancetcountdown.org/wp-content/uploads/2025/10/India_Lancet-Countdown_2025_Data-Sheet-2.pdf",
      interpretation: "Economic/labour exposure impact, not deaths",
      verificationStatus: "primary data sheet"
    }
  ];
}

async function ingestAdministrativeAnchors() {
  const rows = buildAdministrativeAnchors();
  const table = createTableArtifact({
    indicatorId: "heat.admin_and_model_anchors",
    title: "Administrative and modelled heat-mortality anchors for India",
    sourceId: HEAT_SOURCE_ID,
    sourceIndicatorId: "curated anchors",
    sourceUrl: "docs/HEAT_MORTALITY_RESEARCH_DOSSIER.md",
    unit: "mixed; see row",
    fetchedAt,
    rows,
    dimensions: ["sourceFamily", "yearOrPeriod", "measure"],
    metadata: {
      note: "Curated anchors for the article. Use verificationStatus before treating values as fully reproducible."
    }
  });
  const snapshot = await writeSnapshot(HEAT_SOURCE_ID, "administrative-and-model-anchors", rows);
  const path = await writeSeriesArtifact({
    sourceId: HEAT_SOURCE_ID,
    name: "heat-mortality.IN.admin_and_model_anchors",
    artifact: table
  });
  return { artifact: path, snapshot: snapshot.path, rows: rows.length };
}

function buildHeatDeathCountComparison() {
  return [
    {
      sourceFamily: "Frontiers model",
      period: "Single extreme-heat day scenario",
      value: 3400,
      unit: "excess deaths",
      questionAnswered: "How many additional deaths might occur on a nationally extreme heat day?",
      evidenceType: "modelled excess mortality",
      notAmeasureOf: "registered deaths or medically confirmed heatstroke deaths",
      articleUse: "Core disputed estimate; quote only as a modelled scenario",
      verificationStatus: "primary article",
      sourceUrl: "https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full"
    },
    {
      sourceFamily: "Frontiers model",
      period: "Five-day heatwave scenario",
      value: 30000,
      unit: "approximately excess deaths",
      questionAnswered: "How many additional deaths might occur across a five-day severe heatwave?",
      evidenceType: "modelled excess mortality",
      notAmeasureOf: "registered deaths or medically confirmed heatstroke deaths",
      articleUse: "Shows scale sensitivity when heat exposure persists",
      verificationStatus: "primary article",
      sourceUrl: "https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full"
    },
    {
      sourceFamily: "OWID/EM-DAT",
      period: "2024",
      value: 733,
      unit: "reported deaths",
      questionAnswered: "How many extreme-temperature disaster deaths were reported for international disaster accounting?",
      evidenceType: "reported disaster deaths",
      notAmeasureOf: "all heat-attributable mortality",
      articleUse: "International reported-disaster comparator",
      verificationStatus: "OWID Grapher CSV snapshotted and parsed locally",
      sourceUrl: "https://ourworldindata.org/grapher/natural-disasters-deaths"
    },
    {
      sourceFamily: "OWID/EM-DAT",
      period: "2000-2024, non-missing India years",
      value: 10398,
      unit: "reported deaths",
      questionAnswered: "What is the reported extreme-temperature disaster-death total across recent non-missing years?",
      evidenceType: "reported disaster deaths",
      notAmeasureOf: "all heat-attributable mortality",
      articleUse: "Shows how small reported-disaster totals are relative to large excess-mortality scenarios",
      verificationStatus: "OWID Grapher CSV snapshotted and parsed locally",
      sourceUrl: "https://ourworldindata.org/grapher/natural-disasters-deaths"
    },
    {
      sourceFamily: "NCRB ADSI",
      period: "2023",
      value: 804,
      unit: "reported deaths",
      questionAnswered: "How many deaths were administratively recorded as heat/sunstroke under accidental deaths?",
      evidenceType: "administrative cause label",
      notAmeasureOf: "excess deaths during heatwaves",
      articleUse: "Official Indian administrative count, with narrow cause-label caveat",
      verificationStatus: "secondary report of official NCRB report; primary table still to extract",
      sourceUrl: "https://indianexpress.com/article/india/natural-forces-lightning-heat-stroke-killed-2023-ncrb-report-10282010/"
    },
    {
      sourceFamily: "IMD DWE",
      period: "2024",
      value: 460,
      unit: "reported deaths",
      questionAnswered: "How many heatwave deaths were compiled in IMD's meteorological disaster-event report?",
      evidenceType: "reported meteorological disaster-event deaths",
      notAmeasureOf: "medical death registration or all-cause excess mortality",
      articleUse: "Best locally parsed official disaster-event death anchor",
      verificationStatus: "official PDF parsed locally; Table 2, Table 7, Table 22 and state/month totals reconcile",
      sourceUrl: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf"
    },
    {
      sourceFamily: "NCDC/NHRIDS",
      period: "2024, March-July public reporting",
      value: 161,
      unit: "reported deaths",
      questionAnswered: "How many heatstroke deaths were confirmed in the surveillance system by that public-reporting cutoff?",
      evidenceType: "facility/surveillance confirmed heatstroke deaths",
      notAmeasureOf: "all heat-attributable deaths, deaths outside surveillance, or excess mortality",
      articleUse: "Narrow clinical/surveillance comparator",
      verificationStatus: "secondary policy article; NCDC aggregate feed not public in this ingest",
      sourceUrl: "https://www.teriin.org/index.php/article/silent-disaster-why-india-must-build-stronger-heatwave-resilience"
    },
    {
      sourceFamily: "NCDC/NHRIDS parliamentary reporting",
      period: "2024-03-01 to 2024-07-27",
      value: 374,
      unit: "reported deaths",
      questionAnswered: "How many heatstroke deaths were cited in parliamentary/public reporting up to this cutoff?",
      evidenceType: "cutoff-specific surveillance/public reporting",
      notAmeasureOf: "all heat-attributable deaths or a full-year excess-mortality estimate",
      articleUse: "Shows cutoff and reporting-channel sensitivity within surveillance figures",
      verificationStatus: "secondary wire report; primary Lok Sabha answer still to extract",
      sourceUrl: "https://www.theweek.in/wire-updates/national/2024/08/02/del32-lsq-health-heatstroke.html"
    }
  ];
}

async function ingestHeatDeathCountComparison() {
  const rows = buildHeatDeathCountComparison();
  const table = createTableArtifact({
    indicatorId: "heat.death_count_comparison",
    title: "India heat mortality count comparison",
    sourceId: HEAT_SOURCE_ID,
    sourceIndicatorId: "curated comparison table",
    sourceUrl: "docs/HEAT_MORTALITY_ARTICLE_DRAFT.md",
    unit: "mixed; see row",
    fetchedAt,
    rows,
    dimensions: ["sourceFamily", "period", "evidenceType"],
    metadata: {
      note: "Comparison table for public article. Rows are intentionally not directly comparable; questionAnswered and notAmeasureOf define each row's boundary."
    }
  });
  const snapshot = await writeSnapshot(HEAT_SOURCE_ID, "heat-death-count-comparison", rows);
  const path = await writeSeriesArtifact({
    sourceId: HEAT_SOURCE_ID,
    name: "heat-mortality.IN.heat_death_count_comparison",
    artifact: table
  });
  return { artifact: path, snapshot: snapshot.path, rows: rows.length };
}

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildSensitivityModel() {
  const population2024 = 1450935791;
  const crudeDeathRatePer1000 = 6.6;
  const baselineDeathsPerDay = population2024 * crudeDeathRatePer1000 / 1000 / 365;
  const frontiersSingleDayExcessDeaths = 3400;
  const frontiersEquivalentNationalMortalityLift = frontiersSingleDayExcessDeaths / baselineDeathsPerDay;

  const scenarios = [
    {
      scenario: "very_low",
      exposedPopulationShare: 0.20,
      mortalityLiftAmongExposedDeaths: 0.03,
      rationale: "Small affected share and small temporary mortality increase"
    },
    {
      scenario: "low",
      exposedPopulationShare: 0.35,
      mortalityLiftAmongExposedDeaths: 0.05,
      rationale: "Moderate affected share but still a small heat-mortality lift"
    },
    {
      scenario: "middle",
      exposedPopulationShare: 0.50,
      mortalityLiftAmongExposedDeaths: 0.10,
      rationale: "Half the country materially exposed with a 10% mortality lift among exposed baseline deaths"
    },
    {
      scenario: "frontiers_scale",
      exposedPopulationShare: 0.70,
      mortalityLiftAmongExposedDeaths: frontiersEquivalentNationalMortalityLift / 0.70,
      rationale: "One way to reproduce the Frontiers single-day scale under this simple denominator model"
    },
    {
      scenario: "high",
      exposedPopulationShare: 0.75,
      mortalityLiftAmongExposedDeaths: 0.15,
      rationale: "Large affected share and severe but temporary mortality lift"
    }
  ];

  const rows = scenarios.map((scenario) => {
    const exposedBaselineDeathsPerDay = baselineDeathsPerDay * scenario.exposedPopulationShare;
    const excessDeathsPerDay = exposedBaselineDeathsPerDay * scenario.mortalityLiftAmongExposedDeaths;
    return {
      ...scenario,
      population: population2024,
      crudeDeathRatePer1000,
      baselineDeathsPerDay: round(baselineDeathsPerDay),
      exposedBaselineDeathsPerDay: round(exposedBaselineDeathsPerDay),
      excessDeathsPerDay: round(excessDeathsPerDay),
      excessDeathsPerFiveDaysIfConstant: round(excessDeathsPerDay * 5),
      mortalityLiftAmongExposedDeathsPercent: round(scenario.mortalityLiftAmongExposedDeaths * 100, 1),
      exposedPopulationSharePercent: round(scenario.exposedPopulationShare * 100, 1),
      formula: "population * crudeDeathRatePer1000 / 1000 / 365 * exposedPopulationShare * mortalityLiftAmongExposedDeaths"
    };
  });

  return {
    inputs: {
      population2024,
      crudeDeathRatePer1000,
      baselineDeathsPerDay: round(baselineDeathsPerDay),
      frontiersSingleDayExcessDeaths,
      frontiersEquivalentNationalMortalityLiftPercent: round(frontiersEquivalentNationalMortalityLift * 100, 1),
      sourceNotes: [
        "Population is the World Bank 2024 India value already fetched in this evidence packet.",
        "Crude death rate is rounded for scale-check modelling; replace with SRS/state/district baselines before any formal estimate.",
        "The model ignores age, district, humidity, hot nights, exposure duration, harvesting, and lagged mortality."
      ]
    },
    rows
  };
}

async function ingestSensitivityModel() {
  const model = buildSensitivityModel();
  const table = createTableArtifact({
    indicatorId: "heat.sensitivity_scale_check",
    title: "Illustrative heat mortality sensitivity scale check",
    sourceId: HEAT_SOURCE_ID,
    sourceIndicatorId: "curated sensitivity model",
    sourceUrl: "docs/HEAT_MORTALITY_ARTICLE_DRAFT.md",
    unit: "excess deaths per day; see row",
    fetchedAt,
    rows: model.rows,
    dimensions: ["scenario"],
    metadata: {
      inputs: model.inputs,
      note: "Illustrative denominator model only. This is not an epidemiological attribution model and must not be described as a validation of the Frontiers estimate."
    }
  });
  const snapshot = await writeSnapshot(HEAT_SOURCE_ID, "heat-mortality-sensitivity-scale-check", model);
  const path = await writeSeriesArtifact({
    sourceId: HEAT_SOURCE_ID,
    name: "heat-mortality.IN.sensitivity_scale_check",
    artifact: table
  });
  return { artifact: path, snapshot: snapshot.path, rows: model.rows.length };
}

function buildSourceInventory() {
  return [
    ["Frontiers 2026", "modelled excess mortality", "core estimate", "district model; not observed deaths", "https://www.frontiersin.org/journals/environmental-health/articles/10.3389/fenvh.2026.1789071/full"],
    ["CRS", "registered deaths and completeness", "baseline mortality", "annual; not event-level", "https://censusindia.gov.in/nada/index.php/catalog/45564"],
    ["SRS", "death rates and age structure", "baseline mortality", "sample survey; not daily deaths", "https://ruralindiaonline.org/te/library/resource/sample-registration-system-statistical-report-2022/"],
    ["MCCD", "medically certified causes", "cause-of-death gap", "low coverage and hospital skew", "https://www.nature.com/articles/s41598-025-27634-1"],
    ["NCDC/NHRIDS/IHIP", "heatstroke surveillance", "health-system reporting", "facility/reporting dependent; aggregate public data limited", "https://ncdc.mohfw.gov.in/wp-content/uploads/2024/07/FAQ-on-Heat-Related-Illness-Death-Surveillance_2024.pdf"],
    ["NCRB ADSI", "heat/sunstroke accidental deaths", "official administrative count", "narrow cause label", "https://ncrb.gov.in/"],
    ["IMD", "heatwave days and disaster reports", "meteorological event context", "DWE deaths are sourced from media reports, Disaster Management Authority reports, and IMD centre inputs; not an all-cause mortality system", "https://mausam.imd.gov.in/responsive/heatwave_guidance.php"],
    ["OWID/EM-DAT", "reported extreme-temperature disaster deaths", "international comparator", "event/disaster reporting, not full heat burden", "https://ourworldindata.org/grapher/natural-disasters-deaths"],
    ["IMD gridded data", "daily Tmax/Tmin", "India exposure backbone", "access and parsing required", "https://mausam.imd.gov.in/"],
    ["ERA5/ERA5-Land", "temperature, humidity, wind, radiation", "derived heat stress metrics", "reanalysis product", "https://climate.copernicus.eu/climate-reanalysis"],
    ["NASA POWER", "daily/hourly weather API", "accessible exposure cross-check", "model-derived/coarser", "https://power.larc.nasa.gov/docs/services/api/temporal/hourly/"],
    ["World Bank heat hazard", "WBGT return-period hazard", "human-health/labour heat stress", "probabilistic hazard, not daily deaths", "https://datacatalog.worldbank.org/search/dataset/0040194/global-extreme-heat-hazard"],
    ["CEEW district heat risk", "734-district heat risk index using hazard, exposure, and vulnerability indicators", "district risk and vulnerability context", "composite risk index; not a mortality count or causal death estimate", "https://www.ceew.in/publications/mapping-climate-risks-and-impacts-of-extreme-heatwave-disaster-in-indian-districts"],
    ["UNDP HCH", "future heat, mortality, labour, energy projections", "future risk context", "projection, not observed death count", "https://hdr.undp.org/data-center/human-climate-horizons-data-and-insights-platform"],
    ["Lancet Countdown", "heatwave days, heat stress, labour, mortality indicators", "peer-reviewed climate-health indicators", "some modelled indicators", "https://lancetcountdown.org/explore-our-data/"],
    ["Census 2011", "district population, age, workers", "subnational vulnerability", "old but official", "https://censusindia.gov.in/census.website/en/data/population-finder"],
    ["WorldPop", "gridded population and age-sex", "raster exposure overlay", "modelled population surface", "https://hub.worldpop.org/geodata/summary?id=104815"],
    ["NFHS/DHS", "electricity, fan/AC/cooler, health vulnerability", "cooling and household risk", "survey weights and timing", "https://api.dhsprogram.com/"],
    ["PLFS", "sector/outdoor/informal work", "occupational exposure", "survey weights and classifications", "https://github.com/nso-india/esankhyiki-mcp"],
    ["NSS78", "living conditions, water, migration", "household vulnerability", "survey analysis required", "https://github.com/nso-india/esankhyiki-mcp"],
    ["HCES", "consumption/poverty proxy", "adaptive capacity", "survey analysis required", "https://github.com/nso-india/esankhyiki-mcp"],
    ["TUS", "time allocation and unpaid work", "gendered exposure", "harder to connect directly to deaths", "https://github.com/nso-india/esankhyiki-mcp"],
    ["CREA PM2.5", "daily gridded PM2.5", "pollution modifier", "interaction with heat needs careful modelling", "https://southasia-pm2-5.energyandcleanair.org/"],
    ["India Energy Atlas", "daily power supply position", "cooling reliability context", "may not capture local outages", "https://www.energymap.in/psp-daily"],
    ["MODIS/Yale SUHI", "land surface and urban heat islands", "intra-urban heat inequality", "LST is not air temperature", "https://data.nasa.gov/dataset/yale-center-for-earth-observation-yceo-surface-urban-heat-islands-version-4-2003-2018"],
    ["CPR HAP assessment", "heat action plan quality", "policy preparedness", "plans may have changed", "https://cprindia.org/briefsreports/how-is-india-adapting-to-heatwaves-an-assessment-of-heat-action-plans-with-insights-for-transformative-climate-action/"]
  ].map(([source, dataType, articleRole, caveat, sourceUrl]) => ({
    source,
    dataType,
    articleRole,
    caveat,
    sourceUrl
  }));
}

async function ingestSourceInventory() {
  const rows = buildSourceInventory();
  const table = createTableArtifact({
    indicatorId: "heat.source_inventory",
    title: "Source inventory for India heat mortality article",
    sourceId: HEAT_SOURCE_ID,
    sourceIndicatorId: "curated source inventory",
    sourceUrl: "docs/HEAT_MORTALITY_RESEARCH_DOSSIER.md",
    unit: "not applicable",
    fetchedAt,
    rows,
    dimensions: ["source", "articleRole"],
    metadata: {
      note: "Editorial source map. This table describes evidence roles and caveats."
    }
  });
  const snapshot = await writeSnapshot(HEAT_SOURCE_ID, "source-inventory", rows);
  const path = await writeSeriesArtifact({
    sourceId: HEAT_SOURCE_ID,
    name: "heat-mortality.source_inventory",
    artifact: table
  });
  return { artifact: path, snapshot: snapshot.path, rows: rows.length };
}

async function snapshotKeyPdfs() {
  const pdfs = [
    {
      name: "ncdc-heat-related-illness-faq-2024.pdf",
      url: "https://ncdc.mohfw.gov.in/wp-content/uploads/2024/07/FAQ-on-Heat-Related-Illness-Death-Surveillance_2024.pdf"
    },
    {
      name: "ncdc-national-action-plan-heat-related-illnesses.pdf",
      url: "https://ncdc.mohfw.gov.in/wp-content/uploads/2024/05/1.Nation-Action-plan-on-Heat-Related-llnesses.pdf"
    },
    {
      name: "lancet-countdown-india-2025-data-sheet.pdf",
      url: "https://lancetcountdown.org/wp-content/uploads/2025/10/India_Lancet-Countdown_2025_Data-Sheet-2.pdf"
    },
    {
      name: "imd-disastrous-weather-events-2024.pdf",
      url: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf"
    }
  ];

  const results = [];
  for (const pdf of pdfs) {
    try {
      const bytes = await fetchBytes(pdf.url);
      const snapshot = await writeRawSnapshot(HEAT_SOURCE_ID, pdf.name, bytes, "pdf");
      results.push({ ...pdf, status: "ready", snapshot: snapshot.path, rawHash: snapshot.hash, bytes: bytes.length });
    } catch (error) {
      results.push({ ...pdf, status: "failed", error: error.message });
    }
  }
  return results;
}

const results = {};
const failures = [];

for (const [name, task] of Object.entries({
  owidDisasterDeaths: ingestOwidDisasterDeaths,
  humanClimateHorizons: ingestHumanClimateHorizons,
  worldBankContext: ingestWorldBankContext,
  administrativeAnchors: ingestAdministrativeAnchors,
  heatDeathCountComparison: ingestHeatDeathCountComparison,
  sensitivityModel: ingestSensitivityModel,
  sourceInventory: ingestSourceInventory,
  keyPdfs: snapshotKeyPdfs
})) {
  try {
    results[name] = await task();
    console.log(`${name}: ready`);
  } catch (error) {
    failures.push({ name, error: error.message });
    console.warn(`${name}: failed: ${error.message}`);
  }
}

const runSummary = {
  fetchedAt,
  results,
  failures
};

const summarySnapshot = await writeSnapshot(HEAT_SOURCE_ID, "ingest-run-summary", runSummary);
console.log(`heat evidence summary: ${summarySnapshot.path}`);
if (failures.length) {
  process.exitCode = 1;
}
