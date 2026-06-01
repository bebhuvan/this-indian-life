import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

export function stableJson(value) {
  return JSON.stringify(value, null, 2);
}

export function hashObject(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function sourceSlug(value) {
  return String(value).replace(/[^A-Za-z0-9_.@-]+/g, "_");
}

export async function writeSnapshot(sourceId, name, payload) {
  const hash = hashObject(payload);
  const dir = `data/snapshots/${sourceId}`;
  await mkdir(dir, { recursive: true });
  const path = `${dir}/${sourceSlug(name)}.${hash.slice(0, 12)}.json`;
  await writeFile(path, `${stableJson(payload)}\n`);
  return { path, hash };
}

export async function writeSeriesArtifact({ sourceId, name, artifact }) {
  await mkdir("data/series", { recursive: true });
  const path = `data/series/${sourceSlug(name)}.json`;
  await writeFile(path, `${stableJson(artifact)}\n`);
  return path;
}

export async function writeSourceManifest(sourceId, manifest) {
  await mkdir("data/catalog", { recursive: true });
  const path = `data/catalog/${sourceSlug(sourceId)}-manifest.json`;
  await writeFile(path, `${stableJson(manifest)}\n`);
  return path;
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function listJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => `${dir}/${entry.name}`)
    .sort();
}

export function createSeriesArtifact({
  indicatorId,
  title,
  sourceId,
  sourceIndicatorId,
  sourceUrl,
  unit,
  frequency = "annual",
  geography = { type: "country", id: "IND", name: "India" },
  fetchedAt,
  observations,
  dimensions = [],
  metadata = {}
}) {
  return {
    schemaVersion: 1,
    artifactType: "series",
    indicatorId,
    title,
    sourceId,
    sourceIndicatorId: String(sourceIndicatorId),
    sourceUrl,
    unit,
    frequency,
    geography,
    dimensions,
    fetchedAt,
    observations,
    metadata
  };
}

export function createTableArtifact({
  indicatorId,
  title,
  sourceId,
  sourceIndicatorId,
  sourceUrl,
  unit,
  geography = { type: "country", id: "IND", name: "India" },
  fetchedAt,
  rows,
  dimensions = [],
  metadata = {}
}) {
  return {
    schemaVersion: 1,
    artifactType: "table",
    indicatorId,
    title,
    sourceId,
    sourceIndicatorId: String(sourceIndicatorId),
    sourceUrl,
    unit,
    geography,
    dimensions,
    fetchedAt,
    rows,
    metadata
  };
}
