import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SERIES_DIR = resolve(process.cwd(), "data/series");
const OUT_DIR = resolve(process.cwd(), "data/audits");
const OUT_JSON = resolve(OUT_DIR, "india-warming-data-audit.json");
const OUT_MD = resolve(OUT_DIR, "india-warming-data-audit.md");

const REQUIRED = [
  "climate.era5.temp_mean",
  "climate.era5.dewpoint_mean",
  "climate.era5.rel_humidity_mean",
  "climate.era5.precip_total",
  "climate.era5.hotdays40_observed",
  "climate.era5.warmnights26_observed",
  "climate.era5.state_warming",
  "climate.imd.temperature_official_anchors",
  "climate.derived.temp_anomaly_owid_1991_2020",
  "climate.derived.temp_anomaly_era5_1991_2020",
  "climate.derived.temp_anomaly_berkeley_1991_2020",
  "climate.derived.seasonal_temp_anomaly_winter",
  "climate.derived.seasonal_temp_anomaly_pre_monsoon",
  "climate.derived.seasonal_temp_anomaly_southwest_monsoon",
  "climate.derived.seasonal_temp_anomaly_post_monsoon",
  "climate.derived.seasonal_temp_anomaly_decades",
  "climate.temp_anomaly_annual",
  "climate.surface_temp_monthly",
  "climate.precipitation_annual",
  "climate.berkeley.temp_anomaly",
  "climate.berkeley.temp_abs",
  "climate.cckp.temp_historical",
  "climate.cckp.temp_ssp126",
  "climate.cckp.temp_ssp245",
  "climate.cckp.temp_ssp585",
  "climate.cckp.heatindex39_historical",
  "climate.cckp.heatindex39_ssp126",
  "climate.cckp.heatindex39_ssp245",
  "climate.cckp.heatindex39_ssp585",
  "climate.cckp.cdd_historical",
  "climate.cckp.cdd_ssp245",
  "climate.el_nino.imd_monsoon_departure_1901_2025",
  "heat.ceew.districts_high_risk_share",
  "heat.ceew.population_high_risk_share",
  "heat.ceew.state_heat_risk",
  "heat.vulnerability.state_risk_cooling_poverty",
  "heat.cooling.ac_all",
  "heat.cooling.cooler_all",
  "heat.cooling.nfhs6_electricity_all",
  "heat.cooling.nfhs5_fan_all",
  "heat.lancet_countdown_2025.extracted_indicators",
  "heat.work.lancet_labour_loss_sector_shares",
  "heat.work.worker_security_exposure",
  "agriculture.des.all_india_crop_apy",
  "agriculture.derived.rainfall_crop_apy_panel",
  "prices.derived.monsoon_food_inflation_panel",
  "water.cgwb.stage_by_state",
  "water.cgwb.stage_state_trend",
  "energy.ember.demand",
  "climate.psmsl.mumbai",
  "climate.psmsl.chennai",
  "climate.pm25_exposure",
  "owid.co2_total",
  "compare.climate.co2_per_capita",
  "compare.climate.co2_cumulative"
];

const OPTIONAL_PATTERNS = [
  /^climate\.openmeteo\..*\.(mean_temperature|mean_apparent_temperature|very_hot_days|hot_nights|humid_heat_days|precipitation_sum|rainy_days)$/,
  /^work\.who\.(status_|informal_|casual_|self_emp_)/,
  /^climate\.cckp\.(hotdays40|warmnights26)/,
  /^agriculture\.el_nino\./,
  /^prices\.el_nino\./,
  /^water\./
];

const findings = [];

function add(severity, code, indicatorId, message, detail = undefined) {
  findings.push({ severity, code, indicatorId, message, ...(detail === undefined ? {} : { detail }) });
}

