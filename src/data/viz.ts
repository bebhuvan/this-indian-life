import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { QuestionPage } from "./questions";

export type Point = { date: string; value: number };
export type VisualSource = {
  indicatorId?: string;
  sourceId: string;
  sourceIndicatorId: string;
  sourceUrl?: string;
};
export type LineVisual = {
  kind: "line";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  lines: Array<{ label: string; points: Point[] }>;
  bands?: Array<{ year: number; label?: string }>;
};
export type LinePanelsVisual = {
  kind: "linePanels";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  panels: Array<{ label: string; lines: LineVisual["lines"] }>;
  min: number;
  max: number;
};
export type StackVisual = {
  kind: "stack";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  segments: Array<{ label: string; value: number }>;
};
export type BarVisual = {
  kind: "bar";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  bars: Array<{ label: string; value: number; group?: string }>;
  /** "log" for bar sets spanning orders of magnitude (e.g. 29% to 23,773%); enables a
   * log-width + cool→hot colour render so small bars stay visible. */
  scale?: "log";
  /** Render as a single 100%-stacked share strip (parts of one whole, e.g. basket weights). */
  share?: boolean;
};
export type GroupedBarVisual = {
  kind: "groupedBar";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  series: string[];
  groups: Array<{ label: string; date: string; values: number[]; net?: number }>;
};
export type ChangeVisual = {
  kind: "change";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  items: Array<{ label: string; start: Point; end: Point; change: number; pctChange: number | null }>;
};
export type PyramidVisual = {
  kind: "pyramid";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  year: string;
  rows: Array<{ age: string; male: number; female: number }>;
};
export type StripeVisual = {
  kind: "stripes";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  stripes: Array<{ date: string; value: number }>;
  min: number;
  max: number;
  center: number;
};
export type ChoroplethVisual = {
  kind: "choropleth";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  viewBox: string;
  regions: Array<{ name: string; value: number | null; path: string }>;
  min: number;
  max: number;
  rankLabel?: string;
  bottomLabel?: string;
  signed?: boolean;
  ramp?: string;
  divergeAt?: number;
};
export type ScatterVisual = {
  kind: "scatter";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  xLabel: string;
  yLabel: string;
  sizeLabel?: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  points: Array<{
    label: string;
    x: number;
    y: number;
    size?: number | null;
    meta?: Record<string, number | string | null>;
  }>;
};
// Two (or more) 100%-stacked share strips in one block, sharing a legend — for a
// "then vs now" composition comparison (e.g. the CPI basket in 2012 vs 2024).
export type StripPairVisual = {
  kind: "stripPair";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  rows: Array<{ label: string; segments: Array<{ label: string; value: number }> }>;
};
// Small-multiples: several India maps sharing one colour scale and legend — for a
// scenario comparison (e.g. projected heat under low/mid/high emissions).
export type ScenarioMapsVisual = {
  kind: "scenarioMaps";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  viewBox: string;
  min: number;
  max: number;
  panels: Array<{ key: string; label: string; regions: Array<{ name: string; value: number | null; path: string }> }>;
};
// Small-multiples: a grid of tiny trend lines (sparklines), one per series, sharing
// one y-scale — for comparing many entities at once (e.g. very-hot-days across ~20 cities).
export type SparkGridVisual = {
  kind: "sparkGrid";
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  min: number;
  max: number;
  cells: Array<{ label: string; points: Array<{ date: string; value: number }>; latest: number | null; change?: number }>;
};
export type RankedChangeVisual = {
  kind: "rankedChange";
  diverging?: boolean;
  title: string;
  subtitle: string;
  unit: string;
  source: VisualSource;
  startLabel: string;
  endLabel: string;
  min?: number;
  max: number;
  rows: Array<{ label: string; start: number; end: number; change: number }>;
};
export type VisualSpec = LineVisual | LinePanelsVisual | StackVisual | BarVisual | GroupedBarVisual | ChangeVisual | PyramidVisual | StripeVisual | ChoroplethVisual | ScatterVisual | StripPairVisual | ScenarioMapsVisual | SparkGridVisual | RankedChangeVisual;
type VisualRole = "primary" | "context" | "companion";
type VisualWithRole = { visual: VisualSpec; role: VisualRole };

type Artifact = {
  artifactType?: "series" | "table" | "choropleth";
  indicatorId: string;
  title: string;
  sourceId: string;
  sourceIndicatorId: string;
  sourceUrl?: string;
  unit: string;
  observations?: Array<{ date: string; value: number | null }>;
  rows?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
};

const dataDir = resolve(process.cwd(), "data/series");

function loadArtifacts() {
  if (!existsSync(dataDir)) return [] as Artifact[];
  return readdirSync(dataDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(resolve(dataDir, file), "utf8")) as Artifact);
}

const artifacts = loadArtifacts();

const companionIndicators: Record<string, string[]> = {
  "q.people.total": [
    "people.population.un.change_rate",
    "people.population.un.median_age",
    "people.population.un.broad_age_share",
    "people.population.un.age_sex_5y"
  ],
  "q.people.growth": [
    "people.population.total",
    "people.population.un.total",
    "people.population.un.median_age"
  ],
  "q.people.age": [
    "people.population.un.broad_age_share",
    "people.population.un.old_age_dependency",
    "people.population.un.age_sex_5y"
  ],
  "q.people.pyramid": [
    "people.population.un.total",
    "people.population.un.median_age",
    "people.population.un.broad_age_share",
    "people.population.un.total_dependency"
  ],
  "q.people.old_before_rich": [
    "people.population.un.median_age",
    "people.population.un.broad_age_share",
    "people.population.un.total"
  ],
  "q.energy.mix": [
    "energy.ember.demand",
    "energy.ember.emissions",
    "energy.ember.carbon_intensity"
  ],
  "q.energy.coal": [
    "energy.ember.demand",
    "energy.ember.emissions",
    "energy.ember.carbon_intensity"
  ],
  "q.energy.renewables": [
    "energy.ember.demand",
    "energy.ember.emissions",
    "energy.ember.carbon_intensity"
  ],
  "q.econ.compare": [
    "world.share.gdp_current_usd"
  ],
  "q.climate.co2": [
    "owid.co2_per_capita",
    "owid.co2_cumulative"
  ],
  "q.climate.co2_pc": [
    "owid.co2_total",
    "owid.co2_cumulative"
  ],
  "q.health.life": [
    "health.who.hale_birth",
    "health.under5_mortality",
    "people.population.un.life_expectancy"
  ],
  "q.health.hale": [
    "health.who.life_expectancy",
    "health.who.life_expectancy_age_60"
  ],
  "q.work.force": [
    "people.age_15_64_share",
    "work.employment_agriculture"
  ],
  "q.services.water": [
    "society.sanitation_basic"
  ]
};

function sourceFor(artifact: Artifact): VisualSource {
  return {
    indicatorId: artifact.indicatorId,
    sourceId: artifact.sourceId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    sourceUrl: artifact.sourceUrl
  };
}

function numberFrom(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function dateFrom(row: Record<string, unknown>) {
  return String(row.Year || row.date || row.timeLabel || row.TimeDim || row.TimeDimensionValue || row.time || "");
}

function numericKey(row: Record<string, unknown>) {
  const priority = [
    "value",
    "NumericValue",
    "Annual CO₂ emissions",
    "Cumulative CO₂ emissions",
    "Annual CO₂ emissions per capita",
    "CO₂ emissions per capita",
    "generation_twh",
    "share_of_generation_pct",
    "demand_twh",
    "emissions_mtco2",
    "emissions_intensity_gco2_per_kwh",
    "aqi"
  ];
  const named = priority.find((key) => numberFrom(row[key]) !== null);
  if (named) return named;
  // Fallback for OWID and other grapher tables: the value column is whatever
  // numeric field is left once the known metadata columns are excluded.
  const metadata = new Set(["year", "date", "time", "timedim", "code", "entity", "iso3", "iso2", "id", "rank", "world regions according to owid"]);
  return Object.keys(row).find((key) => !metadata.has(key.toLowerCase()) && numberFrom(row[key]) !== null);
}

function sortPoints(points: Point[]) {
  return points
    .filter((point) => point.date && Number.isFinite(point.value))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function seriesVisual(artifact: Artifact): LineVisual | null {
  const points = sortPoints((artifact.observations || [])
    .filter((row) => row.value !== null)
    .map((row) => ({ date: row.date, value: row.value as number })));
  if (points.length < 2) return null;
  return {
    kind: "line",
    title: artifact.title,
    subtitle: `${artifact.sourceId} · ${artifact.sourceIndicatorId}`,
    unit: artifact.unit,
    source: sourceFor(artifact),
    lines: [{ label: artifact.title, points }]
  };
}

function indexedLineVisual(line: LineVisual): LineVisual | null {
  const lines = line.lines
    .map((item) => {
      const first = item.points.find((point) => point.value !== 0);
      if (!first) return null;
      const points = item.points.map((point) => ({ date: point.date, value: (point.value / first.value) * 100 }));
      return { label: item.label, points };
    })
    .filter(Boolean) as LineVisual["lines"];
  if (!lines.length) return null;
  return {
    kind: "line",
    title: "Indexed change",
    subtitle: `${line.title} · first observation = 100`,
    unit: "index",
    source: line.source,
    lines
  };
}

function changeVisual(line: LineVisual): ChangeVisual | null {
  const items = line.lines
    .map((item) => {
      const start = item.points.at(0);
      const end = item.points.at(-1);
      if (!start || !end || start.value === 0) return null;
      const change = end.value - start.value;
      return {
        label: item.label,
        start,
        end,
        change,
        pctChange: (change / Math.abs(start.value)) * 100
      };
    })
    .filter(Boolean) as ChangeVisual["items"];
  if (!items.length) return null;
  return {
    kind: "change",
    title: "How much changed?",
    subtitle: `${line.title} · first to latest point`,
    unit: line.unit,
    source: line.source,
    items
  };
}

function decadeChangeVisual(line: LineVisual): BarVisual | null {
  if (line.lines.length !== 1) return null;
  const points = line.lines[0].points
    .map((point) => ({ ...point, year: Number(point.date) }))
    .filter((point) => Number.isInteger(point.year))
    .sort((a, b) => a.year - b.year);
  if (points.length < 12) return null;
  const byYear = new Map(points.map((point) => [point.year, point]));
  const startYear = points[0].year;
  const endYear = points.at(-1)?.year || startYear;
  const firstDecade = Math.ceil(startYear / 10) * 10;
  const bars: BarVisual["bars"] = [];
  for (let decade = firstDecade; decade < endYear; decade += 10) {
    const start = byYear.get(decade) || points.find((point) => point.year >= decade);
    const targetEnd = Math.min(decade + 10, endYear);
    const end = byYear.get(targetEnd) || [...points].reverse().find((point) => point.year <= targetEnd);
    if (!start || !end || end.year <= start.year) continue;
    bars.push({
      label: `${start.year}-${String(end.year).slice(-2)}`,
      value: end.value - start.value
    });
  }
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title: "Change by decade",
    subtitle: `${line.title} · added during each period`,
    unit: line.unit,
    source: line.source,
    bars
  };
}

function recentBars(line: LineVisual): BarVisual | null {
  if (line.lines.length !== 1) return null;
  const points = line.lines[0].points.slice(-10);
  if (points.length < 3) return null;
  return {
    kind: "bar",
    title: "Latest observations",
    subtitle: `${line.title} · most recent ${points.length} points`,
    unit: line.unit,
    source: line.source,
    bars: points.map((point) => ({ label: point.date, value: point.value }))
  };
}

function rowPassesDefaultFilters(row: Record<string, unknown>) {
  const variant = String(row.variant || "").toLowerCase();
  const sex = String(row.sex || row.Dim1 || "").toLowerCase();
  const age = String(row.ageLabel || "").toLowerCase();
  if (variant && !["median", "estimates"].includes(variant)) return false;
  if (sex && !["both sexes", "sex_btsx", "total"].includes(sex)) return false;
  if (age && age !== "total" && age !== "not applicable") return false;
  // WHO GHO rows carry breakdown dimensions (wealth quintile, residence, region).
  // Keep only the national aggregate: a Dim3 that is empty OR an explicit total
  // (e.g. WEALTHQUINTILE_TOTL). Reject the sub-population rows that cause the sawtooth.
  const dim3 = String(row.Dim3 ?? "").toUpperCase();
  if (dim3 && !/(^|_)(TOTL|TOTAL|ALL|BTSX)($|_)/.test(dim3)) return false;
  return true;
}

// One value per date: WHO can still return multiple aggregate rows per year
// (different data sources). Keep the last, so the line never zigzags.
function dedupeByDate(points: Point[]): Point[] {
  const byDate = new Map<string, number>();
  for (const point of points) byDate.set(point.date, point.value);
  return [...byDate.entries()].map(([date, value]) => ({ date, value }));
}

function tableLineVisual(artifact: Artifact): LineVisual | null {
  const rows = artifact.rows || [];
  if (!rows.length) return null;
  const key = numericKey(rows[0]);
  if (!key) return null;
  const groupKey = rows.some((row) => row.series) ? "series" : "";

  if (rows.some((row) => row.sex) && ["people.population.un.total", "people.population.un.life_expectancy"].includes(artifact.indicatorId)) {
    const wanted = ["Both sexes", "Male", "Female"];
    const lines = wanted
      .map((label) => {
        const points = sortPoints(rows
          .filter((row) => row.sex === label && (!row.variant || row.variant === "Median"))
          .map((row) => ({ date: dateFrom(row), value: numberFrom(row[key]) ?? NaN })));
        return { label, points };
      })
      .filter((line) => line.points.length >= 2);
    if (lines.length) {
      return {
        kind: "line",
        title: artifact.title,
        subtitle: `${artifact.sourceId} · ${key}`,
        unit: artifact.unit,
        source: sourceFor(artifact),
        lines
      };
    }
  }

  if (groupKey) {
    const priority = ["Coal", "Fossil", "Clean", "Solar", "Wind", "Hydro"];
    const lines = priority
      .map((label) => {
        const points = sortPoints(rows
          .filter((row) => row[groupKey] === label)
          .map((row) => ({ date: dateFrom(row), value: numberFrom(row[key]) ?? NaN })));
        return { label, points };
      })
      .filter((line) => line.points.length >= 2);
    if (!lines.length) return null;
    return {
      kind: "line",
      title: artifact.title,
      subtitle: `${artifact.sourceId} · ${key}`,
      unit: artifact.unit,
      source: sourceFor(artifact),
      lines
    };
  }

  const points = dedupeByDate(sortPoints(rows
    .filter(rowPassesDefaultFilters)
    .map((row) => ({ date: dateFrom(row), value: numberFrom(row[key]) ?? NaN }))));
  if (points.length < 2) return null;
  return {
    kind: "line",
    title: artifact.title,
    subtitle: `${artifact.sourceId} · ${key}`,
    unit: artifact.unit,
    source: sourceFor(artifact),
    lines: [{ label: artifact.title, points }]
  };
}

function latestStack(artifact: Artifact): StackVisual | null {
  if (artifact.indicatorId !== "energy.ember.generation") return null;
  const rows = artifact.rows || [];
  const latestYear = [...new Set(rows.map((row) => String(row.date)))].sort().at(-1);
  if (!latestYear) return null;
  const wanted = ["Coal", "Gas", "Hydro", "Solar", "Wind", "Bioenergy", "Nuclear"];
  const segments = wanted
    .map((label) => {
      const row = rows.find((item) => item.date === latestYear && item.series === label);
      return { label, value: numberFrom(row?.generation_twh) || 0 };
    })
    .filter((item) => item.value > 0);
  if (!segments.length) return null;
  return {
    kind: "stack",
    title: "Electricity generation mix",
    subtitle: `India · ${latestYear}`,
    unit: "TWh",
    source: sourceFor(artifact),
    segments
  };
}

function waqiBars(artifact: Artifact): BarVisual | null {
  if (!artifact.indicatorId.startsWith("climate.waqi")) return null;
  const row = artifact.rows?.[0];
  if (!row) return null;
  const iaqi = row.iaqi as Record<string, { v?: number }> | undefined;
  const bars = [
    { label: "AQI", value: numberFrom(row.aqi) || 0 },
    { label: "PM2.5", value: numberFrom(iaqi?.pm25?.v) || 0 },
    { label: "PM10", value: numberFrom(iaqi?.pm10?.v) || 0 },
    { label: "Ozone", value: numberFrom(iaqi?.o3?.v) || 0 },
    { label: "NO2", value: numberFrom(iaqi?.no2?.v) || 0 }
  ].filter((item) => item.value > 0);
  return {
    kind: "bar",
    title: artifact.title,
    subtitle: String((row.city as { name?: string } | undefined)?.name || "Latest station reading"),
    unit: artifact.unit,
    source: sourceFor(artifact),
    bars
  };
}

function comparisonLatestBars(artifact: Artifact): BarVisual | null {
  if (!artifact.indicatorId.startsWith("econ.compare.") && !artifact.indicatorId.startsWith("compare.")) return null;
  const rows = artifact.rows || [];
  const metadata = artifact as Artifact & { metadata?: { latestCommonDate?: string } };
  const latestDate = metadata.metadata?.latestCommonDate || [...new Set(rows.map((row) => String(row.date || "")))].filter(Boolean).sort().at(-1);
  if (!latestDate) return null;
  const order = ["World", "United States", "European Union (27)", "China", "Brazil", "Indonesia", "India"];
  const shortNames: Record<string, string> = {
    "United States": "US",
    "European Union (27)": "EU"
  };
  const bars = rows
    .filter((row) => String(row.date) === latestDate)
    .map((row) => ({
      label: shortNames[String(row.countryName)] || String(row.countryName || row.countryCode || ""),
      value: numberFrom(row.value) || 0,
      order: order.indexOf(String(row.countryName))
    }))
    .filter((item) => item.label && item.value > 0)
    .sort((a, b) => (a.order === -1 ? 99 : a.order) - (b.order === -1 ? 99 : b.order))
    .map(({ label, value }) => ({ label, value }));
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title: artifact.title,
    subtitle: `World Bank · latest common year ${latestDate}`,
    unit: artifact.unit,
    source: sourceFor(artifact),
    bars
  };
}

