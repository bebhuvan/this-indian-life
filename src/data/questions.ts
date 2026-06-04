import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { v1Questions } from "../../scripts/registry/v1-indicators.mjs";
import type { DomainId } from "./site";

export type LockedNumber = {
  label: string;
  value: number;
  displayValue?: string;
  date?: string;
  unit: string;
  sourceId: string;
  indicatorId: string;
};

/** One reader-facing edit-log entry. `commit` deep-links the exact diff on GitHub. */
export type ChangelogEntry = { date: string; note: string; commit?: string };

export type ExplanationArtifact = {
  schemaVersion: 1;
  questionId: string;
  status: "ready" | "work_in_progress" | "needs_data";
  /** Optional editorial freshness signals, distinct from the build/git dates. */
  lastReviewed?: string;
  dataThrough?: string;
  /** Curated, human-readable edit notes. Newest entries are sorted to the top at render. */
  changelog?: ChangelogEntry[];
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
  editorialStory?: {
    eyebrow?: string;
    title: string;
    dek?: string;
    lede?: string;
    numberCards?: Array<{
      numberLabel?: string;
      label?: string;
      value?: number;
      displayValue?: string;
      unit?: string;
      caption?: string;
    }>;
    pullQuotes?: Array<{ quote: string; numberLabel?: string; context?: string }>;
    jargon?: Array<{ term: string; plainMeaning: string; whyItMattersHere?: string }>;
    sections: Array<{
      kicker?: string;
      heading: string;
      body: string | string[];
      pullQuote?: string;
      numberLabels?: string[];
      jargonTerms?: string[];
    }>;
  };
  editorialPlan?: {
    audience: string;
    heroDescription: string;
    selectedDataPoints: Array<{ label: string; reason: string; use: string }>;
    pullQuotes: Array<{ quote: string; numberLabel: string }>;
    glossaryBlocks: Array<{ term: string; plainMeaning: string; whyItMattersHere: string }>;
  };
  chartExplainers?: Array<{
    visualId: string;
    title: string;
    whyShowThis: string;
    howToRead: string;
    mistakeToAvoid: string;
    mobileNote: string;
  }>;
  sourceNotes: string[];
  caveats: string[];
  lockedNumbersUsed: string[];
  qualityFlags: string[];
  generatedAt: string;
  model: string;
  evidence: {
    lockedNumbers: LockedNumber[];
    availableIndicatorIds: string[];
    themeIndicatorIds?: string[];
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
  /** Must-have indicators that define the answer. Falls back to `indicators`. */
  core: string[];
  /** Optional supporting indicators. When set, prose + charts use core ∪ context only. */
  context: string[] | null;
  /** Curated, ordered list of the exact charts this page should show. */
  visualPlan: VisualPlanEntry[] | null;
  /** Optional hand-authored concept primer (e.g. "what inflation means"), rendered as a styled interlude. */
  primer: ConceptPrimer | null;
  explanation: ExplanationArtifact;
};

export type ConceptPrimer = {
  kicker: string;
  lead: string;
  myths?: Array<{ myth: string; reality: string }>;
  ladder?: Array<{ term: string; note: string; tone: string; here?: boolean }>;
  example?: { lead: string; steps: Array<{ year: string; from: number; to: number; rate: string }>; insight: string };
  hyperinflation?: { heading: string; stat?: string; statLabel?: string; body: string };
  protect?: { heading: string; points: string[]; disclaimer?: string };
};

export type VisualPlanEntry = {
  /** Indicator id whose artifact backs this chart. */
  indicator: string;
  /** Which builder/chart type to render. */
  chart: string;
  /** Card size: "hero" (full, large) | "feature" (full width) | "small" (grid cell). */
  size?: string;
  /** Editorial title override (optional; defaults to the artifact title). */
  title?: string;
  /** Time window intent: "full" | "last10" | "latest" | "projection". */
  window?: string;
  /** Multi-series line/bar entries for comparison charts. */
  series?: Array<{ indicator: string; label: string }>;
  /** Unit override for planned comparison charts. */
  unit?: string;
  /** Source/detail line override for the chart subtitle. */
  subtitle?: string;
  /** Optional denominator selector for custom share charts. */
  denominator?: string;
  /** Narrative beat this chart serves (answer | mechanism | structure | shift | caveat ...). */
  beat?: string;
  /** One-line reason this chart earns its place. */
  why?: string;
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
      core: item.core ?? item.indicators,
      context: item.context ?? null,
      visualPlan: item.visualPlan ?? null,
      primer: item.primer ?? null,
      explanation
    };
  })
  .filter(Boolean) as QuestionPage[];

export function questionUrl(page: QuestionPage, locale = "en") {
  return `/${locale}/articles/${page.slug}/`;
}

