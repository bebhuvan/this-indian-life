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

export function macchaExplanation(page: QuestionPage) {
  const locked = page.explanation.evidence.lockedNumbers;
  const top = locked[0];
  const second = locked.find((item) => item.indicatorId !== top?.indicatorId) || locked[1];
  const topText = top ? `${formatLockedNumber(top)}${top.date ? ` in ${top.date}` : ""}` : "not enough clean evidence yet";
  const secondText = second ? `${formatLockedNumber(second)}${second.date ? ` in ${second.date}` : ""}` : "";
  const caveat = page.explanation.caveats[0] || "This is a national number, so it can hide big differences across states, cities, class, caste, gender, and age.";
  const sourceCount = page.explanation.evidence.availableIndicatorIds.length;
  const statusText = page.explanation.status === "ready"
    ? "The chart is useful, but do not convert it into a WhatsApp forward. Read the caveat before the confidence."
    : "The honest answer is: we need more indicators before making a big claim.";

  return {
    title: "What does it mean, maccha?",
    kicker: "That and all ok, but I understood nothing",
    body: top
      ? `Translation: the main number to hold in your head is ${topText}. ${secondText ? `The useful comparison number is ${secondText}. ` : ""}${statusText}`
      : statusText,
    bullets: [
      `Built from ${sourceCount} local data artifact${sourceCount === 1 ? "" : "s"}, not live model memory.`,
      caveat,
      "Use this as a clean starting point, not the final word on India."
    ]
  };
}

export function pullQuoteForQuestion(page: QuestionPage) {
  const top = page.explanation.evidence.lockedNumbers[0];
  if (page.id.startsWith("q.people.")) {
    return {
      stat: top ? formatLockedNumber(top) : "India-scale",
      line: "In India, scale is the story. A small-looking change can still mean a city, a state, or a generation."
    };
  }
  if (page.id.startsWith("q.econ.")) {
    return {
      stat: top ? formatLockedNumber(top) : "The average",
      line: "The national headline and the household feeling can both be true. The chart tells you where the gap starts."
    };
  }
  if (page.id.startsWith("q.energy.")) {
    return {
      stat: top ? formatLockedNumber(top) : "The grid",
      line: "Energy data is not abstract. It is fans, pumps, factories, trains, and the fuel mix behind them."
    };
  }
  if (page.id.startsWith("q.climate.") || page.id.startsWith("q.air.")) {
    return {
      stat: top ? formatLockedNumber(top) : "The atmosphere",
      line: "Climate and air numbers become real when you read them beside exposure, people, and time."
    };
  }
  return {
    stat: top ? formatLockedNumber(top) : "The number",
    line: "The first number is only the entry point. The shape of the data is where the answer begins."
  };
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
