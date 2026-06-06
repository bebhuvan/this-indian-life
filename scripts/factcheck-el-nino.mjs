// Rigorous fact-check of the El Nino article via DeepSeek, in several focused calls.
// Dumps the prose + a labelled data appendix (the actual computed artifact values) and
// asks the model to flag (a) numbers that do not match their source, (b) historical or
// scientific claims that are wrong/imprecise/misleading, (c) bad citations, (d) overclaims.
// Writes all flagged issues to /tmp/elnino_factcheck.json. Run:
//   INDICA_DEEPSEEK_TIMEOUT_MS=900000 node scripts/factcheck-el-nino.mjs
import { readFile, writeFile, readdir } from "node:fs/promises";
import { createDeepSeekJsonCompletion } from "./adapters/deepseek.mjs";

const MODEL = process.env.FACTCHECK_MODEL || "deepseek-v4-pro";
const exp = JSON.parse(await readFile("data/explanations/en/q.climate.el_nino_india.json", "utf8"));

// ---- build a compact, labelled data appendix from the article's artifacts ----
const PREFIXES = ["climate.el_nino", "agriculture.el_nino", "prices.el_nino", "econ.el_nino",
  "work.employment_agriculture", "prices.cpi.inflation_annual_worldbank"];
const files = (await readdir("data/series")).filter((f) => f.endsWith(".json"));
const appendix = [];
for (const f of files) {
  let d;
  try { d = JSON.parse(await readFile(`data/series/${f}`, "utf8")); } catch { continue; }
  const iid = String(d.indicatorId || "");
  if (!PREFIXES.some((p) => iid === p || iid.startsWith(p))) continue;
  let body = "";
  if (d.rows?.length) {
    body = d.rows.map((r) => {
      const label = r.label ?? r.name ?? r.group ?? "";
      const extra = Object.entries(r).filter(([k]) => !["label", "name"].includes(k))
        .map(([k, v]) => `${k}=${v}`).join(",");
      return `${label}: ${extra}`;
    }).join(" | ");
  } else if (d.observations?.length) {
    const o = d.observations.filter((x) => x.value != null);
    const pick = o.length > 16 ? [...o.slice(0, 6), ...o.slice(-6)] : o;
    body = pick.map((x) => `${x.date}=${x.value}`).join(", ") + (o.length > 16 ? ` (… ${o.length} pts)` : "");
  }
  appendix.push(`### ${iid} — ${d.title} [${d.unit}]\n${body}`);
}
const APPENDIX = appendix.join("\n");

const body = exp.article.bodyMarkdown;
const explainers = exp.chartExplainers.map((c) =>
  `- ${c.chartTitle || c.title}: ${c.takeaway || ""} ${c.detail || ""}`).join("\n");

function sys() {
  return "You are a meticulous, skeptical data-journalism fact-checker for an Indian public-interest site. " +
    "You flag ONLY real problems, with specifics. Return STRICT JSON: " +
    '{"issues":[{"severity":"error|warn|note","type":"number|history|science|citation|overclaim|internal-contradiction","quote":"the exact phrase from the text","problem":"what is wrong","fix":"concrete correction"}]}. ' +
    "If a section is clean, return {\"issues\":[]}. Do not invent problems.";
}

async function call(label, user, maxTokens = 40000) {
  process.stdout.write(`\n[${label}] calling ${MODEL}…\n`);
  try {
    const res = await createDeepSeekJsonCompletion({
      model: MODEL,
      maxTokens,
      temperature: 0.1,
      messages: [{ role: "system", content: sys() }, { role: "user", content: user }]
    });
    const issues = res?.issues || [];
    console.log(`[${label}] ${issues.length} issue(s)`);
    return issues.map((i) => ({ ...i, check: label }));
  } catch (e) {
    console.warn(`[${label}] FAILED: ${e.message}`);
    return [{ severity: "note", check: label, type: "meta", problem: `check failed: ${e.message}` }];
  }
}

const all = [];

// 1) Numbers must match the data appendix exactly (value AND the thing it describes).
all.push(...await call("numbers",
  "Check EVERY numeric claim in the ARTICLE against the DATA APPENDIX (the real computed values). " +
  "Flag any number that does not match its source, or that is attached to the wrong region/crop/year/phase. " +
  "Percentages, rupee/tonne figures, correlations, shares, departures - all of them.\n\n" +
  `=== DATA APPENDIX ===\n${APPENDIX}\n\n=== ARTICLE BODY ===\n${body}\n\n=== CHART EXPLAINERS ===\n${explainers}`));

// 2) Historical & scientific claims vs. world knowledge.
all.push(...await call("history-science",
  "Verify the historical and scientific claims in this article against established knowledge. Flag anything " +
  "factually wrong, imprecise, or misleading - dates, attributions, mechanisms. Pay attention to: the India " +
  "Meteorological Department's founding year; Gilbert Walker and the Southern Oscillation; Jacob Bjerknes (1969); " +
  "the 1876-78 and 1896-1902 famines and Mike Davis; the weakening El Nino-monsoon relationship (Kumar, Rajagopalan " +
  "& Cane 1999); central-Pacific 'Modoki' El Ninos being more damaging; 1997 being a strong El Nino with a near-normal " +
  "monsoon; the 1974 oil-shock inflation peak (~28%); the 1991 balance-of-payments crisis; the positive Indian Ocean " +
  "Dipole as warm-west/cool-east; the monsoon being ~70% of India's annual rain; the long-period average being ~88 cm; " +
  "and IMD's normal/below-normal/deficient rainfall bands.\n\n=== ARTICLE BODY ===\n" + body));

// 3) Citations real & correctly attributed.
all.push(...await call("citations",
  "Verify each reference below is a real work, correctly attributed (authors, year, venue), and actually supports " +
  "the point it is cited for. Flag any that is misattributed, has the wrong year/journal, or does not exist.\n\n" +
  exp.furtherReading.map((r) => `- ${r}`).join("\n"), 16000));

// 4) Overclaim / causation-from-correlation / misleading framing.
all.push(...await call("framing",
  "Read this article as a tough editor. Flag sentences that OVERCLAIM, imply causation from correlation, mislead a " +
  "lay reader, or contradict another part of the article. Be specific and quote the sentence.\n\n=== ARTICLE BODY ===\n" + body));

await writeFile("/tmp/elnino_factcheck.json", JSON.stringify(all, null, 2));
console.log(`\n=== TOTAL: ${all.length} issue(s) → /tmp/elnino_factcheck.json ===`);
for (const i of all) console.log(`[${i.severity}/${i.check}] ${i.quote ? `"${String(i.quote).slice(0, 70)}" — ` : ""}${i.problem}`);
