import { readdir, readFile } from "node:fs/promises";

const bannedPhrases = [
  "in conclusion",
  "delve",
  "tapestry",
  "complex interplay",
  "it is important to note",
  "crucial"
];

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
  if (doc.status === "ready" && words < 450) {
    console.error(`fail ${file}: ready article has only ${words} words`);
    failures += 1;
  }
  if (doc.status === "ready" && words < 800) {
    console.warn(`warn ${file}: ready article is shorter than target (${words} words)`);
    warnings += 1;
  }
  const combinedText = `${doc.short?.headline || ""}\n${doc.short?.dek || ""}\n${doc.short?.body || ""}\n${article}`.toLowerCase();
  for (const phrase of bannedPhrases) {
    if (combinedText.includes(phrase)) {
      console.error(`fail ${file}: banned phrase "${phrase}"`);
      failures += 1;
    }
  }
}

console.log(`Validated ${files.length} explanation artifact(s): ${failures} failure(s), ${warnings} warning(s).`);
if (failures) process.exit(1);
