// The Scene: what every form produces and every renderer consumes. Coordinates are CSS px
// at the width the chart is drawn for. Text positions are the vertical centre of the line.

/**
 * axis: ticks. label: names. value: numbers beside marks. note: the italic margin voice.
 * figure: a large sans numeral for tiles and table totals. display: the one number a
 * chart is about, in Literata; a Scene may hold at most one.
 */
export type Role = "axis" | "label" | "value" | "note" | "figure" | "display";
export type Anchor = "start" | "middle" | "end";

export interface TextMark {
  kind: "text";
  x: number;
  y: number;
  text: string;
  role: Role;
  anchor: Anchor;
  bold?: boolean;
  color?: string;
  /** Paint a ground-coloured outline behind the glyphs, so the text reads over lines. */
  halo?: boolean;
}

export type Mark =
  | { kind: "rect"; x: number; y: number; w: number; h: number; fill: string; opacity?: number }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; stroke: string; width: number; dash?: string; cap?: "butt" | "round" }
  | { kind: "path"; d: string; stroke?: string; fill?: string; width?: number; dash?: string; opacity?: number; join?: "round" | "miter" }
  | { kind: "circle"; cx: number; cy: number; r: number; fill?: string; stroke?: string; width?: number }
  | TextMark;

export interface Scene {
  width: number;
  height: number;
  marks: Mark[];
  /** A one-sentence description for screen readers. */
  alt: string;
}

/** Fields every spec may carry. Each form extends this with its own data. */
export interface BaseSpec {
  form: string;
  title?: string;
  dek?: string;
  source?: string;
  alt?: string;
  /** Unit of the values: "%", "pts", "$m", "₹ lakh", "x", "index" or free text. */
  unit?: string;
  /** A unit the formatter cannot attach to a number ("years", "deaths per 1,000 live
   *  births"), printed once as a caption over the scale. Leave it out when `unit` is set. */
  unitLabel?: string;
  /** Force a number of decimals instead of the kit choosing from the data. */
  decimals?: number;
}
