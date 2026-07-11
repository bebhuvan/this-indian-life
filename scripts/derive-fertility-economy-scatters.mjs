// Derive cross-sectional scatter tables joining fertility (TFR) with the
// economic and mechanism axes, per state, for q.people.fertility_divergence.
//
// Produces three scatterXY-shaped table artifacts (rows {label, x, y, highlight}):
//   econ.state.income_vs_tfr    - per-capita income (x) vs TFR (y)   [the money story]
//   people.education_vs_tfr     - female schooling % (x) vs TFR (y)  [clean driver]
//   people.lfp_vs_tfr           - female LFP % (x) vs TFR (y)        [messy correlate]
//
// TFR is the 2023 SRS value (latest); income is DBIE 2023 (2011-12 base, clean);
// education is NFHS-6 (2023-24); LFP is PLFS 2023-24. All join on the ~20 major
// states present in every source.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createTableArtifact } from "./core/artifacts.mjs";

const OUT = resolve(process.cwd(), "data/series");
const FETCHED = "2026-07-10T00:00:00.000Z";
const TFR_YEAR = "2023";
const INC_YEAR = "2023";

const slug = (s) =>
  s.split("$")[0].split("*")[0].trim().toLowerCase().replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const readJson = (f) => JSON.parse(readFileSync(resolve(OUT, f), "utf8"));
const atYear = (obs, y) => obs.find((o) => o.date === y)?.value ?? null;
const PRETTY = {}; // slug -> display name (from geography)
const DFI_URL = "https://www.dataforindia.com/fertility/";
// Label a wide spread of states on the scatters (not just 4), so readers can find
// their state; the renderer stacks these to avoid overlap.
const HIGHLIGHT = new Set([
  "bihar", "uttar_pradesh", "madhya_pradesh", "rajasthan", "jharkhand", "assam",
  "haryana", "west_bengal", "punjab", "gujarat", "odisha",
  "kerala", "tamil_nadu", "karnataka", "andhra_pradesh", "telangana", "maharashtra"
]);

// --- TFR (latest) and income by slug, from the per-state series files ---
const tfr = {}, income = {};
for (const f of readdirSync(OUT)) {
  let m;
  if ((m = f.match(/^srs\.IN\.people\.srs\.tfr_long\.([a-z_]+)\.json$/))) {
    const s = m[1]; if (s === "india") continue;
    const d = readJson(f); tfr[s] = atYear(d.observations, TFR_YEAR);
    PRETTY[s] = d.geography?.name || s;
  } else if ((m = f.match(/^dbie\.IN\.econ\.percap_income\.([a-z_]+)\.json$/))) {
    const s = m[1]; const d = readJson(f);
    income[s] = atYear(d.observations, INC_YEAR);
    PRETTY[s] = PRETTY[s] || d.geography?.name || s;
  }
}

// --- education & LFP by slug, from their state tables ---
const edu = {}, lfp = {};
for (const r of readJson("nfhs.IN.people_nfhs_women_schooling_10y_state.json").rows) edu[slug(r.state)] = r.value;
for (const r of readJson("mospi.IN.plfs.lfpr_female_by_state.json").rows) lfp[slug(r.state)] = r.NumericValue;

function scatter(xMap, round) {
  const rows = [];
  for (const s of Object.keys(tfr)) {
    const x = xMap[s], y = tfr[s];
    if (x == null || y == null) continue;
    rows.push({ label: PRETTY[s], x: round(x), y, highlight: HIGHLIGHT.has(s) ? 1 : 0 });
  }
  return rows.sort((a, b) => a.x - b.x);
}

const write = (file, artifact) => {
  writeFileSync(resolve(OUT, file), JSON.stringify(artifact, null, 2) + "\n");
  console.log("  wrote", file, `(${artifact.rows.length} states)`);
};

// 1. income vs TFR (income in Rs lakh for readability)
write("derived.IN.income_vs_tfr.json", createTableArtifact({
  indicatorId: "econ.state.income_vs_tfr",
  title: "Richer states, fewer children",
  sourceId: "dbie",
  sourceIndicatorId: "RBI DBIE per-capita NSDP (2023) vs SRS TFR (2023), by state",
  sourceUrl: "https://data.rbi.org.in/DBIE/",
  unit: "births per woman",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt: FETCHED,
  rows: scatter(income, (v) => Math.round(v / 1000) / 100), // Rs lakh, 2dp
  dimensions: ["x", "y", "highlight"],
  metadata: {
    xLabel: "Per-capita income, 2023 (Rs lakh, current prices)",
    yLabel: "Total fertility rate, 2023",
    note: "Per-capita NSDP (RBI DBIE, 2011-12 base) against SRS total fertility rate, latest common year."
  }
}));

