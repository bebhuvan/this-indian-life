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

export function buildEvidencePacket({ question, artifacts }) {
  const relevant = artifacts.filter((artifact) => question.indicators.includes(artifact.indicatorId));
  const summaries = relevant.map((artifact) => (
    artifact.artifactType === "series" ? summarizeSeries(artifact) : summarizeTable(artifact)
  ));
  const lockedNumbers = relevant.flatMap((artifact) => (
    artifact.artifactType === "series" ? lockedNumbersFromSeries(artifact) : lockedNumbersFromTable(artifact)
  ));

  return {
    schemaVersion: 1,
    questionId: question.id,
    question: question.question,
    priority: question.priority,
    requiredIndicatorIds: question.indicators,
    availableIndicatorIds: relevant.map((artifact) => artifact.indicatorId),
    lockedNumbers,
    sourceSummaries: summaries,
    caveats: [
      "Use only figures present in lockedNumbers or sourceSummaries.",
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
