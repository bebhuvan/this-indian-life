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


/**
 * Insert `block` immediately before `anchor`, once.
 *
 * swap() cannot do this safely. Its already-applied test looks for block+anchor
 * contiguously, and a LATER insertion at the same anchor pushes itself between them, so
 * the earlier block stops matching and gets inserted a second time on every re-run.
 * Keying idempotency to a marker unique to the block itself is immune to that.
 */
function insertOnce(label, marker, anchor, block) {
  const body = doc.article.bodyMarkdown;
  if (body.includes(marker)) return; // already inserted
  if (!body.includes(anchor)) return failures.push(label);
  doc.article.bodyMarkdown = body.replace(anchor, `${block}${anchor}`);
  applied += 1;
}

// --- 2. the markdown heading bug -------------------------------------------
// Must run before anything that matches across that boundary.
// Idempotency cannot key off the repaired text here, because insertOnce later drops a
// whole section between "They are rarely the last." and this heading, which breaks the
// contiguity swap() relies on. Key off the BROKEN pattern instead: if it is absent there
// is nothing to do. Any edit whose anchor region can later be split needs this shape.
const BROKEN_HEADING = "They are rarely the last.\n## If farming is now just a fraction";
if (doc.article.bodyMarkdown.includes(BROKEN_HEADING)) {
  doc.article.bodyMarkdown = doc.article.bodyMarkdown.replace(BROKEN_HEADING, BROKEN_HEADING.replace("\n##", "\n\n##"));
  applied += 1;
}
// --- 4. the 0.01C rank flip -------------------------------------------------

// --- 5. the long-period average --------------------------------------------

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

Not yet decided, and that is the honest answer rather than an evasive one. The forecasts come a few paragraphs from here. Start with the record, because it is the thing that says how much a forecast at this stage of the season is worth.

Start with where the Pacific actually is, rather than where the headlines put it. The official three-month index for April to June reads 0.98°C, and NOAA's own labelling calls that a weak El Niño. The trend-adjusted index reads 0.47°C, which it calls neutral. Whatever the weekly spikes suggest, the seasonal measures that every base rate in this piece is built from have not reached the strong threshold that would place 2026 in the harshest group.

So ask the conditional question instead. Since 1950, thirteen monsoons opened with the Pacific reading roughly what it reads now, somewhere between 0.6 and 1.4 in April to June. Five of those thirteen went on to cross 1.5 while the monsoon was still running. Eight did not.

What happened afterwards splits almost cleanly along that line. The five that escalated averaged 12.1% below normal, and four of the five finished below normal. The eight that did not escalate averaged 6.8% above normal. Only two of those eight finished dry at all, and the drier of the two missed by 1.4%.

That gap is large enough to survive the obvious objection. Set the 19-point difference against the spread inside each group, which runs to about 8 points and about 7, and the two groups separate cleanly rather than blurring into each other. This is not the northeast-monsoon result later in this piece, where the noise swamps the signal and the honest verdict is that our record cannot tell the groups apart. Here it can. Thirteen cases is still only thirteen cases, and none of this forecasts anything. But it locates the question exactly. The monsoon is not waiting on El Niño. It is waiting on whether this El Niño grows.

## What are the odds of that, then?

Roughly one in three on this record, and that is the honest headline nobody is printing.

Five of thirteen is 38%. Draw the band around today's reading wider or narrower and the figure moves between about a third and a little over 40%, so it does not depend on where the line was put. What it means is that the alarming reference class, the one carrying the 12% average deficit, is the less likely of the two branches from where this season currently stands.

The other branch is worth saying out loud, because it almost never gets said. The eight monsoons that did not escalate were not near misses that scraped through. They averaged close to 7% above normal, against a background of about 1% above normal across every monsoon since 1950. On this record, an El Niño that stalls has been followed by a wetter than average Indian summer.

Two cautions, both real. The dry branch is partly true by construction: a year that escalates becomes a strong-event year by definition, so its poor average is not an independent discovery. The genuinely new information is the escalation rate itself, and the fate of the branch that stalled. And a modest reading now is not safety. Both 1965 and 2023 sat below this band in April to June and still reached strong intensity once the monsoon was under way. The Pacific can accelerate from lower down than this.

That is what the past says. It is a base rate, not a forecast, and it is deliberately blind to everything the forecasters can currently see in the ocean. So it is worth asking them.

