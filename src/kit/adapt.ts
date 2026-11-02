// The bridge from the site's resolved visuals (src/data/viz.ts) to kit specs. An article
// switched to the kit draws every visual this file can translate with the kit; anything it
// cannot (maps, multi-series groups, the older bespoke forms) returns null and keeps the
// old renderer until the kit has a form for it.

import type { VisualSpec } from "../data/viz";
import type { AnySpec } from "./index";

/** Articles drawn with the kit. Add a question id here to move an article over. */
export const KIT_ARTICLES = new Set(["q.econ.lrs_controls", "q.econ.poverty_debate"]);

/** The kit's unit tokens, from the free-text units the artifacts carry. */
export function kitUnit(unit = ""): string | undefined {
  const u = unit.toLowerCase();
  if (/usd million|us\$ ?million|\$ ?million|\$m\b/.test(u)) return "$m";
  if (/usd billion|\$ ?billion|\$bn\b/.test(u)) return "$bn";
  if (/percentage point|\bpp\b|\bpts?\b/.test(u)) return "pts";
  if (/^%|percent|% of|\(%\)|share/.test(u)) return "%";
  if (/(rs|₹|inr) ?lakh/.test(u)) return "₹ lakh";
  if (/(rs|₹|inr) ?crore/.test(u)) return "₹ crore";
  return undefined;
}


export function toKitSpec(v: VisualSpec): AnySpec | null {
  switch (v.kind) {
    case "line": {
      if (v.range || v.categoricalX) return null;
      const unit = kitUnit(v.unit);
      const lead = v.lines.findIndex((l) => l.emphasis);
      const series = v.lines.map((l, i) => {
        const cut = l.projectedAfter ?? v.projectedAfter;
        const after = cut != null ? l.points.find((p) => Number(p.date.slice(0, 4)) === cut)?.date : undefined;
        const role = i === (lead >= 0 ? lead : 0) ? "lead" : v.lines.length > 4 ? "context" : "compare";
        // The kit owns colour: the old renderer's inks are not carried over.
        // Comparability breaks are years; the kit takes the dates of the points they fall on.
        const breaks = ((l as { breaks?: number[] }).breaks ?? (v as { breaks?: number[] }).breaks ?? [])
          .map((y) => l.points.find((p) => Number(p.date.slice(0, 4)) === y)?.date)
          .filter((d): d is string => Boolean(d));
        return { label: l.label, points: l.points, role, projectedAfter: after, ...(breaks.length ? { breaksAfter: breaks } : {}) };
      });
      const all = v.lines.flatMap((l) => l.points.map((p) => p.value));
      const share = unit === "%" && Math.min(...all) >= 0 && Math.max(...all) <= 100;
      return {
        form: "line",
        unit,
        series,
        domain: share ? "share" : undefined,
        annotations: v.bands?.filter((b) => b.label).map((b) => ({ date: String(b.year), label: b.label! })),
      };
    }
    case "bar": {
      if (v.scale === "log" || !v.bars.length) return null;
      return { form: "bars", unit: kitUnit(v.unit), items: v.bars.map((b) => ({ label: b.label, value: b.value })) };
    }
    case "groupedBar": {
      // Two series per group read as a before and after: a dumbbell. More stay as they are.
      if (v.series.length !== 2) return null;
      return {
        form: "dumbbell",
        unit: kitUnit(v.unit),
        ends: [v.series[0], v.series[1]],
        items: v.groups.map((g) => ({ label: g.label, a: g.values[0], b: g.values[1] })),
        sort: "none",
      };
    }
    case "almanac": {
      const a = v as unknown as { form: string; ends?: [string, string]; rows: Array<Record<string, unknown>> };
      if (a.form === "dumbbell" && a.ends) {
        const keys = Object.keys(a.rows[0] ?? {}).filter((k) => k !== "label");
        if (keys.length !== 2) return null;
        return {
          form: "dumbbell",
          unit: kitUnit(v.unit),
          ends: a.ends,
          items: a.rows.map((r) => ({ label: String(r.label), a: Number(r[keys[0]]), b: Number(r[keys[1]]) })),
        };
      }
      return null;
    }
    default:
      return null;
  }
}