function comparisonLineVisual(artifact: Artifact): LineVisual | null {
  if (artifact.indicatorId !== "econ.compare.gdp_per_capita_current_usd") return null;
  const rows = artifact.rows || [];
  const countries = ["India", "China", "United States", "World"];
  const labels: Record<string, string> = { "United States": "US" };
  const lines = countries
    .map((country) => {
      const points = sortPoints(rows
        .filter((row) => row.countryName === country)
        .map((row) => ({ date: String(row.date || ""), value: numberFrom(row.value) ?? NaN })));
      return { label: labels[country] || country, points };
    })
    .filter((line) => line.points.length >= 2);
  if (lines.length < 2) return null;
  return {
    kind: "line",
    title: "GDP per person over time",
    subtitle: "World Bank · current US dollars · 1960 to latest · log scale",
    unit: artifact.unit,
    source: sourceFor(artifact),
    lines
  };
}

// Generic multi-country line for any compare.* / world-context country-group table
// (the hard-coded comparisonLineVisual above is GDP-only with a log scale).
function multiCountryLine(artifact: Artifact, title: string, subtitle: string, unit: string): LineVisual | null {
  const rows = artifact.rows || [];
  // Trajectory lines: keep it to the most contrasting economies (drop World average)
  // so the half-width chart stays legible.
  const countries = ["India", "China", "United States", "European Union (27)", "Brazil", "Indonesia"];
  const labels: Record<string, string> = { "United States": "US", "European Union (27)": "EU" };
  const lines = countries
    .map((country) => ({
      label: labels[country] || country,
      points: sortPoints(rows.filter((row) => row.countryName === country).map((row) => ({ date: String(row.date || ""), value: numberFrom(row.value) ?? NaN })))
    }))
    .filter((line) => line.points.length >= 2);
  if (lines.length < 2) return null;
  return { kind: "line", title, subtitle: subtitle || sourceFor(artifact).sourceId, unit, source: sourceFor(artifact), lines };
}

function pyramidVisual(artifact: Artifact): PyramidVisual | null {
  if (artifact.indicatorId !== "people.population.un.age_sex_5y") return null;
  const rows = artifact.rows || [];
  const currentish = rows.filter((row) => row.variant === "Median" && String(row.timeLabel) === "2025");
  const byAge = new Map<string, { age: string; male: number; female: number; ageStart: number }>();
  for (const row of currentish) {
    const age = String(row.ageLabel || "");
    if (!age || age === "Total") continue;
    const entry = byAge.get(age) || { age, male: 0, female: 0, ageStart: numberFrom(row.ageStart) || 0 };
    if (row.sex === "Male") entry.male = numberFrom(row.value) || 0;
    if (row.sex === "Female") entry.female = numberFrom(row.value) || 0;
    byAge.set(age, entry);
  }
  const rowsOut = [...byAge.values()].sort((a, b) => b.ageStart - a.ageStart);
  if (!rowsOut.length) return null;
  return {
    kind: "pyramid",
    title: "Population pyramid",
    subtitle: "UN median variant · 2025",
    unit: "people",
    source: sourceFor(artifact),
    year: "2025",
    rows: rowsOut
  };
}

function ageBandBars(artifact: Artifact): BarVisual | null {
  if (artifact.indicatorId !== "people.population.un.age_sex_5y") return null;
  const rows = artifact.rows || [];
  const bars = rows
    .filter((row) => row.variant === "Median" && row.sex === "Both sexes" && String(row.timeLabel) === "2025")
    .map((row) => ({ label: String(row.ageLabel || ""), value: numberFrom(row.value) || 0, ageStart: numberFrom(row.ageStart) || 0 }))
    .filter((item) => item.label && item.label !== "Total" && item.value > 0)
    .sort((a, b) => a.ageStart - b.ageStart)
    .map(({ label, value }) => ({ label, value }));
  if (!bars.length) return null;
  return {
    kind: "bar",
    title: "Population by 5-year age band",
    subtitle: "UN median variant · both sexes · 2025",
    unit: "people",
    source: sourceFor(artifact),
    bars
  };
}

// Finer age structure than the 0-14/15-64/65+ split: bucket the 5-year bands
// (both sexes, latest year) into life-stage groups, as a share of the total.
function ageStructureShares(artifact: Artifact): BarVisual | null {
  if (artifact.indicatorId !== "people.population.un.age_sex_5y") return null;
  const rows = (artifact.rows || []).filter((row) => row.variant === "Median" && row.sex === "Both sexes" && String(row.timeLabel) === "2025");
  if (!rows.length) return null;
  const buckets = [
    { label: "0–14 (children)", min: 0, max: 14 },
    { label: "15–24 (youth)", min: 15, max: 24 },
    { label: "25–39 (young adults)", min: 25, max: 39 },
    { label: "40–59 (middle age)", min: 40, max: 59 },
    { label: "60–74 (older)", min: 60, max: 74 },
    { label: "75+ (elderly)", min: 75, max: 200 }
  ];
  let total = 0;
  const sums = buckets.map((bucket) => {
    let sum = 0;
    for (const row of rows) {
      const start = numberFrom(row.ageStart);
      if (start === null || String(row.ageLabel) === "Total") continue;
      if (start >= bucket.min && start <= bucket.max) sum += numberFrom(row.value) || 0;
    }
    total += sum;
    return { label: bucket.label, value: sum };
  });
  if (total <= 0) return null;
  const bars = sums.map((item) => ({ label: item.label, value: (item.value / total) * 100 }));
  return {
    kind: "bar",
    title: "Age structure today",
    subtitle: "UN median variant · share of population · 2025",
    unit: "% of population",
    source: sourceFor(artifact),
    bars
  };
}

function genericBarForLatestRows(artifact: Artifact): BarVisual | null {
  const rows = artifact.rows || [];
  if (artifact.indicatorId !== "people.population.un.broad_age_share") return null;
  const latestYear = "2025";
  const wanted = ["0-14", "15-64", "65+"];
  const bars = rows
    .filter((row) =>
      row.variant === "Median" &&
      row.sex === "Both sexes" &&
      String(row.timeLabel) === latestYear &&
      wanted.includes(String(row.ageLabel || ""))
    )
    .map((row) => ({ label: String(row.ageLabel || row.category), value: numberFrom(row.value) || 0 }))
    .filter((item) => item.label && item.value > 0);
  if (!bars.length) return null;
  return {
    kind: "bar",
    title: "Broad age structure",
    subtitle: `UN median variant · ${latestYear}`,
    unit: "%",
    source: sourceFor(artifact),
    bars
  };
}

// Dependency-ratio tables (UN) encode the ratio definition in ageLabel, e.g.
// "[65+/15-64]", and carry many variants/sexes/definitions. Pick the canonical
// series: Median variant, Both sexes, the standard 15-64 working-age denominator.
function dependencyLine(artifact: Artifact): LineVisual | null {
  const rows = artifact.rows || [];
  const key = numericKey(rows[0] || {});
  if (!key) return null;
  const points = sortPoints(rows
    .filter((row) => row.variant === "Median" && row.sex === "Both sexes" && Number(row.ageEnd) === 1564)
    .map((row) => ({ date: dateFrom(row), value: numberFrom(row[key]) ?? NaN })));
  if (points.length < 2) return null;
  return {
    kind: "line",
    title: artifact.title,
    subtitle: `UN median variant · per 100 working-age adults`,
    unit: artifact.unit,
    source: sourceFor(artifact),
    lines: [{ label: artifact.title, points }]
  };
}

function variantBars(artifact: Artifact): BarVisual | null {
  if (!["people.population.un.total", "people.population.un.growth"].includes(artifact.indicatorId)) return null;
  const rows = artifact.rows || [];
  const key = numericKey(rows[0] || {});
  if (!key) return null;
  const targetYear = "2030";
  const wanted = ["Low-fertility", "Median", "High-fertility", "Constant-fertility", "Zero migration"];
  const bars = wanted
    .map((variant) => {
      const row = rows.find((item) =>
        item.variant === variant &&
        String(item.timeLabel || item.Year || item.date) === targetYear &&
        String(item.sex || "").toLowerCase() === "both sexes" &&
        ["Total", "Not applicable", ""].includes(String(item.ageLabel || item.category || ""))
      );
      return { label: variant.replace("-fertility", ""), value: numberFrom(row?.[key]) || 0 };
    })
    .filter((item) => item.value !== 0);
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title: `${targetYear} scenario spread`,
    subtitle: `${artifact.title} · UN variants`,
    unit: artifact.unit,
    source: sourceFor(artifact),
    bars
  };
}