function num(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function yearFrom(value) {
  const m = String(value || "").match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sortedPoints(points) {
  return points
    .filter((p) => Number.isFinite(p.value) && Number.isFinite(yearFrom(p.date)))
    .map((p) => ({ date: String(p.date), year: yearFrom(p.date), value: Number(p.value) }))
    .sort((a, b) => a.year - b.year || String(a.date).localeCompare(String(b.date)));
}

function tablePoints(artifact) {
  const id = artifact.indicatorId;
  const rows = Array.isArray(artifact.rows) ? artifact.rows : [];
  const fieldById = {
    "climate.temp_anomaly_annual": ["Year", "Temperature anomaly"],
    "climate.precipitation_annual": ["Year", "Annual precipitation"]
  };
  if (fieldById[id]) {
    const [dateKey, valueKey] = fieldById[id];
    return sortedPoints(rows.map((r) => ({ date: r[dateKey], value: num(r[valueKey]) })));
  }
  if (id === "climate.surface_temp_monthly") {
    const byYear = new Map();
    for (const row of rows) {
      const year = yearFrom(row.Day);
      const value = num(row["Monthly average"]);
      if (!year || value === null) continue;
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(value);
    }
    return [...byYear.entries()]
      .filter(([, values]) => values.length === 12)
      .map(([year, values]) => ({ date: String(year), year, value: values.reduce((s, v) => s + v, 0) / values.length }))
      .sort((a, b) => a.year - b.year);
  }
  return [];
}

function pointsFor(artifact) {
  if (Array.isArray(artifact.observations)) return sortedPoints(artifact.observations);
  return tablePoints(artifact);
}

function range(points) {
  if (!points.length) return null;
  return {
    n: points.length,
    start: points[0].date,
    end: points.at(-1).date,
    min: Math.min(...points.map((p) => p.value)),
    max: Math.max(...points.map((p) => p.value)),
    latest: points.at(-1)
  };
}

function baseline(points, start, end) {
  const values = points.filter((p) => p.year >= start && p.year <= end).map((p) => p.value);
  if (!values.length) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function rebase(points, start, end) {
  const b = baseline(points, start, end);
  if (b === null) return [];
  return points.map((p) => ({ ...p, value: p.value - b }));
}

function byYear(points) {
  return new Map(points.map((p) => [p.year, p.value]));
}

function overlapDiff(a, b) {
  const bm = byYear(b);
  const diffs = [];
  for (const p of a) {
    if (!bm.has(p.year)) continue;
    diffs.push({ year: p.year, diff: p.value - bm.get(p.year), abs: Math.abs(p.value - bm.get(p.year)) });
  }
  diffs.sort((x, y) => x.year - y.year);
  return diffs;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function summarizeDiff(name, diffs, warnMedian, warnMax) {
  const med = median(diffs.map((d) => d.abs));
  const max = Math.max(...diffs.map((d) => d.abs), 0);
  const worst = diffs.reduce((best, d) => (!best || d.abs > best.abs ? d : best), null);
  if (!diffs.length) {
    add("error", "cross-source-no-overlap", name, "No overlapping years for cross-source comparison");
    return { n: 0 };
  }
  const summary = {
    n: diffs.length,
    start: diffs[0].year,
    end: diffs.at(-1).year,
    medianAbsDiff: Number(med.toFixed(3)),
    maxAbsDiff: Number(max.toFixed(3)),
    worstYear: worst?.year,
    worstDiff: worst ? Number(worst.diff.toFixed(3)) : null
  };
  if (med > warnMedian) add("warning", "cross-source-median-diff", name, "Median absolute difference exceeds threshold", summary);
  if (max > warnMax) add("warning", "cross-source-max-diff", name, "Maximum absolute difference exceeds threshold", summary);
  return summary;
}

async function loadArtifacts() {
  const files = (await readdir(SERIES_DIR)).filter((f) => f.endsWith(".json")).sort();
  const artifacts = [];
  for (const file of files) {
    const path = resolve(SERIES_DIR, file);
    const artifact = JSON.parse(await readFile(path, "utf8"));
    if (!artifact.indicatorId) continue;
    if (REQUIRED.includes(artifact.indicatorId) || OPTIONAL_PATTERNS.some((p) => p.test(artifact.indicatorId))) {
      artifacts.push({ file, path, artifact });
    }
  }
  return artifacts;
}

function checkArtifact(file, artifact) {
  const id = artifact.indicatorId;
  const isRequired = REQUIRED.includes(id);
  const text = `${id} ${artifact.title || ""} ${artifact.unit || ""}`;
  if (!artifact.sourceUrl) add("error", "missing-source-url", id, "Missing sourceUrl", file);
  else if (!isHttpUrl(artifact.sourceUrl)) add("warning", "non-http-source-url", id, "sourceUrl is not a direct HTTP(S) URL", artifact.sourceUrl);
  if (!artifact.sourceId) add("error", "missing-source-id", id, "Missing sourceId", file);
  if (!artifact.title) add("error", "missing-title", id, "Missing title", file);

  const pts = pointsFor(artifact);
  const r = range(pts);
  const hasRows = Array.isArray(artifact.rows) && artifact.rows.length > 0;
  const hasRegions = Array.isArray(artifact.regions) && artifact.regions.length > 0;
  const hasScenarios = Array.isArray(artifact.scenarios) && artifact.scenarios.length > 0;
  if (!r && !hasRows && !hasRegions && !hasScenarios) {
    add(isRequired ? "error" : "warning", "no-data", id, "No usable observations, rows, regions, or scenarios", file);
  }

  if (r) {
    if (r.start > r.end) add("error", "coverage-order", id, "Coverage dates are reversed", r);
    if (/days|nights|degree-days/i.test(text) && !/degree-days/i.test(text)) {
      if (r.min < 0 || r.max > 366) add("error", "day-count-range", id, "Day/night count outside 0-366 range", r);
    } else if (/temperature|temp_mean|surface_temp|temp_abs/i.test(text) && !/anomaly/i.test(text)) {
      if (r.min < -20 || r.max > 45) add("error", "temperature-range", id, "Absolute temperature outside plausible India range", r);
    }
    if (/anomaly/i.test(text) && !/%|percent|departure/i.test(text)) {
      if (r.min < -5 || r.max > 5) add("error", "anomaly-range", id, "Temperature anomaly outside plausible range", r);
    }
    if (/humidity/i.test(text)) {
      if (r.min < 0 || r.max > 100) add("error", "humidity-range", id, "Humidity outside 0-100 range", r);
    }
    if (/precip|rainfall/i.test(text) && !/%|percent|departure/i.test(text)) {
      if (r.min < 0 || r.max > 5000) add("error", "precip-range", id, "Precipitation outside broad plausible India range", r);
    }
  }
  return { points: pts, range: r };
}

function choroplethValues(artifact) {
  if (!Array.isArray(artifact.regions)) return [];
  return artifact.regions.map((r) => num(r.value)).filter((v) => v !== null);
}

function checkRequired(byId) {
  for (const id of REQUIRED) {
    if (!byId.has(id)) add("error", "missing-required", id, "Required input artifact is missing");
  }
}

function checkCrossSources(series) {
  const era5 = series.get("climate.era5.temp_mean")?.points || [];
  const owidMonthly = series.get("climate.surface_temp_monthly")?.points || [];
  const owidAnom = series.get("climate.temp_anomaly_annual")?.points || [];
  const berkeleyAbs = series.get("climate.berkeley.temp_abs")?.points || [];
  const berkeleyAnom = series.get("climate.berkeley.temp_anomaly")?.points || [];
  const cckpHist = series.get("climate.cckp.temp_historical")?.points || [];
  const derivedOwid = series.get("climate.derived.temp_anomaly_owid_1991_2020")?.points || [];
  const derivedEra5 = series.get("climate.derived.temp_anomaly_era5_1991_2020")?.points || [];
  const derivedBerkeley = series.get("climate.derived.temp_anomaly_berkeley_1991_2020")?.points || [];

  const checks = {};
  checks.era5VsOwidMonthlyAbs = summarizeDiff(
    "ERA5 annual mean vs OWID monthly annual mean",
    overlapDiff(era5, owidMonthly),
    0.15,
    0.6
  );
  checks.era5Rebased1991_2020VsOwidAnomaly = summarizeDiff(
    "ERA5 rebased 1991-2020 vs OWID annual anomaly",
    overlapDiff(rebase(era5, 1991, 2020), owidAnom),
    0.15,
    0.6
  );
  checks.era5Rebased1951_1980VsBerkeleyAnomaly = summarizeDiff(
    "ERA5 rebased 1951-1980 vs Berkeley anomaly",
    overlapDiff(rebase(era5, 1951, 1980), berkeleyAnom),
    0.45,
    1.2
  );
  checks.berkeleyAbsVsEra5Abs = summarizeDiff(
    "Berkeley absolute vs ERA5 absolute",
    overlapDiff(berkeleyAbs, era5),
    1.5,
    3.0
  );
  checks.cckpHistoricalVsEra5Abs = summarizeDiff(
    "CCKP historical model ensemble vs ERA5 absolute",
    overlapDiff(cckpHist, era5),
    1.5,
    3.0
  );
  checks.derivedEra5VsOwid1991_2020 = summarizeDiff(
    "Derived ERA5 vs OWID anomaly, both 1991-2020",
    overlapDiff(derivedEra5, derivedOwid),
    0.05,
    0.1
  );
  checks.derivedBerkeleyVsOwid1991_2020 = summarizeDiff(
    "Derived Berkeley vs OWID anomaly, both 1991-2020",
    overlapDiff(derivedBerkeley, derivedOwid),
    0.25,
    0.75
  );
  return checks;
}

function checkKnownAnchors(series, byId) {
  const owid = byYear(series.get("climate.temp_anomaly_annual")?.points || []);
  const era5 = byYear(series.get("climate.era5.temp_mean")?.points || []);
  if (owid.has(2024) && Math.abs(owid.get(2024) - 0.57244587) > 0.0001) {
    add("error", "anchor-owid-2024", "climate.temp_anomaly_annual", "OWID 2024 anomaly changed from audited snapshot", owid.get(2024));
  }
  if (era5.has(2024) && (era5.get(2024) < 23 || era5.get(2024) > 26)) {
    add("error", "anchor-era5-2024", "climate.era5.temp_mean", "ERA5 2024 annual mean is outside broad India expected range", era5.get(2024));
  }
  const imdRows = byId.get("climate.imd.temperature_official_anchors")?.artifact?.rows || [];
  const imdValue = (metric, date) => imdRows.find((row) => row.metric === metric && String(row.date) === String(date))?.value;
  if (imdValue("Annual mean land surface air temperature anomaly", "2025") !== 0.28) {
    add("error", "anchor-imd-2025", "climate.imd.temperature_official_anchors", "IMD 2025 annual anomaly anchor changed");
  }
  if (imdValue("Annual mean land surface air temperature anomaly", "2024") !== 0.65) {
    add("error", "anchor-imd-2024", "climate.imd.temperature_official_anchors", "IMD 2024 annual anomaly anchor changed");
  }
  if (imdValue("Annual mean temperature trend", "1901-2025") !== 0.68) {
    add("error", "anchor-imd-trend", "climate.imd.temperature_official_anchors", "IMD 1901-2025 annual trend anchor changed");
  }
  const stateWarming = byId.get("climate.era5.state_warming")?.artifact;
  if (stateWarming) {
    const values = choroplethValues(stateWarming);
    if (!values.length) add("error", "state-map-empty", "climate.era5.state_warming", "State warming map has no numeric region values");
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min < -1 || max > 5) add("warning", "state-map-range", "climate.era5.state_warming", "State warming values are outside expected broad range", { min, max });
  }
}

async function main() {
  const loaded = await loadArtifacts();
  const byId = new Map(loaded.map((x) => [x.artifact.indicatorId, x]));
  checkRequired(byId);

  const series = new Map();
  const inventory = [];
  for (const { file, artifact } of loaded) {
    const result = checkArtifact(file, artifact);
    series.set(artifact.indicatorId, result);
    inventory.push({
      indicatorId: artifact.indicatorId,
      file,
      title: artifact.title,
      sourceId: artifact.sourceId,
      sourceUrl: artifact.sourceUrl,
      artifactType: artifact.artifactType,
      unit: artifact.unit,
      coverage: result.range ? `${result.range.start}-${result.range.end}` : null,
      observations: result.range?.n ?? null,
      latest: result.range?.latest ?? null
    });
  }

  const crossSource = checkCrossSources(series);
  checkKnownAnchors(series, byId);

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const report = {
    ok: errors === 0,
    generatedAt: new Date().toISOString(),
    scope: "India warming flagship candidate inputs only",
    checkedArtifacts: loaded.length,
    requiredIndicators: REQUIRED.length,
    errors,
    warnings,
    crossSource,
    findings,
    inventory: inventory.sort((a, b) => a.indicatorId.localeCompare(b.indicatorId))
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(report, null, 2) + "\n");
  await writeFile(OUT_MD, markdownReport(report));
  console.log(JSON.stringify({ ok: report.ok, checkedArtifacts: report.checkedArtifacts, errors, warnings, json: "data/audits/india-warming-data-audit.json", markdown: "data/audits/india-warming-data-audit.md" }, null, 2));
  if (!report.ok) process.exitCode = 1;
}

function markdownReport(report) {
  const lines = [];
  lines.push("# India Warming Data Audit", "");
  lines.push(`Generated: ${report.generatedAt}`, "");
  lines.push(`Scope: ${report.scope}`, "");
  lines.push(`Checked artifacts: ${report.checkedArtifacts}`);
  lines.push(`Errors: ${report.errors}`);
  lines.push(`Warnings: ${report.warnings}`, "");
  lines.push("## Cross-source checks", "");
  for (const [name, s] of Object.entries(report.crossSource)) {
    lines.push(`- ${name}: ${s.n || 0} overlapping years${s.n ? `, ${s.start}-${s.end}, median abs diff ${s.medianAbsDiff}, max abs diff ${s.maxAbsDiff} in ${s.worstYear}` : ""}`);
  }
  lines.push("", "## Findings", "");
  if (!report.findings.length) lines.push("- No findings.");
  for (const f of report.findings) {
    lines.push(`- ${f.severity.toUpperCase()} ${f.indicatorId}: ${f.message}${f.detail === undefined ? "" : ` (${JSON.stringify(f.detail)})`}`);
  }
  lines.push("", "## Inventory", "");
  lines.push("| Indicator | Source | Type | Coverage | Obs | Latest |");
  lines.push("| --- | --- | --- | --- | ---: | --- |");
  for (const item of report.inventory) {
    const latest = item.latest ? `${item.latest.date}: ${Number(item.latest.value).toFixed(3)}` : "";
    lines.push(`| \`${item.indicatorId}\` | ${item.sourceId || ""} | ${item.artifactType || ""} | ${item.coverage || ""} | ${item.observations ?? ""} | ${latest} |`);
  }
  lines.push("");
  return lines.join("\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
