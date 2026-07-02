import { fetchClimateTraceCountryEmissions } from "./adapters/climatetrace.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, mergeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const startYear = 2015;
const endYear = 2024;
const sourceUrl = "https://climatetrace.org/";

// Climate TRACE's country/emissions endpoint returns one blended figure when queried with
// sectors=agriculture etc; querying subsectors= one-at-a-time (definitions/subsectors) exposes
// the breakdown within each sector. We only pull the subsectors needed to check specific claims
// in the methane article (landfills vs sewage, cattle vs rice, coal vs oil-and-gas) rather than
// the full subsector taxonomy.
const groups = [
  {
    id: "waste",
    name: "climatetrace.IN.emissions.waste_subsectors.annual",
    title: "India waste-sector methane by subsector",
    subsectors: [
      "domestic_wastewater_treatment_and_discharge",
      "industrial_wastewater_treatment_and_discharge",
      "solid_waste_disposal",
      "biological_treatment_of_solid_waste_and_biogenic",
      "incineration_and_open_burning_of_waste"
    ]
  },
  {
    id: "agriculture",
    name: "climatetrace.IN.emissions.agriculture_subsectors.annual",
    title: "India agriculture-sector methane by subsector",
    subsectors: [
      "enteric_fermentation_cattle_operation",
      "enteric_fermentation_cattle_pasture",
      "enteric_fermentation_other",
      "rice_cultivation"
    ]
  },
  {
    id: "fossil_fuel_operations",
    name: "climatetrace.IN.emissions.fossil_fuel_operations_subsectors.annual",
    title: "India fossil-fuel-operations methane by subsector",
    subsectors: ["coal_mining", "oil_and_gas_production", "oil_and_gas_transport", "oil_and_gas_refining"]
  }
];

const manifest = [];
const failures = [];

for (const group of groups) {
  try {
    const rawByYear = {};
    const rows = [];
    for (let year = startYear; year <= endYear; year += 1) {
      const yearValues = { date: String(year) };
      for (const subsector of group.subsectors) {
        const apiSubsector = subsector.replace(/_/g, "-");
        const raw = await fetchClimateTraceCountryEmissions({
          country: "IND",
          since: String(year),
          to: String(year),
          subsectors: apiSubsector
        });
        rawByYear[`${year}.${subsector}`] = raw;
        const entry = Array.isArray(raw) ? raw[0] : raw;
        yearValues[`${subsector}_ch4_t`] = entry?.emissions?.ch4 ?? 0;
      }
      rows.push(yearValues);
    }

    const snapshot = await writeSnapshot("climatetrace", `country-emissions.${group.id}-subsectors.IND`, rawByYear);
    const artifact = createTableArtifact({
      indicatorId: `climate.climatetrace.emissions_by_subsector.${group.id}`,
      title: group.title,
      sourceId: "climatetrace",
      sourceIndicatorId: `country/emissions/subsectors/${group.id}`,
      sourceUrl,
      unit: "tonnes",
      fetchedAt,
      rows,
      dimensions: Object.keys(rows[0] || {}),
      metadata: {
        subsectors: group.subsectors,
        since: startYear,
        to: endYear,
        method: "Each subsector queried individually via country/emissions?subsectors=<subsector> (the API returns a single blended figure if multiple subsectors are passed at once)."
      }
    });
    const artifactPath = await writeSeriesArtifact({ sourceId: "climatetrace", name: group.name, artifact });
    manifest.push({
      status: "ready",
      indicatorId: artifact.indicatorId,
      sourceIndicatorId: `country/emissions/subsectors/${group.id}`,
      artifact: artifactPath,
      snapshot: snapshot.path,
      rawHash: snapshot.hash,
      rows: rows.length,
      fetchedAt
    });
    console.log(`climatetrace subsectors ${group.id}: ${rows.length} rows`);
  } catch (error) {
    failures.push({
      status: "failed",
      indicatorId: `climate.climatetrace.emissions_by_subsector.${group.id}`,
      sourceIndicatorId: `country/emissions/subsectors/${group.id}`,
      fetchedAt,
      error: error.message
    });
    console.warn(`climatetrace subsectors ${group.id} failed: ${error.message}`);
  }
}

await mergeSourceManifest("climatetrace-subsectors", [...manifest, ...failures]);
console.log(`Wrote ${manifest.length} Climate TRACE subsector artifacts; ${failures.length} failure(s).`);
