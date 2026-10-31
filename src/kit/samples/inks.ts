// One ink per series across a whole story, so a reader who learns "$8.30 is neel" in one
// chart can read it in every other. Samples pass these as series/item colours.

import { INK } from "../theme";

export const POVERTY_LINES = {
  "$8.30": INK.neel,
  "$4.20": INK.ink,
  "$3.00": INK.plum,
} as const;

export const LRS_PURPOSES = {
  /** The story's protagonist: deposits, property, equity and debt. */
  capital: INK.neel,
  total: INK.ink,
  travel: INK.stoneLine,
  family: INK.stoneLine,
} as const;
