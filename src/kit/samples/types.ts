import type { AnySpec } from "../index";

/** A gallery entry: a spec plus the words the page (or an export) sets around it. */
export interface Sample {
  id: string;
  title: string;
  dek: string;
  source: string;
  spec: AnySpec;
}
