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
  // Source notes and further reading must carry a URL. ArticleEvidence.astro renders a
  // { label, url } object as a hyperlink and a bare string as dead text, so an unlinked
  // note is a source the reader is asked to trust but cannot check.
  //
  // Deliberately a WARNING rather than a failure: 349 of 373 notes across the site are
  // still bare strings, so failing here would turn the gate red for almost every article
  // and bury the real errors. Same call the repo already made for validate:data. Once the
  // backlog is cleared, promote this to `failures`.
  for (const [field, items] of [["sourceNotes", doc.sourceNotes], ["furtherReading", doc.furtherReading]]) {
    const unlinked = (items || []).filter((item) => !item || typeof item === "string" ? !/^https?:\/\/\S+$/.test(String(item || "")) : !item.url);
    if (unlinked.length) {
      const first = typeof unlinked[0] === "string" ? unlinked[0] : unlinked[0].label || "";
      console.warn(`warn ${file}: ${field} ${unlinked.length}/${(items || []).length} entries have no URL — "${String(first).slice(0, 60)}"`);
      warnings += 1;
    }
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