`;

insertOnce(
  "insert-fork-sections",
  "## So which kind of El Niño year is this one?",
  "## What actually happened to the monsoon the last times a strong El Niño coincided with the season?",
  FORK_SECTIONS
);
// --- 1b-ii. the forecast, now that there is a real one to cite --------------
// The original sin was an unsourced "forecasters expect 2026 to cross that 1.5C mark".
// The fix was to remove it. The better fix, once scripts/ingest-cpc-enso-forecast.mjs
// exists, is to say what is ACTUALLY forecast, with a date and a source. CPC's official
// probabilistic strength outlook (issued July 2026, verified in RONI on a 1991-2020
// base) gives the chance of reaching +1.5C as 25% for JJA, 73% for JAS, 90% for ASO and
// 81% very strong by OND, with a 97% chance the event persists into early spring 2027.
//
// Two things make this worth a section of its own rather than a clause:
//   1. It CONVERGES with the historical fork. The record says 38% of comparable seasons
//      escalated during the monsoon; the models say 25% by JJA rising to 73% by JAS.
//      Two independent methods, same neighbourhood, and neither is a certainty.
//   2. It is expressed in RONI. That kills the reading, available to anyone who has
//      followed the article this far, that the trend-adjusted index is a way of talking
//      the event down. NOAA forecasts in RONI and still projects a record-scale event.
const FORECAST_SECTION = `## How fast is this one actually moving?

Faster than any of them, at this point in the year.

Line 2026 up against the events it keeps being compared to, on a shared January-to-December axis, and adjust each one for the warming of its own era so the decades are on equal terms. Through July, 2026 sits near 2.1°C. At the same point in the calendar, 1997 was at about 1.4 and 2015 at about 1.4. No year since 1982 has been higher in July.

That sounds like it contradicts the reading two sections ago, where the official index was a weak 0.98. It does not. The official index averages three months, so the April-to-June figure is still carrying April, when the Pacific was barely above normal. The weekly ocean has since run away from the seasonal average that describes it. Both numbers are correct, and the gap between them is the same measurement problem this article opened with, now visible as a moving target rather than a list.

One caution, and it is the whole reason this chart is not a prediction. Being ahead in July is not the same as finishing highest. Both 1997 and 2015 kept climbing hard through the autumn, well after the point where 2026's line currently stops. This shows the race so far. It does not show the finish.

## And what do the forecasters actually say?

Now there is something to quote, which there was not a few paragraphs ago. NOAA's Climate Prediction Center publishes an official probabilistic outlook, re-issued on the second Thursday of every month. The July 2026 edition carries an El Niño Advisory and puts a 97% chance on the event lasting into early spring 2027.

The number that matters for India is narrower: the chance of crossing that same +1.5°C line the base rates use. For June to August it is about one in four. For July to September it rises to roughly three in four. By August to October it is nine in ten, and by October to December the forecast is for a very strong event, at 81%, which would put it among the largest since 1950.

Read that sequence slowly, because the shape of it is the story. The escalation is not forecast to arrive at the start of the monsoon. It is forecast to arrive at the end of it, and to peak after it is over.

Set the two methods side by side. The historical record says 38% of seasons that opened here went on to cross the line during the monsoon. The models say 25% by August, three-quarters by September. Those are different instruments answering slightly different questions, and they land in the same neighbourhood: escalation is likely, it is not certain, and it is late.

One detail is worth pausing on. CPC's strength probabilities are verified against the relative index, the trend-adjusted one, on a 1991 to 2020 baseline. So the adjustment this piece spent three sections explaining is not a way of talking the event down. The forecaster uses it, and still expects something close to a record.

