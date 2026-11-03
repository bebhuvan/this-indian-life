// The bridge from the site's resolved visuals (src/data/viz.ts) to kit specs. An article
// switched to the kit draws every visual this file can translate with the kit; anything it
// cannot (maps, multi-series groups, the older bespoke forms) returns null and keeps the
// old renderer until the kit has a form for it.

import type { VisualSpec } from "../data/viz";
import type { AnySpec } from "./index";
import { namedIn } from "../data/almanac";

/** Articles kept on the old engine entirely. Since November 2026 every other article is
 *  drawn by the kit: each visual the adapter can translate goes to the kit, and the rest
 *  (maps, small multiples, scatters, share strips and the older bespoke forms) stay on the
 *  old engine within the same page. scripts/kit/coverage.mjs lists what each still needs. */
export const KIT_EXCLUDED = new Set<string>([]);
/** Whether an article is drawn with the kit (kept as a set-like for its callers). */
export const KIT_ARTICLES = { has: (id: string) => !KIT_EXCLUDED.has(id) };

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

/** Multipliers named in a unit ("INR billion", "US$ million"). */
const MAGNITUDE: Array<[RegExp, number]> = [[/\btrillions?\b|\btn\b/i, 1e12], [/\bbillions?\b|\bbn\b/i, 1e9], [/\bmillions?\b|\bmn\b/i, 1e6], [/\bcrores?\b/i, 1e7], [/\blakhs?\b/i, 1e5], [/\bthousands?\b/i, 1e3]];

/** What a money unit says beyond its currency and size, in a fixed order: what is
 *  measured, what it is per, the price base, purchasing-power parity. "output, per hour
 *  worked, purchasing-power parity". "current" says nothing a reader needs. */
function moneyCaption(unit: string): string | undefined {
  const per = unit.match(/\bper [^,()]+/i)?.[0].replace(/\s+at\s+ppp\b/i, "").replace(/us\$|usd|\$|₹|\binr\b/gi, "").replace(/\s+/g, " ").trim();
  const base = unit.match(/\bconstant(?: \d{4}(?:-\d{2})?)?\b|\b\d{4}(?:-\d{2})? prices\b/i)?.[0];
  const ppp = /\bppp\b|international|int-\$/i.test(unit);
  const rest = unit
    .replace(/\bper [^,()]+/i, " ").replace(/\bconstant(?: \d{4}(?:-\d{2})?)?\b|\b\d{4}(?:-\d{2})? prices\b|\bprices\b/gi, " ")
    .replace(/\bppp\b|\binternational\b|int-\$/gi, " ")
    .replace(/us\$|usd|\$|₹|\binr\b|\brs\.?(?=\s|$)|rupees?|dollars?/gi, " ")
    .replace(/\b(trillions?|billions?|millions?|crores?|lakhs?|thousands?|tn|bn|mn|current)\b/gi, " ")
    .replace(/[()]/g, " ").replace(/\s+/g, " ").replace(/^[\W_]+|[\W_]+$/g, "").trim();
  const priced = base ? (/prices/i.test(base) ? base : `${base} prices`) : undefined;
  return [rest, per, priced, ppp ? "purchasing-power parity" : undefined].filter(Boolean).join(", ") || undefined;
}

/**
 * Money and big counts in the units a reader uses. Dollars: $tn, $bn, $m, or $ with what
 * it is per ("$84,534", "per person"). Rupees: ₹ lakh crore, ₹ crore, ₹ lakh, or ₹ per
 * something, grouped the Indian way. Other counts: crore or lakh, said in the caption
 * ("145", "people, crore"; never 1,450,935,791). Returns the divisor, the unit token and
 * the caption, or null when the values print well as they are.
 */
