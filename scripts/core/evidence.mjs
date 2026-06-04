function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function numericValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function displayValue(value, unit = "") {
  const abs = Math.abs(value);
  if (/rupees|inr|₹/i.test(unit)) {
    if (abs >= 1_000_000_000_000) return `₹${(value / 1_000_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh crore`;
    if (abs >= 10_000_000) return `₹${(value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} crore`;
    if (abs >= 100_000) return `₹${(value / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh`;
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  if (/current US\$|usd|US\$/i.test(unit) && abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)} trillion`;
  if (/people/i.test(unit) && abs >= 10_000_000) return `${(value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} crore`;
  if (/%/.test(unit)) return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} billion`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} million`;
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function latestSeriesObservation(observations) {
  return [...observations]
    .filter((row) => row.value !== null && row.value !== undefined)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
}

function earliestSeriesObservation(observations) {
  return [...observations]
    .filter((row) => row.value !== null && row.value !== undefined)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))[0];
}

function summarizeSeries(artifact) {
  const observations = Array.isArray(artifact.observations) ? artifact.observations : [];
  const earliest = earliestSeriesObservation(observations);
  const latest = latestSeriesObservation(observations);
  return {
    indicatorId: artifact.indicatorId,
    title: artifact.title,
    sourceId: artifact.sourceId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    unit: artifact.unit,
    frequency: artifact.frequency,
    geography: artifact.geography,
    observations: observations.length,
    earliest,
    latest
  };
}

function rowDate(row) {
  return row.TIME_PERIOD || row.TimeDim || row.timeLabel || row.timeId || row.time || row.year || row.Year || row.date || row.Date || row.period || "";
}

function isMetadataNumberKey(key) {
  const lower = key.toLowerCase();
  if (["id", "idx", "code", "year", "date", "period", "time", "timelabel", "timeid", "timemid"].includes(lower)) return true;
  if (["lat", "lon", "latitude", "longitude"].includes(lower)) return true;
  if (["revision", "agestart", "ageend", "agemid"].includes(lower)) return true;
  if (lower.endsWith("id") || lower.endsWith("code")) return true;
  return ["source", "variant", "category", "estimate", "sex", "location", "parent", "dim"].some((part) => lower === part || lower.startsWith(`${part}_`));
}

function summarizeTable(artifact) {
  const rows = Array.isArray(artifact.rows) ? artifact.rows : [];
  const datedRows = rows
    .map((row) => ({ row, date: rowDate(row) }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || rowPriority(b.row) - rowPriority(a.row));
  const latestRows = datedRows.slice(0, 10).map(({ row }) => row);
  return {
    indicatorId: artifact.indicatorId,
    title: artifact.title,
    sourceId: artifact.sourceId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    unit: artifact.unit,
    geography: artifact.geography,
    rows: rows.length,
    dimensions: artifact.dimensions || [],
    latestRows
  };
}

function rowPriority(row) {
  let score = 0;
  const variant = String(row.variant || row.Variant || "").toLowerCase();
  const sex = String(row.sex || row.Sex || "").toLowerCase();
  const category = String(row.category || row.Category || "").toLowerCase();
  if (variant === "median" || variant === "medium" || variant === "estimates") score += 20;
  if (variant.includes("upper") || variant.includes("lower")) score -= 10;
  if (sex === "both sexes" || sex === "total") score += 15;
  if (category === "total") score += 8;
  return score;
}

function preferredRowsForLockedNumbers(rows) {
  const datedRows = rows
    .map((row) => ({ row, date: rowDate(row) }))
    .filter((item) => item.date !== "")
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (!datedRows.length) return rows.slice(0, 10);

  const latestDate = datedRows[0].date;
  const earliestDate = datedRows[datedRows.length - 1].date;
  const forDate = (date) => datedRows
    .filter((item) => item.date === date)
    .sort((a, b) => rowPriority(b.row) - rowPriority(a.row))
    .slice(0, 5)
    .map((item) => item.row);
  return [...forDate(latestDate), ...forDate(earliestDate)];
}

function rowQualifier(row) {
  const parts = [];
  for (const key of ["variant", "sex", "category", "series", "fuel", "IndicatorCode"]) {
    if (row[key]) parts.push(String(row[key]));
  }
  return parts.length ? ` (${parts.join(", ")})` : "";
}

function lockedNumbersFromSeries(artifact) {
  const summary = summarizeSeries(artifact);
  const numbers = [];
  if (summary.latest && isFiniteNumber(summary.latest.value)) {
    numbers.push({
      label: `${artifact.title}, latest`,
      value: summary.latest.value,
      displayValue: displayValue(summary.latest.value, artifact.unit),
      date: summary.latest.date,
      unit: artifact.unit,
      sourceId: artifact.sourceId,
      indicatorId: artifact.indicatorId
    });
  }
  if (summary.earliest && isFiniteNumber(summary.earliest.value)) {
    numbers.push({
      label: `${artifact.title}, earliest`,
      value: summary.earliest.value,
      displayValue: displayValue(summary.earliest.value, artifact.unit),
      date: summary.earliest.date,
      unit: artifact.unit,
      sourceId: artifact.sourceId,
      indicatorId: artifact.indicatorId
    });
  }
  return numbers;
}

function lockedNumbersFromTable(artifact) {
  const summary = summarizeTable(artifact);
  const numbers = [];
  for (const row of preferredRowsForLockedNumbers(Array.isArray(artifact.rows) ? artifact.rows : [])) {
    const date = rowDate(row);
    for (const [key, value] of Object.entries(row)) {
      const parsed = numericValue(value);
      if (parsed === null) continue;
      if (isMetadataNumberKey(key)) continue;
      numbers.push({
        label: `${artifact.title}${rowQualifier(row)}: ${key}`,
        value: parsed,
        displayValue: displayValue(parsed, artifact.unit),
        date,
        unit: artifact.unit,
        sourceId: artifact.sourceId,
        indicatorId: artifact.indicatorId
      });
      if (numbers.length >= 12) return numbers;
    }
  }
  return numbers;
}

const themeRules = {
  people: {
    label: "People and demography",
    prefixes: ["people."],
    readerQuestions: [
      "What is the headline number?",
      "Is the trend rising, falling, or slowing?",
      "What is the age or sex structure behind the total?",
      "What does this change for jobs, schools, care, and families?"
    ],
    glossaryTerms: ["population estimate", "projection", "fertility", "median age", "dependency ratio", "per capita"]
  },
  economy: {
    label: "Economy and public money",
    prefixes: ["econ.", "state."],
    readerQuestions: [
      "What is the headline economic number?",
      "Is this a total number or a per-person number?",
      "How much of the story is prices, exchange rates, or GDP share?",
      "What does this explain about household life?"
    ],
    glossaryTerms: ["GDP", "GDP per capita", "real growth", "nominal", "inflation", "CPI", "tax-to-GDP"]
  },
  health: {
    label: "Health and survival",
    prefixes: ["health.", "owid.life_expectancy", "owid.child_mortality"],
    readerQuestions: [
      "What is the survival or health outcome?",
      "How much has it changed over time?",
      "Is the measure about death, illness, or healthy years?",
      "What does the national average hide?"
    ],
    glossaryTerms: ["life expectancy", "healthy life expectancy", "mortality rate", "per 1,000 live births", "age-standardized"]
  },
  energy: {
    label: "Energy and electricity",
    prefixes: ["energy.", "owid.energy_per_capita"],
    readerQuestions: [
      "How much energy or electricity is being used?",
      "What is the fuel mix?",
      "Is access different from reliability or consumption?",
      "Is the system getting cleaner as demand grows?"
    ],
    glossaryTerms: ["TWh", "kWh per capita", "electricity access", "carbon intensity", "generation mix"]
  },
  society: {
    label: "Society, work, education, and services",
    prefixes: ["society.", "education.", "work."],
    readerQuestions: [
      "What basic capability is being measured?",
      "How many people does the percentage represent?",
      "Is this access, usage, quality, or outcome?",
      "Which caveat stops the chart from being overclaimed?"
    ],
    glossaryTerms: ["labour force", "participation rate", "gross enrolment", "basic drinking water", "basic sanitation"]
  },
  climate: {
    label: "Climate, emissions, and air",
    prefixes: ["climate.", "owid.co2_"],
    readerQuestions: [
      "Is this about total scale or per-person exposure?",
      "Is the chart annual, cumulative, or a latest snapshot?",
      "What comparison would stop the number from being misread?",
      "What is outside the measure?"
    ],
    glossaryTerms: ["CO2", "per capita emissions", "cumulative emissions", "AQI", "PM2.5", "ERA5", "daily maximum temperature", "precipitation"]
  },
  world: {
    label: "India in the world",
    prefixes: ["world.share.", "econ.compare.", "compare."],
    readerQuestions: [
      "What is India's share of the global total?",
      "Is the share about people, production, emissions, or another denominator?",
      "Does the comparison use total numbers or per-person numbers?",
      "Which caveat stops a share from becoming a boast or a panic headline?"
    ],
    glossaryTerms: ["share", "world total", "GDP", "GDP per capita", "CO2"]
  }
};

const questionThemeOverrides = {
  econ: "economy",
  work: "society",
  education: "society",
  services: "society",
  state: "economy",
  air: "climate"
};

function themeForQuestion(question) {
  const key = String(question.id || "").split(".")[1] || "society";
  return questionThemeOverrides[key] || key;
}

function artifactCount(artifact) {
  if (artifact.artifactType === "series") {
    return (artifact.observations || []).filter((row) => row.value !== null && row.value !== undefined).length;
  }
  return Array.isArray(artifact.rows) ? artifact.rows.length : 0;
}

function artifactMatchesTheme(artifact, theme) {
  const rule = themeRules[theme] || themeRules.society;
  return rule.prefixes.some((prefix) => artifact.indicatorId.startsWith(prefix));
}

function visualKindForArtifact(artifact) {
  if (artifact.indicatorId === "people.population.un.age_sex_5y") return "population pyramid plus horizontal age-band bars";
  if (artifact.indicatorId === "people.population.un.broad_age_share") return "horizontal share bars";
  if (artifact.indicatorId === "energy.ember.generation") return "stacked mix bar plus selected source trends";
  if (artifact.indicatorId.startsWith("climate.waqi")) return "compact pollutant bars";
  if (artifact.artifactType === "table") return "mobile horizontal bars or selected multi-line chart";
  return "single-series line chart with latest value and first-to-latest change";
}

function mobileGuidanceForArtifact(artifact) {
  if (artifact.indicatorId === "people.population.un.age_sex_5y") {
    return "Use a full-width pyramid on desktop; on mobile keep labels short and preserve left/right symmetry.";
  }
  if (artifact.indicatorId === "energy.ember.generation") {
    return "Use a stacked bar for the latest mix and avoid too many fuel lines on mobile.";
  }
  if (artifact.artifactType === "table") {
    return "Prefer horizontal bars, share strips, or at most three lines; avoid dense tables.";
  }
  return "Use a line chart with large labels, sparse ticks, and a short reader caption.";
}

function visualPlanForArtifact(artifact, index, role) {
  return {
    visualId: `v${index + 1}.${artifact.indicatorId}`,
    indicatorId: artifact.indicatorId,
    title: artifact.title,
    sourceId: artifact.sourceId,
    unit: artifact.unit,
    role,
    recommendedVisualization: visualKindForArtifact(artifact),
    mobileGuidance: mobileGuidanceForArtifact(artifact),
    whyThisMatters: role === "primary"
      ? "This is the chart that answers the page question most directly."
      : "This chart adds context, structure, change, or a caveat to the headline answer."
  };
}

function sourcePriority(sourceId) {
  if (sourceId === "un-population") return 6;
  if (sourceId === "worldbank") return 5;
  if (sourceId === "who-gho") return 5;
  if (sourceId === "owid") return 4;
  if (sourceId === "open-meteo") return 4;
  if (sourceId === "ember") return 4;
  if (sourceId === "eia") return 4;
  if (sourceId === "waqi") return 3;
  return 1;
}

// The indicators that define a page's scope. `core` is the must-have answer set;
// it falls back to the legacy `indicators` array for questions not yet migrated.
export function coreIndicatorIds(question) {
  return question.core ?? question.indicators ?? [];
}

function scoreArtifact(artifact, question, theme) {
  const core = coreIndicatorIds(question);
  let score = 0;
  if (core.includes(artifact.indicatorId)) score += 100;
  if (artifactMatchesTheme(artifact, theme)) score += 25;
  score += Math.min(20, Math.log10(Math.max(1, artifactCount(artifact))) * 8);
  score += sourcePriority(artifact.sourceId);
  if (artifact.artifactType === "table") score += 8;
  if (artifactCount(artifact) <= 1 && !core.includes(artifact.indicatorId)) score -= 18;
  return score;
}

function selectThemeArtifacts({ question, artifacts, theme }) {
  const core = coreIndicatorIds(question);
  const excludeSet = new Set(question.exclude ?? []);
  const byId = (indicatorId) => artifacts.filter((artifact) => artifact.indicatorId === indicatorId);
  const required = core.flatMap(byId);
  if (question.id === "q.air.today") return required;

  // Explicit scope: when a question declares `context`, the packet is exactly
  // core + context. No theme expansion, so unrelated indicators can never leak in.
  if (Array.isArray(question.context)) {
    const contextArtifacts = question.context.flatMap(byId).filter((artifact) => artifactCount(artifact) > 0);
    const seen = new Set();
    const selected = [];
    for (const artifact of [...required, ...contextArtifacts]) {
      if (excludeSet.has(artifact.indicatorId) || seen.has(artifact.indicatorId)) continue;
      seen.add(artifact.indicatorId);
      selected.push(artifact);
    }
    return selected;
  }

  // Legacy path: expand to the whole theme, ranked, capped — now minus any excludes.
  const requiredSources = new Set(required.map((artifact) => artifact.sourceId));
  const lockToIndiaDataHub = requiredSources.has("indiadatahub");
  const candidates = artifacts
    .filter((artifact) => artifactMatchesTheme(artifact, theme))
    .filter((artifact) => !excludeSet.has(artifact.indicatorId))
    .filter((artifact) => !lockToIndiaDataHub || artifact.sourceId === "indiadatahub")
    .filter((artifact) => artifactCount(artifact) > 0)
    .sort((a, b) => scoreArtifact(b, question, theme) - scoreArtifact(a, question, theme));
  const seen = new Set();
  const selected = [];
  for (const artifact of [...required, ...candidates]) {
    if (seen.has(artifact.indicatorId)) continue;
    seen.add(artifact.indicatorId);
    selected.push(artifact);
    if (selected.length >= 14) break;
  }
  return selected;
}

function selectedDataPoint(numbers) {
  return numbers.slice(0, 24).map((item) => ({
    label: item.label,
    value: item.value,
    displayValue: item.displayValue,
    date: item.date,
    unit: item.unit,
    indicatorId: item.indicatorId,
    sourceId: item.sourceId,
    editorialUse: "Use only if it directly supports the answer, a chart caption, a pull quote, or a caveat."
  }));
}

export function buildEvidencePacket({ question, artifacts }) {
  const theme = themeForQuestion(question);
  const themeRule = themeRules[theme] || themeRules.society;
  const core = coreIndicatorIds(question);
  const selected = selectThemeArtifacts({ question, artifacts, theme });
  const required = selected.filter((artifact) => core.includes(artifact.indicatorId));
  const summaries = selected.map((artifact) => (
    artifact.artifactType === "series" ? summarizeSeries(artifact) : summarizeTable(artifact)
  ));
  const lockedNumbers = selected.flatMap((artifact) => (
    artifact.artifactType === "series" ? lockedNumbersFromSeries(artifact) : lockedNumbersFromTable(artifact)
  ));
  const visualPlan = selected.map((artifact, index) => visualPlanForArtifact(
    artifact,
    index,
    core.includes(artifact.indicatorId) ? "primary" : "context"
  ));

  // The curated, ordered set of charts that will actually render (from the registry
  // visualPlan). The prose must be built around exactly these, in this order: one
  // article section per chart, one chartExplainer per chart, one sectionVisualMap entry.
  const titleFor = (indicatorId) => artifacts.find((artifact) => artifact.indicatorId === indicatorId)?.title;
  const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const plannedCharts = (question.visualPlan || []).map((entry, index) => {
    const title = entry.title || titleFor(entry.indicator) || entry.indicator;
    return {
      order: index + 1,
      chartId: slugify(title),
      title,
      chartType: entry.chart,
      beat: entry.beat || "",
      window: entry.window || "",
      indicator: entry.indicator || "",
      series: Array.isArray(entry.series) ? entry.series : [],
      unit: entry.unit || "",
      subtitle: entry.subtitle || "",
      whyThisChart: entry.why || ""
    };
  });

  return {
    schemaVersion: 1,
    questionId: question.id,
    question: question.question,
    priority: question.priority,
    theme: {
      id: theme,
      label: themeRule.label,
      readerQuestions: themeRule.readerQuestions,
      glossaryTerms: themeRule.glossaryTerms
    },
    requiredIndicatorIds: core,
    availableIndicatorIds: required.map((artifact) => artifact.indicatorId),
    themeIndicatorIds: selected.map((artifact) => artifact.indicatorId),
    visualPlan,
    plannedCharts,
    selectedDataPoints: selectedDataPoint(lockedNumbers),
    lockedNumbers,
    sourceSummaries: summaries,
    selectionRules: [
      "Start from the page question, not from the indicator name.",
      "Choose the smallest set of visuals that explains scale, trend, structure, comparison, and caveat.",
      "Prefer mobile-friendly charts: line charts with sparse ticks, horizontal bars, share strips, pyramids only when essential, and no dense tables.",
      "Use one strong pull quote only when the evidence supports it with a number.",
      "Add glossary blocks for technical terms that normal readers may not know."
    ],
    caveats: [
      "Use only figures present in lockedNumbers or sourceSummaries.",
      "If a related theme indicator is present, you may use it for context, but do not pretend it is the main answer.",
      "If source coverage is thin, say so directly.",
      "Do not compare states, districts, or cities unless the evidence packet contains those geographies."
    ],
    forbiddenClaims: [
      "Do not invent current-year figures.",
      "Do not infer causality from a trend unless the evidence explicitly supports it.",
      "Do not cite a source that is not present in sourceSummaries."
    ]
  };
}
