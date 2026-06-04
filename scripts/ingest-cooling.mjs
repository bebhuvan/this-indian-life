// Ingest India household cooling-appliance ownership (NSS 78, 2020-21, MoSPI).
// Emits: single-value series artifacts for the AC/cooler ownership bars, and a
// state choropleth of air-cooler ownership that reuses the ERA5 state-warming
// SVG paths so it lines up with the warming map in the heat-mortality article.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "data/manual/cooling-nss78.json";
const NFHS_SRC = "data/manual/cooling-nfhs.json";
const STATE_PATHS = "data/series/era5.IN.state_warming.json";
const OUT_DIR = "data/series";
const fetchedAt = new Date().toISOString();

const data = JSON.parse(readFileSync(SRC, "utf8"));
const nfhs = JSON.parse(readFileSync(NFHS_SRC, "utf8"));
const baseMeta = {
  schemaVersion: 1,
  sourceId: "mospi",
  sourceIndicatorId: data.sourceTable,
  sourceUrl: data.sourceUrl,
  geography: { type: "country", id: "IND", name: "India" },
  fetchedAt,
  metadata: { survey: data.source, year: data.year, note: data.note }
};

function writeSeries(slug, indicatorId, title, value) {
  const artifact = {
    ...baseMeta,
    artifactType: "series",
    indicatorId,
    title,
    unit: "percent of households",
    frequency: "one-off survey",
    dimensions: [],
    observations: [{ date: "2021", value }]
  };
  const file = `${OUT_DIR}/cooling.IN.${slug}.json`;
  writeFileSync(file, `${JSON.stringify(artifact, null, 2)}\n`);
  return file;
}

const written = [];
const n = data.national;
written.push(writeSeries("ac_all", "heat.cooling.ac_all", "Households with an air conditioner, all India", n.all.ac));
written.push(writeSeries("ac_rural", "heat.cooling.ac_rural", "Households with an air conditioner, rural", n.rural.ac));
written.push(writeSeries("ac_urban", "heat.cooling.ac_urban", "Households with an air conditioner, urban", n.urban.ac));
written.push(writeSeries("cooler_all", "heat.cooling.cooler_all", "Households with an air cooler, all India", n.all.cooler));
written.push(writeSeries("cooler_rural", "heat.cooling.cooler_rural", "Households with an air cooler, rural", n.rural.cooler));
written.push(writeSeries("cooler_urban", "heat.cooling.cooler_urban", "Households with an air cooler, urban", n.urban.cooler));

function writeNfhsSeries(slug, indicatorId, title, value, year, sourceUrl, sourceIndicatorId) {
  const artifact = {
    schemaVersion: 1,
    sourceId: "nfhs",
    sourceIndicatorId,
    sourceUrl,
    geography: { type: "country", id: "IND", name: "India" },
    fetchedAt,
    metadata: { survey: nfhs.source, note: nfhs.note },
    artifactType: "series",
    indicatorId,
    title,
    unit: "percent",
    frequency: "survey",
    dimensions: [],
    observations: [{ date: year, value }]
  };
  const file = `${OUT_DIR}/cooling-nfhs.IN.${slug}.json`;
  writeFileSync(file, `${JSON.stringify(artifact, null, 2)}\n`);
  written.push(file);
}

writeNfhsSeries(
  "electricity_all",
  "heat.cooling.nfhs6_electricity_all",
  "Population living in households with electricity, all India",
  nfhs.nfhs6.populationLivingInHouseholdsWithElectricity.all,
  "2024",
  nfhs.nfhs6.sourceUrl,
  nfhs.nfhs6.sourceTable
);
writeNfhsSeries(
  "electricity_urban",
  "heat.cooling.nfhs6_electricity_urban",
  "Population living in households with electricity, urban",
  nfhs.nfhs6.populationLivingInHouseholdsWithElectricity.urban,
  "2024",
  nfhs.nfhs6.sourceUrl,
  nfhs.nfhs6.sourceTable
);
writeNfhsSeries(
  "electricity_rural",
  "heat.cooling.nfhs6_electricity_rural",
  "Population living in households with electricity, rural",
  nfhs.nfhs6.populationLivingInHouseholdsWithElectricity.rural,
  "2024",
  nfhs.nfhs6.sourceUrl,
  nfhs.nfhs6.sourceTable
);
writeNfhsSeries(
  "fan_all",
  "heat.cooling.nfhs5_fan_all",
  "Households with an electric fan, all India",
  nfhs.nfhs5.households.electricFan,
  "2021",
  nfhs.nfhs5.sourceUrl,
  nfhs.nfhs5.sourceTable
);
writeNfhsSeries(
  "ac_cooler_all",
  "heat.cooling.nfhs5_ac_cooler_all",
  "Households with air conditioner or cooler, all India",
  nfhs.nfhs5.households.airConditionerOrCooler,
  "2021",
  nfhs.nfhs5.sourceUrl,
  nfhs.nfhs5.sourceTable
);
writeNfhsSeries(
  "ac_cooler_urban",
  "heat.cooling.nfhs5_ac_cooler_urban",
  "Households with air conditioner or cooler, urban",
  nfhs.nfhs5.households.airConditionerOrCoolerUrban,
  "2021",
  nfhs.nfhs5.sourceUrl,
  nfhs.nfhs5.sourceTable
);
writeNfhsSeries(
  "ac_cooler_rural",
  "heat.cooling.nfhs5_ac_cooler_rural",
  "Households with air conditioner or cooler, rural",
  nfhs.nfhs5.households.airConditionerOrCoolerRural,
  "2021",
  nfhs.nfhs5.sourceUrl,
  nfhs.nfhs5.sourceTable
);

// Choropleth: air-cooler ownership by state, joined onto the warming-map paths.
const stateArtifact = JSON.parse(readFileSync(STATE_PATHS, "utf8"));
const coolerByName = new Map(data.byState.map((row) => [row.state, row.cooler]));
// Draw EVERY state in the base map (all 34), so the silhouette is complete; states
// with no NSS survey value get value:null and render as neutral "no data" grey.
const regions = stateArtifact.regions.map((r) => {
  const v = coolerByName.get(r.name);
  return { name: r.name, value: (v === undefined || v === null) ? null : v, path: r.path };
});
const noData = regions.filter((r) => r.value === null).map((r) => r.name);
const values = regions.map((r) => r.value).filter((v) => v !== null);
const choropleth = {
  ...baseMeta,
  artifactType: "choropleth",
  indicatorId: "heat.cooling.cooler_by_state",
  title: "Air-cooler ownership by state",
  unit: "percent of households",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  viewBox: stateArtifact.viewBox,
  min: 0,
  max: Math.max(...values),
  regions
};
const choroFile = `${OUT_DIR}/cooling.IN.cooler_by_state.json`;
writeFileSync(choroFile, `${JSON.stringify(choropleth, null, 2)}\n`);
written.push(choroFile);

console.log(`wrote ${written.length} cooling artifacts:`);
for (const f of written) console.log("  " + f);
console.log(`choropleth regions: ${regions.length} total, ${values.length} with data (max cooler ${Math.max(...values)}%)`);
if (noData.length) console.log(`no-data states (drawn grey): ${noData.join(", ")}`);
