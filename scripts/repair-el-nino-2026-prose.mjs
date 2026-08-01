// Hand-repair of the q.climate.el_nino_2026 prose.
//
// Written as a script rather than done by hand because the explanation artifact is
// 180KB of JSON and every edit has to be auditable and re-runnable. Idempotent: each
// replacement asserts its target is present OR that the replacement is already in
// place, and the script exits non-zero if any edit cannot be applied. Run it after any
// regeneration, alongside scripts/finish-el-nino-2026-explanation.mjs.
//
// WHAT IT FIXES, and why each one mattered:
//
//  1. THE UNSOURCED FORECAST. The draft pivoted on "forecasters expect 2026 to cross
//     that 1.5C mark while the monsoon is still running, which places it in the
//     harshest of the three groups". There is no forecast in the evidence packet - 156
//     locked numbers, zero references to any forecast product - and the article's own
//     data says the AMJ 2026 ONI is 0.98 (CPC: weak) and RONI 0.47 (neutral). The
//     article was selecting its most alarming reference class on a claim it could not
//     support, in a piece whose closing section boasts about carrying no unevidenced
//     2026 figures. Replaced with two new sections built on
//     climate.el_nino.escalation_fork, which answers the same question from the record.
//
//  2. A MARKDOWN BUG THAT SHIPPED. The "If farming is now just a fraction of the
//     economy" heading had no blank line before it, so CommonMark did not parse it and
//     it rendered as literal "## If farming..." text glued to the previous paragraph.
//     Exactly the failure CLAUDE.md warns about.
//
//  3. THE IOD DIRECTION. "the IOD is only now approaching positive territory" is
//     backwards. The DMI peaked at +0.53 in February 2026 and has fallen every month
//     since, reading +0.15 in May. It is receding, not building.
//
//  4. A 0.01C GAP DOING NARRATIVE WORK. RONI puts 1997-98 at 2.38 and 2014-16 at 2.37.
//     The draft reported "slipping to third place behind 1997-98 as well" as a finding.
//
//  5. THE LPA. Stated as "about 88 centimetres". The series' own implied long-period
//     average is 868.5mm, and IMD's published figure is 87cm.
//
//  6. FOUR CONSECUTIVE SECTIONS explaining the same irrigated-versus-rainfed mechanism.
//     Trimmed so the mechanism is explained once, where its chart sits.

import { readFile, writeFile } from "node:fs/promises";

const PATH = "data/explanations/en/q.climate.el_nino_2026.json";
const doc = JSON.parse(await readFile(PATH, "utf8"));

let applied = 0;
const failures = [];

/**
 * Replace `from` with `to` in body markdown; tolerate an already-applied edit.
 *
 * The already-applied test has to come FIRST. Some of these edits are insertions
 * whose anchor text survives into the result, so checking `from` first would match
 * again on a second run and insert the same block twice.
 */
function swap(label, from, to) {
  const body = doc.article.bodyMarkdown;
  if (body.includes(to)) return; // already applied
  if (body.includes(from)) {
    doc.article.bodyMarkdown = body.replace(from, to);
    applied += 1;
    return;
  }
  failures.push(label);
}

// --- 2. the markdown heading bug -------------------------------------------
// Must run before anything that matches across that boundary.
swap(
  "heading-blank-line",
  "They are rarely the last.\n## If farming is now just a fraction",
  "They are rarely the last.\n\n## If farming is now just a fraction"
);

// --- 4. the 0.01C rank flip -------------------------------------------------
swap(
  "roni-rank-precision",
  "Now 1982-83 tops the list at 2.52°C, while 2014-16 drops to 2.37°C, slipping to third place behind 1997-98 as well.",
  "Now 1982-83 tops the list at 2.52°C, while 2014-16 drops to 2.37°C. It also slips behind 1997-98, but by a hundredth of a degree, a gap far too small to carry any meaning. It is worth noticing only because it shows how tightly the top of this list bunches together once the trend is taken out."
);

// --- 5. the long-period average --------------------------------------------
swap(
  "lpa-87cm",
  "The long-period average is about 88 centimetres",
  "The long-period average is about 87 centimetres"
);

