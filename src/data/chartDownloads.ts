import type { VisualSpec } from "./viz";

export function fileSafe(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "indica-chart";
}

export function visualPayload(visual: VisualSpec) {
  const source = visual.source;
  if (visual.kind === "line") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.lines.flatMap((line) => line.points.map((point) => ({ series: line.label, date: point.date, value: point.value })))
    };
  }
  if (visual.kind === "linePanels") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.panels.flatMap((panel) =>
        panel.lines.flatMap((line) =>
          line.points.map((point) => ({ panel: panel.label, series: line.label, date: point.date, value: point.value }))
        )
      )
    };
  }
  if (visual.kind === "stack") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.segments.map((item) => ({ series: item.label, value: item.value }))
    };
  }
  if (visual.kind === "bar") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.bars.map((item) => ({ group: item.group, series: item.label, value: item.value }))
    };
  }
  if (visual.kind === "groupedBar") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.groups.flatMap((group) =>
        group.values.map((value, index) => ({
          date: group.date,
          year: group.label,
          series: visual.series[index],
          value,
          netExports: group.net
        }))
      )
    };
  }
  if (visual.kind === "change") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.items.map((item) => ({
        series: item.label,
        startDate: item.start.date,
        startValue: item.start.value,
        endDate: item.end.date,
        endValue: item.end.value,
        change: item.change,
        pctChange: item.pctChange
      }))
    };
  }
  if (visual.kind === "stripes") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.stripes.map((item) => ({ date: item.date, value: item.value }))
    };
  }
  if (visual.kind === "choropleth") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.regions.map((region) => ({ region: region.name, value: region.value }))
    };
  }
  if (visual.kind === "scatter") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.points.map((point) => ({
        region: point.label,
        x: point.x,
        y: point.y,
        size: point.size,
        ...(point.meta || {})
      }))
    };
  }
  if (visual.kind === "scenarioMaps") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.panels.flatMap((panel) => panel.regions.map((region) => ({ scenario: panel.label, region: region.name, value: region.value })))
    };
  }
  if (visual.kind === "sparkGrid") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.cells.flatMap((cell) => cell.points.map((point) => ({ city: cell.label, date: point.date, value: point.value })))
    };
  }
  if (visual.kind === "rankedChange") {
    return {
      title: visual.title,
      unit: visual.unit,
      source,
      rows: visual.rows.map((row) => ({
        city: row.label,
        baselinePeriod: visual.startLabel,
        baselineValue: row.start,
        latestYear: visual.endLabel,
        latestValue: row.end,
        change: row.change
      }))
    };
  }
  return {
    title: visual.title,
    unit: visual.unit,
    source,
    rows: visual.rows.map((item) => ({ age: item.age, male: item.male, female: item.female }))
  };
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function payloadToCsv(payload: ReturnType<typeof visualPayload>) {
  const sourceRows = [
    ["title", payload.title],
    ["unit", payload.unit],
    ["sourceId", payload.source?.sourceId],
    ["sourceIndicatorId", payload.source?.sourceIndicatorId],
    ["sourceUrl", payload.source?.sourceUrl || ""],
    []
  ];
  const rows = payload.rows || [];
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const body = [keys, ...rows.map((row) => keys.map((key) => row[key as keyof typeof row]))];
  return [...sourceRows, ...body].map((row) => row.map(csvEscape).join(",")).join("\n");
}