function visualsForArtifact(artifact: Artifact): VisualWithRole[] {
  const visuals: VisualWithRole[] = [];
  const custom = [pyramidVisual(artifact), ageBandBars(artifact), latestStack(artifact), waqiBars(artifact), comparisonLatestBars(artifact), comparisonLineVisual(artifact), genericBarForLatestRows(artifact), variantBars(artifact)]
    .filter(Boolean) as VisualSpec[];
  visuals.push(...custom.map((visual) => ({ visual, role: "primary" as const })));
  const line = artifact.artifactType === "series" ? seriesVisual(artifact) : tableLineVisual(artifact);
  if (line) {
    const keepContextLine = ["people.population.un.total", "energy.ember.generation"].includes(artifact.indicatorId);
    if (!custom.length || keepContextLine) {
      visuals.push({ visual: line, role: custom.length ? "context" : "primary" });
    }
    if (!artifact.indicatorId.startsWith("econ.compare.") && !artifact.indicatorId.startsWith("compare.")) {
      const companions = [decadeChangeVisual(line), changeVisual(line), recentBars(line), indexedLineVisual(line)].filter(Boolean) as VisualSpec[];
      visuals.push(...companions.map((visual) => ({ visual, role: "companion" as const })));
    }
  }
  return visuals;
}

function latestPoint(artifact: Artifact) {
  const points = sortPoints((artifact.observations || [])
    .filter((row) => row.value !== null)
    .map((row) => ({ date: row.date, value: row.value as number })));
  return points.at(-1) || null;
}

function alignedTradeGroups(exportsArtifact: Artifact, importsArtifact: Artifact, netExports?: Artifact) {
  const exportsByDate = new Map(sortPoints((exportsArtifact.observations || [])
    .filter((row) => row.value !== null)
    .map((row) => ({ date: row.date, value: row.value as number })))
    .map((point) => [point.date, point.value]));
  const importsByDate = new Map(sortPoints((importsArtifact.observations || [])
    .filter((row) => row.value !== null)
    .map((row) => ({ date: row.date, value: row.value as number })))
    .map((point) => [point.date, point.value]));
  const netByDate = new Map(sortPoints((netExports?.observations || [])
    .filter((row) => row.value !== null)
    .map((row) => ({ date: row.date, value: row.value as number })))
    .map((point) => [point.date, point.value]));
  return [...exportsByDate.entries()]
    .filter(([date]) => importsByDate.has(date))
    .map(([date, exportsValue]) => ({
      label: date.slice(0, 4),
      date,
      values: [exportsValue, importsByDate.get(date) || 0],
      net: netByDate.get(date)
    }))
    .slice(-10);
}

function combinedSource(artifacts: Artifact[], indicatorId: string, title: string): VisualSource {
  const sourceId = artifacts.find((artifact) => artifact.sourceId)?.sourceId || "local";
  return {
    indicatorId,
    sourceId,
    sourceIndicatorId: title,
    sourceUrl: artifacts.find((artifact) => artifact.sourceUrl)?.sourceUrl
  };
}

function economySizeVisuals(matched: Artifact[]): VisualSpec[] {
  const byId = new Map(matched.map((artifact) => [artifact.indicatorId, artifact]));
  const requiredLines = [
    "econ.idh.nominal_gdp_annual",
    "econ.idh.real_gdp_annual",
    "econ.idh.per_capita_nominal_gdp"
  ].map((id) => byId.get(id)).filter(Boolean) as Artifact[];
  const visuals = requiredLines
    .map(seriesVisual)
    .filter(Boolean) as VisualSpec[];

  const sectorIds = [
    ["Agriculture", "econ.idh.gva_agriculture_nominal"],
    ["Industry", "econ.idh.gva_industry_nominal"],
    ["Services", "econ.idh.gva_services_nominal"]
  ] as const;
  const sectorArtifacts = sectorIds.map(([, id]) => byId.get(id)).filter(Boolean) as Artifact[];
  const sectorLatest = sectorIds
    .map(([label, id]) => ({ label, point: byId.get(id) ? latestPoint(byId.get(id)!) : null }))
    .filter((item) => item.point);
  const sectorTotal = sectorLatest.reduce((sum, item) => sum + (item.point?.value || 0), 0);
  if (sectorLatest.length === 3 && sectorTotal > 0) {
    visuals.push({
      kind: "bar",
      title: "Latest GVA by sector",
      subtitle: `IndiaDataHub · ${sectorLatest[0].point?.date || "latest"}`,
      unit: "% of sector GVA",
      source: combinedSource(sectorArtifacts, "econ.idh.gva_sector_mix", "sector GVA mix"),
      bars: sectorLatest.map((item) => ({
        label: item.label,
        value: ((item.point?.value || 0) / sectorTotal) * 100
      }))
    });
  }

  const nominalGdp = byId.get("econ.idh.nominal_gdp_annual");
  const latestGdp = nominalGdp ? latestPoint(nominalGdp) : null;
  const demandIds = [
    ["Household spending", "econ.idh.private_consumption_nominal"],
    ["Investment", "econ.idh.gross_capital_formation_nominal"],
    ["Government consumption", "econ.idh.government_consumption_nominal"],
    ["Net exports", "econ.idh.net_exports_nominal"]
  ] as const;
  const demandArtifacts = demandIds.map(([, id]) => byId.get(id)).filter(Boolean) as Artifact[];
  const demandLatest = demandIds
    .map(([label, id]) => ({ label, point: byId.get(id) ? latestPoint(byId.get(id)!) : null }))
    .filter((item) => item.point);
  if (latestGdp && demandLatest.length >= 3) {
    visuals.push({
      kind: "bar",
      title: "What GDP is made of",
      subtitle: `Share of nominal GDP · ${latestGdp.date}`,
      unit: "% of nominal GDP",
      source: combinedSource([nominalGdp, ...demandArtifacts].filter(Boolean) as Artifact[], "econ.idh.gdp_demand_mix", "GDP demand mix"),
      bars: demandLatest.map((item) => ({
        label: item.label,
        value: ((item.point?.value || 0) / latestGdp.value) * 100
      }))
    });
  }

  const nominalQuarterly = byId.get("econ.idh.nominal_gdp_quarterly");
  const nominalQuarterlyLine = nominalQuarterly ? seriesVisual(nominalQuarterly) : null;
  if (nominalQuarterlyLine) visuals.push(nominalQuarterlyLine);

  const quarterly = byId.get("econ.idh.real_gdp_quarterly");
  const quarterlyLine = quarterly ? seriesVisual(quarterly) : null;
  if (quarterlyLine) visuals.push(quarterlyLine);

  const netExports = byId.get("econ.idh.net_exports_nominal");
  const exportsArtifact = byId.get("econ.idh.exports_nominal");
  const importsArtifact = byId.get("econ.idh.imports_nominal");
  if (exportsArtifact && importsArtifact) {
    const tradeGroups = alignedTradeGroups(exportsArtifact, importsArtifact, netExports);
    const latestTradeDate = tradeGroups.at(-1)?.date || "latest";
    visuals.push({
      kind: "groupedBar",
      title: "Imports and exports, last 10 years",
      subtitle: `IndiaDataHub · annual goods and services · ${latestTradeDate}`,
      unit: exportsArtifact!.unit,
      source: combinedSource([exportsArtifact!, importsArtifact!, netExports].filter(Boolean) as Artifact[], "econ.idh.imports_exports_nominal", "imports and exports"),
      series: ["Exports", "Imports"],
      groups: tradeGroups
    });
  }

  return visuals.slice(0, 8);
}

function worldShareVisuals(matched: Artifact[]): VisualSpec[] {
  const labels = [
    ["Population", "world.share.population"],
    ["GDP", "world.share.gdp_current_usd"],
    ["CO2 emissions", "world.share.co2_total"]
  ] as const;
  const byId = new Map(matched.map((artifact) => [artifact.indicatorId, artifact]));
  const shareArtifacts = labels.map(([, id]) => byId.get(id)).filter(Boolean) as Artifact[];
  const visuals: VisualSpec[] = [];
  const latestBars = labels
    .map(([label, id]) => {
      const artifact = byId.get(id);
      const point = artifact ? latestPoint(artifact) : null;
      return point ? { label, value: point.value, date: point.date } : null;
    })
    .filter(Boolean) as Array<{ label: string; value: number; date: string }>;

  if (latestBars.length) {
    const latestDate = latestBars.map((bar) => bar.date).sort().at(-1) || "latest";
    visuals.push({
      kind: "bar",
      title: "India's latest share of the world",
      subtitle: `India value divided by world value · latest data through ${latestDate}`,
      unit: "%",
      source: {
        indicatorId: "world.share.summary",
        sourceId: "world-context",
        sourceIndicatorId: "derived India/world shares"
      },
      bars: latestBars.map(({ label, value }) => ({ label, value }))
    });
  }

  const lines = labels
    .map(([label, id]) => {
      const artifact = byId.get(id);
      const line = artifact ? seriesVisual(artifact) : null;
      if (!line) return null;
      const points = line.lines[0].points.filter((point) => Number(point.date.slice(0, 4)) >= 1960);
      return points.length >= 2 ? { label, points } : null;
    })
    .filter(Boolean) as LineVisual["lines"];

  if (lines.length) {
    visuals.push({
      kind: "line",
      title: "India's world share over time",
      subtitle: "Population and GDP from World Bank; CO2 from Our World in Data",
      unit: "%",
      source: {
        indicatorId: "world.share.trends",
        sourceId: "world-context",
        sourceIndicatorId: "derived India/world shares"
      },
      lines
    });
  }

  for (const artifact of shareArtifacts) {
    const line = seriesVisual(artifact);
    if (!line) continue;
    visuals.push({
      ...line,
      lines: line.lines.map((item) => ({
        ...item,
        points: item.points.filter((point) => Number(point.date.slice(0, 4)) >= 1960)
      }))
    });
  }

  return visuals.slice(0, 5);
}

// Build one chart from a curated plan entry, reusing the existing builders but
// driven by editorial intent instead of the mechanical per-indicator explosion.
function artifactById(indicatorId: string): Artifact | undefined {
  return artifacts.find((artifact) => artifact.indicatorId === indicatorId);
}

function lineFor(artifact: Artifact): LineVisual | null {
  return artifact.artifactType === "table" ? tableLineVisual(artifact) : seriesVisual(artifact);
}

// Combine several single-indicator series into one multi-line chart — the
// "composition over time" lens (e.g. the three age-group shares since 1960).
function multiSeriesLine(
  series: Array<{ indicator: string; label: string }>,
  title: string,
  subtitle: string,
  unit: string,
  fromYear?: number,
  bands?: Array<{ year: number; label?: string }>
): LineVisual | null {
  const clip = (points: LineVisual["lines"][number]["points"]) =>
    fromYear ? points.filter((p) => Number(String(p.date).slice(0, 4)) >= fromYear) : points;
  const lines = (series || [])
    .map((item) => {
      const artifact = artifactById(item.indicator);
      const line = artifact ? lineFor(artifact) : null;
      return line && line.lines[0] ? { label: item.label, points: clip(line.lines[0].points) } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line) && line.points.length >= 2);
  if (lines.length < 2) return null;
  const firstArtifact = artifactById(series[0].indicator);
  return {
    kind: "line",
    title,
    subtitle,
    unit,
    source: firstArtifact ? sourceFor(firstArtifact) : { sourceId: "worldbank", sourceIndicatorId: title },
    lines,
    ...(bands?.length ? { bands } : {})
  };
}

export type PlanNote = { why?: string; detail?: string; read?: string; watch?: string };
// Latest value of each named indicator as one bar — for comparisons where a trend
// line is not possible (e.g. a single survey year, or men vs women at the latest point).
function latestBarsFromIndicators(series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string): BarVisual | null {
  const bars = (series || [])
    .map((item) => {
      const artifact = artifactById(item.indicator);
      const point = artifact ? latestPoint(artifact) : null;
      return point ? { label: item.label, value: point.value, date: point.date } : null;
    })
    .filter((b): b is { label: string; value: number; date: string } => Boolean(b));
  if (bars.length < 2) return null;
  const latest = bars.map((b) => b.date).sort().at(-1);
  const firstArtifact = artifactById(series[0].indicator);
  // Peak-inflation bars span orders of magnitude (29% → 23,773%): sort descending
  // and flag log scale so every bar — including India's — stays visible.
  const isPeak = (series || []).every((s) => s.indicator.startsWith("compare.cpi_peak"));
  // Basket weights are parts of one whole -> render as a 100%-stacked share strip.
  const isWeights = (series || []).every((s) => s.indicator.startsWith("prices.cpi.weight"));
  const outBars = bars.map(({ label, value }) => ({ label, value }));
  if (isPeak || isWeights) outBars.sort((a, b) => b.value - a.value);
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `latest available · ${latest}`,
    unit,
    source: firstArtifact ? sourceFor(firstArtifact) : { sourceId: "worldbank", sourceIndicatorId: title },
    bars: outBars,
    ...(isPeak ? { scale: "log" as const } : {}),
    ...(isWeights ? { share: true } : {})
  };
}

