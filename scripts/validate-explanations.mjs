import { readdir, readFile } from "node:fs/promises";
import { lintExplanation } from "./core/prose-lint.mjs";

const files = (await readdir("data/explanations/en"))
  .filter((file) => file.endsWith(".json") && !file.endsWith(".evidence.json"))
  .sort();

let failures = 0;
let warnings = 0;

for (const file of files) {
  const path = `data/explanations/en/${file}`;
  const doc = JSON.parse(await readFile(path, "utf8"));
  const required = ["schemaVersion", "questionId", "status", "short", "article", "sourceNotes", "caveats", "lockedNumbersUsed", "qualityFlags", "evidence"];
  for (const key of required) {
    if (doc[key] === undefined) {
      console.error(`fail ${file}: missing ${key}`);
      failures += 1;
    }
  }
  const article = doc.article?.bodyMarkdown || "";
  const words = article.split(/\s+/).filter(Boolean).length;
  if (doc.status === "ready" && words < 300) {
    console.error(`fail ${file}: ready article has only ${words} words`);
    failures += 1;
  }
  if (doc.status === "ready" && words < 380) {
    console.warn(`warn ${file}: ready article is shorter than target (${words} words)`);
    warnings += 1;
  }
  for (const finding of lintExplanation(doc)) {
    if (finding.severity === "error") {
      console.error(`fail ${file}: ${finding.field} ${finding.rule} — "${finding.match}"`);
      failures += 1;
    } else {
      console.warn(`warn ${file}: ${finding.field} ${finding.rule} — "${finding.match}"`);
      warnings += 1;
    }
  }
}

console.log(`Validated ${files.length} explanation artifact(s): ${failures} failure(s), ${warnings} warning(s).`);
if (failures) process.exit(1);
