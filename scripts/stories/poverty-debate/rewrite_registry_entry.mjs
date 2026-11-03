// Replace the q.econ.poverty_debate registry entry with the November 2026 rewrite plan
// (data/stories/poverty-debate/story-design.md). Keeps the pinned source
// notes from the current entry and appends PLAN.sourceNotesExtra; PLAN.furtherReading replaces the reading list.
import { readFileSync, writeFileSync } from "node:fs";
import { v1Questions } from "../../registry/v1-indicators.mjs";

const FILE = new URL("../../registry/v1-indicators.mjs", import.meta.url);
const QID = "q.econ.poverty_debate";
const old = v1Questions.find((q) => q.id === QID);
const PLAN = JSON.parse(readFileSync(new URL("./registry_plan.json", import.meta.url), "utf8"));

const { sourceNotesExtra = [], furtherReading, ...plan } = PLAN;
const keep = old.sourceNotes.filter((n) => !sourceNotesExtra.some((x) => x.label === n.label));
const entry = { id: QID, slug: old.slug, ...plan, sourceNotes: [...keep, ...sourceNotesExtra], furtherReading: furtherReading ?? old.furtherReading };
const text = readFileSync(FILE, "utf8");
const at = text.indexOf(`"id": "${QID}"`);
const start = text.lastIndexOf("\n  {", at) + 1;
let depth = 0, i = start, inStr = false, q = "";
for (; i < text.length; i++) {
  const c = text[i];
  if (inStr) { if (c === "\\") i++; else if (c === q) inStr = false; continue; }
  if (c === '"' || c === "'" || c === "`") { inStr = true; q = c; continue; }
  if (c === "{") depth++;
  if (c === "}" && --depth === 0) break;
}
const block = JSON.stringify(entry, null, 2).split("\n").map((l) => "  " + l).join("\n");
writeFileSync(FILE, text.slice(0, start) + block + text.slice(i + 1));
console.log(`replaced ${QID}: ${PLAN.visualPlan.length} charts`);