function barsFromTableRows(indicator: string, title: string, subtitle: string, unit: string): BarVisual | null {
  const artifact = artifactById(indicator);
  if (!artifact?.rows?.length) return null;
  const bars = artifact.rows
    .map((row) => {
      const label = typeof row.label === "string" ? row.label : typeof row.name === "string" ? row.name : "";
      const value = typeof row.value === "number" ? row.value : Number(row.value);
      const group = typeof row.group === "string" ? row.group : undefined;
      return label && Number.isFinite(value) ? { label, value, ...(group ? { group } : {}) } : null;
    })
    .filter((row): row is { label: string; value: number; group?: string } => Boolean(row));
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title: title || artifact.title,
    subtitle: subtitle || artifact.sourceIndicatorId,
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    bars,
    ...(artifact.metadata?.share === true ? { share: true as const } : {})
  };
}

// Cross-city AQI snapshot: one bar per city, reading the live `aqi` from each
// WAQI table artifact. These are single-row snapshots, not observation series,
// so latestPoint() (and therefore latestBarsFromIndicators) cannot see them.
function waqiCityCompareBars(series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string): BarVisual | null {
  const bars = (series || [])
    .map((item) => {
      const artifact = artifactById(item.indicator);
      const row = artifact?.rows?.[0];
      const value = row ? numberFrom(row.aqi) : null;
      return value !== null && value > 0 ? { label: item.label, value } : null;
    })
    .filter((b): b is { label: string; value: number } => Boolean(b));
  if (bars.length < 2) return null;
  const firstArtifact = artifactById(series[0].indicator);
  return {
    kind: "bar",
    title,
    subtitle: subtitle || "Live air quality index · latest reading",
    unit,
    source: firstArtifact ? sourceFor(firstArtifact) : { sourceId: "waqi", sourceIndicatorId: title },
    bars
  };
}

function comtradePartnerBars(artifact: Artifact, title: string, subtitle: string, field = "primaryValue", limit = 10): BarVisual | null {
  const rows = artifact.rows || [];
  if (!rows.length) return null;
  const scale = field === "netWgt" || field === "qty" ? 1_000_000_000 : 1_000_000_000;
  const unit = field === "netWgt" || field === "qty" ? "billion kg" : "US$ billions";
  const byPartner = new Map<string, number>();
  for (const row of rows) {
    const partnerCode = String(row.partnerCode ?? "");
    const partner2Code = String(row.partner2Code ?? "");
    const primaryPartner = partnerCode && partnerCode !== "0" ? row.partnerDesc : null;
    const secondaryPartner = partner2Code && partner2Code !== "0" ? row.partner2Desc : null;
    const label = String(primaryPartner || secondaryPartner || "").trim();
    if (!label || label.toLowerCase().includes("world")) continue;
    const value = numberFrom(row[field]);
    if (value === null || value <= 0) continue;
    byPartner.set(label, (byPartner.get(label) || 0) + value / scale);
  }
  const bars = [...byPartner.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
  if (bars.length < 2) return null;
  const year = String(rows.find((row) => row.period)?.period || "").trim();
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `UN Comtrade · India imports${year ? ` · ${year}` : ""}`,
    unit,
    source: sourceFor(artifact),
    bars
  };
}

function comtradeCommodityBars(artifact: Artifact, title: string, subtitle: string, field = "primaryValue", limit = 10): BarVisual | null {
  const rows = artifact.rows || [];
  if (!rows.length) return null;
  const scale = 1_000_000_000;
  const byCommodity = new Map<string, number>();
  for (const row of rows) {
    const code = String(row.cmdCode ?? "");
    if (!code || code.toUpperCase() === "TOTAL") continue;
    const label = String(row.cmdDesc || "").split(";")[0].trim();
    if (!label) continue;
    const value = numberFrom(row[field]);
    if (value === null || value <= 0) continue;
    byCommodity.set(label, (byCommodity.get(label) || 0) + value / scale);
  }
  const bars = [...byCommodity.entries()]
    .map(([label, value]) => ({ label: label.length > 42 ? `${label.slice(0, 40)}…` : label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
  if (bars.length < 2) return null;
  const year = String(rows.find((row) => row.period)?.period || "").trim();
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `UN Comtrade · HS chapters${year ? ` · ${year}` : ""}`,
    unit: "US$ billions",
    source: sourceFor(artifact),
    bars
  };
}

function tradeStatPartnerBars(artifact: Artifact, title: string, subtitle: string, field = "valueCurrentUsdMillion", limit = 10): BarVisual | null {
  const rows = artifact.rows || [];
  if (!rows.length) return null;
  const isQuantity = field === "quantityCurrent" || field === "quantityPrevious";
  const unit = isQuantity ? "billion units" : "US$ billions";
  const scale = isQuantity ? 1_000_000_000 : 1_000;
  const fiscalYear = String(artifact.metadata?.fiscalYear || artifact.sourceIndicatorId.match(/\.(\d{4})$/)?.[1] || "").trim();
  const bars = rows
    .map((row) => {
      const value = numberFrom(row[field]);
      const label = String(row.country || "").trim();
      if (!label || value === null || value <= 0) return null;
      return { label: label.replace(/\s+/g, " "), value: value / scale };
    })
    .filter((bar): bar is { label: string; value: number } => Boolean(bar))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `TradeStat / DGCI&S · India imports · ${fiscalYear ? `${fiscalYear}-${String(Number(fiscalYear) + 1).slice(-2)}` : "latest fiscal year"}`,
    unit,
    source: sourceFor(artifact),
    bars
  };
}

function tradeStatPartnerHistoryLines(
  artifact: Artifact,
  series: Array<{ indicator: string; label: string }>,
  field = "valueUsdMillion",
  title: string,
  subtitle: string,
  unit = "US$ billions"
): LineVisual | null {
  const rows = artifact.rows || [];
  if (!rows.length || !series.length) return null;
  const lines = series
    .map((item) => {
      const points = sortPoints(rows
        .filter((row) => String(row.country || "") === item.indicator)
        .map((row) => ({
          date: String(row.fiscalYearLabel || row.fiscalYear || ""),
          value: (numberFrom(row[field]) ?? 0) / 1000
        })));
      return points.length >= 2 ? { label: item.label, points } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line));
  if (lines.length < 2) return null;
  return {
    kind: "line",
    title,
    subtitle: subtitle || "TradeStat / DGCI&S · HS 270900 crude oil imports by partner · 2017-18 to 2025-26",
    unit,
    source: sourceFor(artifact),
    lines
  };
}

function ppacMonthlyBars(artifact: Artifact, item: string, title: string, subtitle: string, limit = 12, measure = ""): BarVisual | null {
  const rows = (artifact.rows || [])
    .filter((row) => String(row.item || "").toLowerCase() === item.toLowerCase())
    .filter((row) => !measure || String(row.measure || "").toLowerCase() === measure.toLowerCase())
    .filter((row) => String(row.month || "").toLowerCase() !== "total")
    .map((row) => ({ label: String(row.month || ""), value: numberFrom(row.value) ?? 0, monthIndex: numberFrom(row.monthIndex) ?? 0, unit: String(row.unit || "") }))
    .filter((row) => row.label && row.value > 0)
    .sort((a, b) => a.monthIndex - b.monthIndex)
    .slice(0, limit)
  const unit = rows.find((row) => row.unit)?.unit || artifact.unit;
  const bars = rows.map(({ label, value }) => ({ label, value }));
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `PPAC · ${item} · current fiscal year`,
    unit,
    source: sourceFor(artifact),
    bars
  };
}

function fuelSpendBars(artifact: Artifact, measure: string, title: string, subtitle: string): BarVisual | null {
  const rows = (artifact.rows || [])
    .filter((row) => String(row.measure || "") === measure)
    .map((row) => ({
      label: String(row.item || ""),
      value: numberFrom(row.value) ?? 0,
      unit: String(row.unit || artifact.unit)
    }))
    .filter((row) => row.label && row.value > 0)
    .sort((a, b) => b.value - a.value);
  if (rows.length < 2) return null;
  const unit = rows.find((row) => row.unit)?.unit || artifact.unit;
  return {
    kind: "bar",
    title,
    subtitle: subtitle || "PPAC + TradeStat · India fuel imports · 2025-26",
    unit,
    source: sourceFor(artifact),
    bars: rows.map(({ label, value }) => ({ label, value }))
  };
}

type SibcSelector = { section: string; code: string; label: string; statement?: string };

function sibcParseSelector(item: { indicator: string; label: string }): SibcSelector {
  const parts = String(item.indicator || "").split(":");
  if (parts.length === 3) return { statement: parts[0], section: parts[1], code: parts[2], label: item.label };
  if (parts.length === 2) return { statement: "sectors", section: parts[0], code: parts[1], label: item.label };
  return { statement: "sectors", section: "", code: String(item.indicator || ""), label: item.label };
}

function sibcRowsFor(artifact: Artifact, selector: SibcSelector, fromYear?: number) {
  return (artifact.rows || [])
    .filter((row) =>
      String(row.statement || "sectors") === (selector.statement || "sectors") &&
      String(row.section || "") === selector.section &&
      String(row.code || "") === selector.code &&
      (!fromYear || Number(String(row.period || row.date || "").slice(0, 4)) >= fromYear)
    )
    .sort((a, b) => String(a.period || a.date).localeCompare(String(b.period || b.date)));
}

function sibcPointMap(artifact: Artifact, selector: SibcSelector, fromYear?: number) {
  const byPeriod = new Map<string, number>();
  for (const row of sibcRowsFor(artifact, selector, fromYear)) {
    const period = String(row.period || row.date || "");
    const value = numberFrom(row.NumericValue);
    if (period && value !== null) byPeriod.set(period, value);
  }
  return byPeriod;
}

function sibcLines(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): LineVisual | null {
  if (artifact.indicatorId !== "banking.rbi.sibc_sectoral_deployment_monthly") return null;
  const lines = (series || [])
    .map(sibcParseSelector)
    .map((selector) => {
      const points = [...sibcPointMap(artifact, selector, fromYear).entries()].map(([date, value]) => ({ date, value }));
      return points.length >= 2 ? { label: selector.label, points } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line));
  if (!lines.length) return null;
  return {
    kind: "line",
    title,
    subtitle: subtitle || "RBI · Sectoral Deployment of Bank Credit",
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    lines
  };
}

function sibcShareLines(artifact: Artifact, series: Array<{ indicator: string; label: string }>, denominator: string, title: string, subtitle: string, fromYear?: number): LineVisual | null {
  if (artifact.indicatorId !== "banking.rbi.sibc_sectoral_deployment_monthly") return null;
  const denom = sibcParseSelector({ indicator: denominator || "bank_credit_totals:I", label: "Total" });
  const denomByPeriod = sibcPointMap(artifact, denom, fromYear);
  const lines = (series || [])
    .map(sibcParseSelector)
    .map((selector) => {
      const points = [...sibcPointMap(artifact, selector, fromYear).entries()]
        .map(([date, value]) => {
          const total = denomByPeriod.get(date);
          return total ? { date, value: (value / total) * 100 } : null;
        })
        .filter((point): point is Point => Boolean(point));
      return points.length >= 2 ? { label: selector.label, points } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line));
  if (!lines.length) return null;
  return {
    kind: "line",
    title,
    subtitle: subtitle || "RBI · share of bank credit",
    unit: "% of bank credit",
    source: sourceFor(artifact),
    lines
  };
}

function sibcLatestBars(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): BarVisual | null {
  if (artifact.indicatorId !== "banking.rbi.sibc_sectoral_deployment_monthly") return null;
  const bars = (series || [])
    .map(sibcParseSelector)
    .map((selector) => {
      const points = [...sibcPointMap(artifact, selector, fromYear).entries()];
      const latest = points.at(-1);
      return latest ? { label: selector.label, value: latest[1], date: latest[0] } : null;
    })
    .filter((bar): bar is { label: string; value: number; date: string } => Boolean(bar) && bar.value > 0);
  if (!bars.length) return null;
  const latestDate = bars.map((bar) => bar.date).sort().at(-1);
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `RBI · Sectoral Deployment of Bank Credit · ${latestDate}`,
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    bars: bars.map(({ label, value }) => ({ label, value }))
  };
}

function sibcLatestStack(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): StackVisual | null {
  const bars = sibcLatestBars(artifact, series, title, subtitle, unit, fromYear);
  if (!bars) return null;
  return {
    kind: "stack",
    title: bars.title,
    subtitle: bars.subtitle,
    unit: bars.unit,
    source: bars.source,
    segments: bars.bars
  };
}

