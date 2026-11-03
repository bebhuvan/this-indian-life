// The bridge from the site's resolved visuals (src/data/viz.ts) to kit specs. An article
// switched to the kit draws every visual this file can translate with the kit; anything it
// cannot (maps, multi-series groups, the older bespoke forms) returns null and keeps the
// old renderer until the kit has a form for it.

import type { VisualSpec } from "../data/viz";
import type { AnySpec } from "./index";
import { namedIn } from "../data/almanac";

/** Articles drawn with the kit. Add a question id here to move an article over; anything
 *  the adapter cannot translate stays on the old engine within the same article.
 *  scripts/kit/coverage.mjs lists what each article still needs. */
export const KIT_ARTICLES = new Set([
  "q.econ.lrs_controls", "q.econ.poverty_debate",
  // November 2026, batch 1: one or two articles per domain, every chart translatable.
  "q.people.growth", "q.people.old_before_rich", "q.health.life", "q.work.women",
  "q.energy.coal", "q.climate.co2", "q.society.connected", "q.econ.trade",
]);

/**
 * Roles for a line chart's series, by the rule the old engine used (lineRoles in
 * ArticleVisuals.astro), so moving an article does not change which line is the story: the
 * emphasised line, else India, else the line the title names, leads; other named lines
 * compare; the rest are context. With no lead (fewer than three lines, rural against
 * urban, or nothing named) every line is a peer.
 */
export function lineRoles(lines: Array<{ label: string; emphasis?: boolean }>, title: string): Array<"lead" | "compare" | "context" | "peer"> {
  const n = lines.length;
  if (n < 3 || lines.some((l) => /\b(rural|urban)\b/i.test(l.label))) return lines.map(() => "peer");
  const named = lines.map((l) => namedIn(l.label, title));
  const e = lines.findIndex((l) => l.emphasis), india = lines.findIndex((l) => /^india\b/i.test(l.label.trim()));
  const lead = e >= 0 ? e : india >= 0 ? india : named.indexOf(true);
  if (lead < 0) return lines.map(() => "peer");
  const sex = (l: { label: string }) => /\b(male|female|men|women|boys|girls)\b/i.test(l.label);
  return lines.map((l, i) => (i === lead ? "lead" : named[i] || sex(l) ? "compare" : "context"));
}

/** A free-text unit the formatter cannot attach, shortened for a caption: "years",
 *  "deaths per 1,000 live births". Machine ids and empty units give nothing. */
export function unitCaption(unit = ""): string | undefined {
  const u = unit.trim();
  if (!u || (/^[a-z0-9_.:-]+$/i.test(u) && /[_:]/.test(u))) return undefined;
  return u.length > 60 ? u.slice(0, 58).trimEnd() + "…" : u;
}

/**
 * Big counts and dollar sums in the units a reader uses: dollars in billions or millions,
 * everything else in crore or lakh (the site writes "145 crore people", never
 * 1,450,935,791). Returns the divisor and the unit token or caption to use, or null when
 * the values are small enough to print as they are.
 */
export function scaleFor(values: number[], unit = ""): { by: number; unit?: string; caption?: string } | null {
  const max = Math.max(...values.map(Math.abs));
  if (kitUnit(unit) || !Number.isFinite(max)) return null;
  const caption = unitCaption(unit);
  if (/us\$|usd|dollar/i.test(unit)) {
    // What is left once the currency is said by the unit: "current" says nothing more,
    // "constant 2015" is the price base and stays.
    let rest = caption?.replace(/us\$|usd|dollars?/gi, "").replace(/\(\s*\)/g, "").replace(/^[\W_]+|[\W_]+$/g, "").trim();
    if (rest && /^current$/i.test(rest)) rest = "";
    if (rest && /^constant\b/i.test(rest) && !/prices/i.test(rest)) rest = `${rest} prices`;
    if (max >= 1e9) return { by: 1e9, unit: "$bn", caption: rest || undefined };
    if (max >= 1e6) return { by: 1e6, unit: "$m", caption: rest || undefined };
    return null;
  }
  if (/%|percent|per |rate|index|ratio|score/i.test(unit)) return null;
  if (max >= 1e7) return { by: 1e7, caption: caption ? `${caption}, crore` : "crore" };
  if (max >= 1e5) return { by: 1e5, caption: caption ? `${caption}, lakh` : "lakh" };
  return null;
}

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


/** Row names without a trailing bracket that every row repeats: "Employed in agriculture (%
 *  of workers)" beside "Self-employed (% of workers)" is the chart's unit, said once in the
 *  dek. A bracket that differs between rows ("$2.15 to $3.00", "% of line" beside "% of
 *  population") carries meaning and stays. */