// --- 1a. strip the forecast assertion from the definitions section ----------
swap(
  "definitions-heading",
  "## What is the actual chance of a poor monsoon this year, given the El Niño forecast?\n\nIt depends entirely on which past El Niños you count, and that choice matters more than most forecasts.",
  "## How much does the definition of an El Niño year change the answer?\n\nIt depends entirely on which past El Niños you count, and that choice does more work than any forecast."
);

swap(
  "definitions-forecast-claim",
  "Most coverage quotes the first number, because it alarms nobody. But forecasters expect 2026 to cross that 1.5°C mark while the monsoon is still running, which places it in the harshest of the three groups. Same record, same arithmetic, three very different answers. The definition does the work.",
  "Most coverage quotes the first number, because it alarms nobody. A smaller amount of coverage quotes the third, because it alarms everybody. Same record, same arithmetic, three very different answers. The definition does the work.\n\nWhich leaves the one question the definition cannot settle: which of the three is this year?"
);

// --- 1b. the two new sections, built on climate.el_nino.escalation_fork -----
const FORK_SECTIONS = `## So which kind of El Niño year is this one?

Nobody knows yet. That is not evasion, and it is not a gap in the reporting. It is the most useful thing this record has to say in early August.

Start with where the Pacific actually is, rather than where the headlines put it. The official three-month index for April to June reads 0.98°C, and NOAA's own labelling calls that a weak El Niño. The trend-adjusted index reads 0.47°C, which it calls neutral. Whatever the weekly spikes suggest, the seasonal measures that every base rate in this piece is built from have not reached the strong threshold that would place 2026 in the harshest group.

So ask the conditional question instead. Since 1950, thirteen monsoons opened with the Pacific reading roughly what it reads now, somewhere between 0.6 and 1.4 in April to June. Five of those thirteen went on to cross 1.5 while the monsoon was still running. Eight did not.

What happened afterwards splits almost cleanly along that line. The five that escalated averaged 12.1% below normal, and four of the five finished below normal. The eight that did not escalate averaged 6.8% above normal. Only two of those eight finished dry at all, and the drier of the two missed by 1.4%.

That gap is large enough to survive the obvious objection. Set the 19-point difference against the spread inside each group, which runs to about 8 points and about 7, and the two groups separate cleanly rather than blurring into each other. This is not the northeast-monsoon result later in this piece, where the noise swamps the signal and the honest verdict is that our record cannot tell the groups apart. Here it can. Thirteen cases is still only thirteen cases, and none of this forecasts anything. But it locates the question exactly. The monsoon is not waiting on El Niño. It is waiting on whether this El Niño grows.

## What are the odds of that, then?

Roughly one in three on this record, and that is the honest headline nobody is printing.

Five of thirteen is 38%. Draw the band around today's reading wider or narrower and the figure moves between about a third and a little over 40%, so it does not depend on where the line was put. What it means is that the alarming reference class, the one carrying the 12% average deficit, is the less likely of the two branches from where this season currently stands.

The other branch is worth saying out loud, because it almost never gets said. The eight monsoons that did not escalate were not near misses that scraped through. They averaged close to 7% above normal, against a background of about 1% above normal across every monsoon since 1950. On this record, an El Niño that stalls has been followed by a wetter than average Indian summer.

Two cautions, both real. The dry branch is partly true by construction: a year that escalates becomes a strong-event year by definition, so its poor average is not an independent discovery. The genuinely new information is the escalation rate itself, and the fate of the branch that stalled. And a modest reading now is not safety. Both 1965 and 2023 sat below this band in April to June and still reached strong intensity once the monsoon was under way. The Pacific can accelerate from lower down than this.

`;

swap(
  "insert-fork-sections",
  "## What actually happened to the monsoon the last times a strong El Niño coincided with the season?",
  `${FORK_SECTIONS}## What actually happened to the monsoon the last times a strong El Niño coincided with the season?`
);

// --- 1c. downgrade the remaining forecast-conditional claims ----------------
swap(
  "strong-events-reference-class",
  "If the 2026 forecast holds, India is entering a reference class with a deeply uncomfortable track record, but the range of outcomes, from near-normal to calamitous, remains wide.",
  "If this event does escalate, India enters a reference class with a deeply uncomfortable track record, but the range of outcomes inside it, from near-normal to calamitous, remains wide."
);