// 2. female education vs TFR
write("derived.IN.education_vs_tfr.json", createTableArtifact({
  indicatorId: "people.education_vs_tfr",
  title: "The clearest lever: girls' schooling",
  sourceId: "nfhs",
  sourceIndicatorId: "NFHS-6 women with 10+ years schooling vs SRS TFR (2023), by state",
  sourceUrl: "https://www.nfhsiips.in/nfhsuser/index.php",
  unit: "births per woman",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt: FETCHED,
  rows: scatter(edu, (v) => Math.round(v * 10) / 10),
  dimensions: ["x", "y", "highlight"],
  metadata: {
    xLabel: "Women with 10+ years of schooling, % (NFHS-6)",
    yLabel: "Total fertility rate, 2023",
    note: "Female education tracks fertility tightly across states."
  }
}));

// 3. female LFP vs TFR (the messy correlate)
write("derived.IN.lfp_vs_tfr.json", createTableArtifact({
  indicatorId: "people.lfp_vs_tfr",
  title: "Female work does not explain it",
  sourceId: "work",
  sourceIndicatorId: "MOSPI PLFS female LFPR (2023-24) vs SRS TFR (2023), by state",
  sourceUrl: "https://api.mospi.gov.in/api/plfs/getData?indicator_code=1&frequency_code=1&Format=JSON",
  unit: "births per woman",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt: FETCHED,
  rows: scatter(lfp, (v) => Math.round(v * 10) / 10),
  dimensions: ["x", "y", "highlight"],
  metadata: {
    xLabel: "Female labour-force participation, % (PLFS 2023-24)",
    yLabel: "Total fertility rate, 2023",
    note: "Unlike education, female LFP has no clean relationship with fertility across Indian states (the female-LFP paradox)."
  }
}));

// 4. population growth 2011-2024 by state (tableBars: label/value/group) - the
//    delimitation payload: southern states growing far slower than the north.
const gs = readJson("data/series/states.population.growth_share.json".replace("data/series/", ""));
write("derived.IN.population_growth_bars.json", createTableArtifact({
  indicatorId: "people.state_population.growth_bars",
  title: "The states that cut fertility are growing slowest",
  sourceId: "rbi-estates",
  sourceIndicatorId: "RBI Handbook of Statistics on Indian States: population growth 2011-2024, by state",
  sourceUrl: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States",
  unit: "% growth 2011-2024",
  geography: { type: "subnational", id: "IND-states", name: "India states" },
  fetchedAt: FETCHED,
  rows: gs.rows
    .map((r) => ({ label: r.state, value: r.growth_pct, group: r.region === "South" ? "South" : "Rest" }))
    .sort((a, b) => a.value - b.value),
  dimensions: ["value", "group"],
  metadata: {
    note: "Population growth 2011-2024 (RBI Handbook; 2012-2024 are official estimates). The southern, "
      + "low-fertility states grew far slower than the northern high-fertility ones, so seats reallocated by "
      + "population would shift from south to north. Delimitation is frozen on 1971 population until at least 2026."
  }
}));