function sibcShareChangeBars(artifact: Artifact, series: Array<{ indicator: string; label: string }>, denominator: string, title: string, subtitle: string, fromYear?: number): BarVisual | null {
  if (artifact.indicatorId !== "banking.rbi.sibc_sectoral_deployment_monthly") return null;
  const denom = sibcParseSelector({ indicator: denominator || "bank_credit_totals:I", label: "Total" });
  const denomByPeriod = sibcPointMap(artifact, denom, fromYear);
  const bars = (series || [])
    .map(sibcParseSelector)
    .map((selector) => {
      const shares = [...sibcPointMap(artifact, selector, fromYear).entries()]
        .map(([date, value]) => {
          const total = denomByPeriod.get(date);
          return total ? { date, value: (value / total) * 100 } : null;
        })
        .filter((point): point is Point => Boolean(point));
      const start = shares.at(0);
      const end = shares.at(-1);
      return start && end ? { label: selector.label, value: end.value - start.value } : null;
    })
    .filter((bar): bar is { label: string; value: number } => Boolean(bar));
  if (!bars.length) return null;
  return {
    kind: "bar",
    title,
    subtitle: subtitle || "RBI SIBC · change in share of gross bank credit",
    unit: "percentage points",
    source: sourceFor(artifact),
    bars
  };
}

function sibcGrowthMultipleBars(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, fromYear?: number): BarVisual | null {
  if (artifact.indicatorId !== "banking.rbi.sibc_sectoral_deployment_monthly") return null;
  const bars = (series || [])
    .map(sibcParseSelector)
    .map((selector) => {
      const points = [...sibcPointMap(artifact, selector, fromYear).entries()];
      const start = points.at(0);
      const end = points.at(-1);
      return start && end && start[1] > 0 ? { label: selector.label, value: end[1] / start[1] } : null;
    })
    .filter((bar): bar is { label: string; value: number } => Boolean(bar) && Number.isFinite(bar.value));
  if (!bars.length) return null;
  return {
    kind: "bar",
    title,
    subtitle: subtitle || "RBI SIBC · latest outstanding divided by first 2019 value",
    unit: "multiple",
    source: sourceFor(artifact),
    bars
  };
}

type IdhCreditSelector = { scope: string; family: string; label: string; displayLabel: string };

function idhCreditParseSelector(item: { indicator: string; label: string }): IdhCreditSelector {
  const parts = String(item.indicator || "").split(":");
  return {
    scope: parts[0] || "",
    family: parts[1] || "",
    label: parts.slice(2).join(":") || String(item.indicator || ""),
    displayLabel: item.label
  };
}

function idhCreditRowsFor(artifact: Artifact, selector: IdhCreditSelector, variant?: string, fromYear?: number) {
  return (artifact.rows || [])
    .filter((row) =>
      String(row.scope || "") === selector.scope &&
      String(row.family || "") === selector.family &&
      String(row.label || "") === selector.label &&
      (!variant || String(row.variant || "") === variant) &&
      (!fromYear || Number(String(row.period || row.date || "").slice(0, 4)) >= fromYear)
    )
    .sort((a, b) => String(a.period || a.date).localeCompare(String(b.period || b.date)));
}

function idhCreditValue(row: Record<string, unknown>) {
  return numberFrom(row.NumericValue ?? row.value);
}

function idhCreditStitchedPoints(artifact: Artifact, selector: IdhCreditSelector, fromYear?: number): Point[] {
  const oldRows = idhCreditRowsFor(artifact, selector, "oldClassification", fromYear)
    .filter((row) => String(row.period || row.date || "") < "2019-01");
  const currentRows = idhCreditRowsFor(artifact, selector, "current", fromYear)
    .filter((row) => String(row.period || row.date || "") >= "2019-01");
  const byPeriod = new Map<string, number>();
  for (const row of [...oldRows, ...currentRows]) {
    const period = String(row.period || row.date || "");
    const value = idhCreditValue(row);
    if (period && value !== null) byPeriod.set(period, value);
  }
  return [...byPeriod.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

function idhCreditLatestCurrentPoint(artifact: Artifact, selector: IdhCreditSelector, fromYear?: number): Point | null {
  const points = idhCreditRowsFor(artifact, selector, "current", fromYear)
    .map((row) => ({ date: String(row.period || row.date || ""), value: idhCreditValue(row) }))
    .filter((point): point is Point => Boolean(point.date) && point.value !== null);
  return points.at(-1) || null;
}

function idhCreditLines(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): LineVisual | null {
  if (artifact.indicatorId !== "banking.idh.credit_monthly") return null;
  const lines = (series || [])
    .map(idhCreditParseSelector)
    .map((selector) => {
      const points = idhCreditStitchedPoints(artifact, selector, fromYear);
      return points.length >= 2 ? { label: selector.displayLabel, points } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line));
  if (!lines.length) return null;
  return {
    kind: "line",
    title,
    subtitle: subtitle || "IndiaDataHub/RBI · Banking/Credit monthly series",
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    lines
  };
}

function idhCreditLatestBars(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): BarVisual | null {
  if (artifact.indicatorId !== "banking.idh.credit_monthly") return null;
  const bars = (series || [])
    .map(idhCreditParseSelector)
    .map((selector) => {
      const latest = idhCreditLatestCurrentPoint(artifact, selector, fromYear);
      return latest ? { label: selector.displayLabel, value: latest.value, date: latest.date } : null;
    })
    .filter((bar): bar is { label: string; value: number; date: string } => Boolean(bar) && bar.value > 0)
    .sort((a, b) => b.value - a.value);
  if (!bars.length) return null;
  const latestDate = bars.map((bar) => bar.date).sort().at(-1);
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `IndiaDataHub/RBI · latest current classification · ${latestDate}`,
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    bars: bars.map(({ label, value }) => ({ label, value }))
  };
}

function idhCreditLatestStack(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): StackVisual | null {
  if (artifact.indicatorId !== "banking.idh.credit_monthly") return null;
  const segments = (series || [])
    .map(idhCreditParseSelector)
    .map((selector) => {
      const latest = idhCreditLatestCurrentPoint(artifact, selector, fromYear);
      return latest ? { label: selector.displayLabel, value: latest.value, date: latest.date } : null;
    })
    .filter((segment): segment is { label: string; value: number; date: string } => Boolean(segment) && segment.value > 0);
  if (!segments.length) return null;
  const latestDate = segments.map((segment) => segment.date).sort().at(-1);
  return {
    kind: "stack",
    title,
    subtitle: subtitle || `IndiaDataHub/RBI · latest current classification · ${latestDate}`,
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    segments: segments.map(({ label, value }) => ({ label, value }))
  };
}

function idhCreditGrowthBars(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, fromYear?: number): BarVisual | null {
  if (artifact.indicatorId !== "banking.idh.credit_monthly") return null;
  const bars = (series || [])
    .map(idhCreditParseSelector)
    .map((selector) => {
      const points = idhCreditStitchedPoints(artifact, selector, fromYear);
      const start = points.at(0);
      const end = points.at(-1);
      return start && end && start.value > 0 ? { label: selector.displayLabel, value: end.value / start.value } : null;
    })
    .filter((bar): bar is { label: string; value: number } => Boolean(bar) && Number.isFinite(bar.value))
    .sort((a, b) => b.value - a.value);
  if (!bars.length) return null;
  return {
    kind: "bar",
    title,
    subtitle: subtitle || "IndiaDataHub/RBI · latest outstanding divided by first available value",
    unit: "multiple",
    source: sourceFor(artifact),
    bars
  };
}

function countryMetricRows(
  artifact: Artifact,
  metric: string,
  countryCode?: string,
  fromYear?: number
) {
  return (artifact.rows || [])
    .filter((row) =>
      String(row.metric || "") === metric &&
      (!countryCode || String(row.countryCode || "") === countryCode) &&
      (!fromYear || Number(String(row.date || row.period || "").slice(0, 4)) >= fromYear)
    )
    .sort((a, b) => String(a.date || a.period).localeCompare(String(b.date || b.period)));
}

function countryMetricPoints(
  artifact: Artifact,
  metric: string,
  countryCode: string,
  fromYear?: number
): Point[] {
  return countryMetricRows(artifact, metric, countryCode, fromYear)
    .map((row) => ({ date: String(row.date || row.period || ""), value: numberFrom(row.NumericValue ?? row.value) ?? NaN }))
    .filter((point) => point.date && Number.isFinite(point.value));
}

function countryMetricLines(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): LineVisual | null {
  if (!["credit.bis.total_credit_quarterly", "credit.bis.credit_gap_quarterly", "credit.imf.household_debt_pct_gdp"].includes(artifact.indicatorId)) return null;
  const lines = (series || [])
    .map((item) => {
      const [metric, countryCode] = String(item.indicator || "").split(":");
      if (!metric || !countryCode) return null;
      const points = countryMetricPoints(artifact, metric, countryCode, fromYear);
      return points.length >= 2 ? { label: item.label, points } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line));
  if (!lines.length) return null;
  return {
    kind: "line",
    title,
    subtitle: subtitle || artifact.sourceId,
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    lines
  };
}

function countryMetricLatestBars(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): BarVisual | null {
  if (!["credit.bis.total_credit_quarterly", "credit.bis.credit_gap_quarterly", "credit.imf.household_debt_pct_gdp"].includes(artifact.indicatorId)) return null;
  const bars = (series || [])
    .map((item) => {
      const [metric, countryCode] = String(item.indicator || "").split(":");
      if (!metric || !countryCode) return null;
      const latest = countryMetricRows(artifact, metric, countryCode, fromYear).at(-1);
      const value = latest ? numberFrom(latest.NumericValue ?? latest.value) : null;
      return latest && value !== null ? { label: item.label, value, date: String(latest.period || latest.date || "") } : null;
    })
    .filter((bar): bar is { label: string; value: number; date: string } => Boolean(bar) && Number.isFinite(bar.value))
    .sort((a, b) => b.value - a.value);
  if (!bars.length) return null;
  const latestDate = bars.map((bar) => bar.date).sort().at(-1);
  return {
    kind: "bar",
    title,
    subtitle: subtitle || `${artifact.sourceId} · latest available · ${latestDate}`,
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    bars: bars.map(({ label, value }) => ({ label, value }))
  };
}

function countryMetricLatestStack(artifact: Artifact, series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): StackVisual | null {
  if (artifact.indicatorId !== "credit.bis.total_credit_quarterly") return null;
  const segments = (series || [])
    .map((item) => {
      const [metric, countryCode] = String(item.indicator || "").split(":");
      if (!metric || !countryCode) return null;
      const latest = countryMetricRows(artifact, metric, countryCode, fromYear).at(-1);
      const value = latest ? numberFrom(latest.NumericValue ?? latest.value) : null;
      return latest && value !== null ? { label: item.label, value, date: String(latest.period || latest.date || "") } : null;
    })
    .filter((segment): segment is { label: string; value: number; date: string } => Boolean(segment) && segment.value > 0);
  if (!segments.length) return null;
  const latestDate = segments.map((segment) => segment.date).sort().at(-1);
  return {
    kind: "stack",
    title,
    subtitle: subtitle || `BIS · latest available · ${latestDate}`,
    unit: unit || artifact.unit,
    source: sourceFor(artifact),
    segments: segments.map(({ label, value }) => ({ label, value }))
  };
}

// One source's % share of generation over time, from the Ember generation table
// (which carries share_of_generation_pct to 2025). Lets us show coal's or clean's
// share as a current single line without a stale World Bank series.
function emberSourceShare(artifact: Artifact, seriesName: string, title: string): LineVisual | null {
  if (!artifact || !seriesName) return null;
  const points = dedupeByDate(sortPoints((artifact.rows || [])
    .filter((row) => row.series === seriesName)
    .map((row) => ({ date: String(row.date || ""), value: numberFrom(row.share_of_generation_pct) ?? NaN }))));
  if (points.length < 2) return null;
  return {
    kind: "line",
    title: title || `${seriesName} share of generation`,
    subtitle: `Ember · ${seriesName} as a share of electricity generation`,
    unit: "% of generation",
    source: sourceFor(artifact),
    lines: [{ label: seriesName, points }]
  };
}

// Several named series from ONE Ember table as a multi-line chart (e.g. Solar + Wind,
// or Clean vs Fossil). `series[].indicator` here holds the Ember series name, and
// `field` chooses the value column (generation_twh by default). Current to 2025.
function emberSeriesLines(artifact: Artifact, series: Array<{ indicator: string; label: string }>, field: string, title: string, unit: string): LineVisual | null {
  if (!artifact) return null;
  const lines = (series || [])
    .map((s) => {
      const points = dedupeByDate(sortPoints((artifact.rows || [])
        .filter((row) => row.series === s.indicator)
        .map((row) => ({ date: String(row.date || ""), value: numberFrom(row[field]) ?? NaN }))));
      return points.length >= 2 ? { label: s.label, points } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line));
  if (!lines.length) return null;
  return { kind: "line", title, subtitle: "Ember · electricity generation", unit, source: sourceFor(artifact), lines };
}

function heatDeathCountBars(artifact: Artifact, title: string, subtitle: string): BarVisual | null {
  if (artifact.indicatorId !== "heat.death_count_comparison") return null;
  const wanted = new Set([
    "Frontiers model|Single extreme-heat day scenario",
    "OWID/EM-DAT|2024",
    "NCRB ADSI|2023",
    "IMD DWE|2024",
    "NCDC/NHRIDS parliamentary reporting|2024-03-01 to 2024-07-27",
    "NCDC/NHRIDS|2024, March-July public reporting"
  ]);
  const labelFor = (row: Record<string, unknown>) => {
    const source = String(row.sourceFamily || "");
    const period = String(row.period || "");
    if (source === "Frontiers model") return "Frontiers model, one extreme-heat day";
    if (source === "OWID/EM-DAT") return "OWID/EM-DAT, 2024 disaster deaths";
    if (source === "NCRB ADSI") return "NCRB, 2023 heat/sunstroke";
    if (source === "IMD DWE") return "IMD DWE, 2024 heatwave";
    if (source.includes("parliamentary")) return "NCDC/Lok Sabha cutoff, 2024";
    if (source === "NCDC/NHRIDS") return "NCDC confirmed heatstroke, 2024";
    return `${source}, ${period}`;
  };
  const bars = (artifact.rows || [])
    .filter((row) => wanted.has(`${row.sourceFamily}|${row.period}`))
    .map((row) => ({ label: labelFor(row), value: numberFrom(row.value) || 0 }))
    .filter((row) => row.value > 0);
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title,
    subtitle,
    unit: "deaths or excess deaths",
    source: sourceFor(artifact),
    bars,
    scale: "log"
  };
}