`;

insertOnce(
  "insert-forecast-section",
  "## And what do the forecasters actually say?",
  "## What actually happened to the monsoon the last times a strong El Niño coincided with the season?",
  FORECAST_SECTION
);
// --- 1c. downgrade the remaining forecast-conditional claims ----------------
swap(
  "strong-events-reference-class",
  "If the 2026 forecast holds, India is entering a reference class with a deeply uncomfortable track record, but the range of outcomes, from near-normal to calamitous, remains wide.",
  "If this event does escalate, India enters a reference class with a deeply uncomfortable track record, but the range of outcomes inside it, from near-normal to calamitous, remains wide."
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

// --- 9. readability: break the inherited wall-of-text sections -------------
// The sections written during the rebuild run 60-140 words a paragraph. The ones
// inherited from the original generator are single blocks of 150-330 words, several of
// them carrying ten or more numbers. Measured across the article, every paragraph over
// 150 words was an inherited one. These edits split them at their natural pivots and
// thin the number load where a figure was decorating rather than doing work. No claim,
// caveat or figure that carries meaning is dropped.

// 218 words, 16 numbers, and the reader has only just arrived. The mechanism (why the
// raw index drifts) matters more than the four decimal rankings, so the rankings get one
// paragraph and the meaning gets another.
swap(
  "readability-index-ranking",
  "The answer changes depending on the yardstick. On the raw Oceanic Niño Index (ONI), the 2014-16 event holds the record, with a peak seasonal anomaly of 2.75°C. The 1982-83 episode, by the same measure, peaked lower at 2.23°C. Switch to the trend-adjusted Relative Niño Index (RONI), which removes the tropical-wide ocean warming trend to isolate the Pacific’s heating relative to its surroundings, and the ranking flips. Now 1982-83 tops the list at 2.52°C, while 2014-16 drops to 2.37°C, slipping to third place behind 1997-98 as well. This is not an academic detail. The raw index has been drifting upward as the entire tropical ocean warms, so it amplifies recent events. The adjusted index resets the baseline, making older events like 1982-83 look stronger relative to their own cooler era. When forecasters say the developing 2026 El Niño could rival or exceed past records, they are implicitly choosing an index. Which benchmark we inherit, the raw record holder or the adjusted one, determines which historical monsoon outcomes India should study as possible analogues. Neither index is wrong, but they point to different past summers.",
  "It depends which yardstick you pick, and there are two.\n\nOn the raw index, the official one, the 2015-16 event is the biggest on record at 2.75°C. 1982-83 comes in well below it at 2.23°C. Now switch to the adjusted index, which strips out the warming of the tropical ocean as a whole and leaves only the Pacific's heat relative to its surroundings. The order reverses. 1982-83 goes top at 2.52°C and 2015-16 drops to 2.37°C.\n\nIt also slips behind 1997-98, but by a hundredth of a degree, which is far too small a gap to mean anything. It is worth noticing only because it shows how tightly the top of this list bunches once the trend is taken out.\n\nThe reason is not a technicality. The raw index has been creeping upward for decades because the whole ocean it sits in has been warming, so it flatters recent events simply for happening recently. The adjusted version resets that, which makes an older event look as big as it felt at the time.\n\nSo when anyone says a developing El Niño could rival the records, they have already chosen an index, whether or not they say so. And the choice decides which past summers India should be studying. Neither is wrong. They just point at different years."
);
// 202 words, 10 numbers. The four decade gaps are the evidence; the apples-and-oranges
// image is the point. They should not be in the same breath.
swap(
  "readability-measuring-stick",
  "Because the measuring stick itself has drifted. Subtract the trend-adjusted RONI from the raw ONI, and the gap is a measure of how much background warming is inflating the raw index. In the 1950s and 1960s, the two indices sat close together, with differences of just -0.12°C and -0.06°C respectively. They wobbled either side of zero before the turn of the century. Since 2000, the tropical ocean has warmed markedly, and the raw ONI now runs consistently above the adjusted figure. By the 2010s, the average gap had widened to roughly 0.23°C. So far in the 2020s, it has reached about 0.44°C. So the same real warming reads differently in different eras.",
  "Because the measuring stick itself has drifted.\n\nSubtract one index from the other and the gap tells you how much background warming is inflating the raw number. Through the 1950s and 1960s the two sat almost on top of each other, wobbling either side of zero. Since 2000 they have pulled apart: a gap of roughly 0.23°C through the 2010s, and about 0.44°C so far in the 2020s.\n\nSo the same real warming reads differently depending on the decade it happens in."
);


swap(
  "readability-crops",
  "These are mainly dryland crops that depend on the June-September rainfall. Irrigated crops like rice and sugarcane, and winter-sown wheat that grows after the monsoon, were largely flat or even gained. The reason is structural. Canal networks, groundwater pumps, and large reservoirs decouple the water supply for irrigated fields from the current season’s rainfall, at least for a while. Rainfed fields have no such buffer. National averages hide regional collapse.",
  "These are mainly dryland crops that depend on the June-September rainfall. Irrigated crops like rice and sugarcane, and winter-sown wheat that grows after the monsoon, were largely flat or even gained.\n\nThe pattern is the same one the previous chart set out, now sorted by crop rather than by region, which is the form in which it reaches a household: what you grow decides what a dry year costs you. National averages hide regional collapse."
);
// 171 words, 12 numbers, and it is the article's calmest and most important idea:
// the monsoon is wild before El Nino is even mentioned.
swap(
  "readability-monsoon-swings",
  "Look at the 125-year record of June-to-September monsoon rainfall over India, and no two summers are alike. The long-period average is about 88 centimetres, but individual years swing far from that mark. The driest year on record, 1972, came in 22.3% below average; the wettest, 1917, ran 26.6% above. That is a spread of nearly 50 percentage points. The most recent season, 2025, finished 7.8% above normal. This seesaw is the natural rhythm of the monsoon, driven by a mix of Pacific conditions, Indian Ocean dynamics, Atlantic influences, and internal atmospheric chaos. It means that El Niño is only one of many hands on the steering wheel.",
  "Look at 125 years of June-to-September rainfall and no two summers are alike. A normal monsoon delivers about 87 centimetres. The driest year on record, 1972, came in 22.3% below that. The wettest, 1917, ran 26.6% above. Last year finished 7.8% wet.\n\nThat swing is the monsoon's natural rhythm, driven by the Pacific, the Indian Ocean, the Atlantic and plain atmospheric chaos all at once. El Niño is one hand on the steering wheel, not the only one."
);
// Break-only edits: no wording changes, just a paragraph break at a genuine turn in
// the argument. Each of these was a single block of 145-200 words. Splitting at the
// pivot is lower-risk than rewriting prose that is already doing its job, and it is
// where a reader's eye needs somewhere to rest.
const breaks = [
  // [9] the strong-event record: the roll-call of disasters, then the exception
  ["strong-events", "But the small sample of seven also contains 1997,"],
  // [10] flavour: the eastern-leaning cases, then what they fail to show
  ["flavour", "Yet 1997, the most lopsidedly eastern event of all at 3.16, finished essentially normal."],
  // [11] IOD: the evidence, then the caveat that 1972 blows it open
  ["iod", "But this is a tilt, not a guarantee."],
  // [12] rolling correlation: the fall, then the reversal
  ["rolling-corr", "But the trend reversed."],
  // [14] subseasonal: the month-by-month walk, then why timing matters to a farmer
  ["subseasonal", "This timing matters enormously for farmers."],
  // [16] irrigation split: the numbers, then the mechanism
  ["irrigation", "The mechanism is straightforward."],
  // [18] food prices: the three counter-examples, then why the link is loose
  ["prices-loose", "The link is real but loose, because rain is only one of the things that sets a price."],
  // [19] price components: the split, then the policy reason for it
  ["prices-split", "The divergence happens because different foods have different exposure to rain"],
  // [22] agriculture's share: then vs now
  ["agri-share", "Today, agriculture contributes only about 14% of gross value added"],
  // [23] methodology: the base-rate caveats, then the definitional ones
  ["methodology-split", "That threshold also uses the peak index value reached during June to September,"]
];
for (const [label, sentence] of breaks) {
  swap(`break-${label}`, ` ${sentence}`, `\n\n${sentence}`);
}

// --- 10. the second channel onto the winter crop ---------------------------
// The peak-timing act establishes that this event lands on rabi rather than kharif, and
// then describes that risk purely as water: reservoirs, groundwater, sowing. There is a
// second channel, and on our own ERA5 data it is the better-evidenced one. Inserted
// after the peak-timing section, which is where the rabi argument already lives.
const HEAT_SECTION = `## Does a warmer winter come with it?