// 5. Year each state crossed the replacement rate (TFR first <= 2.1). Only the
//    long-history states (SRS data since 1981 or earlier) so the crossing year is
//    genuine, not an artefact of when the series starts. States still above
//    replacement in 2023 are named in the explainer, not plotted.
{
  const LONG = {}; // slug -> {name, firstYear, cross}
  for (const f of readdirSync(OUT)) {
    const m = f.match(/^srs\.IN\.people\.srs\.tfr_long\.([a-z_]+)\.json$/);
    if (!m || m[1] === "india") continue;
    const d = readJson(f); const o = d.observations;
    const firstYear = Number(o[0].date);
    if (firstYear > 1981) continue; // drop child states with short history
    const c = o.find((p) => p.value <= 2.1);
    LONG[m[1]] = { name: d.geography.name, cross: c ? Number(c.date) : null };
  }
  const SOUTH = new Set(["kerala", "tamil_nadu", "karnataka", "andhra_pradesh"]);
  const LATEST = 2023;
  // Encode "years below replacement by 2023" (meaningful zero) rather than the raw
  // crossing YEAR, which as a bar length is ~98% full and hides the spread. States
  // still above replacement in 2023 sit at 0 (empty bar), which makes the point.
  const rows = Object.entries(LONG)
    .map(([s, v]) => ({
      label: v.name,
      value: v.cross != null ? LATEST - v.cross : 0,
      crossedIn: v.cross,
      group: SOUTH.has(s) ? "South" : "Rest"
    }))
    .sort((a, b) => b.value - a.value);
  const notYet = Object.values(LONG).filter((v) => v.cross == null).map((v) => v.name).sort();
  write("derived.IN.replacement_crossing_year.json", createTableArtifact({
    indicatorId: "people.replacement_crossing_year",
    title: "How long each state has been below replacement",
    sourceId: "dataforindia",
    sourceIndicatorId: "SRS total fertility rate: years each state has spent at or below the 2.1 replacement rate, by 2023",
    sourceUrl: DFI_URL,
    unit: "years below replacement by 2023",
    geography: { type: "subnational", id: "IND-states", name: "India states" },
    fetchedAt: FETCHED,
    rows,
    dimensions: ["value", "crossedIn", "group"],
    metadata: {
      notYetCrossed: notYet,
      note: "Years each state has spent at or below the 2.1 replacement rate as of 2023 (SRS): "
        + "2023 minus the first year it reached 2.1. Limited to states with SRS history from 1981 or "
        + "earlier so the crossing year is real. States still above replacement in 2023 (value 0): "
        + notYet.join(", ") + "."
    }
  }));
  console.log("  years-below range:", rows[0].label, rows[0].value, "->", rows[rows.length-1].label, rows[rows.length-1].value, "| notYet:", notYet.join(", "));
}

// 6. "India's states span the world" — rank Indian states (2023 SRS TFR) against a
//    spread of countries (2024 World Bank TFR) on one fertility scale. Shows one
//    country's internal range covers most of the global spectrum.
{
  const STATE_MARKERS = ["bihar", "uttar_pradesh", "madhya_pradesh", "rajasthan", "assam",
    "haryana", "gujarat", "odisha", "karnataka", "andhra_pradesh", "maharashtra",
    "kerala", "west_bengal", "tamil_nadu"];
  const COUNTRIES = [ // World Bank SP.DYN.TFRT.IN, latest (2024)
    ["pak", "Pakistan"], ["wld", "World average"], ["bgd", "Bangladesh"], ["usa", "United States"],
    ["fra", "France"], ["gbr", "United Kingdom"], ["deu", "Germany"], ["jpn", "Japan"],
    ["chn", "China"], ["kor", "South Korea"]
  ];
  const rows = [];
  for (const s of STATE_MARKERS) {
    if (tfr[s] != null) rows.push({ label: `${PRETTY[s]} (India)`, value: tfr[s], group: "Indian state" });
  }
  for (const [code, name] of COUNTRIES) {
    const path = `worldbank.divergence.${code}.SP_DYN_TFRT_IN.json`;
    try {
      const o = readJson(path).observations.filter((p) => p.value != null);
      if (o.length) rows.push({ label: name, value: Math.round(o[o.length - 1].value * 100) / 100, group: "Country" });
    } catch { /* skip missing */ }
  }
  rows.sort((a, b) => b.value - a.value);
  write("derived.IN.states_span_world.json", createTableArtifact({
    indicatorId: "people.states_span_world",
    title: "India's states span the world",
    sourceId: "dataforindia",
    sourceIndicatorId: "SRS state TFR 2023 and World Bank country TFR 2024",
    sourceUrl: DFI_URL,
    unit: "births per woman",
    geography: { type: "subnational", id: "IND-states", name: "India states" },
    fetchedAt: FETCHED,
    rows,
    dimensions: ["value", "group"],
    metadata: {
      note: "Indian states (SRS 2023, via Data For India) ranked among countries (World Bank 2024) on one "
        + "fertility scale. Bihar sits above the world average and below only Pakistan; Tamil Nadu and West "
        + "Bengal sit below Germany, near Japan. One country contains most of the world's fertility range."
    }
  }));
  console.log("  states_span_world:", rows.length, "rows,", rows[0].label, rows[0].value, "->", rows[rows.length-1].label, rows[rows.length-1].value);
}

console.log("Done.");