function deathCertificationFunnelBars(artifact: Artifact, title: string, subtitle: string): BarVisual | null {
  if (artifact.indicatorId !== "heat.counting.death_certification_funnel") return null;
  const wanted = [
    "Estimated deaths",
    "Registered deaths",
    "No medical attention at death",
    "Institutional deaths",
    "Medically certified cause"
  ];
  const byStep = new Map((artifact.rows || []).map((row) => [String(row.step || ""), row]));
  const bars = wanted
    .map((step) => {
      const row = byStep.get(step);
      const value = row ? numberFrom(row.value) : null;
      const share = row ? numberFrom(row.shareOfEstimatedDeathsPct) : null;
      const label = share === null ? step : `${step} (${share}%)`;
      return value === null ? null : { label, value };
    })
    .filter((bar): bar is { label: string; value: number } => Boolean(bar));
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title,
    subtitle,
    unit: "deaths",
    source: sourceFor(artifact),
    bars
  };
}

function heatVulnerabilityScatter(artifact: Artifact, title: string, subtitle: string): ScatterVisual | null {
  const rows = artifact.rows || [];
  const points = rows
    .map((row) => {
      const x = numberFrom(row.heatRiskPct);
      const y = numberFrom(row.noCoolingProtectionPct);
      if (x === null || y === null) return null;
      return {
        label: String(row.state || ""),
        x,
        y,
        size: numberFrom(row.mpiPct),
        meta: {
          acPct: numberFrom(row.acPct),
          coolerPct: numberFrom(row.coolerPct),
          coolingProtectionPct: numberFrom(row.coolingProtectionPct),
          mpiPct: numberFrom(row.mpiPct),
          ruralMpce: numberFrom(row.ruralMpce),
          urbanMpce: numberFrom(row.urbanMpce),
          ruralGini: numberFrom(row.ruralGini),
          urbanGini: numberFrom(row.urbanGini),
          mccdCauseCertifiedPct: numberFrom(row.mccdCauseCertifiedPct)
        }
      };
    })
    .filter((point): point is ScatterVisual["points"][number] => Boolean(point?.label));
  if (points.length < 3) return null;
  return {
    kind: "scatter",
    title,
    subtitle,
    unit: "%",
    source: sourceFor(artifact),
    xLabel: "Districts at high or very high heat risk",
    yLabel: "Households without AC/cooler protection proxy",
    sizeLabel: "Bubble size = multidimensional poverty",
    xMin: 0,
    xMax: 100,
    yMin: 0,
    yMax: 100,
    points
  };
}

function heatSensitivityBars(artifact: Artifact, title: string, subtitle: string): BarVisual | null {
  if (artifact.indicatorId !== "heat.sensitivity_scale_check") return null;
  const labelMap: Record<string, string> = {
    very_low: "Very low",
    low: "Low",
    middle: "Middle",
    frontiers_scale: "Frontiers-scale denominator check",
    high: "High"
  };
  const bars = (artifact.rows || [])
    .map((row) => ({
      label: labelMap[String(row.scenario)] || String(row.scenario || ""),
      value: numberFrom(row.excessDeathsPerDay) || 0
    }))
    .filter((row) => row.label && row.value > 0);
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title,
    subtitle,
    unit: "illustrative excess deaths in one day",
    source: sourceFor(artifact),
    bars
  };
}

function heatSensitivityFiveDayBars(artifact: Artifact, title: string, subtitle: string): BarVisual | null {
  if (artifact.indicatorId !== "heat.sensitivity_scale_check") return null;
  const labelMap: Record<string, string> = {
    very_low: "Very low",
    low: "Low",
    middle: "Middle",
    frontiers_scale: "Frontiers-scale denominator check",
    high: "High"
  };
  const bars = (artifact.rows || [])
    .map((row) => ({
      label: labelMap[String(row.scenario)] || String(row.scenario || ""),
      value: numberFrom(row.excessDeathsPerFiveDaysIfConstant) || 0
    }))
    .filter((row) => row.label && row.value > 0);
  if (bars.length < 2) return null;
  return {
    kind: "bar",
    title,
    subtitle,
    unit: "illustrative excess deaths over five days",
    source: sourceFor(artifact),
    bars
  };
}

function imdHeatMonthBars(artifact: Artifact, title: string, subtitle: string): BarVisual | null {
  if (artifact.indicatorId !== "heat.imd_dwe_2024.heatwave_deaths_by_month") return null;
  const monthOrder = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const bars = (artifact.rows || [])
    .map((row) => ({ label: String(row.month || ""), value: numberFrom(row.humanDeaths) || 0 }))
    .filter((row) => row.label && row.value > 0)
    .sort((a, b) => monthOrder.indexOf(a.label) - monthOrder.indexOf(b.label))
    .map((bar) => ({ ...bar, label: bar.label[0] + bar.label.slice(1).toLowerCase() }));
  if (!bars.length) return null;
  return {
    kind: "bar",
    title,
    subtitle,
    unit: "reported deaths",
    source: sourceFor(artifact),
    bars
  };
}

function imdHeatStateBars(artifact: Artifact, title: string, subtitle: string, limit = 10): BarVisual | null {
  if (artifact.indicatorId !== "heat.imd_dwe_2024.heatwave_deaths_by_state") return null;
  const bars = (artifact.rows || [])
    .map((row) => ({ label: String(row.stateOrUt || ""), value: numberFrom(row.humanDeaths) || 0 }))
    .filter((row) => row.label && row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
  if (!bars.length) return null;
  return {
    kind: "bar",
    title,
    subtitle,
    unit: "reported deaths",
    source: sourceFor(artifact),
    bars
  };
}

function owidExtremeTemperatureDeathsLine(artifact: Artifact, title: string, subtitle: string, fromYear?: number): LineVisual | null {
  if (artifact.indicatorId !== "heat.reported_extreme_temperature_deaths.owid_emdat") return null;
  const points = sortPoints((artifact.rows || [])
    .map((row) => ({
      date: String(row.year || ""),
      value: numberFrom(row.reportedExtremeTemperatureDeaths) ?? NaN
    }))
    .filter((point) => Number.isFinite(point.value) && (!fromYear || Number(point.date) >= fromYear)));
  if (points.length < 2) return null;
  return {
    kind: "line",
    title,
    subtitle,
    unit: "reported deaths",
    source: sourceFor(artifact),
    lines: [{ label: "Reported extreme-temperature deaths", points }]
  };
}

type PlanEntry = {
  indicator: string;
  chart: string;
  title?: string;
  size?: string;
  unit?: string;
  field?: string;
  item?: string;
  measure?: string;
  limit?: number;
  subtitle?: string;
  seriesName?: string;
  series?: Array<{ indicator: string; label: string }>;
  panels?: Array<{ label: string; series: Array<{ indicator: string; label: string }> }>;
  rows?: Array<{ label: string; series: Array<{ indicator: string; label: string }> }>;
  columns?: Array<{ key: string; label: string }>;
  fromYear?: number;
  bands?: Array<{ year: number; label?: string }>;
  years?: number[];
  denominator?: string;
  why?: string;
  detail?: string;
  read?: string;
  watch?: string;
  rankLabel?: string;
  bottomLabel?: string;
  signed?: boolean;
  ramp?: string;
  diverging?: boolean;
  divergeAt?: number;
};

// --- Builders for richer analysis types (reuse existing renderers where possible) ---

// Wide table -> one line per named column (e.g. GHG by gas: CO2 / CH4 / N2O).
function columnLinesVisual(artifact: Artifact, columns: Array<{ key: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): LineVisual | null {
  const rows = (artifact.rows || []).filter((row) => !fromYear || Number(dateFrom(row)) >= fromYear);
  if (!rows.length || !columns.length) return null;
  const lines = columns
    .map((col) => ({ label: col.label, points: sortPoints(rows.map((row) => ({ date: dateFrom(row), value: numberFrom(row[col.key]) ?? NaN }))) }))
    .filter((line) => line.points.length >= 2);
  if (!lines.length) return null;
  return { kind: "line", title, subtitle: subtitle || artifact.sourceId, unit, source: sourceFor(artifact), lines };
}

// Seasonal cycle by year: each selected year becomes a line across the 12 months, so the
// whole annual temperature curve visibly marches upward over the decades. A curated set
// of years (not all ~85) keeps it elegant rather than spaghetti. Expects a monthly table
// with a "Day" column (YYYY-MM-15) and a "Monthly average" value.
function seasonalByYear(artifact: Artifact, years: number[], title: string, subtitle: string, unit: string): LineVisual | null {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const byKey = new Map<string, number>();
  for (const row of artifact.rows || []) {
    const m = String(row.Day || row.date || "").match(/^(\d{4})-(\d{2})/);
    const value = numberFrom(row["Monthly average"] ?? row.value);
    if (!m || value === null) continue;
    byKey.set(`${Number(m[1])}-${Number(m[2])}`, value);
  }
  // Each entry is a decade start: average the 10-year window per month so the curve is a
  // smooth decadal climatology, not a single noisy year (a single Dec can buck the trend).
  const byMonthDecade = new Map<string, number[]>();
  for (const row of artifact.rows || []) {
    const m = String(row.Day || row.date || "").match(/^(\d{4})-(\d{2})/);
    const value = numberFrom(row["Monthly average"] ?? row.value);
    if (!m || value === null) continue;
    const yr = Number(m[1]);
    const decade = years.find((y) => yr >= y && yr <= y + 9);
    if (decade === undefined) continue;
    const key = `${decade}-${Number(m[2])}`;
    (byMonthDecade.get(key) || byMonthDecade.set(key, []).get(key)!).push(value);
  }
  const decadeLabel = (y: number) => (y >= 2000 ? `${y}–${String(y + 9).slice(2)}` : `${y}s`);
  const lines = years
    .map((year) => {
      const points = months
        .map((name, i) => {
          const vals = byMonthDecade.get(`${year}-${i + 1}`);
          return vals && vals.length ? { date: name, value: Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)) } : null;
        })
        .filter((p): p is Point => Boolean(p));
      return points.length >= 6 ? { label: decadeLabel(year), points } : null;
    })
    .filter((line): line is LineVisual["lines"][number] => Boolean(line));
  if (lines.length < 2) return null;
  return { kind: "line", title, subtitle: subtitle || artifact.sourceId, unit, source: sourceFor(artifact), lines };
}

// Latest row of a wide table -> composition strip (e.g. GHG by sector, this year).
function compositionStackVisual(artifact: Artifact, columns: Array<{ key: string; label: string }>, title: string, subtitle: string, unit: string): StackVisual | null {
  const rows = artifact.rows || [];
  if (!rows.length || !columns.length) return null;
  const latest = [...rows].sort((a, b) => String(dateFrom(a)).localeCompare(String(dateFrom(b)))).at(-1);
  if (!latest) return null;
  const segments = columns
    .map((col) => ({ label: col.label, value: numberFrom(latest[col.key]) ?? 0 }))
    .filter((seg) => seg.value > 0)
    .sort((a, b) => b.value - a.value);
  if (segments.length < 2) return null;
  return { kind: "stack", title, subtitle: subtitle || `${artifact.sourceId} · ${dateFrom(latest)}`, unit, source: sourceFor(artifact), segments };
}

// Decade-average of the value column -> bars (diverging when values cross zero,
// e.g. temperature anomaly: cool decades below the line, hot decades above).
function decadeMeanBars(artifact: Artifact, title: string, subtitle: string, unit: string): BarVisual | null {
  const line = lineFor(artifact);
  if (!line || !line.lines[0]) return null;
  const points = line.lines[0].points.map((p) => ({ year: Number(p.date), value: p.value })).filter((p) => Number.isInteger(p.year));
  if (points.length < 10) return null;
  const byDecade = new Map<number, number[]>();
  for (const p of points) {
    const decade = Math.floor(p.year / 10) * 10;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade)!.push(p.value);
  }
  const bars = [...byDecade.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, vals]) => ({ label: `${decade}s`, value: Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(3)) }));
  if (bars.length < 2) return null;
  return { kind: "bar", title, subtitle: subtitle || `${artifact.sourceId} · decade average`, unit, source: sourceFor(artifact), bars };
}

