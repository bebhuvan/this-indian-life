import { readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createTableArtifact, writeRawSnapshot, writeSeriesArtifact, writeSnapshot } from "./core/artifacts.mjs";

const execFileAsync = promisify(execFile);
const fetchedAt = new Date().toISOString();
const SOURCE_ID = "heat-mortality";
const SNAPSHOT_DIR = "data/snapshots/heat-mortality";

async function findSnapshot(prefix, extension = ".pdf") {
  const files = await readdir(SNAPSHOT_DIR);
  const matches = files.filter((file) => file.startsWith(prefix) && file.endsWith(extension)).sort();
  if (!matches.length) throw new Error(`No snapshot found for ${prefix}`);
  return `${SNAPSHOT_DIR}/${matches.at(-1)}`;
}

async function pdfToText(path) {
  const result = await execFileAsync("pdftotext", ["-layout", path, "-"], {
    maxBuffer: 50 * 1024 * 1024
  });
  return result.stdout;
}

function numberFrom(text) {
  if (!text) return null;
  const normalized = String(text).replaceAll(",", "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchNumber(text, regex) {
  const match = text.match(regex);
  return match ? numberFrom(match[1]) : null;
}

function buildLancetRows(text) {
  const normalizedText = text.replace(/\s+/g, " ");
  const rows = [
    {
      indicatorId: "heatwave_days_per_person_2024",
      label: "Heatwave days per person",
      value: matchNumber(text, /exposed to\s+([\d.]+)\s+heatwave days each/i),
      unit: "days per person",
      year: 2024,
      interpretation: "Exposure indicator, not a mortality count"
    },
    {
      indicatorId: "climate_change_attributed_heatwave_days_2024",
      label: "Heatwave exposure days not expected without climate change",
      value: matchNumber(text, /Of these,\s+([\d.]+)\s+days of exposure/i),
      unit: "days per person",
      year: 2024,
      interpretation: "Attribution/exposure indicator, not a mortality count"
    },
    {
      indicatorId: "moderate_heat_stress_extra_hours_2024",
      label: "Extra hours of moderate-or-higher heat stress exposure versus 1990-1999",
      value: matchNumber(normalizedText, /([\d,]+)\s+more hours during which ambient heat/i),
      unit: "hours per person",
      year: 2024,
      interpretation: "Exposure indicator for moderate outdoor physical activity"
    },
    {
      indicatorId: "potential_labour_hours_lost_2024",
      label: "Potential labour hours lost due to heat exposure",
      value: matchNumber(text, /loss of\s+([\d,]+)\s+billion potential labour/i),
      unit: "billion potential labour hours",
      year: 2024,
      interpretation: "Labour-capacity impact, not a mortality count"
    },
    {
      indicatorId: "potential_labour_hours_lost_per_person_2024",
      label: "Potential labour hours lost per person",
      value: matchNumber(text, /record high\s+([\d,]+)h per person/i),
      unit: "hours per person",
      year: 2024,
      interpretation: "Labour-capacity impact, not a mortality count"
    },
    {
      indicatorId: "labour_loss_change_since_1990s_2024",
      label: "Potential labour hours lost versus 1990-1999",
      value: matchNumber(normalizedText, /([\d,]+)% more than in.*?1990-1999/i),
      unit: "percent increase",
      year: 2024,
      interpretation: "Change relative to 1990-1999"
    },
    {
      indicatorId: "agriculture_share_labour_losses_2024",
      label: "Agriculture share of heat-related labour-hour losses",
      value: matchNumber(text, /agriculture sector accounted for\s+([\d,]+)%/i),
      unit: "percent",
      year: 2024,
      interpretation: "Sector share of labour losses"
    },
    {
      indicatorId: "construction_share_labour_losses_2024",
      label: "Construction share of heat-related labour-hour losses",
      value: matchNumber(text, /construction sector accounted for\s+([\d,]+)%/i),
      unit: "percent",
      year: 2024,
      interpretation: "Sector share of labour losses"
    },
    {
      indicatorId: "potential_income_lost_heat_2024",
      label: "Potential income lost from heat-related labour capacity reduction",
      value: matchNumber(text, /extreme heat was US\$([\d.]+)\s+billion/i),
      unit: "billion current US dollars",
      year: 2024,
      interpretation: "Economic impact, not a mortality count"
    },
    {
      indicatorId: "anthropogenic_pm25_deaths_2022",
      label: "Deaths attributable to anthropogenic PM2.5 air pollution",
      value: matchNumber(text, /over\s+([\d,]+)\s+deaths attributable to anthropogenic air pollution/i),
      unit: "deaths",
      year: 2022,
      interpretation: "Air-pollution mortality context; separate from heat mortality"
    },
    {
      indicatorId: "fossil_fuel_pm25_deaths_2022",
      label: "Deaths attributable to fossil-fuel PM2.5",
      value: matchNumber(text, /contributed to\s+([\d,]+)\s+\(44%\) of these deaths/i),
      unit: "deaths",
      year: 2022,
      interpretation: "Air-pollution mortality context; separate from heat mortality"
    },
    {
      indicatorId: "coal_pm25_deaths_2022",
      label: "Deaths attributable to coal-related PM2.5",
      value: matchNumber(text, /coal\s+accounted for\s+([\d,]+)\s+deaths/i),
      unit: "deaths",
      year: 2022,
      interpretation: "Air-pollution mortality context; separate from heat mortality"
    },
    {
      indicatorId: "coal_power_plants_pm25_deaths_2022",
      label: "Deaths attributable to coal PM2.5 from power plants",
      value: matchNumber(normalizedText, /power plants\s+\(([\d,]+)\s+deaths\)/i),
      unit: "deaths",
      year: 2022,
      interpretation: "Air-pollution mortality context; separate from heat mortality"
    },
    {
      indicatorId: "petrol_transport_pm25_deaths_2022",
      label: "Deaths attributable to petrol for road transportation",
      value: matchNumber(text, /petrol for road\s+transportation contributed to\s+([\d,]+)\s+deaths/i),
      unit: "deaths",
      year: 2022,
      interpretation: "Air-pollution mortality context; separate from heat mortality"
    },
    {
      indicatorId: "outdoor_air_pollution_mortality_value_2022",
      label: "Monetised value of premature mortality due to outdoor air pollution",
      value: matchNumber(text, /amounted to US\$\s*([\d.]+)\s+billion/i),
      unit: "billion current US dollars",
      year: 2022,
      interpretation: "Economic valuation context; separate from heat mortality"
    },
    {
      indicatorId: "outdoor_air_pollution_mortality_value_gdp_share_2022",
      label: "Outdoor air pollution mortality value as share of GDP",
      value: matchNumber(normalizedText, /equivalent of\s+([\d.]+)% of gross domestic product/i),
      unit: "percent of GDP",
      year: 2022,
      interpretation: "Economic valuation context; separate from heat mortality"
    },
    {
      indicatorId: "household_air_pollution_mortality_rate_2022",
      label: "Household air pollution mortality rate",
      value: matchNumber(text, /associated with\s+([\d,]+)\s+deaths per\s+100,000/i),
      unit: "deaths per 100,000",
      year: 2022,
      interpretation: "Air-pollution vulnerability context"
    },
    {
      indicatorId: "household_air_pollution_mortality_rate_rural_2022",
      label: "Household air pollution mortality rate, rural",
      value: matchNumber(normalizedText, /\(([\d,]+)\s+per\s+100,000 in rural/i),
      unit: "deaths per 100,000",
      year: 2022,
      interpretation: "Air-pollution vulnerability context"
    },
    {
      indicatorId: "household_air_pollution_mortality_rate_urban_2022",
      label: "Household air pollution mortality rate, urban",
      value: matchNumber(normalizedText, /and\s+([\d,]+)\s+per\s+100,000 in urban/i),
      unit: "deaths per 100,000",
      year: 2022,
      interpretation: "Air-pollution vulnerability context"
    },
    {
      indicatorId: "dengue_r0_aedes_albopictus_1951_1960",
      label: "Average dengue R0 by Aedes albopictus, 1951-1960",
      value: matchNumber(normalizedText, /increased from\s+([\d.]+)\s+to\s+[\d.]+\s+in\s+2015-2024/i),
      unit: "R0",
      year: 1960,
      interpretation: "Climate-sensitive disease context, not heat mortality"
    },
    {
      indicatorId: "dengue_r0_aedes_albopictus_2015_2024",
      label: "Average dengue R0 by Aedes albopictus, 2015-2024",
      value: matchNumber(normalizedText, /increased from\s+[\d.]+\s+to\s+([\d.]+)\s+in\s+2015-2024/i),
      unit: "R0",
      year: 2024,
      interpretation: "Climate-sensitive disease context, not heat mortality"
    },
    {
      indicatorId: "vibrio_suitability_change_2024",
      label: "Coastal area environmentally suitable for Vibrio transmission versus 1982-2010",
      value: matchNumber(normalizedText, /Vibrio transmission was\s+([\d.]+)% greater in 2024/i),
      unit: "percent increase",
      year: 2024,
      interpretation: "Climate-sensitive disease context, not heat mortality"
    },
    {
      indicatorId: "sea_level_population_under_1m_2024",
      label: "People living less than 1 m above sea level",
      value: matchNumber(text, /In 2024, over\s+([\d,]+)\s+million people were living less than 1 m/i),
      unit: "million people",
      year: 2024,
      interpretation: "Climate-risk context, not heat mortality"
    },
    {
      indicatorId: "tree_cover_loss_2001_2023",
      label: "Cumulative tree cover loss",
      value: matchNumber(text, /lost a cumulative total of\s+([\d.]+)\s+million hectares/i),
      unit: "million hectares",
      year: 2023,
      interpretation: "Cooling/adaptation context"
    },
    {
      indicatorId: "urban_greenness_decline_2015_2024",
      label: "Average urban greenness decline",
      value: matchNumber(text, /average urban greenness in India has decreased\s+([\d.]+)%/i),
      unit: "percent decline",
      year: 2024,
      interpretation: "Urban cooling/adaptation context"
    }
  ];

  return rows.filter((row) => row.value !== null);
}

function extractBlock(text, startPattern, endPattern) {
  const start = text.search(startPattern);
  if (start < 0) return "";
  const rest = text.slice(start);
  const end = rest.search(endPattern);
  return end >= 0 ? rest.slice(0, end) : rest;
}

function buildImdStateRows(text) {
  const block = extractBlock(
    text,
    /Table 22:\s+Human and Livestock Loss due to Heat Wave during/i,
    /Table 23:\s+Human and Livestock Loss due to Lightning/i
  );
  const stateRows = [];
  const rowRegex = /^\s*([A-Za-z][A-Za-z ]*?[A-Za-z])\s+(\d+)\s+\*/gm;
  for (const match of block.matchAll(rowRegex)) {
    const state = match[1].trim().replace(/\s+/g, " ");
    if (state.toLowerCase() === "total") continue;
    stateRows.push({
      stateOrUt: state,
      humanDeaths: Number(match[2]),
      sourceTable: "IMD DWE 2024 Table 22",
      interpretation: "Reported human deaths due to heat wave; administrative meteorological disaster count"
    });
  }
  return stateRows.sort((a, b) => b.humanDeaths - a.humanDeaths || a.stateOrUt.localeCompare(b.stateOrUt));
}

function buildImdMonthlyRows(text) {
  const block = extractBlock(
    text,
    /Table 7:\s+Month wise Deaths due to Disastrous Weather Events 2024/i,
    /Table 8:\s+Month Wise and State Wise Deaths/i
  );
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER"
  ];
  const rows = [];
  for (const month of months) {
    const regex = new RegExp(`^${month}\\s+(\\S+)\\s+(\\S+)\\s+(\\S+)`, "m");
    const match = block.match(regex);
    if (!match) continue;
    rows.push({
      month,
      humanDeaths: match[3] === "*" ? 0 : Number(match[3]),
      sourceTable: "IMD DWE 2024 Table 7",
      interpretation: "Reported monthly human deaths due to heat wave; administrative meteorological disaster count"
    });
  }
  return rows;
}

function buildImdSummaryRows(text) {
  return [
    {
      indicatorId: "imd_dwe_2024_heatwave_deaths_total",
      label: "Heat wave deaths",
      value: matchNumber(text, /Heat Wave\s+([\d,]+)\s+Pre Monsoon\s+and Monsoon/i) ?? matchNumber(text, /Heat wave.*?claimed about\s+([\d,]+)\s+lives/is),
      unit: "reported deaths",
      year: 2024,
      interpretation: "IMD meteorological disaster-event count; not all heat-attributable excess mortality"
    },
    {
      indicatorId: "imd_dwe_2024_total_disastrous_weather_deaths",
      label: "Total deaths due to disastrous weather events",
      value: matchNumber(text, /During the year 2024,\s+total\s+([\d,]+)\s+persons reportedly claimed dead/i),
      unit: "reported deaths",
      year: 2024,
      interpretation: "IMD all-event reported death total"
    },
    {
      indicatorId: "imd_dwe_2024_heatwave_deaths_may_30",
      label: "Heat wave deaths on 30 May",
      value: matchNumber(text, /on a single day 30th May,\s+([\d,]+)\s+persons reportedly claimed dead because of Heat Wave/i),
      unit: "reported deaths",
      year: 2024,
      interpretation: "Single-day reported heatwave deaths in IMD narrative"
    },
    {
      indicatorId: "imd_dwe_2024_heatwave_deaths_june_1",
      label: "Heat wave deaths on 1 June",
      value: matchNumber(text, /on a single day,\s+on 1st June,\s+([\d,]+)\s+deaths were reported because of Heat Wave/i),
      unit: "reported deaths",
      year: 2024,
      interpretation: "Single-day reported heatwave deaths in IMD narrative"
    },
    {
      indicatorId: "imd_dwe_2024_heatwave_deaths_june_16",
      label: "Heat wave deaths on 16 June",
      value: matchNumber(text, /([\d,]+)\s+deaths on 16th June/i),
      unit: "reported deaths",
      year: 2024,
      interpretation: "Single-day reported heatwave deaths in IMD narrative"
    }
  ].filter((row) => row.value !== null);
}

async function writeExtractedText(name, text) {
  return writeRawSnapshot(SOURCE_ID, name, text, "txt");
}

async function main() {
  const lancetPdf = await findSnapshot("lancet-countdown-india-2025-data-sheet.pdf");
  const imdPdf = await findSnapshot("imd-disastrous-weather-events-2024.pdf");

  const [lancetText, imdText] = await Promise.all([
    pdfToText(lancetPdf),
    pdfToText(imdPdf)
  ]);

  const [lancetTextSnapshot, imdTextSnapshot] = await Promise.all([
    writeExtractedText("lancet-countdown-india-2025-data-sheet.extracted", lancetText),
    writeExtractedText("imd-disastrous-weather-events-2024.extracted", imdText)
  ]);

  const lancetRows = buildLancetRows(lancetText);
  const imdStateRows = buildImdStateRows(imdText);
  const imdMonthlyRows = buildImdMonthlyRows(imdText);
  const imdSummaryRows = buildImdSummaryRows(imdText);

  const artifacts = [];

  artifacts.push(await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "heat-mortality.IN.lancet_countdown_2025_extracted_indicators",
    artifact: createTableArtifact({
      indicatorId: "heat.lancet_countdown_2025.extracted_indicators",
      title: "Extracted India indicators from Lancet Countdown 2025 data sheet",
      sourceId: "lancet-countdown",
      sourceIndicatorId: "India 2025 data sheet",
      sourceUrl: "https://lancetcountdown.org/wp-content/uploads/2025/10/India_Lancet-Countdown_2025_Data-Sheet-2.pdf",
      unit: "mixed; see row",
      fetchedAt,
      rows: lancetRows,
      dimensions: ["indicatorId", "year"],
      metadata: {
        sourcePdfSnapshot: lancetPdf,
        extractedTextSnapshot: lancetTextSnapshot.path,
        note: "Extracted from text layer. These are climate-health context indicators, not direct heat-mortality counts unless labelled otherwise."
      }
    })
  }));

  artifacts.push(await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_state",
    artifact: createTableArtifact({
      indicatorId: "heat.imd_dwe_2024.heatwave_deaths_by_state",
      title: "IMD DWE 2024 heatwave deaths by state/UT",
      sourceId: "imd",
      sourceIndicatorId: "DWE 2024 Table 22",
      sourceUrl: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf",
      unit: "reported deaths",
      fetchedAt,
      rows: imdStateRows,
      dimensions: ["stateOrUt"],
      metadata: {
        sourcePdfSnapshot: imdPdf,
        extractedTextSnapshot: imdTextSnapshot.path,
        note: "Reported deaths due to heat wave in IMD disaster reporting. This is not all-cause excess mortality."
      }
    })
  }));

  artifacts.push(await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "heat-mortality.IN.imd_dwe_2024_heatwave_deaths_by_month",
    artifact: createTableArtifact({
      indicatorId: "heat.imd_dwe_2024.heatwave_deaths_by_month",
      title: "IMD DWE 2024 heatwave deaths by month",
      sourceId: "imd",
      sourceIndicatorId: "DWE 2024 Table 7",
      sourceUrl: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf",
      unit: "reported deaths",
      fetchedAt,
      rows: imdMonthlyRows,
      dimensions: ["month"],
      metadata: {
        sourcePdfSnapshot: imdPdf,
        extractedTextSnapshot: imdTextSnapshot.path,
        note: "Reported monthly deaths due to heat wave in IMD disaster reporting. This is not all-cause excess mortality."
      }
    })
  }));

  artifacts.push(await writeSeriesArtifact({
    sourceId: SOURCE_ID,
    name: "heat-mortality.IN.imd_dwe_2024_heatwave_summary",
    artifact: createTableArtifact({
      indicatorId: "heat.imd_dwe_2024.heatwave_summary",
      title: "IMD DWE 2024 extracted heatwave summary values",
      sourceId: "imd",
      sourceIndicatorId: "DWE 2024 narrative and event table",
      sourceUrl: "https://www.imdpune.gov.in/library/public/DWE_2024.pdf",
      unit: "mixed; see row",
      fetchedAt,
      rows: imdSummaryRows,
      dimensions: ["indicatorId", "year"],
      metadata: {
        sourcePdfSnapshot: imdPdf,
        extractedTextSnapshot: imdTextSnapshot.path,
        note: "Narrative/table summary values from IMD DWE 2024. These are reported disaster deaths, not excess mortality."
      }
    })
  }));

  const summary = {
    fetchedAt,
    lancetPdf,
    imdPdf,
    extractedTextSnapshots: {
      lancet: lancetTextSnapshot.path,
      imd: imdTextSnapshot.path
    },
    artifacts,
    counts: {
      lancetRows: lancetRows.length,
      imdStateRows: imdStateRows.length,
      imdMonthlyRows: imdMonthlyRows.length,
      imdSummaryRows: imdSummaryRows.length,
      imdStateDeathTotal: imdStateRows.reduce((sum, row) => sum + row.humanDeaths, 0),
      imdMonthlyDeathTotal: imdMonthlyRows.reduce((sum, row) => sum + row.humanDeaths, 0)
    }
  };

  const summarySnapshot = await writeSnapshot(SOURCE_ID, "pdf-extraction-summary", summary);
  console.log(JSON.stringify({ ...summary.counts, summarySnapshot: summarySnapshot.path }, null, 2));
}

await main();