export function unitless(labels: string[]): string[] {
  const tail = (l: string) => l.match(/\s*\([^()]*\)\s*$/)?.[0];
  const t = tail(labels[0] ?? "");
  return labels.length > 1 && t && labels.every((l) => tail(l) === t) ? labels.map((l) => l.slice(0, l.length - t.length)) : labels;
}

export function toKitSpec(v: VisualSpec): AnySpec | null {
  switch (v.kind) {
    case "line": {
      // Not yet in the kit: shaded ranges, survey rounds on a categorical axis, calendar
      // overlays (a month axis), and dashed lines (the old engine's second meaning for a dash).
      if (v.range || v.categoricalX || v.monthAxis || v.lines.some((l) => l.dash)) return null;
      const unit = kitUnit(v.unit);
      const roles = lineRoles(v.lines, v.title);
      // Five or more peers are small multiples, which the kit does not draw yet: as one chart
      // they would be a tangle with no line to follow.
      if (roles.every((r) => r === "peer") && v.lines.length >= 5) return null;
      const sc = scaleFor(v.lines.flatMap((l) => l.points.map((p) => p.value)), v.unit);
      const series = v.lines.map((l, i) => {
        const cut = l.projectedAfter ?? v.projectedAfter;
        const after = cut != null ? l.points.find((p) => Number(p.date.slice(0, 4)) === cut)?.date : undefined;
        const role = roles[i] === "peer" ? (i === 0 ? "lead" : "compare") : roles[i];
        // The kit owns colour: the old renderer's inks are not carried over.
        // Comparability breaks are years; the kit takes the dates of the points they fall on.
        const breaks = ((l as { breaks?: number[] }).breaks ?? (v as { breaks?: number[] }).breaks ?? [])
          .map((y) => l.points.find((p) => Number(p.date.slice(0, 4)) === y)?.date)
          .filter((d): d is string => Boolean(d));
        const points = sc ? l.points.map((p) => ({ ...p, value: p.value / sc.by })) : l.points;
        return { label: l.label, points, role, projectedAfter: after, ...(breaks.length ? { breaksAfter: breaks } : {}) };
      });
      const all = v.lines.flatMap((l) => l.points.map((p) => p.value));
      // A 0 to 100 scale only for shares that fill much of it; health spending at 3% of GDP
      // is read on its own scale.
      const share = unit === "%" && Math.min(...all) >= 0 && Math.max(...all) <= 100 && Math.max(...all) > 50;
      return {
        form: "line",
        unit: sc?.unit ?? unit,
        unitLabel: sc ? sc.caption : unit ? undefined : unitCaption(v.unit),
        series,
        domain: share ? "share" : undefined,
        annotations: v.bands?.filter((b) => b.label).map((b) => ({ date: String(b.year), label: b.label! })),
        references: v.refLine ? [{ value: v.refLine.value / (sc?.by ?? 1), label: v.refLine.label }] : undefined,
      };
    }
    case "bar": {
      if (v.scale === "log" || !v.bars.length) return null;
      // Parts of one whole are a share strip in the old engine (explicitly, or four or fewer
      // percentages summing to about 100); the kit has no strip yet.
      const total = v.bars.reduce((t, b) => t + Math.max(0, b.value), 0);
      const comparison = /^(econ\.)?compare\./.test(v.source.indicatorId ?? "");
      if (v.share || (/%/.test(v.unit) && v.bars.length <= 4 && Math.abs(total - 100) <= 3 && !v.bars.some((b) => b.value < 0) && !comparison)) return null;
      const unit = kitUnit(v.unit), sc = scaleFor(v.bars.map((b) => b.value), v.unit);
      // India among three or more others is the subject: its bar in neel, the rest in stone.
      const india = v.bars.length >= 3 ? v.bars.findIndex((b) => /^india$/i.test(b.label.trim())) : -1;
      return { form: "bars", unit: sc?.unit ?? unit, unitLabel: sc ? sc.caption : unit ? undefined : unitCaption(v.unit), items: v.bars.map((b, k) => ({ label: b.label, value: b.value / (sc?.by ?? 1), ...(b.group ? { group: b.group } : {}), ...(k === india ? { highlight: true } : {}) })) };
    }
    case "groupedBar": {
      // Two series per group read as a before and after: a dumbbell. More stay as they are.
      if (v.series.length !== 2) return null;
      return {
        form: "dumbbell",
        unit: kitUnit(v.unit),
        ends: [v.series[0], v.series[1]],
        items: ((names) => v.groups.map((g, k) => ({ label: names[k], a: g.values[0], b: g.values[1] })))(unitless(v.groups.map((g) => g.label))),
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
          items: ((names) => a.rows.map((r, k) => ({ label: names[k], a: Number(r[keys[0]]), b: Number(r[keys[1]]) })))(unitless(a.rows.map((r) => String(r.label)))),
        };
      }
      return null;
    }
    default:
      return null;
  }
}
