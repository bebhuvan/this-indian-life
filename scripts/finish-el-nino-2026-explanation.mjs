// Post-generation finisher for q.climate.el_nino_2026.
//
// Run this after EVERY `generate-explanations.mjs --questions=q.climate.el_nino_2026`.
// It repairs three things the generator gets wrong or cannot do, and it is idempotent.
//
//  1. sourceNotes. The generator invents plausible-sounding attributions. On the first
//     run it credited the Central Water Commission's reservoir bulletins (deliberately
//     EXCLUDED from this article's evidence), the CACP for prices (we use RBI WPI) and
//     the Ministry of Agriculture for yields (we use ICRISAT). A fabricated source line
//     in the evidence block is exactly what a reader trusts on sight, so these are
//     overwritten with what the article actually rests on.
//
//  2. Two caveats that overstate our own findings.
//
//  3. The closing methodology section. The batched generator does not emit prose-only
//     sections (see CLAUDE.md), so it must be appended. Appending is safe here because
//     sectionVisualMap binds by HEADING TEXT rather than position, so a section whose
//     heading is absent from the map simply carries no chart. Do NOT splice mid-article.
//
// Also runs the CLAUDE.md structural check: heading count must rise by exactly one.

import { readFile, writeFile } from "node:fs/promises";

const PATH = "data/explanations/en/q.climate.el_nino_2026.json";
const METHODOLOGY_HEADING = "How to read these numbers";

