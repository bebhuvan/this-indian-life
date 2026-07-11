// Regenerate ONLY the evidence packet for q.econ.gold from the updated series
// (deterministic, no LLM). Keeps lockedNumbers / selectedDataPoints in sync with
// the now-extended (CY2025) data so the evidence block and GitHub links match the
// charts. Leaves prose, chartExplainers, sectionVisualMap untouched.
import { readFile, writeFile } from "node:fs/promises";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

const QID = "q.econ.gold";
const path = `data/explanations/en/${QID}.json`;
const question = v1Questions.find((q) => q.id === QID);
const files = await listJsonFiles("data/series");
const artifacts = [];
for (const f of files) { try { artifacts.push(await readJson(f)); } catch {} }
const evidence = buildEvidencePacket({ question, artifacts });

const doc = JSON.parse(await readFile(path, "utf8"));
const before = doc.evidence?.lockedNumbers?.length ?? 0;
doc.evidence = evidence;
await writeFile(path, JSON.stringify(doc, null, 2) + "\n");
console.log(`refreshed evidence: ${before} -> ${evidence.lockedNumbers?.length} lockedNumbers, ${evidence.selectedDataPoints?.length} selectedDataPoints`);
