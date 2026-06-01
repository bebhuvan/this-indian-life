import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { QuestionPage } from "./questions";

export type Point = { date: string; value: number };
export type VisualSource = {
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
  bars: Array<{ label: string; value: number }>;
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
export type VisualSpec = LineVisual | StackVisual | BarVisual | ChangeVisual | PyramidVisual;

type Artifact = {
  artifactType?: "series" | "table";
  indicatorId: string;
  title: string;
  sourceId: string;
  sourceIndicatorId: string;
  sourceUrl?: string;
  unit: string;
  observations?: Array<{ date: string; value: number | null }>;
  rows?: Array<Record<string, unknown>>;
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
    "people.population.un.broad_age_share"
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
  "q.services.water": [
    "society.sanitation_basic"
  ]
};

function sourceFor(artifact: Artifact): VisualSource {
  return {
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
  return priority.find((key) => numberFrom(row[key]) !== null);
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
  return true;
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

  const points = sortPoints(rows
    .filter(rowPassesDefaultFilters)
    .map((row) => ({ date: dateFrom(row), value: numberFrom(row[key]) ?? NaN })));
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

function visualsForArtifact(artifact: Artifact): VisualSpec[] {
  const visuals: VisualSpec[] = [];
  const custom = [pyramidVisual(artifact), latestStack(artifact), waqiBars(artifact), genericBarForLatestRows(artifact), variantBars(artifact)]
    .filter(Boolean) as VisualSpec[];
  visuals.push(...custom);
  const line = artifact.artifactType === "series" ? seriesVisual(artifact) : tableLineVisual(artifact);
  if (line) {
    visuals.push(line);
    const companions = [changeVisual(line), recentBars(line), indexedLineVisual(line)].filter(Boolean) as VisualSpec[];
    visuals.push(...companions);
  }
  return visuals;
}

export function visualsForQuestion(page: QuestionPage) {
  const indicatorIds = [...page.indicators, ...(companionIndicators[page.id] || [])];
  const matched = indicatorIds
    .flatMap((indicator) => artifacts.filter((artifact) => artifact.indicatorId === indicator));
  const visualGroups = matched.map(visualsForArtifact).filter((group) => group.length);
  const firstPass = visualGroups.map((group) => group[0]);
  const secondPass = visualGroups.flatMap((group) => group.slice(1));
  const seen = new Set<string>();
  const visuals = [...firstPass, ...secondPass].filter((visual) => {
    const key = `${visual.kind}:${visual.title}:${visual.subtitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return visuals.slice(0, 12);
}
