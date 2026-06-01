import { mkdir, writeFile } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";
import { buildEvidencePacket } from "./core/evidence.mjs";
import { listJsonFiles, readJson, stableJson } from "./core/artifacts.mjs";
import { v1Questions } from "./registry/v1-indicators.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, limit: Infinity, questions: null };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    if (arg.startsWith("--limit=")) args.limit = Number(arg.slice("--limit=".length));
    if (arg.startsWith("--questions=")) {
      args.questions = new Set(arg.slice("--questions=".length).split(",").map((value) => value.trim()).filter(Boolean));
    }
  }
  return args;
}

function systemPrompt() {
  return [
    "You write for Indica, a public data almanac about India.",
    "Return only valid JSON.",
    "Every number and factual claim in the prose must come from the evidence packet. Do not add outside facts, rankings, census context, policy claims, or causes.",
    "Write in clean Indian English for an intelligent general reader.",
    "Avoid AI-writing tells: no 'delve', 'tapestry', 'complex interplay', 'crucial', 'it is important to note', 'in conclusion', generic balance paragraphs, or theatrical transitions.",
    "The short version should be precise and readable in one screen.",
    "The long article should be scholarly in structure but simple in language: explain what the measure means, what the trend says, what it does not say, and why it matters.",
    "If status is ready, the long article must be at least 900 words. If you cannot reach 900 words using only evidence, set status to needs_data.",
    "If the evidence is not enough, set status to 'needs_data' and write honestly about the gap.",
    "The top-level JSON object must contain schemaVersion, questionId, status, short, article, sourceNotes, caveats, lockedNumbersUsed, and qualityFlags. Do not wrap the answer in task, outputSchema, or any other parent object."
  ].join("\n");
}

function userPrompt(evidence) {
  return [
    "Write the explanation for this question.",
    "Return exactly one JSON object with this shape:",
    stableJson({
      schemaVersion: 1,
      questionId: evidence.questionId,
      status: "ready | needs_data",
      short: {
        headline: "string, <= 90 characters",
        dek: "string, <= 180 characters",
        body: "string, 90-150 words"
      },
      article: {
        title: "string",
        standfirst: "string, <= 260 characters",
        bodyMarkdown: "string, 900-1400 words if status is ready; 250-500 words if status is needs_data"
      },
      sourceNotes: ["short source note strings"],
      caveats: ["specific caveats"],
      lockedNumbersUsed: ["labels of locked numbers used"],
      qualityFlags: ["specific issues or empty array"]
    }),
    "Evidence packet:",
    stableJson(evidence)
  ].join("\n\n");
}

function normalizeCompletion(json) {
  if (json?.outputSchema && typeof json.outputSchema === "object") return json.outputSchema;
  return json;
}

function validateExplanation(document, questionId) {
  const missing = [];
  for (const key of ["schemaVersion", "questionId", "status", "short", "article", "sourceNotes", "caveats", "lockedNumbersUsed", "qualityFlags"]) {
    if (document[key] === undefined) missing.push(key);
  }
  if (document.questionId !== questionId) missing.push("matching questionId");
  if (!document.short?.body) missing.push("short.body");
  if (!document.article?.bodyMarkdown) missing.push("article.bodyMarkdown");
  if (missing.length) throw new Error(`Explanation ${questionId} is missing ${missing.join(", ")}`);
}

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

function sanitizeExplanation(document) {
  const copy = structuredClone(document);
  if (copy.short) {
    copy.short.headline = sanitizeText(copy.short.headline || "");
    copy.short.dek = sanitizeText(copy.short.dek || "");
    copy.short.body = sanitizeText(copy.short.body || "");
  }
  if (copy.article) {
    copy.article.title = sanitizeText(copy.article.title || "");
    copy.article.standfirst = sanitizeText(copy.article.standfirst || "");
    copy.article.bodyMarkdown = sanitizeText(copy.article.bodyMarkdown || "");
  }
  return copy;
}

async function loadArtifacts() {
  const files = await listJsonFiles("data/series");
  const artifacts = [];
  for (const file of files) {
    const artifact = await readJson(file);
    artifacts.push({ ...artifact, path: file });
  }
  return artifacts;
}

const args = parseArgs(process.argv.slice(2));
const artifacts = await loadArtifacts();
const questions = v1Questions
  .filter((question) => !args.questions || args.questions.has(question.id))
  .slice(0, args.limit);

await mkdir("data/explanations/en", { recursive: true });

for (const question of questions) {
  const evidence = buildEvidencePacket({ question, artifacts });
  const outputPath = `data/explanations/en/${question.id}.json`;

  if (args.dryRun) {
    await writeFile(outputPath.replace(/\.json$/, ".evidence.json"), `${stableJson(evidence)}\n`);
    console.log(`dry-run evidence ${question.id}: ${evidence.availableIndicatorIds.length} artifact(s), ${evidence.lockedNumbers.length} locked number(s)`);
    continue;
  }

  const completion = await createDeepSeekJsonCompletion({
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: userPrompt(evidence) }
    ],
    maxTokens: Number(process.env.INDICA_EXPLANATION_MAX_TOKENS || 7000)
  });

  const generated = sanitizeExplanation(normalizeCompletion(completion.json));
  validateExplanation(generated, question.id);
  const document = {
    ...generated,
    generatedAt: new Date().toISOString(),
    model: completion.payload.model,
    evidence
  };
  await writeFile(outputPath, `${stableJson(document)}\n`);
  console.log(`wrote explanation ${question.id}`);
}