swap(
  "record-holder-forecast",
  "When forecasters say the developing 2026 El Niño could rival or exceed past records, they are implicitly choosing an index.",
  "When anyone says a developing El Niño could rival or exceed past records, they are implicitly choosing an index."
);

swap(
  "rainfall-swing-forecast",
  "A forecast of a strong El Niño shifts the odds towards a dry season, but it does not lock in the outcome.",
  "A strong El Niño shifts the odds towards a dry season, but it does not lock in the outcome."
);

// --- 3. the IOD direction ---------------------------------------------------
swap(
  "iod-direction",
  "For 2026, the IOD is only now approaching positive territory; it is not firmly established. Counting on it to shield the monsoon would be premature.",
  "For 2026, the dipole is not building. It reached positive territory briefly in February, at 0.53, and has slipped every month since, reading 0.15 by May, which is squarely neutral. Counting on it to shield this monsoon would mean counting on something that is currently moving the wrong way."
);

// --- 8. a physics claim that is backwards ----------------------------------
// "that extra Pacific warmth pumps moisture into the Bay of Bengal, feeding the
// retreating monsoon and tropical cyclones."
//
// The rainfall half is fine, and properly hedged elsewhere. The CYCLONE half is
// backwards. Girishkumar & Ravichandran (2012, JGR Oceans, doi:10.1029/2011JC007417)
// find Bay of Bengal accumulated cyclone energy in Oct-Dec is NEGATIVELY correlated
// with the Nino3.4 anomaly, and that extreme TCs (>64 kt) increase significantly under
// La Nina. Later work agrees that BoB cyclones are more frequent and intensify more
// rapidly during La Nina than El Nino. So El Nino SUPPRESSES post-monsoon Bay of Bengal
// cyclone activity; the article had it feeding them.
//
// The correction is worth more than a deletion, because the suppression cuts against
// the section's own "wetter northeast monsoon" framing and is a second reason not to
// read a wet NEM as good news.
// Numbers below are Roose et al. 2022, npj Clim Atmos Sci 5:31, Table 2 (OND BoB
// cyclones, 1979-2020, 12 El Nino and 11 La Nina years): total BoB TCs 1.83/yr across
// all years, 1.33/yr in El Nino (down 27%) and 2.18/yr in La Nina (up 19%). The
// low-latitude storms (5-10N) fall 58% while the ones forming north of 10N barely move
// (down 5%). Rounded to "a quarter" and "a fifth" per the house rule on false precision.
// These are the article's only figures not derived from its own artifacts, so both
// papers are cited in sourceNotes.
swap(
  "bay-of-bengal-cyclones",
  "Later in the year, as the sun moves south, that extra Pacific warmth pumps moisture into the Bay of Bengal, feeding the retreating monsoon and tropical cyclones.",
  "Later in the year, as the sun moves south and the winds reverse, those same easterlies cross the warm Bay of Bengal and pick up the moisture that falls on the southern coast. One thing El Niño does not feed, though, is cyclones. Over the four decades to 2020, El Niño autumns brought roughly a quarter fewer cyclones to the Bay than a normal year and La Niña autumns about a fifth more, and almost the whole of that gap sits in the storms that form nearest the equator. The rain tilts one way and the storms tilt the other, so neither is a safe proxy for the other."
);

// --- 7. three factual errors found on the final read -----------------------
// The ENSO/IOD/monsoon join runs 1950-2025, not 1901: the ONI only starts in 1950,
// so no El Nino monsoon before then is classified at all.
swap(
  "iod-since-1950",
  "Five El Niño monsoons since 1901 arrived alongside a positive dipole",
  "Five El Niño monsoons since 1950 arrived alongside a positive dipole"
);