// Every source note carries a URL. ArticleEvidence.astro's refParts() renders a
// { label, url } pair as a hyperlink and a bare string as plain text, so objects are what
// make these clickable. All six URLs were checked to return 200 (ICRISAT serves HTTP only,
// which is fine for a link even from an HTTPS page). Re-check them if this is ever
// regenerated after a long gap; a dead link in the evidence block is worse than plain text.
const SOURCE_NOTES = [
  // Reader-facing pages, not raw endpoints, and each checked to return the RIGHT page.
  // Split NOAA into three because the article leans on three distinct CPC products and
  // RONI is its central argument, so it deserves its own discoverable link.
  { label: "NOAA Climate Prediction Center, for the Oceanic Nino Index (ONI), the official measure of El Nino strength used throughout this piece.", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php" },
  { label: "NOAA Climate Prediction Center, for the Relative Oceanic Nino Index (RONI), the trend-adjusted measure that re-ranks the historical record.", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/" },
  { label: "NOAA Climate Prediction Center's ENSO monitoring pages, for the weekly and monthly Nino-region sea-surface temperatures from the ERSSTv5 and OISST products.", url: "https://www.cpc.ncep.noaa.gov/products/precip/CWlink/MJO/enso.shtml" },
  // NOAA PSL has no working landing page for the Dipole Mode Index: the obvious path,
  // /gcos_wgsp/Timeseries/DMI/, returns 200 but serves an AMO SST page, and the index
  // pages list no DMI entry. The raw data file is the correct source, so link that and
  // tell the reader it is a data file rather than sending them somewhere wrong.
  // The only forecast the article quotes. Linked to the product itself rather than to
  // the monthly discussion that summarises it, because the product carries the full
  // nine-season distribution and states the index and base period it is verified against.
  { label: "NOAA Climate Prediction Center's official ENSO strength probabilities (issued July 2026), the single forecast quoted in this piece, verified against the trend-adjusted RONI on a 1991-2020 base and re-issued every month.", url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso/roni/strengths/" },
  { label: "NOAA Physical Sciences Laboratory, for the Dipole Mode Index behind the Indian Ocean Dipole (raw data file, HadISST, 1870 onward).", url: "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data" },
  // ERA5 via the Copernicus CDS, our own ingest. Copernicus asks for the "Contains
  // modified Copernicus Climate Change Service information" form of words, which is why
  // the label reads the way it does.
  { label: "Contains modified Copernicus Climate Change Service information: ERA5 monthly reanalysis, for the all-India temperature anomalies behind the winter-heat comparison.", url: "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-monthly-means" },
  { label: "India Meteorological Department, for all-India and subdivisional monthly rainfall from 1901 to 2025, which underlies every rainfall departure in this piece.", url: "https://imdpune.gov.in/cmpg/Product/Rainfall_Data.html" },
  { label: "ICRISAT's district-level database, for the crop yield comparisons, which run from 1966 to 2017.", url: "http://data.icrisat.org/dld/" },
  { label: "Reserve Bank of India, for wholesale food prices and for the national accounts behind agriculture's share of output.", url: "https://data.rbi.org.in/DBIE/" },
  { label: "World Bank, for the modelled estimate of agriculture's share of employment.", url: "https://data.worldbank.org/indicator/SL.AGR.EMPL.ZS" },
  // The two published papers the article leans on for claims NOT derivable from its own
  // data. Both are named in the prose, so both need to be findable. DOIs resolve to the
  // correct publisher pages (the publishers 403 a bare curl, which does not affect an
  // <a href>); each was checked by title and author list, not just by status code.
  //
  // Kumar et al. is the source of the central-vs-eastern Pacific hypothesis the flavour
  // chart tests and fails to confirm. Girishkumar & Ravichandran corrects a claim an
  // earlier draft got backwards: it finds Bay of Bengal Oct-Dec accumulated cyclone
  // energy NEGATIVELY correlated with Nino3.4, so El Nino suppresses post-monsoon
  // cyclone activity rather than feeding it, as the draft said.
  { label: "Kumar, Rajagopalan, Hoerling, Bates and Cane, 'Unraveling the Mystery of Indian Monsoon Failure During El Nino', Science 314 (2006), for the central-Pacific hypothesis this piece tests.", url: "https://doi.org/10.1126/science.1131152" },
  { label: "Girishkumar and Ravichandran, 'The influences of ENSO on tropical cyclone activity in the Bay of Bengal during October-December', Journal of Geophysical Research: Oceans 117 (2012), for the finding that El Nino suppresses post-monsoon cyclone energy in the Bay.", url: "https://doi.org/10.1029/2011JC007417" },
  // Open access, and the source of the actual figures quoted in the northeast-monsoon
  // section: Table 2 gives 1.33 Bay of Bengal cyclones per year in El Nino autumns
  // against a 1.83 climatology (down 27%) and 2.18 in La Nina (up 19%), with the drop
  // concentrated in low-latitude genesis (down 58%) and almost none of it north of 10N.
  { label: "Roose, Ajayamohan, Ray, Mohan and Mohanakumar, 'ENSO influence on Bay of Bengal cyclogenesis confined to low latitudes', npj Climate and Atmospheric Science 5:31 (2022), for the post-monsoon cyclone counts by ENSO phase.", url: "https://doi.org/10.1038/s41612-022-00252-8" },
  // The current state of the "is the link fading" debate, and the source for the
  // projected weakening via El Nino / positive-IOD co-occurrence. Open access, read in
  // full. Cited rather than merely used, because it is the one place the article
  // reports a model projection rather than an observation.
  { label: "Goswami and An, 'An assessment of the ENSO-monsoon teleconnection in a warming climate', npj Climate and Atmospheric Science 6:82 (2023), for the projected weakening of the link and the El Nino/positive-dipole mechanism behind it.", url: "https://doi.org/10.1038/s41612-023-00411-5" }
];

const METHODOLOGY = `

## ${METHODOLOGY_HEADING}

Every Pacific figure here comes from the NOAA Climate Prediction Center, and the single most important thing to know about them is that they are not interchangeable. Each carries a product, an averaging period and a baseline, and changing any one of the three changes the number. The weekly values are unsmoothed snapshots from the OISST product; the seasonal ones are three-month running means from ERSSTv5. Some are measured against a fixed 1991 to 2020 climatology, others against the shifting thirty-year windows NOAA uses for the official index. The relative index goes further and subtracts the warming of the wider tropics. When a figure appears in this piece it is labelled, because an unlabelled one is close to meaningless.

The rainfall departures are IMD's, measured against each series' own long-period average. The base rate for strong events rests on seven monsoons, which is a small enough number that it should be read as a rough guide to the odds and never as a forecast. That threshold also uses the peak index value reached during June to September, not the event's calendar peak, and many events reach their maximum later in the year. The regional figures for the October to December season are the unweighted mean of subdivision departures rather than an area-weighted total, because subdivision areas are not in the dataset. They answer how anomalous a season was across the belt, not how much rain fell.

Where a relationship is described, it is a correlation and not proof of cause. Technology, sown area, irrigation, public stocks, imports and policy all move harvests and prices alongside the weather. One test in this piece returned nothing: the idea that where the Pacific warms should predict the monsoon could not be checked against these seven events, because all seven lean the same way and there is no contrasting case among them. That is reported rather than quietly dropped.

Finally, what is absent. The 2026 season is unfinished, and this piece deliberately carries no figures for rainfall so far, reservoir storage or sown area. Those numbers exist and they move week to week, but they are not in the evidence behind this article, so no estimate of them has been made here.
`;

const explanation = JSON.parse(await readFile(PATH, "utf8"));
const before = explanation.article.bodyMarkdown;
const headingsBefore = before.split("\n## ").length - 1;

explanation.sourceNotes = SOURCE_NOTES;

explanation.caveats = (explanation.caveats || []).map((caveat) => {
  if (/statistically robust/i.test(caveat)) {
    return "The reversal in southern India during the October-December season is a tilt in the odds rather than a rule. About half of El Nino years came in above normal against roughly a third of La Nina years, and the spread inside each group is wide.";
  }
  if (/lag of one to two years/i.test(caveat)) {
    return "The crop yield comparisons come from ICRISAT's district panel, which ends in 2017, so they describe how El Nino years behaved historically rather than anything about the current season.";
  }
  return caveat;
});

if (!before.includes(`## ${METHODOLOGY_HEADING}`)) {
  explanation.article.bodyMarkdown = `${before.trimEnd()}${METHODOLOGY.trimEnd()}\n`;
}

const after = explanation.article.bodyMarkdown;
const headingsAfter = after.split("\n## ").length - 1;
const appended = !before.includes(`## ${METHODOLOGY_HEADING}`);

// Structural checks (CLAUDE.md): never let a body edit silently destroy the markdown.
const problems = [];
if (appended && headingsAfter !== headingsBefore + 1) {
  problems.push(`heading count went ${headingsBefore} -> ${headingsAfter}, expected +1`);
}
if (after.includes("—")) problems.push("em-dash present in body");
const noteText = (note) => (typeof note === "string" ? note : note.label || "");
const badSource = explanation.sourceNotes.filter((note) => /Central Water Commission|CACP|Commission for Agricultural/i.test(noteText(note)));
if (badSource.length) problems.push(`fabricated source attribution survived: ${badSource.map(noteText).join("; ")}`);
const unlinked = explanation.sourceNotes.filter((note) => !note || typeof note === "string" || !note.url);
if (unlinked.length) problems.push(`${unlinked.length} source note(s) without a URL: ${unlinked.map(noteText).join("; ")}`);

// Explainers bind to charts by slugified TITLE. Renaming a chart in the registry without
// renaming its explainer silently orphans it, and the page falls back to the thin
// why/read/watch one-liners - which is how two scatter charts shipped with explainer text
// describing the bar charts they used to be. Catch the mismatch instead of eyeballing it.
const { v1Questions } = await import("./registry/v1-indicators.mjs");
const question = v1Questions.find((q) => q.id === "q.climate.el_nino_2026");
const slugifyTitle = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const chartSlugs = new Set((question?.visualPlan || []).map((v) => slugifyTitle(v.title)));
const explainerIds = new Set((explanation.chartExplainers || []).map((e) => e.visualId));
const noExplainer = [...chartSlugs].filter((s) => !explainerIds.has(s));
const orphaned = [...explainerIds].filter((s) => !chartSlugs.has(s));
if (noExplainer.length) problems.push(`chart(s) with no explainer: ${noExplainer.join(", ")}`);
if (orphaned.length) problems.push(`orphaned explainer(s), title probably renamed: ${orphaned.join(", ")}`);

if (problems.length) {
  for (const problem of problems) console.error(`  !! ${problem}`);
  process.exit(1);
}

await writeFile(PATH, `${JSON.stringify(explanation, null, 2)}\n`);
console.log(`finished q.climate.el_nino_2026: sourceNotes=${explanation.sourceNotes.length}, caveats=${explanation.caveats.length}, methodology ${appended ? "appended" : "already present"}, headings ${headingsAfter}`);