export type StatusMeta = {
  /** Full label for the article header / edit log, e.g. "Work in progress". */
  label: string;
  /** Compact label for listing rows, e.g. "In progress". */
  short: string;
  /** CSS modifier on `.status` / `.q-ans`. */
  cls: "ready" | "wip" | "needs";
};

export function statusMeta(status: ExplanationArtifact["status"]): StatusMeta {
  if (status === "work_in_progress") return { label: "Work in progress", short: "In progress", cls: "wip" };
  if (status === "needs_data") return { label: "Needs more data", short: "Needs data", cls: "needs" };
  return { label: "Ready", short: "Article", cls: "ready" };
}

export type GitCommitMeta = { sha: string; date: string; subject: string };
export type GitFileMeta = { published?: string; updated?: string; history: GitCommitMeta[] };

// Built before each build by scripts/build-git-meta.mjs (committed for the dev
// server too). Absent/empty is fine — callers fall back to `generatedAt`.
let gitMetaCache: Record<string, GitFileMeta> | null = null;
function loadGitMeta(): Record<string, GitFileMeta> {
  if (gitMetaCache) return gitMetaCache;
  const path = resolve(process.cwd(), "data/git-meta.json");
  gitMetaCache = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
  return gitMetaCache!;
}

export function gitMetaFor(questionId: string): GitFileMeta {
  return loadGitMeta()[questionId] ?? { history: [] };
}

export function formatLockedNumber(item: LockedNumber) {
  if (item.displayValue) return item.displayValue;
  const abs = Math.abs(item.value);
  if (/rupees|inr|₹/i.test(item.unit) && abs >= 1_000_000_000_000) return `₹${(item.value / 1_000_000_000_000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh crore`;
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
  const sourceCount = page.explanation.evidence.themeIndicatorIds?.length || page.explanation.evidence.availableIndicatorIds.length;
  const statusText = page.explanation.status !== "needs_data"
    ? "The chart is useful, but do not convert it into a WhatsApp forward. Read the caveat before the confidence."
    : "The honest answer is: we need more indicators before making a big claim.";

  return {
    title: "Okay bro, what does this mean?",
    kicker: "Chart looks nice. Point kya hai?",
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

// Prefer the LLM's real, article-specific pull quote (editorialPlan.pullQuotes);
// fall back to the generic per-domain line only if none was generated.
export function pullQuoteForPage(page: QuestionPage) {
  const quotes = page.explanation.editorialPlan?.pullQuotes;
  const q = Array.isArray(quotes) ? quotes.find((item) => item && item.quote) : null;
  if (q) {
    const locked = page.explanation.evidence.lockedNumbers?.find((n) => n.label === q.numberLabel);
    let stat = locked ? formatLockedNumber(locked) : "";
    if (!stat) {
      const m = q.quote.match(/[₹$]?\d[\d,.]*\s?(%|crore|lakh|billion|million|trillion|TWh|GB|years)?/i);
      stat = m ? m[0].trim() : "";
    }
    return { stat: stat || "The point", line: q.quote };
  }
  return pullQuoteForQuestion(page);
}

export function pullQuoteForQuestion(page: QuestionPage) {
  const top = page.explanation.evidence.lockedNumbers[0];
  if (page.id === "q.econ.compare") {
    return {
      stat: "$2.7k",
      line: "India is huge by people and total GDP. GDP per person is the reality check."
    };
  }
  if (page.id === "q.world.share") {
    return {
      stat: "17.8%",
      line: "India's world share depends on the denominator: people, GDP, or emissions."
    };
  }
  if (page.id.startsWith("q.people.")) {
    return {
      stat: top ? formatLockedNumber(top) : "India-scale",
      line: "In India, scale is the story. A small-looking change can still mean a city, a state, or a generation."
    };
  }
  if (page.id.startsWith("q.econ.")) {
    return {
      stat: top ? formatLockedNumber(top) : "The average",
      line: "The total number shows national scale. The per-person number is the reality check."
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

export type MarkdownBlock =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseMarkdownTable(block: string) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || !lines.every((line) => line.startsWith("|") && line.endsWith("|"))) return null;
  const separator = lines[1]
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (!separator.length || !separator.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;
  const parseRow = (line: string) => line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow).filter((row) => row.length);
  return { headers, rows };
}

export function markdownBlocks(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  for (const block of markdown.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)) {
    const table = parseMarkdownTable(block);
    if (table) blocks.push({ type: "table", ...table });
    else if (block.startsWith("### ")) blocks.push({ type: "h3", text: block.slice(4) });
    else if (block.startsWith("## ")) blocks.push({ type: "h2", text: block.slice(3) });
    else if (block.split("\n").every((line) => /^-\s+/.test(line.trim()))) {
      blocks.push({
        type: "ul",
        items: block.split("\n").map((line) => line.trim().replace(/^-\s+/, "")).filter(Boolean)
      });
    }
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
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
}