// "The underlying physics has not shifted" is an assertion the article has no
// evidence for, sitting inside a paragraph whose whole point is that a rolling
// correlation is a weak instrument.
//
// The replacement also brings this section up to the current literature. The old text
// framed the weakening question as a decades-old debate and let our own correlation
// have the last word. Goswami and An 2023 (npj Clim Atmos Sci 6:82, open access, read
// in full) states there is "no clear consensus on whether the ENSO-monsoon relationship
// will weaken or stay intact amidst a warming climate": some studies find it stable,
// some find weakening, and Bodai et al. report an increase. Their own 28-ensemble
// CESM1.2 experiment (idealized 1%/yr CO2 to quadrupling) has every ensemble weakening,
// caused by more frequent El Nino / positive-IOD co-occurrence as the mean state warms
// into a pIOD-like pattern in the Indian Ocean. They are explicit that this is a single
// model and that they "do not claim to settle the debate", so it is reported as a
// projection, not a finding. The mechanism links straight back to the IOD section
// immediately above this one, which is why it earns the space.
swap(
  "rolling-corr-physics",
  "However, a rolling correlation is sensitive to its endpoints, and a few extreme years can swing it. The underlying physics has not shifted. So this is not proof that the relationship is permanently locked, but it does caution against the easy narrative that El Niño no longer matters. At least for now, the Pacific’s shout is as loud as ever.",
  "However, a rolling correlation is a weak instrument for this question. It is sensitive to its endpoints, a few extreme years can swing it, and a correlation can move without anything in the underlying physics changing. What the line can support is narrow: it gives no comfort to the idea that El Niño has stopped mattering to the monsoon. Whether the connection is genuinely stronger now than in 1960 is not something 56 overlapping windows can settle.\n\nThe published research does not agree either, and it is more honest to say so than to pick the study that suits. Several papers report the link fraying after about 1980. At least one recent one reports it strengthening. Climate models pushed to high carbon dioxide mostly project further weakening, and their reason is the interesting part. As the Indian Ocean warms into a pattern that looks like a permanent positive dipole, El Niño and a positive dipole increasingly turn up in the same year, and the second ocean cancels part of what the first one does. That is the tilt described in the section above, projected forward and made routine. Note what it would mean. A weaker link is not a safer monsoon. It is a less predictable one, because it removes the earliest warning India gets."
);

// --- 6. the repeated irrigation mechanism ----------------------------------
// Section on regional rainfall: hand the mechanism forward instead of pre-empting it.
swap(
  "dedupe-regional",
  "This geography matters because the northwest relies heavily on irrigation from canals and tubewells, so less rain does not automatically mean crop failure. But it does mean groundwater is not recharged, reservoirs are not topped up, and the cost of pumping rises. In contrast, rainfed regions farther east can be devastated by the same percentage drop. The national average can mask the true stress on particular communities.",
  "But a rainfall map is not a damage map, and the next few charts take apart why. The northwest loses the most rain and yet its irrigated rice comes out ahead, while the rainfed cereals grown beside that same rice fall further than any crop in any other region. The shortfall is regional; the harm is not. What a map of departures cannot show you is who actually gets hurt."
);

// Rice section: keep the observed contrast, drop the mechanism (it belongs to the
// chart below it, which exists specifically to explain it).
swap(
  "dedupe-rice",
  "Yet in the northwestern states of Punjab and Haryana, rice yields often rise. The explanation is irrigation: these regions draw on canal networks and tubewells, and the clearer skies that accompany a weaker monsoon actually provide more sunlight, boosting photosynthesis. So while eastern farmers face losses, those with assured water may benefit. This divergence means the national rice harvest does not simply fall in proportion to the rain deficit. It also means that the people hurt most are typically those with the fewest alternatives: smallholders in rainfed areas with limited access to groundwater.",
  "Yet in the northwestern states of Punjab and Haryana, rice yields often rise, by 7.8% in Punjab and 6.3% in Haryana. Jharkhand, at the other end, loses 13.7%. So the national rice harvest does not fall in proportion to the rain deficit, and the people hurt most are the ones with the fewest alternatives: smallholders in rainfed districts with little access to groundwater. Why the same shortfall should cut one field and spare another is the subject of the next chart."
);

// Crop section: drop the third restatement of the same structural explanation.
swap(
  "dedupe-crops",
  "These are mainly dryland crops that depend on the June-September rainfall. Irrigated crops like rice and sugarcane, and winter-sown wheat that grows after the monsoon, were largely flat or even gained. The reason is structural. Canal networks, groundwater pumps, and large reservoirs decouple the water supply for irrigated fields from the current season’s rainfall, at least for a while. Rainfed fields have no such buffer. National averages hide regional collapse.",
  "These are mainly dryland crops that depend on the June-September rainfall. Irrigated crops like rice and sugarcane, and winter-sown wheat that grows after the monsoon, were largely flat or even gained. The pattern is the same one the previous chart set out, now sorted by crop rather than by region, which is the form in which it reaches a household: what you grow decides what a dry year costs you. National averages hide regional collapse.",
);

