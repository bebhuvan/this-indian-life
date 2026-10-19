import { readdir, readFile } from "node:fs/promises";
import { lintExplanation } from "./core/prose-lint.mjs";
import { lintSectionBinding, lintChartCards } from "./core/chart-card-lint.mjs";

const questionArg = process.argv.slice(2).find((arg) => arg.startsWith("--question="));
const selectedQuestion = questionArg?.slice("--question=".length);
const files = (await readdir("data/explanations/en"))
  .filter((file) => file.endsWith(".json") && !file.endsWith(".evidence.json"))
  .filter((file) => !selectedQuestion || file === `${selectedQuestion}.json`)
  .sort();
if (selectedQuestion && files.length !== 1) throw new Error(`Explanation not found: ${selectedQuestion}`);

let failures = 0;
let warnings = 0;

// Resolvers for the opt-in card lint; cheap enough to build unconditionally.
const { v1Questions } = await import("./registry/v1-indicators.mjs");
const slugifyTitle = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seriesByIndicator = new Map();
if (process.env.INDICA_CARD_LINT) {
  for (const f of await readdir("data/series")) {
    try {
      const a = JSON.parse(await readFile(`data/series/${f}`, "utf8"));
      if (a.indicatorId) seriesByIndicator.set(a.indicatorId, a);
    } catch { /* skip unreadable */ }
  }
}
const chartsFor = (qid) => {
  const q = v1Questions.find((x) => x.id === qid);
  return (q?.visualPlan || []).filter((v) => v.indicator).map((v) => ({ visualId: slugifyTitle(v.title), indicator: v.indicator }));
};
const resolveIndicator = (id) => seriesByIndicator.get(id) || null;

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
  // note is a source the reader is asked to trust but cannot check. This is a FAILURE:
  // the backlog was cleared in October 2026, when every article's verified list was
  // pinned in the registry (scripts/registry/source-notes.mjs). Check what actually
  // RENDERS, i.e. the registry list where one is pinned (src/data/questions.ts merges it
  // over the explanation), else the explanation's own list. Explanations with no
  // registry question are not built, but are held to the same rule.
  const question = v1Questions.find((q) => q.id === doc.questionId);
  for (const field of ["sourceNotes", "furtherReading"]) {
    const items = question?.[field] ?? doc[field];
    // A url is absolute http(s), or a root-relative link to another Indica page.
    const isUrl = (v) => /^(https?:\/\/\S+|\/[^\s/]\S*)$/.test(String(v || ""));
    const unlinked = (items || []).filter((item) => !item || typeof item === "string" ? !/^https?:\/\/\S+$/.test(String(item || "")) : !isUrl(item.url) || !String(item.label || "").trim());
    if (unlinked.length) {
      const first = typeof unlinked[0] === "string" ? unlinked[0] : unlinked[0]?.label || "";
      console.error(`fail ${file}: ${field} ${unlinked.length}/${(items || []).length} entries have no URL — "${String(first).slice(0, 60)}"`);
      failures += 1;
    }
    // House style: no em dashes in reader-facing labels.
    const dashed = (items || []).filter((item) => /—/.test(typeof item === "string" ? item : item?.label || ""));
    if (dashed.length) {
      const sample = typeof dashed[0] === "string" ? dashed[0] : dashed[0].label;
      console.error(`fail ${file}: ${field} ${dashed.length} label(s) contain an em dash: "${String(sample).slice(0, 60)}"`);
      failures += 1;
    }
    // The explanation file should carry the same list the page renders, so anyone reading
    // the JSON (or a downstream export) sees the linked version.
    if (question?.[field] && doc[field]) {
      const plain = (list) => JSON.stringify(list.map((e) => (typeof e === "string" ? e : { label: e.label, url: e.url })));
      if (plain(question[field]) !== plain(doc[field])) {
        console.warn(`warn ${file}: ${field} differs from the registry's pinned list (run python3 scripts/apply-pinned-references.py)`);
        warnings += 1;
      }
    }
  }

  // sectionVisualMap binding. A mapped heading that no longer exists in the prose makes
  // [slug].astro fall back SILENTLY to token-overlap matching, so charts sit under the
  // wrong prose with a green build. Warning rather than failure only because four
  // articles are already in this state; promote to a failure once they are cleared.
  for (const finding of lintSectionBinding(doc)) {
    console.warn(`warn ${file}: ${finding.field} ${finding.rule} — "${finding.match}"`);
    warnings += 1;
  }
  // Card-level numeric checks are opt-in: measured across the site they carry too many
  // false positives to gate on. See the header of chart-card-lint.mjs.
  if (process.env.INDICA_CARD_LINT) {
    for (const finding of lintChartCards(doc, chartsFor, resolveIndicator)) {
      console.warn(`warn ${file}: ${finding.field} ${finding.rule} — "${finding.match}"`);
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
