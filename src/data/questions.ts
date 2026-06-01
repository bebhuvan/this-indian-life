import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { v1Questions } from "../../scripts/registry/v1-indicators.mjs";
import type { DomainId } from "./site";

export type LockedNumber = {
  label: string;
  value: number;
  date?: string;
  unit: string;
  sourceId: string;
  indicatorId: string;
};

export type ExplanationArtifact = {
  schemaVersion: 1;
  questionId: string;
  status: "ready" | "needs_data";
  short: {
    headline: string;
    dek: string;
    body: string;
  };
  article: {
    title: string;
    standfirst: string;
    bodyMarkdown: string;
  };
  sourceNotes: string[];
  caveats: string[];
  lockedNumbersUsed: string[];
  qualityFlags: string[];
  generatedAt: string;
  model: string;
  evidence: {
    lockedNumbers: LockedNumber[];
    availableIndicatorIds: string[];
    requiredIndicatorIds: string[];
    sourceSummaries: Array<Record<string, unknown>>;
  };
};

export type QuestionPage = {
  id: string;
  slug: string;
  domain: DomainId;
  question: string;
  indicators: string[];
  explanation: ExplanationArtifact;
};

const domainByPrefix: Record<string, DomainId> = {
  people: "people",
  econ: "economy",
  health: "health",
  education: "society",
  work: "society",
  energy: "energy",
  air: "climate",
  climate: "climate",
  services: "society",
  state: "economy",
  world: "society"
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function domainForQuestionId(id: string): DomainId {
  return domainByPrefix[id.split(".")[1]] || "society";
}

function readExplanation(questionId: string): ExplanationArtifact | null {
  const path = resolve(process.cwd(), `data/explanations/en/${questionId}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

export const questionPages: QuestionPage[] = v1Questions
  .map((item) => {
    const explanation = readExplanation(item.id);
    if (!explanation) return null;
    return {
      id: item.id,
      slug: slugify(item.question),
      domain: domainForQuestionId(item.id),
      question: item.question,
      indicators: item.indicators,
      explanation
    };
  })
  .filter(Boolean) as QuestionPage[];

export function questionUrl(page: QuestionPage, locale = "en") {
  return `/${locale}/articles/${page.slug}/`;
}

export function formatLockedNumber(item: LockedNumber) {
  const abs = Math.abs(item.value);
  if (item.unit === "people" && abs >= 10_000_000) return `${(item.value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} crore`;
  if (/current US\$|usd|US\$/i.test(item.unit) && abs >= 1_000_000_000_000) return `$${(item.value / 1_000_000_000_000).toFixed(2)}T`;
  if (/tonnes|twh|mtco2|kwh/i.test(item.unit) && abs >= 1_000_000_000) return `${(item.value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return item.value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  if (abs >= 100) return item.value.toLocaleString("en-IN", { maximumFractionDigits: 1 });
  return item.value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

export function markdownBlocks(markdown: string) {
  const blocks: Array<{ type: "h2" | "h3" | "p"; text: string }> = [];
  for (const block of markdown.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)) {
    if (block.startsWith("### ")) blocks.push({ type: "h3", text: block.slice(4) });
    else if (block.startsWith("## ")) blocks.push({ type: "h2", text: block.slice(3) });
    else blocks.push({ type: "p", text: block.replace(/\n/g, " ") });
  }
  return blocks;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function inlineMarkdownHtml(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}