It does, and this is the part that gets left out.

Take India's temperature through the winter crop season, October to February, and measure each year against its own decade rather than against a fixed baseline. That last step matters: El Niño years are scattered through a warming record, so without it any group containing more recent years looks hotter for reasons that have nothing to do with the Pacific.

Do that, and the winter after an El Niño monsoon runs about 0.3°C above its own decade. The winter after a La Niña runs about 0.24°C below. After a strong El Niño it is 0.44°C. That is a gap of roughly half a degree between the two ends, and unlike several other relationships in this piece it is comfortably distinguishable from noise.

Half a degree sounds like very little. For wheat it is not nothing. Indian wheat is more vulnerable to heat than to drought once it has irrigation, because warm nights late in the season cut the grain-filling short. So the winter crop is facing two things at once from the same event: reservoirs that a weak monsoon failed to fill, and a season that tends to run warm.

One honesty note, because it cuts against the neat version of this. The narrow window that actually decides a wheat yield, the fortnight or so of grain filling in late February and March, is too noisy in this record to separate from chance. The season is a real signal. The critical fortnight is not something we can show.

`;

insertOnce(
  "insert-heat-section",
  "## Does a warmer winter come with it?",
  "## If farming is now just a fraction of the economy, why does a bad monsoon still matter?",
  HEAT_SECTION
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


// These two run AFTER the cyclone correction above, because they split paragraphs
// that only contain the corrected sentence once that swap has applied.
// 326 words in a single paragraph, the longest in the article by 100 words, and it
// carries three separate claims: the sign flip, the cyclone correction, and the
// significance caveat. One each.
swap(
  "readability-northeast-monsoon",
  "Later in the year, as the sun moves south, that extra Pacific warmth pumps moisture into the Bay of Bengal, feeding the retreating monsoon and tropical cyclones. So the same ocean warmth that starves Gujarat in July can soak Chennai in November. The reversal is a tilt in the odds, not a guarantee. It is also much weaker evidence than the summer picture.",
  "Later in the year, as the sun moves south and the winds reverse, those same easterlies cross the warm Bay of Bengal and pick up the moisture that falls on the southern coast. So the same ocean warmth that starves Gujarat in July can soak Chennai in November.\n\nOne thing it does not feed, though, is cyclones. Over the four decades to 2020, El Niño autumns brought roughly a quarter fewer cyclones to the Bay of Bengal than a normal year, and La Niña autumns about a fifth more. Almost all of that gap sits in the storms forming nearest the equator. The rain tilts one way and the storms tilt the other, so neither is a safe stand-in for the other.\n\nNow the caveat, and it is a large one. The reversal is a tilt in the odds, not a guarantee, and it rests on much weaker evidence than the summer picture."
);
swap(
  "readability-northeast-significance",
  "On average, El Niño autumns run about 6 percentage points wetter than La Niña autumns. But individual autumns swing enormously, by 24 and 33 points either side of their own averages. The noise is four or five times larger than the signal. With numbers that scattered, this record simply cannot tell the two groups apart. The direction matches what published research on the northeast monsoon reports. Our own figures cannot confirm it. And a wetter northeast monsoon does not mean a comfortable harvest. It can arrive in violent bursts that flood the city rather than gently refill the parched reservoirs of Rayalaseema.",
  "On average, El Niño autumns run about 6 percentage points wetter than La Niña ones. But individual autumns swing by 24 and 33 points either side of their own averages, so the noise is four or five times bigger than the signal. With numbers that scattered, this record cannot actually tell the two groups apart. The direction matches what published research reports. Our own figures cannot confirm it.\n\nAnd more rain is not the same as a good year. The northeast monsoon tends to arrive in violent bursts, which flood Chennai rather than gently refilling the parched reservoirs of Rayalaseema."
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


// Runs after dedupe-crops, which is the swap that writes this sentence.
// --- methodology section: the honesty ledger has to match the new spine -----
swap(
  "methodology-forecast-note",
  "The rainfall departures are IMD's, measured against each series' own long-period average. The base rate for strong events rests on seven monsoons, which is a small enough number that it should be read as a rough guide to the odds and never as a forecast.",
  "The rainfall departures are IMD's, measured against each series' own long-period average. The base rate for strong events rests on seven monsoons, and the escalation split earlier in the piece on thirteen, of which five sit in one branch and eight in the other. Those are small enough numbers that they should be read as rough guides to the odds and never as forecasts. The escalation split also carries one circularity worth naming: a year that escalates is a strong-event year by definition, so the poor average of that branch restates the base rate rather than confirming it independently. The parts that stand on their own are the escalation rate and the outcome of the branch that did not escalate."
);

// The peak-timing act previously rested entirely on a histogram of past events. CPC's
// own forecast now says the same thing about THIS event, which is much stronger.
swap(
  "peak-timing-forecast-confirms",
  "This is the fact that moves the story into 2027. India's kharif crop, sown with the June rains, is largely settled by the end of September. If the Pacific does not reach full volume until December, the loudest part of the event arrives after the summer harvest has already been decided, one way or the other.",
  "This is the fact that moves the story into 2027, and it is not only a pattern from the past. It is what NOAA forecasts for this event: 81% odds of a very strong El Niño in October to December, against about one chance in four of even reaching the strong threshold during June to August. India's kharif crop, sown with the June rains, is largely settled by the end of September. The loudest part of this event is expected to arrive after the summer harvest has already been decided, one way or the other."
);

swap(
  "methodology-absent",
  "Finally, what is absent. The 2026 season is unfinished, and this piece deliberately carries no figures for rainfall so far, reservoir storage or sown area. Those numbers exist and they move week to week, but they are not in the evidence behind this article, so no estimate of them has been made here.",
  "Finally, what is absent, which in this piece matters as much as what is present. The 2026 season is unfinished, and this article carries no figures for rainfall so far, reservoir storage or sown area. Those numbers exist and they move week to week, but they are not in the evidence behind this article, so no estimate of them is made here.\n\nAn earlier draft of this piece asserted, with no source at all, that a crossing of the strong threshold during the monsoon was widely anticipated, and used that to apply the harshest of the three base rates. No forecast product was among its sources. That sentence is gone, and in its place is the actual CPC outlook, named, dated and linked below. The difference matters more than it might look: one was a confident sentence about the future, the other is a published distribution that can be checked and that will be revised next month."
);


// Runs AFTER methodology-absent, because it anchors on text that swap creates.
swap(
  "methodology-forecast-vintage",
  "Finally, what is absent, which in this piece matters as much as what is present.",
  "One forecast is quoted, and only one. The Climate Prediction Center's probabilistic strength outlook is an official product, re-issued on the second Thursday of every month, and the figures here are from the July 2026 edition. It is a distribution rather than a prediction, its probabilities are verified against the trend-adjusted index on a 1991 to 2020 baseline, and it will have moved by the time you read this. Every other number about 2026 in this piece is an observation, not a projection.\n\nFinally, what is absent, which in this piece matters as much as what is present."
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
  "this-el-nino-is-climbing-faster-than-the-ones-it-is-compared-to",
  "when-noaa-expects-this-el-nino-to-cross-the-strong-line",
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
  "el-nino-does-not-just-take-the-water-it-brings-the-heat",
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
doc.dataThrough = "22 July 2026 (observations); CPC forecast issued July 2026";
doc.lastReviewed = "2026-08-01";

doc.article.title = "The El Nino Is Coming Late, and That Changes Who It Hurts";
doc.article.standfirst =
  "NOAA now puts an 81% chance on a very strong El Niño by December. But the forecast for the monsoon months is far softer, and the event is expected to peak after India's summer crop is already in the ground. The risk is real. It is just not where the headlines are pointing.";

// This is the summary card, the first thing most readers will actually read, and it had
// become the densest paragraph on the page: nine numbers, three unexplained technical
// terms (the "three-month index", the "trend-adjusted" version, the "strong threshold"),
// an unexpanded CPC, and three overlapping season windows. The precision belongs in the
// body, where the charts and the glossary support it. Here the job is the shape of the
// story. House length for short.body is roughly 90-140 words; this is about 120, with
// three numbers instead of nine and no acronym beyond NOAA.
doc.short = {
  headline: "This El Niño is running late, and that decides who it hurts.",
  dek: "It is forecast to peak around October, after India's summer crop is already harvested. The rains it could still spoil are the ones falling now.",
  body:
    "An El Niño has begun in the Pacific and it is strengthening fast. For India the question is not whether, but when. NOAA expects it to become a major event only around October, by which time the rice, pulses and millets sown with the June rains are largely decided. Through the monsoon months themselves the odds are much softer, roughly one in four. History says the same thing from the other direction: of the thirteen monsoons that began where this one began, five turned dry and eight ended up wetter than usual. So the crop in the ground now faces a real risk that is genuinely unsettled. What the event lands on at full strength is water: how full the reservoirs are in October, how much wheat gets sown after that, and what food costs in 2027."
};

// No glossary blocks existed at all, so "kharif" appeared in the old headline with
// nothing to support it and the body's index vocabulary had no safety net. These give
// the precise terms somewhere to be explained, which is what lets the body stay precise.
doc.editorialPlan = doc.editorialPlan || {};
doc.editorialPlan.glossaryBlocks = [
  {
    term: "kharif",
    plainMeaning: "The summer crop, sown with the arrival of the monsoon in June and harvested from about September. Rice, maize, pulses, groundnut, bajra and jowar are the main ones.",
    whyItMattersHere: "It is the crop growing right now, and the one the monsoon rains decide. Almost everything in this piece about a bad monsoon is about kharif."
  },
  {
    term: "rabi",
    plainMeaning: "The winter crop, sown from about October and harvested in spring. Wheat is the big one, and it depends far more on stored water than on rain falling at the time.",
    whyItMattersHere: "Because this El Niño is expected to peak after the kharif harvest, rabi is where its full force actually lands, through reservoir levels and groundwater."
  },
  {
    term: "Oceanic Niño Index",
    plainMeaning: "The official measure of El Niño: how much warmer than normal a patch of the equatorial Pacific has been, averaged over three months. Above 0.5°C is an El Niño; above 1.5°C counts as strong.",
    whyItMattersHere: "It averages three months, so it lags a fast-moving ocean. That is why the official index can read weak while this week's reading looks alarming.",
    keyTerm: true
  },
  {
    term: "long-period average",
    plainMeaning: "India's normal monsoon rainfall, about 87 centimetres over June to September, measured across a long run of years. Every rainfall figure here is a departure from it.",
    whyItMattersHere: "A season within about 10% of it counts as normal. That is the line separating 'below normal' from 'deficient'."
  }
];

doc.macha = {
  heading: "So should I start stocking up on onions now?",
  body:
    "Arre, not this week. Here is the timing, which is the whole thing. The Pacific is warming up and NOAA thinks it gets seriously big by December. But your kharif rice and dal are being grown right now, in June to September, and for those months the forecast is much softer, roughly a one-in-four chance of the dangerous level. The monster shows up after that harvest is mostly decided. What it actually hits is the water in the reservoirs in October, which decides how much wheat gets planted for winter, and that shows up in prices somewhere in 2027. So: farmers without irrigation and officials watching reservoir levels should be paying attention now. Your kitchen budget has time.",
  soWhat:
    "Because the scary number is a December number, and what it lands on is next year's wheat and water, not this month's vegetables."
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
    visualId: "this-el-nino-is-climbing-faster-than-the-ones-it-is-compared-to",
    title: "This El Nino is climbing faster than the ones it is compared to",
    takeaway:
      "Through July, 2026 sits near 2.1°C, above where 1997 and 2015 were on the same date, and above every other year since 1982.",
    detail:
      "Each line is one year's Niño 3.4 anomaly by month, on a shared January-to-December axis, so years can be compared at the same point in the calendar rather than at their own peaks. Every line is era-adjusted, which removes the warming of the base period: without it every recent year would look larger than every older one for reasons that have nothing to do with El Niño. 2026 crosses the strong threshold on this measure in June and keeps going. The dashed line is the median of the other 41 years, which is what an unremarkable year looks like.",
    whyShowThis:
      "The forecast in the next chart says the escalation is steep. This is the only place the reader can see how steep, measured against the yardstick that actually means something: where the record-holders sat on the same date. It also explains why a weak-sounding seasonal index and an alarming weekly one are both correct.",
    howToRead:
      "Follow 2026 from January. Compare its height in any month to the other lines in that same month, not to their eventual peaks, which come later in the year.",
    mistakeToAvoid:
      "Reading a lead in July as a lead at the finish. 1997 and 2015 both climbed hard through the autumn, long past where 2026's line currently stops. The era adjustment is also our approximation of NOAA's centred-base convention rather than a NOAA product, and these are monthly means of a noisier weekly series.",
    mobileNote:
      "Find July on the axis and read straight up: 2026 is the top line there."
  },
  {
    visualId: "el-nino-does-not-just-take-the-water-it-brings-the-heat",
    title: "El Nino does not just take the water. It brings the heat.",
    takeaway:
      "India's winter crop season runs about 0.3°C above its own decade after an El Niño monsoon, and about 0.24°C below after a La Niña one.",
    detail:
      "All-India temperature in two windows, grouped by the state of the Pacific during that year's monsoon, with every year measured against the average of the eleven years centred on it. That detrending is what makes the comparison mean anything: El Niño years sit scattered through a warming record, so a raw comparison would mostly be measuring the trend. The gap between the El Niño and La Niña ends of the winter window is roughly half a degree, and it survives a significance test comfortably. The monsoon season itself shows the same direction but a smaller gap.",
    whyShowThis:
      "The article has already established that this event peaks after the summer harvest is settled, so what it lands on is the winter crop. That risk was described here purely as a water story. This is the second channel, and on this data it is the better-evidenced one: less water and a warmer season, arriving together on a crop that is more heat-sensitive than drought-sensitive once irrigated.",
    howToRead:
      "Zero means normal for that year's own decade, not normal for the twentieth century. Compare the top and bottom bars within each group.",
    mistakeToAvoid:
      "Treating this as a forecast for one winter. It is an average across 17 El Niño seasons and any single year can sit anywhere in the spread. And the narrow February-to-March grain-filling window, which is what actually decides a wheat yield, cannot be separated from noise in this record. The season is a signal; the critical fortnight is not.",
    mobileNote:
      "Two groups. The winter one is where the gap between El Niño and La Niña is widest."
  },
  {
    visualId: "when-noaa-expects-this-el-nino-to-cross-the-strong-line",
    title: "When NOAA expects this El Nino to cross the strong line",
    takeaway:
      "The escalation is forecast to arrive late: about one chance in four during June to August, three in four by July to September, and near-certain once the monsoon is over.",
    detail:
      "CPC's official probability of the index reaching +1.5°C or above, the same threshold every base rate in this article uses, for each of nine overlapping three-month seasons. The first three overlap the monsoon. The shape is what matters: the event is not forecast to be strong while the crop is being sown, but to become strong as the season closes and to peak afterwards, when the forecast is for a very strong event at 81% for October to December. Issued July 2026 and re-issued monthly.",
    whyShowThis:
      "The two charts above establish how often seasons like this one escalated in the past. They cannot say what will happen this time. This is the one place the article quotes a forecast rather than a base rate, and it is worth quoting because it converges with the history: the record says 38%, the models say 25% by August rising to 73% by September.",
    howToRead:
      "Each bar is one three-month season, in order. The height is the chance of reaching the strong threshold, not the chance of any El Niño at all, which is close to certain throughout.",
    mistakeToAvoid:
      "Reading a probability as a plan. An 81% chance of a very strong event in October to December is not a statement that one will happen, and CPC itself notes that the strength of an event does not necessarily match the strength of its impact. This forecast is re-issued on the second Thursday of every month and moves.",
    mobileNote:
      "Follow the bars left to right: the line is crossed late, not early."
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
// Since climate.enso.forecast_strong_threshold exists, forecast language is legitimate
// ON THAT CARD ONLY, where it is sourced to a dated CPC product. Everywhere else it is
// still the unsourced-assertion smell that started all of this, so the guard stays.
const FORECAST_CARD = "when-noaa-expects-this-el-nino-to-cross-the-strong-line";
const FORECAST_PREMISE = /\b(as forecast|forecast holds|is forecast to|are forecast to|forecast to (?:cross|reach|peak|be)|expected to (?:cross|reach|be)|projected to (?:cross|reach|be))\b/i;
for (const e of doc.chartExplainers) {
  if (e.visualId === FORECAST_CARD) continue;
  for (const [field, value] of Object.entries(e)) {
    if (typeof value === "string" && FORECAST_PREMISE.test(value)) {
      console.error(`forecast premise in explainer ${e.visualId}.${field}: ${value.slice(0, 140)}`);
      process.exit(1);
    }
  }
}
// The forecast card itself must name its source and its vintage, or it is just another
// confident sentence about the future.
const fcard = doc.chartExplainers.find((e) => e.visualId === FORECAST_CARD);
if (fcard) {
  const blob = Object.values(fcard).join(" ");
  if (!/CPC|Climate Prediction Center/.test(blob) || !/2026/.test(blob)) {
    console.error("the forecast card must name CPC and its issue date");
    process.exit(1);
  }
}

await writeFile(PATH, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`repaired ${PATH}`);
console.log(`  edits applied: ${applied}`);
console.log(`  sections: ${headingCount}  charts bound: ${doc.sectionVisualMap.filter((s) => s.visualId).length}`);
console.log(`  words: ${body.split(/\s+/).length}`);
