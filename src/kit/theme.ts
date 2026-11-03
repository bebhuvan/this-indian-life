// Ink and type tokens. docs/CHART_KIT.md is the reference for what each one means.

export const INK = {
  ink: "#1A1A1A",
  ink2: "#57534D",
  ink3: "#6E6962",
  rule: "#ECE9E3",
  axis: "#A9A49C",
  stone: "#CFCAC0",
  stoneLine: "#B5AFA4",
  track: "#F3F1EC",
  ground: "#FFFFFF",
  neel: "#26408B",
  sindoor: "#C0402A",
  haldi: "#D9A21B",
  hara: "#2E7D5B",
  plum: "#6B3E75",
} as const;

/**
 * Series colours in the order a multi-series chart takes them. Sindoor (loss) and hara
 * (rural) carry fixed meanings, so neither is a general series ink.
 */
export const SERIES = [INK.neel, INK.ink, INK.plum, INK.haldi];

/**
 * Pale stone through haldi to deep sindoor: five steps of magnitude. Kept quiet in the
 * middle so a field of tiles reads as tone, not as alarm; only the top steps are strong,
 * and those two need white text.
 */
export const RAMP = ["#F3ECDD", "#EBD3A2", "#DDAE63", "#B9583A", "#7A2216"];
export const RAMP_DARK_FROM = 3;

/**
 * The text-safe shade of an ink. Haldi is 2.3:1 on white, a mark colour only; a number or
 * name written in a series' colour goes through this so it keeps its hue and reads.
 */
export function textInk(c: string): string {
  if (c === INK.haldi) return "#8F6510";
  if (c === INK.stoneLine || c === INK.stone) return INK.ink2;
  return c;
}

/** Fixed meanings: a label that names one of these always gets its ink. */
export function fixedInk(label: string): string | null {
  if (/\brural\b/i.test(label)) return INK.hara;
  if (/\burban\b/i.test(label)) return INK.neel;
  return null;
}

export const FONT = {
  sans: "'Schibsted Grotesk', ui-sans-serif, system-ui, sans-serif",
  // Literata once it is self-hosted; until then the site's own Newsreader, never Georgia.
  display: "Literata, Newsreader, Georgia, serif",
};

export type SizeClass = "s" | "m" | "l";

export interface Sizes {
  cls: SizeClass;
  axis: number;
  label: number;
  value: number;
  note: number;
  figure: number;
  display: number;
  /** Stroke of the protagonist line and of context lines. */
  line: number;
  lineCtx: number;
  dot: number;
  /** Height of one row in row-based forms. */
  row: number;
  /** Thickness of a bar inside a row. */
  bar: number;
  /** Space between a mark and its label. */
  gap: number;
}

export function sizes(width: number): Sizes {
  const cls: SizeClass = width < 520 ? "s" : width < 800 ? "m" : "l";
  const s = cls === "s";
  return {
    cls,
    // Axis text was 11.5 px on a 1,100 px plot: correct, and too faint to read at a glance.
    axis: s ? 12 : 13,
    label: s ? 13 : cls === "m" ? 14 : 14.5,
    value: s ? 13 : cls === "m" ? 14 : 14.5,
    note: s ? 12.5 : 13.5,
    figure: s ? 17 : cls === "m" ? 19 : 20,
    display: s ? 20 : cls === "m" ? 24 : 28,
    line: s ? 2 : 2.25,
    lineCtx: 1.25,
    // Marks need presence beside 14 px labels: a 4.75 px dot read as a speck on a wide plot.
    dot: s ? 4.75 : cls === "m" ? 5.5 : 6.25,
    row: s ? 30 : cls === "m" ? 34 : 38,
    // Bars fill about 0.55 of their row: substantial beside 13.5 px labels, never spindly.
    bar: s ? 14 : cls === "m" ? 16 : 18,
    gap: s ? 6 : 8,
  };
}

export function sizeFor(role: "axis" | "label" | "value" | "note" | "figure" | "display", z: Sizes): number {
  return z[role];
}
