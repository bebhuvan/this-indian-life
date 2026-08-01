// Lint the chart explainer cards against the data the charts are actually drawn from.
//
// WHY THIS EXISTS. The article-level numeric audit we already run asks whether a figure
// exists somewhere in some artifact. That is far too weak. Every one of the following
// passed it while being wrong on the page, in a single article, found only by a human
// reading the rendered page cold:
//
//   - the stripes card called 1901's -13.8% "the driest year on record". -13.8 is the
//     FIRST ROW of the series; the true minimum is 1972 at -22.3%. This came from the
//     evidence packet handing the writer only a series' earliest and latest points, so
//     it is a GENERATOR-level bug and almost certainly not confined to one article.
//   - the irrigation card reported the northwest's rainfed coarse-cereal figure as
//     -3.1%. That is central India's RICE figure, two rows away. The real value is
//     -11.8%, so the card understated the chart's headline contrast fourfold.
//   - the subseasonal card quoted the "typical year" comparison bars as El Nino
//     surpluses and moved August's value onto July.
//
// The shape they share: a real number from the right artifact, attached to the wrong
// claim. That is what these checks look for.
//
// DESIGN RULE, learned the hard way. A first cut of this flagged 49% of all cards
// across the site. Sampling showed the hits were overwhelmingly unit conversions
// ("30.8 crore" against a raw 307898649), regex artefacts ("Nino 3.4" read as a
// measurement), and fair cross-indicator comparisons. A check nobody trusts is worse
// than no check, because it trains people to skim past the output. Everything here is
// therefore narrow and conservative: it would rather miss a real bug than cry wolf.
//
// VERDICT AFTER MEASURING, and it is a negative one for two of the three checks.
// Run across all 72 explanation artifacts:
//
//   lintSectionBinding        4 findings, 4 verified real       -> WIRED INTO THE GATE
//   value-attached-to-wrong-row  586 -> 197 -> 39 after two rounds of tightening,
//                             and the residue is still almost all false positives:
//                             cards write "jowar" where the artifact says
//                             "Sorghum (jowar)", so the next-label bound misses and a
//                             legitimate list reads as a mis-attribution.
//   superlative-not-extreme   20 findings, sampled as false positives: "one of the
//                             lowest in decades" is not a claim to be the minimum, and
//                             "the highest raw peak at 2.75, but scores 2.37" attaches
//                             its superlative to the other number.
//
// So the two card checks are NOT wired into validate-explanations. They are exported for
// manual use during review of a single article, where a human filters the output, and
// that is genuinely useful: on q.climate.el_nino_2026 they surfaced the real irrigation
// and subseasonal mis-attributions. Making them gate-worthy needs label aliasing and
// superlative-scoping, which is real work and is not done here.
//
//   INDICA_CARD_LINT=1 npm run explain:v1:validate    # opt in, expect false positives

const SUPERLATIVE = /\b(driest|wettest|hottest|coldest|warmest|highest|lowest|worst|best|largest|smallest|biggest|record|peak|maximum|minimum|most severe|least)\b/i;
const NUM = /(?<![\w.\-])(-?\d+(?:\.\d+)?)(?=\s*(?:°C|%|\b))/g;

const round2 = (v) => Number(Number(v).toFixed(2));
const near = (a, b, tol = 0.051) => Math.abs(a - b) <= tol;

/** Numeric values a chart actually plots, plus the rows they came from. */
function numericRows(artifact) {
  const rows = artifact?.rows || artifact?.observations || [];
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const label = [row.label, row.state, row.name, row.date, row.season, row.week_centred]
      .find((v) => typeof v === "string" && v.trim());
    const group = typeof row.group === "string" ? row.group : undefined;
    for (const [key, value] of Object.entries(row)) {
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      out.push({ label, group, key, value });
    }
  }
  return out;
}

/**
 * A superlative claim must quote the series extreme, not just any value from it.
 * Only fires when the card uses superlative language AND the artifact has a clear
 * primary value column, so a chart with several unrelated numeric columns is skipped.
 */
function checkSuperlatives(card, artifact, indicator) {
  const findings = [];
  const values = numericRows(artifact).filter((r) => r.key === "value" || r.key.endsWith("_pct") || r.key.endsWith("_c"));
  if (values.length < 8) return findings; // too few points for "the highest" to be meaningful
  const nums = values.map((v) => v.value);
  const min = round2(Math.min(...nums));
  const max = round2(Math.max(...nums));
  for (const field of ["takeaway", "detail"]) {
    const text = card[field];
    if (typeof text !== "string") continue;
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      if (!SUPERLATIVE.test(sentence)) continue;
      // Only judge a sentence carrying exactly ONE figure from this chart. A superlative
      // sentence that also lists three other values ("the worst year at 20.9%, cereals
      // rose 3.1%...") attaches its superlative to one of them, and guessing which is
      // how a check starts crying wolf.
      const own = [...sentence.matchAll(NUM)]
        .map((m) => round2(Math.abs(Number(m[1]))))
        .filter((v) => nums.some((n) => near(round2(Math.abs(n)), v)));
      if (own.length !== 1) continue;
      const v = own[0];
      if (near(v, Math.abs(min)) || near(v, Math.abs(max))) continue;
      findings.push({
        rule: "superlative-not-extreme",
        severity: "error",
        field: `chartExplainers.${card.visualId}.${field}`,
        match: `${v} described with a superlative, but ${indicator} runs ${min} to ${max}`
      });
    }
  }
  return findings;
}

