// Build-time only: maps each data artifact's indicatorId to its source file on
// GitHub and the one-line method note baked into the artifact's metadata. Used by
// the article evidence block to make every series auditable (link to the exact file
// + how it was computed) WITHOUT shipping any of the data to the client — this runs
// once at build and produces plain static links, so it adds nothing to page load.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dataDir = resolve(process.cwd(), "data/series");
const REPO_BLOB = "https://github.com/bebhuvan/this-indian-life/blob/main/data/series";

export type DataFileMeta = { file: string; githubUrl: string; method?: string; sourceUrl?: string };

function build(): Map<string, DataFileMeta> {
  const map = new Map<string, DataFileMeta>();
  if (!existsSync(dataDir)) return map;
  for (const file of readdirSync(dataDir)) {
    if (!file.endsWith(".json")) continue;
    let d: { indicatorId?: string; sourceUrl?: string; metadata?: Record<string, unknown> };
    try { d = JSON.parse(readFileSync(resolve(dataDir, file), "utf8")); } catch { continue; }
    const iid = d?.indicatorId;
    if (!iid || map.has(iid)) continue;
    const md = (d.metadata || {}) as Record<string, unknown>;
    const method = typeof md.method === "string" ? md.method : typeof md.note === "string" ? md.note : undefined;
    map.set(iid, { file, githubUrl: `${REPO_BLOB}/${file}`, method, sourceUrl: typeof d.sourceUrl === "string" ? d.sourceUrl : undefined });
  }
  return map;
}

const manifest = build();
export const DATA_FOLDER_URL = "https://github.com/bebhuvan/this-indian-life/tree/main/data/series";
export function dataFileFor(indicatorId?: string): DataFileMeta | undefined {
  return indicatorId ? manifest.get(indicatorId) : undefined;
}