// --- methodology section: the honesty ledger has to match the new spine -----
swap(
  "methodology-forecast-note",
  "The rainfall departures are IMD's, measured against each series' own long-period average. The base rate for strong events rests on seven monsoons, which is a small enough number that it should be read as a rough guide to the odds and never as a forecast.",
  "The rainfall departures are IMD's, measured against each series' own long-period average. The base rate for strong events rests on seven monsoons, and the escalation split earlier in the piece on thirteen, of which five sit in one branch and eight in the other. Those are small enough numbers that they should be read as rough guides to the odds and never as forecasts. The escalation split also carries one circularity worth naming: a year that escalates is a strong-event year by definition, so the poor average of that branch restates the base rate rather than confirming it independently. The parts that stand on their own are the escalation rate and the outcome of the branch that did not escalate."
);

swap(
  "methodology-absent",
  "Finally, what is absent. The 2026 season is unfinished, and this piece deliberately carries no figures for rainfall so far, reservoir storage or sown area. Those numbers exist and they move week to week, but they are not in the evidence behind this article, so no estimate of them has been made here.",
  "Finally, what is absent, which in this piece matters as much as what is present. The 2026 season is unfinished, and this article carries no figures for rainfall so far, reservoir storage or sown area. Those numbers exist and they move week to week, but they are not in the evidence behind this article, so no estimate of them is made here.\n\nNor does it carry a forecast. An earlier draft of this piece asserted that the Pacific was widely projected to cross the strong threshold during the monsoon, and used that to apply the harshest of the three base rates. No forecast product was ever among the sources listed below, so that sentence has been removed rather than sourced after the fact. Everything here about 2026 is an observation already on the record: an April to June index of 0.98°C, a trend-adjusted 0.47°C, and a dipole that has been sliding towards neutral since February. What the Pacific does between now and October is not something this article claims to know."
);

// --- section-to-chart binding ----------------------------------------------
// Two sections were inserted, so every binding after the definitions chart shifts.
// Rebuilt from the section order rather than patched, per the CLAUDE.md gotcha.
const CHART_ORDER = [
  "five-official-numbers-for-the-same-ocean",
  "change-the-index-and-the-record-holder-changes",
  "the-measuring-stick-moved",
  "a-century-and-a-quarter-of-monsoons-that-never-sit-still",
  "how-strictly-you-define-an-el-nino-year-changes-the-answer",
  "monsoons-that-began-where-this-one-begins",
  "the-fork-not-the-forecast",
  "a-bigger-el-nino-is-not-a-worse-monsoon",
  "where-the-pacific-warmed-does-not-settle-it-either",
  "does-the-indian-ocean-rescue-an-el-nino-monsoon",
  "has-the-pacific-s-grip-on-the-monsoon-loosened",
  "el-nino-hits-the-northwest-hardest",
  "when-in-the-season-the-rain-goes-missing",
  "where-el-nino-actually-cuts-the-rice-harvest",
  "why-the-rainfall-map-is-not-the-yield-map",
  "which-crops-el-nino-actually-hits",
  "a-weak-monsoon-does-not-automatically-mean-dearer-food",
  "after-a-drought-food-prices-do-not-move-as-one",
  "same-el-nino-opposite-signs-india-has-two-monsoons",
  "el-nino-peaks-after-the-kharif-harvest-is-decided",
  "a-shrinking-share-of-the-economy-but-still-two-in-five-jobs"
];

