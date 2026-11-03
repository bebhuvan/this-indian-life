// Months by series as a field of tone. Each cell is a share; an even spread across the
// columns is the neutral point. Cells at or below it stay in pale stone, cells above it
// warm through the haldi-to-sindoor ramp as they concentrate. Each row's peak is named.

import type { BaseSpec, Scene } from "../types";
import { Builder } from "../builder";
import { INK, RAMP } from "../theme";
import { fmt, formatterFor } from "../format";

export interface SeasonSpec extends BaseSpec {
  form: "season";
  columns: string[];
  rows: { label: string; values: number[] }[];
  /** The even-spread value; 100 / columns by default. */
  neutral?: number;
}

/**
 * Tone by ratio to the even spread, which is the one breakpoint. Below it the cells pale
 * toward paper as the share falls; above it they warm from haldi to sindoor.
 */
const BELOW: Array<[number, string]> = [
  [0.7, "#F8F6F2"],
  [0.85, "#F0ECE5"],
  [1, "#E5DFD5"],
];
const ABOVE: Array<[number, string]> = [
  [1.25, RAMP[1]],
  [1.55, RAMP[2]],
  [1.9, "#CC7A4A"],
  [Infinity, RAMP[3]],
];
const STEPS = [...BELOW, ...ABOVE];
const tone = (r: number) => STEPS.find(([lim]) => r < lim)![1];
const dark = (r: number) => r >= 1.9;

export function season(spec: SeasonSpec, w: number): Scene {
  const b = new Builder(w);
  const z = b.z;
  const n = spec.columns.length;
  const neutral = spec.neutral ?? 100 / n;
  const all = spec.rows.flatMap((r) => r.values);
  const val = formatterFor(all, { unit: spec.unit, decimals: spec.decimals });
  const narrow = z.cls === "s";

  // The key: one line from "less than even" to "twice even".
  const ky = b.lh("axis") / 2 + 2;
  b.text(0, ky, "Less than even", "axis");
  let kx = b.tw("Less than even", "axis") + 8;
  const sw = narrow ? 16 : 22;
  STEPS.forEach(([, c], i) => {
    b.rect(kx + i * (sw + 2), ky - 6, sw, 12, c);
  });
  kx += STEPS.length * (sw + 2) + 6;
  // The far end's name shortens on the narrowest phones rather than run off the frame.
  const hiName = ["twice even or more", "twice even", "2× even"].find((t) => kx + b.tw(t, "axis") <= w) ?? "2×";
  b.text(kx, ky, hiName, "axis");
  // The breakpoint between the two halves of the key is the even spread.
  const evenX = b.tw("Less than even", "axis") + 8 + BELOW.length * (sw + 2) - 1;
  b.hair(evenX, ky - 9, evenX, ky + 9, INK.ink);
  b.text(evenX, ky + 18, `even ${fmt(neutral, { decimals: 1, unit: spec.unit })}`, "note", "middle");

  // Columns and the month header.
  const nameW = narrow ? 0 : Math.max(...spec.rows.map((r) => b.tw(r.label, "label"))) + 18;
  const gap = narrow ? 2 : 3;
  const cw = (w - nameW - gap * (n - 1)) / n;
  const ch = narrow ? 26 : 38;
  const cx = (j: number) => nameW + j * (cw + gap);
  let y = ky + 16 + b.lh("note") / 2 + 16;
  spec.columns.forEach((c, j) => b.text(cx(j) + cw / 2, y, narrow && cw < 26 ? c.slice(0, 1) : c, "axis", "middle"));
  y += b.lh("axis") / 2 + 8;

  for (const r of spec.rows) {
    const peak = r.values.indexOf(Math.max(...r.values));
    if (narrow) {
      // Phones: the name on its own line, the peak named at the right of that line.
      const ly = y + b.lh("label") / 2;
      b.text(0, ly, r.label, "label");
      const pk = `${spec.columns[peak]} ${val(r.values[peak])}`;
      b.text(w, ly, pk, "label", "end", { bold: true });
      y += b.lh("label") + 4;
    } else b.text(nameW - 14, y + ch / 2, r.label, "label", "end");

    r.values.forEach((v, j) => b.rect(cx(j), y, cw, ch, tone(v / neutral)));
    // Mark the peak: a 2 px ink rule along its foot, the site's way of underlining.
    b.rect(cx(peak), y + ch - 2, cw, 2, INK.ink);
    if (!narrow) {
      const t = val(r.values[peak]);
      const fits = b.tw(t, "value", true) + 8 <= cw;
      if (fits) b.text(cx(peak) + cw / 2, y + ch / 2 - 1, t, "value", "middle", { bold: true, color: dark(r.values[peak] / neutral) ? INK.ground : INK.ink });
    }
    y += ch + (narrow ? 14 : gap + 3);
  }

  const peaks = spec.rows.map((r) => `${r.label} peaks in ${spec.columns[r.values.indexOf(Math.max(...r.values))]} at ${val(Math.max(...r.values))}`);
  return b.scene(y - (narrow ? 14 : gap + 3) + 2, spec.alt ?? `Share of each row's total by ${spec.columns.length} columns; an even spread is ${fmt(neutral, { decimals: 1 })}. ${peaks.join("; ")}.`);
}
