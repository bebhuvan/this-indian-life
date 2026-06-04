// Build data/git-meta.json: per-article first-published date, last-updated date,
// and the full commit list (sha + date + subject) for its source JSON.
//
// This is the source of truth for the reader-facing edit log. The site renders a
// curated changelog (hand-written notes in each article JSON) plus a synthesized
// "First published" entry and a link to GitHub for the exact line-level diffs —
// so the site itself ships no diff engine. Runs as part of `npm run build`.
//
// Robust by design: if git is unavailable (e.g. some CI runners), every file just
// gets an empty history and the pages fall back to each article's `generatedAt`.

import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DIR = "data/explanations/en";
const OUT = "data/git-meta.json";

const files = readdirSync(resolve(process.cwd(), DIR))
  .filter((file) => file.endsWith(".json") && !file.endsWith(".evidence.json"));

const meta = {};
let withHistory = 0;

for (const file of files) {
  const questionId = file.replace(/\.json$/, "");
  const relPath = `${DIR}/${file}`;
  let raw = "";
  try {
    // --follow tracks renames; %x09 = tab, %aI = author date (ISO 8601, strict).
    raw = execFileSync("git", ["log", "--follow", "--format=%H%x09%aI%x09%s", "--", relPath], {
      encoding: "utf8"
    });
  } catch {
    raw = "";
  }

  // git log is newest-first.
  const history = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sha, date, ...rest] = line.split("\t");
      return { sha, date, subject: rest.join("\t") };
    });

  if (history.length) withHistory += 1;

  meta[questionId] = {
    published: history.at(-1)?.date,
    updated: history[0]?.date,
    history
  };
}

writeFileSync(resolve(process.cwd(), OUT), JSON.stringify(meta, null, 2) + "\n");
console.log(`build-git-meta: wrote ${OUT} for ${files.length} articles (${withHistory} with git history).`);
