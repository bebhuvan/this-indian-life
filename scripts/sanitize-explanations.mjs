import { readFile, readdir, writeFile } from "node:fs/promises";
import { stableJson } from "./core/artifacts.mjs";

function sanitizeText(text) {
  return String(text)
    .replace(/\bit is important to note that\b/gi, "the caveat is that")
    .replace(/\bit is important to note\b/gi, "the caveat matters")
    .replace(/\bcrucially\b/gi, "importantly")
    .replace(/\bcrucial\b/gi, "important")
    .replace(/\bdelve\b/gi, "examine")
    .replace(/\btapestry\b/gi, "pattern")
    .replace(/\bcomplex interplay\b/gi, "relationship")
    .replace(/\bin conclusion\b/gi, "overall");
}

function sanitizeDocument(value) {
  if (typeof value === "string") return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeDocument);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, sanitizeDocument(nested)]));
  }
  return value;
}

const files = (await readdir("data/explanations/en"))
  .filter((file) => file.endsWith(".json") && !file.endsWith(".evidence.json"))
  .sort();

for (const file of files) {
  const path = `data/explanations/en/${file}`;
  const document = JSON.parse(await readFile(path, "utf8"));
  await writeFile(path, `${stableJson(sanitizeDocument(document))}\n`);
  console.log(`sanitized ${file}`);
}
