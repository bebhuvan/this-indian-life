import type { Sample } from "./types";
import { samples as core } from "./core";
import { samples as signed } from "./signed";
import { samples as compare } from "./compare";
import { samples as fields } from "./fields";

export const SAMPLES: Sample[] = [...core, ...signed, ...compare, ...fields];
export type { Sample };
