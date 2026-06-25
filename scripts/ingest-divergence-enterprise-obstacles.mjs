// World Bank Enterprise Surveys — what India's own firms name as their single
// biggest obstacle. Served by the WB API under source 13 (so &source=13). The
// data is sparse and survey-bound: India's only survey in this aggregation is
// 2014, so this is ONE dated snapshot, not a time series — used as a single
// "from the businesses' mouths" ranking with an explicit vintage caveat, never
// as a trend. Written as a ranked table artifact (rows: label/value/group) for
// the tableBars chart, matching e.g. people.nfhs.tfr_state_ranked.
import { fetchJson } from "./lib/source-http.mjs";
import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const OBSTACLES = [
  { n: 1, label: "Access to finance" },
  { n: 2, label: "Access to land" },
  { n: 3, label: "Business licensing & permits" },
  { n: 4, label: "Corruption" },
  { n: 5, label: "Courts" },
  { n: 6, label: "Crime, theft & disorder" },
  { n: 7, label: "Customs & trade regulations" },
  { n: 8, label: "Electricity" },
  { n: 9, label: "Inadequately educated workforce" },
  { n: 10, label: "Labour regulations" },
  { n: 11, label: "Political instability" },
  { n: 12, label: "Informal-sector competition" },
  { n: 13, label: "Tax administration" },
  { n: 14, label: "Tax rates" },
  { n: 15, label: "Transportation" }
];

const collected = [];
let surveyYear = null;
for (const o of OBSTACLES) {
  const code = `IC.FRM.OBS.OBST${o.n}`;
  const url = `https://api.worldbank.org/v2/country/IN/indicator/${code}?format=json&per_page=200&source=13`;
  try {
    const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
    const rows = (Array.isArray(raw?.[1]) ? raw[1] : []).filter((r) => r.value != null);
    if (!rows.length) continue;
    const latest = rows.sort((a, b) => String(a.date).localeCompare(String(b.date))).at(-1);
    surveyYear = surveyYear || latest.date;
    collected.push({ label: o.label, value: Math.round(Number(latest.value) * 10) / 10, year: latest.date });
  } catch (error) {
    console.warn(`ES OBST${o.n} (${o.label}) failed: ${error.message}`);
  }
}

collected.sort((a, b) => b.value - a.value);
await writeSnapshot("worldbank", `enterprise-obstacles.IN`, collected);

// group the top 5 as the headline obstacles for visual emphasis.
const rows = collected.map((r, i) => ({ label: r.label, value: r.value, group: i < 5 ? "Top five" : "Rest" }));

const indicatorId = "divergence.es_obstacles.in";
const artifact = createTableArtifact({
  indicatorId,
  title: "What India's firms call their biggest obstacle",
  sourceId: "worldbank",
  sourceIndicatorId: "IC.FRM.OBS.OBST",
  sourceUrl: "https://www.enterprisesurveys.org/en/data/exploreeconomies/2014/india",
  unit: `% of firms (India Enterprise Survey ${surveyYear})`,
  geography: { type: "country", id: "IN", name: "India" },
  fetchedAt,
  rows,
  dimensions: ["label", "value", "group"],
  metadata: { angle: "institutions", dataset: "World Bank Enterprise Surveys", surveyYear, note: "single survey vintage; read as one dated snapshot, not a trend" }
});
const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.in.es_obstacles`, artifact });

await writeSourceManifest("worldbank-divergence-enterprise", [{ status: "ready", indicatorId, sourceIndicatorId: "IC.FRM.OBS.OBST", artifact: path, observations: rows.length, latest: surveyYear, fetchedAt }]);
console.log(`Wrote ES obstacle ranking (${rows.length} obstacles, India ${surveyYear}):`);
for (const r of collected) console.log(`  ${String(r.value).padStart(5)}%  ${r.label}`);