// Two columns indexed to 100 at the first year -> multiLine (decoupling, e.g. GDP vs CO2).
function decoupleIndexVisual(artifact: Artifact, columns: Array<{ key: string; label: string }>, title: string, subtitle: string): LineVisual | null {
  const rows = artifact.rows || [];
  if (columns.length < 2) return null;
  const lines = columns
    .map((col) => {
      const pts = sortPoints(rows.map((row) => ({ date: dateFrom(row), value: numberFrom(row[col.key]) ?? NaN })));
      const base = pts.find((p) => p.value !== 0)?.value;
      if (!base) return null;
      return { label: col.label, points: pts.map((p) => ({ date: p.date, value: Number(((p.value / base) * 100).toFixed(1)) })) };
    })
    .filter(Boolean) as LineVisual["lines"];
  if (lines.length < 2) return null;
  return { kind: "line", title, subtitle: subtitle || "indexed · first year = 100", unit: "index (first yr = 100)", source: sourceFor(artifact), lines };
}

// Warming stripes: one coloured band per year, blue (cool) to red (hot).
function warmingStripes(artifact: Artifact, title: string, subtitle: string, unit: string, center?: number): StripeVisual | null {
  const line = lineFor(artifact);
  if (!line || !line.lines[0]) return null;
  const stripes = line.lines[0].points.map((p) => ({ date: p.date, value: p.value }));
  if (stripes.length < 10) return null;
  const vals = stripes.map((s) => s.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { kind: "stripes", title, subtitle: subtitle || artifact.sourceId, unit, source: sourceFor(artifact), stripes, min, max, center: center ?? (min + max) / 2 };
}

function attachMeta(visual: VisualSpec, entry: PlanEntry): VisualSpec {
  const out = { ...visual, ...(entry.title ? { title: entry.title } : {}) } as VisualSpec & { size?: string; note?: PlanNote };
  if (entry.size) out.size = entry.size;
  if (entry.why || entry.detail || entry.read || entry.watch) out.note = { why: entry.why, detail: entry.detail, read: entry.read, watch: entry.watch };
  return out;
}

function choroplethVisual(artifact: Artifact, title: string, subtitle: string, unit: string, opts: { rankLabel?: string; bottomLabel?: string; signed?: boolean; ramp?: string; divergeAt?: number } = {}): ChoroplethVisual | null {
  const a = artifact as Artifact & { regions?: Array<{ name: string; value: number | null; path: string }>; viewBox?: string; min?: number; max?: number };
  if (!a.regions || a.regions.length < 2) return null;
  const values = a.regions.map((r) => r.value).filter((v): v is number => v !== null && v !== undefined);
  return {
    kind: "choropleth",
    title: title || artifact.title,
    subtitle: subtitle || `${artifact.sourceId} · by state`,
    unit,
    source: sourceFor(artifact),
    viewBox: a.viewBox || "0 0 740 820",
    regions: a.regions,
    min: a.min ?? Math.min(...values),
    max: a.max ?? Math.max(...values),
    rankLabel: opts.rankLabel,
    bottomLabel: opts.bottomLabel,
    signed: opts.signed,
    ramp: opts.ramp,
    divergeAt: opts.divergeAt
  };
}

function sparkGridVisual(series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, fromYear?: number): SparkGridVisual | null {
  const clip = (points: LineVisual["lines"][number]["points"]) =>
    fromYear ? points.filter((p) => Number(String(p.date).slice(0, 4)) >= fromYear) : points;
  // Per-cell change uses decade averages (first 10 vs last 10 points), matching the
  // ranked chart's method — so the magnitude shown on each sparkline is robust to a
  // single noisy endpoint year, not first-point-minus-last-point.
  const decadeMean = (pts: Array<{ value: number }>, end: "first" | "last") => {
    const slice = end === "first" ? pts.slice(0, 10) : pts.slice(-10);
    return slice.length ? slice.reduce((s, p) => s + p.value, 0) / slice.length : 0;
  };
  const cells = (series || [])
    .map((item) => {
      const artifact = artifactById(item.indicator);
      const line = artifact ? lineFor(artifact) : null;
      const points = line && line.lines[0] ? clip(line.lines[0].points) : [];
      if (points.length < 2) return null;
      const change = decadeMean(points, "last") - decadeMean(points, "first");
      return { label: item.label, points, latest: points[points.length - 1].value, change };
    })
    .filter((c): c is { label: string; points: Array<{ date: string; value: number }>; latest: number; change: number } => Boolean(c));
  if (cells.length < 2) return null;
  cells.sort((a, b) => (b.latest ?? 0) - (a.latest ?? 0));
  const all = cells.flatMap((c) => c.points.map((p) => p.value));
  const first = artifactById(series[0].indicator);
  return {
    kind: "sparkGrid",
    title, subtitle, unit,
    source: first ? sourceFor(first) : { sourceId: "open-meteo", sourceIndicatorId: title },
    // min/max bound the COLOUR ramp across cells (so warmer cities read redder). The
    // sparkline geometry is auto-scaled per cell at render time, so a 1 deg C trend on a
    // 27 deg C base is visible instead of a flat line near a shared 0-based ceiling.
    min: Math.min(...all),
    max: Math.max(...all, 1),
    cells
  };
}

function linePanelsVisual(panels: NonNullable<PlanEntry["panels"]>, title: string, subtitle: string, unit: string, fromYear?: number): LinePanelsVisual | null {
  const clip = (points: Point[]) =>
    fromYear ? points.filter((p) => Number(String(p.date).slice(0, 4)) >= fromYear) : points;
  const out = (panels || [])
    .map((panel) => {
      const lines = (panel.series || [])
        .map((item) => {
          const artifact = artifactById(item.indicator);
          const line = artifact ? lineFor(artifact) : null;
          const points = line?.lines?.[0]?.points ? clip(line.lines[0].points) : [];
          return points.length >= 2 ? { label: item.label, points } : null;
        })
        .filter((line): line is LineVisual["lines"][number] => Boolean(line));
      return lines.length ? { label: panel.label, lines } : null;
    })
    .filter((panel): panel is LinePanelsVisual["panels"][number] => Boolean(panel));
  if (out.length < 1) return null;
  const values = out.flatMap((panel) => panel.lines.flatMap((line) => line.points.map((point) => point.value)));
  const firstIndicator = panels?.[0]?.series?.[0]?.indicator || "";
  const first = artifactById(firstIndicator);
  return {
    kind: "linePanels",
    title,
    subtitle,
    unit,
    source: first ? sourceFor(first) : { sourceId: "open-meteo", sourceIndicatorId: title },
    panels: out,
    min: Math.min(0, ...values),
    max: Math.max(...values, 1)
  };
}

function rankedChangeVisual(series: Array<{ indicator: string; label: string }>, title: string, subtitle: string, unit: string, baselineYears = 10, latestYears = 10, diverging = false): RankedChangeVisual | null {
  const rows = (series || [])
    .map((item) => {
      const artifact = artifactById(item.indicator);
      const line = artifact ? lineFor(artifact) : null;
      const points = line?.lines?.[0]?.points || [];
      if (points.length < 2) return null;
      const baseline = points.slice(0, Math.max(1, baselineYears));
      const latest = points.slice(-Math.max(1, latestYears));
      const start = baseline.reduce((sum, point) => sum + point.value, 0) / baseline.length;
      const end = latest.reduce((sum, point) => sum + point.value, 0) / latest.length;
      return { label: item.label, start, end, change: end - start };
    })
    .filter((row): row is RankedChangeVisual["rows"][number] => Boolean(row));
  if (rows.length < 2) return null;
  // Diverging mode ranks by the CHANGE itself (warming amount); default ranks by current level.
  rows.sort((a, b) => diverging ? (b.change - a.change) : (b.end - a.end));
  const first = artifactById(series[0].indicator);
  const firstPoints = first ? lineFor(first)?.lines?.[0]?.points || [] : [];
  const baselineStart = firstPoints.at(0)?.date || "baseline";
  const baselineEnd = firstPoints.at(Math.min(Math.max(1, baselineYears), firstPoints.length) - 1)?.date || baselineStart;
  const latestStart = firstPoints.at(Math.max(0, firstPoints.length - Math.max(1, latestYears)))?.date || "latest";
  const latestEnd = firstPoints.at(-1)?.date || latestStart;
  const max = Math.max(...rows.flatMap((row) => [row.start, row.end]), 1);
  const min = Math.min(...rows.flatMap((row) => [row.start, row.end]));
  return {
    kind: "rankedChange",
    diverging,
    title,
    subtitle,
    unit,
    source: first ? sourceFor(first) : { sourceId: "open-meteo", sourceIndicatorId: title },
    startLabel: baselineStart === baselineEnd ? baselineStart : `${baselineStart}-${baselineEnd}`,
    endLabel: latestStart === latestEnd ? latestStart : `${latestStart}-${latestEnd}`,
    min,
    max,
    rows
  };
}

function scenarioMapsVisual(artifact: Artifact, title: string, subtitle: string, unit: string): ScenarioMapsVisual | null {
  const a = artifact as Artifact & { scenarios?: ScenarioMapsVisual["panels"]; viewBox?: string; min?: number; max?: number };
  if (!a.scenarios || a.scenarios.length < 2) return null;
  const all = a.scenarios.flatMap((p) => p.regions.map((r) => r.value)).filter((v): v is number => v !== null && v !== undefined);
  return {
    kind: "scenarioMaps",
    title: title || artifact.title,
    subtitle: subtitle || `${artifact.sourceId} · by state`,
    unit,
    source: sourceFor(artifact),
    viewBox: a.viewBox || "0 0 740 820",
    min: a.min ?? 0,
    max: a.max ?? (all.length ? Math.max(...all) : 100),
    panels: a.scenarios
  };
}

// Build a "then vs now" pair of 100%-stacked share strips from two indicator sets.
function stripPairVisual(
  rows: Array<{ label: string; series: Array<{ indicator: string; label: string }> }>,
  title: string, subtitle: string, unit: string
): StripPairVisual | null {
  const out = (rows || []).map((row) => ({
    label: row.label,
    segments: (row.series || []).map((s) => {
      const a = artifactById(s.indicator);
      const p = a ? latestPoint(a) : null;
      return p ? { label: s.label, value: p.value } : null;
    }).filter((x): x is { label: string; value: number } => Boolean(x))
  })).filter((r) => r.segments.length >= 2);
  if (out.length < 2) return null;
  const first = artifactById(rows[0]?.series?.[0]?.indicator || "");
  return {
    kind: "stripPair", title, subtitle, unit,
    source: first ? sourceFor(first) : { sourceId: "mospi", sourceIndicatorId: title },
    rows: out
  };
}

function buildPlannedVisual(entry: PlanEntry): VisualSpec | null {
  if (entry.chart === "multiLine") {
    const visual = multiSeriesLine(entry.series || [], entry.title || "", entry.subtitle || "", entry.unit || "", entry.fromYear, entry.bands);
    return visual ? attachMeta(visual, entry) : null;
  }
  if (entry.chart === "sparkGrid") {
    const visual = sparkGridVisual(entry.series || [], entry.title || "", entry.subtitle || "", entry.unit || "", entry.fromYear);
    return visual ? attachMeta(visual, entry) : null;
  }
  if (entry.chart === "linePanels") {
    const visual = linePanelsVisual(entry.panels || [], entry.title || "", entry.subtitle || "", entry.unit || "", entry.fromYear);
    return visual ? attachMeta(visual, entry) : null;
  }
  if (entry.chart === "rankedChange") {
    const visual = rankedChangeVisual(entry.series || [], entry.title || "", entry.subtitle || "", entry.unit || "", 10, 10, Boolean(entry.diverging));
    return visual ? attachMeta(visual, entry) : null;
  }
  if (entry.chart === "latestBars") {
    const visual = latestBarsFromIndicators(entry.series || [], entry.title || "", entry.subtitle || "", entry.unit || "");
    return visual ? attachMeta(visual, entry) : null;
  }
  if (entry.chart === "tableBars") {
    const visual = barsFromTableRows(entry.indicator || "", entry.title || "", entry.subtitle || "", entry.unit || "");
    return visual ? attachMeta(visual, entry) : null;
  }
  if (entry.chart === "stripPair") {
    const visual = stripPairVisual(entry.rows || [], entry.title || "", entry.subtitle || "", entry.unit || "");
    return visual ? attachMeta(visual, entry) : null;
  }
  if (entry.chart === "waqiCompare") {
    const visual = waqiCityCompareBars(entry.series || [], entry.title || "", entry.subtitle || "", entry.unit || "");
    return visual ? attachMeta(visual, entry) : null;
  }
  const artifact = artifactById(entry.indicator);
  if (!artifact) return null;
  let visual: VisualSpec | null = null;
  switch (entry.chart) {
    case "line": visual = lineFor(artifact); break;
    case "pyramid": visual = pyramidVisual(artifact); break;
    case "ageBands": visual = ageBandBars(artifact); break;
    case "ageStructure": visual = ageStructureShares(artifact); break;
    case "broadShares": visual = genericBarForLatestRows(artifact); break;
    case "dependencyLine": visual = dependencyLine(artifact); break;
    case "scenarioSpread": visual = variantBars(artifact); break;
    case "stack": visual = latestStack(artifact); break;
    case "emberShare": visual = emberSourceShare(artifact, entry.seriesName || "", entry.title || ""); break;
    case "emberLines": visual = emberSeriesLines(artifact, entry.series || [], entry.field || "generation_twh", entry.title || "", entry.unit || "TWh"); break;
    case "waqiBars": visual = waqiBars(artifact); break;
    case "comtradePartnerBars": visual = comtradePartnerBars(artifact, entry.title || artifact.title, entry.subtitle || "", entry.field || "primaryValue", entry.limit || 10); break;
    case "comtradeCommodityBars": visual = comtradeCommodityBars(artifact, entry.title || artifact.title, entry.subtitle || "", entry.field || "primaryValue", entry.limit || 10); break;
    case "tradestatPartnerBars": visual = tradeStatPartnerBars(artifact, entry.title || artifact.title, entry.subtitle || "", entry.field || "valueCurrentUsdMillion", entry.limit || 10); break;
    case "tradestatPartnerHistoryLines": visual = tradeStatPartnerHistoryLines(artifact, entry.series || [], entry.field || "valueUsdMillion", entry.title || artifact.title, entry.subtitle || "", entry.unit || "US$ billions"); break;
    case "ppacMonthlyBars": visual = ppacMonthlyBars(artifact, entry.item || "", entry.title || artifact.title, entry.subtitle || "", entry.limit || 12, entry.measure || ""); break;
    case "fuelSpendBars": visual = fuelSpendBars(artifact, entry.measure || "usd_billion", entry.title || artifact.title, entry.subtitle || ""); break;
    case "sibcLines": visual = sibcLines(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "sibcShareLines": visual = sibcShareLines(artifact, entry.series || [], entry.denominator || "bank_credit_totals:I", entry.title || artifact.title, entry.subtitle || "", entry.fromYear); break;
    case "sibcShareChangeBars": visual = sibcShareChangeBars(artifact, entry.series || [], entry.denominator || "bank_credit_totals:I", entry.title || artifact.title, entry.subtitle || "", entry.fromYear); break;
    case "sibcGrowthMultipleBars": visual = sibcGrowthMultipleBars(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.fromYear); break;
    case "sibcLatestBars": visual = sibcLatestBars(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "sibcLatestStack": visual = sibcLatestStack(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "idhCreditLines": visual = idhCreditLines(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "idhCreditLatestBars": visual = idhCreditLatestBars(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "idhCreditLatestStack": visual = idhCreditLatestStack(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "idhCreditGrowthBars": visual = idhCreditGrowthBars(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.fromYear); break;
    case "countryMetricLines": visual = countryMetricLines(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "countryMetricLatestBars": visual = countryMetricLatestBars(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "countryMetricLatestStack": visual = countryMetricLatestStack(artifact, entry.series || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "compareBars": visual = comparisonLatestBars(artifact); break;
    case "compareLine": visual = artifact.indicatorId === "econ.compare.gdp_per_capita_current_usd" ? comparisonLineVisual(artifact) : multiCountryLine(artifact, entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit); break;
    case "columnLines": visual = columnLinesVisual(artifact, entry.columns || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, entry.fromYear); break;
    case "seasonalByYear": visual = seasonalByYear(artifact, entry.years || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit); break;
    case "compositionStack": visual = compositionStackVisual(artifact, entry.columns || [], entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit); break;
    case "decadeBars": visual = decadeMeanBars(artifact, entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit); break;
    case "decoupleIndex": visual = decoupleIndexVisual(artifact, entry.columns || [], entry.title || artifact.title, entry.subtitle || ""); break;
    case "stripes": visual = warmingStripes(artifact, entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit); break;
    case "choropleth": visual = choroplethVisual(artifact, entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit, { rankLabel: entry.rankLabel, bottomLabel: entry.bottomLabel, signed: entry.signed, ramp: entry.ramp, divergeAt: entry.divergeAt }); break;
    case "scenarioMaps": visual = scenarioMapsVisual(artifact, entry.title || artifact.title, entry.subtitle || "", entry.unit || artifact.unit); break;
    case "heatDeathCountBars": visual = heatDeathCountBars(artifact, entry.title || artifact.title, entry.subtitle || "Curated sources · rows answer different questions"); break;
    case "deathCertificationFunnelBars": visual = deathCertificationFunnelBars(artifact, entry.title || artifact.title, entry.subtitle || "CRS 2023 death registration + MCCD 2023 medical certification"); break;
    case "heatVulnerabilityScatter": visual = heatVulnerabilityScatter(artifact, entry.title || artifact.title, entry.subtitle || "CEEW heat risk + NSS cooling + NITI MPI"); break;
    case "heatSensitivityBars": visual = heatSensitivityBars(artifact, entry.title || artifact.title, entry.subtitle || "Illustrative denominator model, not epidemiological attribution"); break;
    case "heatSensitivityFiveDayBars": visual = heatSensitivityFiveDayBars(artifact, entry.title || artifact.title, entry.subtitle || "One-day scenarios multiplied by five for scale only"); break;
    case "imdHeatMonthBars": visual = imdHeatMonthBars(artifact, entry.title || artifact.title, entry.subtitle || "IMD Disastrous Weather Events 2024 · Table 7"); break;
    case "imdHeatStateBars": visual = imdHeatStateBars(artifact, entry.title || artifact.title, entry.subtitle || "IMD Disastrous Weather Events 2024 · Table 22", entry.limit || 10); break;
    case "owidExtremeTemperatureDeathsLine": visual = owidExtremeTemperatureDeathsLine(artifact, entry.title || artifact.title, entry.subtitle || "OWID / EM-DAT · reported extreme-temperature disaster deaths", entry.fromYear); break;
    case "decadeChange": { const line = lineFor(artifact); visual = line ? decadeChangeVisual(line) : null; break; }
    case "change": { const line = lineFor(artifact); visual = line ? changeVisual(line) : null; break; }
    case "recentBars": { const line = lineFor(artifact); visual = line ? recentBars(line) : null; break; }
    default: visual = lineFor(artifact);
  }
  return visual ? attachMeta(visual, entry) : null;
}

// Curated path: render exactly the planned charts, in order. No auto-companions.
function curatedVisualsForQuestion(page: QuestionPage): VisualSpec[] {
  const seen = new Set<string>();
  return (page.visualPlan || [])
    .map(buildPlannedVisual)
    .filter((visual): visual is VisualSpec => Boolean(visual))
    .filter((visual) => {
      const key = `${visual.kind}:${visual.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function visualsForQuestion(page: QuestionPage) {
  // Curated visual plan wins: show exactly the editorially chosen charts, in order.
  if (page.visualPlan && page.visualPlan.length) return curatedVisualsForQuestion(page);
  // When a question declares an explicit `context` scope in the registry, charts
  // are built from core ∪ context — the same indicator set the prose sees — so the
  // page never shows a chart the article doesn't discuss (and vice versa).
  // Otherwise fall back to the legacy indicators + companionIndicators override.
  const indicatorIds = page.context
    ? [...page.core, ...page.context]
    : [...page.indicators, ...(companionIndicators[page.id] || [])];
  const matched = indicatorIds
    .flatMap((indicator) => artifacts.filter((artifact) => artifact.indicatorId === indicator));
  if (page.id === "q.econ.size") return economySizeVisuals(matched);
  if (page.id === "q.world.share") return worldShareVisuals(matched);
  const visualGroups = matched.map(visualsForArtifact).filter((group) => group.length);
  const firstPass = visualGroups.flatMap((group) => group.filter((item) => item.role === "primary"));
  const contextPass = visualGroups.flatMap((group) => group.filter((item) => item.role === "context").slice(0, 1));
  const companionPass = visualGroups
    .slice(0, 1)
    .flatMap((group) => group.filter((item) => item.role === "companion").slice(0, 2));
  const seen = new Set<string>();
  const visuals = [...firstPass, ...contextPass, ...companionPass].map((item) => item.visual).filter((visual) => {
    const key = `${visual.kind}:${visual.title}:${visual.subtitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return visuals.slice(0, page.id === "q.econ.compare" ? 14 : 10);
}

// --- Story binding -------------------------------------------------------
// Pair each prose section with the chart it actually discusses, instead of
// zipping charts to sections by array position. An explicit map from the
// generated prose wins; otherwise we score token overlap between the section
// text and each visual, and only bind when the match is confident.

const STORY_STOPWORDS = new Set([
  "india", "indian", "indians", "what", "does", "this", "that", "with", "from",
  "have", "into", "over", "more", "than", "then", "they", "their", "them",
  "about", "which", "while", "still", "much", "many", "very", "just", "like",
  "show", "shows", "showing", "here", "there", "these", "those", "when", "where",
  "year", "years", "rate", "ratio", "total", "number", "numbers", "value", "values",
  "data", "chart", "charts", "people", "population"
]);

// Light synonym expansion so prose words reach the indicator vocabulary.
const STORY_SYNONYMS: Record<string, string[]> = {
  growing: ["growth", "change", "grow"],
  growth: ["growing", "change"],
  fertility: ["births", "fertility", "woman", "children", "birth"],
  ageing: ["age", "median", "older", "old"],
  age: ["median", "ageing", "old"],
  income: ["gdp", "capita", "rupee", "dollar"],
  rich: ["gdp", "capita", "income"],
  jobs: ["labour", "labor", "workforce", "employment", "participation"],
  work: ["labour", "labor", "employment", "participation", "workforce"],
  women: ["female", "women"],
  emit: ["co2", "emissions", "carbon"],
  emissions: ["co2", "carbon", "emit"],
  electricity: ["generation", "power", "grid"],
  coal: ["fossil", "generation"],
  renewables: ["solar", "wind", "renewable", "clean"],
  tax: ["revenue", "fiscal"],
  air: ["aqi", "pollution", "pm"],
  die: ["mortality", "deaths", "death"],
  death: ["mortality", "deaths"],
  live: ["life", "expectancy", "survival"]
};

function storyTokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of String(text || "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 4 || STORY_STOPWORDS.has(raw)) continue;
    out.add(raw);
    for (const syn of STORY_SYNONYMS[raw] || []) out.add(syn);
  }
  return out;
}

function visualTokens(visual: VisualSpec): Set<string> {
  const indicatorText = String(visual.source.indicatorId || visual.source.sourceIndicatorId || "").replace(/[._]/g, " ");
  const parts = [visual.title, visual.subtitle, indicatorText];
  return storyTokens(parts.join(" "));
}

function slugifyTitle(value: string): string {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function visualMatchesId(visual: VisualSpec, visualId: string): boolean {
  const id = visualId.toLowerCase().trim();
  // Primary: the chart slug (plannedCharts.chartId = slug of the title) uniquely
  // identifies each chart, even when two charts share a source indicator.
  const slug = slugifyTitle(visual.title);
  if (id === slug || slugifyTitle(visualId) === slug) return true;
  // Fallbacks for older maps that referenced the title or indicator id directly.
  if (id === visual.title.toLowerCase().trim()) return true;
  const indicator = (visual.source.indicatorId || "").toLowerCase();
  if (!indicator) return false;
  return id === indicator || id.endsWith(indicator) || indicator.endsWith(id.replace(/^v\d+\./, ""));
}

export type BoundSection = { heading: string; text: string };

/**
 * Bind visuals to story sections. Returns one entry per section (the chart that
 * belongs beside it, or null) plus any visuals that did not match a section.
 * `explicitMap` is heading -> visualId from the generated prose, used first.
 */
export function bindSectionVisuals(
  sections: BoundSection[],
  visuals: VisualSpec[],
  explicitMap?: Record<string, string>
) {
  const used = new Set<number>();
  const bound: Array<VisualSpec | null> = [];
  const hasExplicitMap = Boolean(explicitMap && Object.keys(explicitMap).length);

  for (const section of sections) {
    let pick = -1;

    const explicitId = explicitMap?.[section.heading];
    if (explicitId) {
      pick = visuals.findIndex((visual, index) => !used.has(index) && visualMatchesId(visual, explicitId));
    }

    // Token match as a fallback whenever the explicit map did not resolve this section
    // (including when the map exists but its chartId did not match any chart).
    if (pick < 0) {
      const sectionSet = storyTokens(`${section.heading} ${section.text}`);
      let bestScore = 0;
      visuals.forEach((visual, index) => {
        if (used.has(index)) return;
        let score = 0;
        for (const token of visualTokens(visual)) if (sectionSet.has(token)) score += 1;
        if (score > bestScore) {
          bestScore = score;
          pick = index;
        }
      });
      // Require a confident overlap; a wrong chart is worse than no chart.
      if (bestScore < 2) pick = -1;
    }

    if (pick >= 0) {
      used.add(pick);
      bound.push(visuals[pick]);
    } else {
      bound.push(null);
    }
  }

  // Positional fallback: the article is written one section per planned chart, in order,
  // so any section still without a chart takes the next unused chart in sequence. Without
  // this, a poor LLM sectionVisualMap orphans every chart into the 2-up leftover grid,
  // leaving the article body as text only.
  let nextUnused = 0;
  for (let s = 0; s < bound.length; s += 1) {
    if (bound[s] !== null) continue;
    while (nextUnused < visuals.length && used.has(nextUnused)) nextUnused += 1;
    if (nextUnused < visuals.length) {
      bound[s] = visuals[nextUnused];
      used.add(nextUnused);
    }
  }

  const leftover = visuals.filter((_, index) => !used.has(index));
  return { bound, leftover };
}