export function scaleFor(values: number[], unit0 = ""): { by: number; unit?: string; caption?: string } | null {
  // "₹/month" is "₹ per month".
  const unit = unit0.replace(/\s*\/\s*(?=[a-z])/gi, " per ");
  const max0 = Math.max(...values.map(Math.abs));
  if (!Number.isFinite(max0)) return null;
  const token = kitUnit(unit);
  // A unit the kit already knows: only crore that run into lakh of crore are restated.
  if (token === "₹ crore" && max0 >= 1e5) return { by: 1e5, unit: "₹ lakh crore" };
  if (token === "$m" && max0 >= 1e4) return { by: 1e3, unit: "$bn" };
  if (token) return null;
  // An index or a ratio of currencies stays a plain number: "rupees (1970 = 1)", "INR per USD" is a rate.
  if (/=|\bindex\b|%|percent|\bratios?\b|\bscore\b/i.test(unit)) return null;
  const dollar = /us\$|usd|dollar|\$/i.test(unit), rupee = /₹|\brs\.?(?=\s|$)|rupee|\binr\b/i.test(unit);
  const per = /\bper\b/i.test(unit);
  // A rate (per person, per 1,000, per capita) is read as it is; a count per period
  // ("deaths per year") is still a count and is sized like one.
  const rate = /\bper (\d|cent|capita|person|people|head|worker|resident|household|thousand|hundred|million|lakh|km|sq|hour|case|delivery|gb|unit)/i.test(unit) || /\/\s*(\d|km|kwh|gb)/i.test(unit0);
  if (dollar && rupee) return null;
  // A size named in the unit applies only when the values are plausibly in it: "trillion $"
  // over values of 19,626,247,000,000 is a label that describes the axis, not the data.
  const named = MAGNITUDE.find(([re]) => re.test(unit))?.[1] ?? 1;
  const mag = named > 1 && max0 >= 1e6 ? 1 : named;
  const max = max0 * mag, cap = moneyCaption(unit);
  if (dollar) {
    if (per) return { by: 1 / mag, unit: "$", caption: cap };
    if (max >= 1e12) return { by: 1e12 / mag, unit: "$tn", caption: cap };
    if (max >= 1e9) return { by: 1e9 / mag, unit: "$bn", caption: cap };
    if (max >= 1e6) return { by: 1e6 / mag, unit: "$m", caption: cap };
    return { by: 1 / mag, unit: "$", caption: cap };
  }
  if (rupee) {
    if (per) return { by: 1 / mag, unit: "₹", caption: cap };
    if (max >= 1e12) return { by: 1e12 / mag, unit: "₹ lakh crore", caption: cap };
    if (max >= 1e7) return { by: 1e7 / mag, unit: "₹ crore", caption: cap };
    if (max >= 1e5) return { by: 1e5 / mag, unit: "₹ lakh", caption: cap };
    return { by: 1 / mag, unit: "₹", caption: cap };
  }
  if (rate || /\brates?\b/i.test(unit)) return null;
  // Counts: a size word in the unit is applied, or dropped when the values are plainly raw
  // ("thousands" over 13,093,785 deaths), so the caption never says two sizes.
  const n = max0 * mag;
  const caption = unitCaption(unit.replace(/\b(trillions?|billions?|millions?|crores?|lakhs?|thousands?)\b/gi, " ").replace(/[()]/g, " ").replace(/\s*,(\s*,)+/g, ",").replace(/\s+,/g, ",").replace(/\s+/g, " ").replace(/^[\W_]+|[\W_]+$/g, "").trim());
  if (n >= 1e7) return { by: 1e7 / mag, caption: caption ? `${caption}, crore` : "crore" };
  if (n >= 1e5) return { by: 1e5 / mag, caption: caption ? `${caption}, lakh` : "lakh" };
  return mag > 1 ? { by: 1 / mag, caption } : null;
}

/** The kit's unit tokens, from the free-text units the artifacts carry. */
export function kitUnit(unit = ""): string | undefined {
  const u = unit.toLowerCase();
  if (/usd million|us\$ ?million|\$ ?million|\$m\b/.test(u)) return "$m";
  if (/usd billion|\$ ?billion|\$bn\b/.test(u)) return "$bn";
  if (/percentage point|\bpp\b|\bpts?\b/.test(u)) return "pts";
  if (/^(multiples?|times|x)$/.test(u.trim())) return "x";
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
      // Ranks run downwards (first at the top), which the kit's scale does not do yet.
      if (v.range || v.categoricalX || v.monthAxis || v.lines.some((l) => l.dash) || /\brank\b/i.test(v.unit ?? "")) return null;
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