const headings = [...doc.article.bodyMarkdown.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
// The closing methodology section is prose-only and takes no chart.
const chartBearing = headings.filter((h) => !/^How to read these numbers$/i.test(h));
if (chartBearing.length !== CHART_ORDER.length) {
  failures.push(`sectionVisualMap: ${chartBearing.length} chart-bearing sections but ${CHART_ORDER.length} charts`);
} else {
  // The key MUST be `heading`. src/pages/articles/[slug].astro builds its explicit map
  // with Object.fromEntries(entries.map(e => [e.heading, e.visualId])), so any other
  // key name yields a map of `undefined` and the page silently falls back to a
  // token-overlap heuristic that mis-binds most of the article. Nothing errors; the
  // charts just quietly end up under the wrong prose.
  doc.sectionVisualMap = headings.map((heading) => {
    const index = chartBearing.indexOf(heading);
    return { heading, visualId: index === -1 ? null : CHART_ORDER[index] };
  });
  applied += 1;
}

// --- title, standfirst, summary cards --------------------------------------
// The page <h1> is the registry's `question`, not article.title. The evidence block
// keeps its own stale copy, so sync it to avoid the two disagreeing in the artifact.
if (doc.evidence?.question) doc.evidence.question = "An El Nino is under way. What can it actually tell India?";

// Data vintage, rendered by [slug].astro as "Data through ...". Was null, so a piece
// whose entire argument is "as of right now the Pacific has not decided" displayed no
// date at all. The freshest observation in the article is the weekly Nino 3.4 for the
// week centred 22 July 2026; the official seasonal index only runs to AMJ. This matters
// more here than on most articles: the July weekly values average +2.0, so MJJ lands
// near 1.45 and JJA will very likely cross the +1.5 escalation threshold. When CPC
// publishes those, the framing needs revisiting. See the hold plan in the handoff.
doc.dataThrough = "22 July 2026";
doc.lastReviewed = "2026-08-01";

doc.article.title = "What the Pacific Has Not Told India Yet";
doc.article.standfirst =
  "An El Niño is under way and the alarm has already started. But the official index still reads weak, and of the thirteen monsoons that opened exactly here, eight finished wetter than normal. What happens to India's rain depends on something that has not happened yet.";

doc.short = {
  headline: "The monsoon is not waiting on El Niño. It is waiting on whether El Niño grows.",
  dek: "A strong El Niño makes a dry monsoon far more likely. This one is not strong yet, and most events at this stage never got there.",
  body:
    "The tropical Pacific is warmer than usual and an El Niño is under way, but the official three-month index reads 0.98°C, which NOAA calls weak, and the trend-adjusted version reads 0.47°C, which it calls neutral. Thirteen monsoons since 1950 opened at this reading. Five escalated past the strong threshold during the season and averaged 12% below normal; the eight that did not averaged 7% above. So the fork is the escalation, not the declaration, and it has not happened yet. Beyond that, the national average is the least interesting number in the story: irrigation decides who is actually hurt, El Niño usually peaks in October after the summer harvest is settled, and the price consequences of a bad season land the following year."
};

doc.macha = {
  heading: "So should I start stocking up on onions now?",
  body:
    "Arre, not yet, and possibly not at all. El Niño is like a doctor telling you your cholesterol is borderline. It raises the risk; it does not book the hospital bed. Right now the Pacific is at the borderline reading, and historically about two in three years like this one never became the dangerous kind. If it does escalate, the damage shows up in your dal and vegetables rather than your rice and atta, because the government sits on huge grain stocks but nobody stockpiles tur dal. And it shows up late, next year, not next month. The people who need to plan now are farmers without irrigation and the officials watching reservoir levels in October. Your kitchen budget can wait for actual news.",
  soWhat:
    "Because the scary number everyone is quoting applies to a kind of El Niño this one has not become yet, and might not."
};

// --- caveats: replace the two that overstated, add the escalation caveat ----
doc.caveats = [
  "Five different NOAA indices measure Pacific warming and they disagree sharply on this event, currently spanning 0.47°C to 2.2°C. Any single figure is close to meaningless without its product, averaging window and baseline.",
  "This article carries no forecast. Everything it says about 2026 is an observation already on the record as of the April-June season, and the Pacific may do something quite different between now and October.",
  "The escalation split rests on thirteen monsoons, five in one branch and eight in the other, and the dry branch is partly true by definition. Read it as a rough guide to the odds, never as a prediction.",
  "Historical El Niño and monsoon links rest on small samples of strong events, and each event is unique in ways the record cannot capture.",
  "The all-India average hides enormous regional variation. Some states can receive normal rain in a year the national figure calls deficient.",
  "El Niño usually peaks after the main kharif growing season, so its direct effect on the summer harvest is often smaller than the headline event size suggests.",
  "Irrigation coverage, groundwater levels and reservoir storage change the agricultural impact substantially, which makes local conditions as important as the ocean signal.",
  "Rainfall, crop yield and price data all arrive with lags and revisions, so any real-time assessment is provisional."
];

// --- explainers for the two new charts -------------------------------------
// Hand-authored rather than generated: the generator is the thing that produced the
// unsourced forecast claim in the first place, and these two cards are precisely
// where an invented number would do the most damage. visualId must equal the
// slugified chart title (see slugifyTitle in ArticleVisuals.astro).
const NEW_EXPLAINERS = [
  {
    visualId: "monsoons-that-began-where-this-one-begins",
    title: "Monsoons that began where this one begins",
    takeaway:
      "Thirteen monsoons since 1950 opened with the Pacific reading what it reads now. Five grew into strong events and were mostly dry; the other eight were mostly wet.",
    detail:
      "Each bar is one monsoon whose April-June Pacific reading sat between 0.6 and 1.4, the band around 2026's 0.98. The top group is the five years in which the index went on to cross 1.5 while the monsoon was still running: they averaged 12.1% below normal, and four of the five finished short. The bottom group is the eight in which it did not: they averaged 6.8% above normal, and only two finished dry at all. The gap between the groups is large relative to the spread inside them, which is what makes the split worth reporting at this sample size.",
    whyShowThis:
      "Every base rate elsewhere in this article assumes you already know which kind of El Niño year you are in. In early August nobody does. This is the only chart here that answers the question actually facing a reader now, which is what the record says from a position of not knowing.",
    howToRead:
      "Bars run left for a rainfall deficit and right for a surplus. The number in each label is the highest the index reached during that year's monsoon, so anything at 1.5 or above is in the escalated group.",
    mistakeToAvoid:
      "Reading the dry group as a discovery. A year that escalates becomes a strong-event year by definition, so that group's poor average restates the base rate rather than confirming it. The parts that stand on their own are the one-in-three escalation rate and the wetness of the group that stalled. Thirteen cases is also a thin base, and 1965 and 2023 both escalated from below this band, so a modest reading now is not safety.",
    mobileNote:
      "If you read only one thing here, count the bars: five in the dry group, eight in the wet one."
  },
  {
    visualId: "the-fork-not-the-forecast",
    title: "The fork, not the forecast",
    takeaway:
      "Escalate and the average monsoon is 12% below normal. Stall and it is 7% above, which is wetter than a typical year, not merely survivable.",
    detail:
      "The same thirteen monsoons as the chart above, collapsed to their two branch averages, with every monsoon since 1950 as the third bar for context. The branch that did not escalate did not simply avoid disaster: at close to 7% above normal it ran well above the long-run average of about 1% above normal. That is the half of this story that almost never gets reported, because it only exists once you condition on where the season actually started rather than on how it ended.",
    whyShowThis:
      "The first chart shows the spread; this one shows what a reader will actually carry away. It also supplies the comparison that makes the wet branch legible, because 6.8% above normal means nothing until you know the background is about 1%.",
    howToRead:
      "Three averages, not three forecasts. The first two bars split the thirteen-year cohort by whether the Pacific crossed 1.5 during the monsoon; the third is every monsoon since 1950.",
    mistakeToAvoid:
      "Treating a branch average as what a single season would deliver. Five years and eight years are small groups with wide spread inside them: the escalated branch contains both 1972 at 22.3% below normal and 1997 at essentially normal.",
    mobileNote:
      "The third bar is the one to anchor on: it is what an ordinary monsoon looks like, at about 1% above normal."
  }
];

// The forecast premise also leaked into two existing explainer cards, where it is
// harder to spot than in the body. The IOD one repeats the direction error as well.
function patchExplainer(visualId, field, from, to) {
  const card = doc.chartExplainers.find((e) => e.visualId === visualId);
  if (!card) return failures.push(`explainer ${visualId} not found`);
  if (card[field] && card[field].includes(to)) return; // already applied
  if (!card[field] || !card[field].includes(from)) return failures.push(`${visualId}.${field}`);
  card[field] = card[field].replace(from, to);
  applied += 1;
}

patchExplainer(
  "does-the-indian-ocean-rescue-an-el-nino-monsoon",
  "detail",
  "In 2026, the IOD is forecast to just barely turn positive, making the balance extremely delicate.",
  "Through 2026 the dipole has been moving the wrong way for India: positive in February, back to neutral by May. It is not currently offering a counterweight."
);

patchExplainer(
  "a-bigger-el-nino-is-not-a-worse-monsoon",
  "whyShowThis",
  "If 2026 reaches strong-event territory as forecast, this is the group it joins, and the group's record is harsh:",
  "If 2026 escalates into strong-event territory, this is the group it joins, and the group's record is harsh:"
);

for (const explainer of NEW_EXPLAINERS) {
  const at = doc.chartExplainers.findIndex((e) => e.visualId === explainer.visualId);
  if (at === -1) doc.chartExplainers.push(explainer);
  else doc.chartExplainers[at] = explainer;
}

if (failures.length) {
  console.error("FAILED to apply:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

// --- structural assertions before writing ----------------------------------
const body = doc.article.bodyMarkdown;
const headingCount = (body.match(/^## /gm) || []).length;
const blankSeparated = (body.match(/\n\n## /g) || []).length;
if (headingCount - 1 !== blankSeparated) {
  console.error(`markdown structure broken: ${headingCount} headings but ${blankSeparated} blank-line separated`);
  process.exit(1);
}
if (/forecasters expect/i.test(body)) {
  console.error("the unsourced forecast assertion is still present");
  process.exit(1);
}
if (body.includes("—")) {
  console.error("em-dash found in body");
  process.exit(1);
}
// Explainers bind by slugified title, so a renamed chart silently orphans its card and
// the page falls back to the registry one-liners. Fail loudly instead.
const explainerIds = new Set(doc.chartExplainers.map((e) => e.visualId));
const orphanedCharts = CHART_ORDER.filter((id) => !explainerIds.has(id));
const orphanedCards = [...explainerIds].filter((id) => !CHART_ORDER.includes(id));
if (orphanedCharts.length || orphanedCards.length) {
  if (orphanedCharts.length) console.error(`charts with no explainer: ${orphanedCharts.join(", ")}`);
  if (orphanedCards.length) console.error(`explainers with no chart: ${orphanedCards.join(", ")}`);
  process.exit(1);
}
// Guard the binding contract itself, since getting it wrong fails silently.
const badKeys = doc.sectionVisualMap.filter((e) => typeof e.heading !== "string" || !e.heading);
if (badKeys.length) {
  console.error(`sectionVisualMap entries must use the key 'heading' (${badKeys.length} bad)`);
  process.exit(1);
}
const bodyHeadings = new Set(headings);
const unmatched = doc.sectionVisualMap.filter((e) => !bodyHeadings.has(e.heading));
if (unmatched.length) {
  console.error(`sectionVisualMap headings not found in body: ${unmatched.map((e) => e.heading).join(" | ")}`);
  process.exit(1);
}

for (const e of doc.chartExplainers) {
  const missing = ["takeaway", "detail", "whyShowThis", "howToRead", "mistakeToAvoid"].filter((k) => !e[k]);
  if (missing.length) {
    console.error(`explainer ${e.visualId} missing: ${missing.join(", ")}`);
    process.exit(1);
  }
}
// No forward-looking claim about 2026 anywhere in the card text. The explainers are
// where an invented forecast is hardest to notice, because nobody re-reads 21 cards.
const FORECAST_PREMISE = /\b(as forecast|forecast holds|is forecast to|are forecast to|forecast to (?:cross|reach|peak|be)|expected to (?:cross|reach|be)|projected to (?:cross|reach|be))\b/i;
for (const e of doc.chartExplainers) {
  for (const [field, value] of Object.entries(e)) {
    if (typeof value === "string" && FORECAST_PREMISE.test(value)) {
      console.error(`forecast premise in explainer ${e.visualId}.${field}: ${value.slice(0, 140)}`);
      process.exit(1);
    }
  }
}

await writeFile(PATH, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`repaired ${PATH}`);
console.log(`  edits applied: ${applied}`);
console.log(`  sections: ${headingCount}  charts bound: ${doc.sectionVisualMap.filter((s) => s.visualId).length}`);
console.log(`  words: ${body.split(/\s+/).length}`);