/**
 * A number sitting next to a row's name should be that row's number.
 * Fires only when the quoted figure belongs to a DIFFERENT row of the same chart,
 * which is the signature of a card reading across its own table.
 */
function checkLabelValuePairs(card, artifact, indicator) {
  const findings = [];
  const rows = numericRows(artifact).filter((r) => r.label && (r.key === "value" || r.key.endsWith("_pct")));
  if (rows.length < 2) return findings;
  const allValues = rows.map((r) => round2(Math.abs(r.value)));
  for (const field of ["takeaway", "detail"]) {
    const text = card[field];
    if (typeof text !== "string") continue;
    for (const row of rows) {
      const label = String(row.label);
      if (label.length < 4) continue; // "June" is fine, "NW" is not distinctive enough
      // Skip time-series labels. On a chart whose rows are years, a card legitimately
      // writes "from 0.1 in 1980 to 1.06 today", and any proximity window will read the
      // second figure as attached to the first year. Every real instance of this bug was
      // on a categorical table (a region, a crop, a food group).
      if (/^\d{4}(-\d{1,4})?$/.test(label) || /^\d{4}-\d{2}/.test(label)) continue;
      const at = text.toLowerCase().indexOf(label.toLowerCase());
      if (at === -1) continue;
      // Bound the window at the NEXT row label. Cards legitimately list several rows in
      // one sentence ("June comes in 10.3% short and September 10.8% short"), and a
      // fixed-width window reads September's figure as attached to June. Only a number
      // that reaches the label with no other label in between is really "beside" it.
      const after = text.slice(at + label.length);
      const nextLabel = rows
        .map((r) => String(r.label))
        .filter((l) => l !== label && l.length >= 4)
        .map((l) => after.toLowerCase().indexOf(l.toLowerCase()))
        .filter((i) => i > -1)
        .sort((a, b) => a - b)[0];
      const window = label + after.slice(0, Math.min(nextLabel ?? 60, 60));
      for (const m of window.matchAll(NUM)) {
        const v = round2(Math.abs(Number(m[1])));
        if (near(v, round2(Math.abs(row.value)))) continue;   // correct
        if (!allValues.some((x) => near(x, v))) continue;      // not from this chart at all
        // It is a value from this chart, next to a label it does not belong to.
        const owners = rows.filter((r) => near(round2(Math.abs(r.value)), v)).map((r) => r.label);
        if (owners.includes(label)) continue;
        findings.push({
          rule: "value-attached-to-wrong-row",
          severity: "error",
          field: `chartExplainers.${card.visualId}.${field}`,
          match: `"${label}" is ${row.value} in ${indicator}, but the card puts ${m[1]} beside it (that is ${owners.slice(0, 2).join(", ")})`
        });
        break;
      }
    }
  }
  return findings;
}

/**
 * sectionVisualMap must use the key `heading`, and every heading must exist in the body.
 *
 * src/pages/articles/[slug].astro builds its map with
 *   Object.fromEntries(entries.map((e) => [e.heading, e.visualId]))
 * so any other key, or a heading that no longer matches the prose, yields a map of
 * undefined. The page then falls back SILENTLY to a token-overlap heuristic that
 * mis-binds most of the article. Nothing errors and the build stays green; the charts
 * simply sit under the wrong prose. This has happened twice.
 */
export function lintSectionBinding(doc) {
  const findings = [];
  const map = doc.sectionVisualMap;
  if (!Array.isArray(map) || !map.length) return findings;
  const headings = [...String(doc.article?.bodyMarkdown || "").matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const bad = map.filter((e) => !e || typeof e.heading !== "string" || !e.heading.trim());
  if (bad.length) {
    findings.push({
      rule: "section-map-missing-heading-key",
      severity: "error",
      field: "sectionVisualMap",
      match: `${bad.length} entries have no 'heading' key — the page will silently fall back to heuristic binding`
    });
    return findings;
  }
  const missing = map.filter((e) => !headings.includes(e.heading));
  if (missing.length) {
    findings.push({
      rule: "section-map-heading-not-in-body",
      severity: "error",
      field: "sectionVisualMap",
      match: `${missing.length} mapped heading(s) absent from the prose, e.g. "${missing[0].heading.slice(0, 60)}"`
    });
  }
  return findings;
}

/**
 * Run the card checks for one explanation.
 * `resolve(indicatorId)` returns the series artifact, or null.
 * `chartsFor(questionId)` returns [{ visualId, indicator }].
 */
export function lintChartCards(doc, chartsFor, resolve) {
  const findings = [];
  const cards = doc.chartExplainers;
  if (!Array.isArray(cards) || !cards.length) return findings;
  const byId = new Map((chartsFor(doc.questionId) || []).map((c) => [c.visualId, c.indicator]));
  for (const card of cards) {
    const indicator = byId.get(card.visualId);
    if (!indicator) continue;
    const artifact = resolve(indicator);
    if (!artifact) continue;
    findings.push(...checkSuperlatives(card, artifact, indicator));
    findings.push(...checkLabelValuePairs(card, artifact, indicator));
  }
  return findings;
}
