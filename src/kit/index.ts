// The kit's public surface: draw a spec at a width, or render it straight to SVG.

import type { Scene } from "./types";
import { renderSvg, type RenderOpts } from "./render-svg";
import { line } from "./forms/line";
import { bars } from "./forms/bars";
import { spectrum } from "./forms/spectrum";
import { waterfall } from "./forms/waterfall";
import { tug } from "./forms/tug";
import { columns } from "./forms/columns";
import { curve } from "./forms/curve";
import { dumbbell } from "./forms/dumbbell";
import { arrows } from "./forms/arrows";
import { slope } from "./forms/slope";
import { tiles } from "./forms/tiles";
import { hundred } from "./forms/hundred";
import { season } from "./forms/season";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = (spec: any, width: number) => Scene;

export const FORMS: Record<string, Form> = {
  line,
  bars,
  spectrum,
  waterfall,
  tug,
  columns,
  curve,
  dumbbell,
  arrows,
  slope,
  tiles,
  hundred,
  season,
};

export interface AnySpec {
  form: string;
  [k: string]: unknown;
}

export function draw(spec: AnySpec, width: number): Scene {
  const f = FORMS[spec.form];
  if (!f) throw new Error(`chart kit: no form "${spec.form}"`);
  return f(spec, Math.round(width));
}

export function svg(spec: AnySpec, width: number, opts?: RenderOpts): string {
  return renderSvg(draw(spec, width), opts);
}

export { renderSvg };
export type { Scene };
