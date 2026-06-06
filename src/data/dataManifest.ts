// Build-time only: maps each data artifact's indicatorId to its source file name
// and the one-line method note baked into the artifact's metadata. The evidence
// block turns this into GitHub deep-links pinned to the article's own publish commit
// (see githubFileUrl), so the linked data is exactly what the article was built from,
// frozen — not whatever the file says now. Runs once at build; emits plain static
// links, so it adds nothing to page load.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const dataDir = resolve(process.cwd(), "data/series");
const REPO = "https://github.com/bebhuvan/this-indian-life";

export type DataFileMeta = { file: string; method?: string; sourceUrl?: string };

/** GitHub blob link for a data file, pinned to `ref` (a commit sha, or "main"). */
export function githubFileUrl(file: string, ref = "main"): string {
  return `${REPO}/blob/${ref}/data/series/${file}`;
}
/** GitHub link to the whole data folder, pinned to `ref`. */
export function dataFolderUrl(ref = "main"): string {
  return `${REPO}/tree/${ref}/data/series`;
}

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
    map.set(iid, { file, method, sourceUrl: typeof d.sourceUrl === "string" ? d.sourceUrl : undefined });
  }
  return map;
}

const manifest = build();
export function dataFileFor(indicatorId?: string): DataFileMeta | undefined {
  return indicatorId ? manifest.get(indicatorId) : undefined;
}
