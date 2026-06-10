// Manual / transcribed India R&D series for "How India does (and doesn't) do R&D".
// India publishes R&D data only in PDFs (DST/NSTMIS, NITI Aayog), not via any API,
// so these series are hand-transcribed from the source documents with a precise
// sourceUrl on every artifact. Source figures are pinned in comments next to each
// block so the numbers can be re-checked against the page they came from.
//
// Vintage: India's official R&D series (DST/NSTMIS "R&D Statistics at a Glance
// 2022-23") ends at 2020-21. The GERD/GDP ratio for the cross-country charts comes
// from the World Bank/UNESCO lens (see ingest-rnd-world-lens.mjs); this file
// supplies the rupee figures, sector/agency splits, innovation outputs and the
// good-uses / bad-uses case studies that have no API home.
import { createSeriesArtifact, createTableArtifact, writeSeriesArtifact, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();
const manifest = [];

// Source URLs (kept clean — no trailing text, so the per-chart SOURCE line links).
const SRC = {
  dstGlance: "https://dst.gov.in/sites/default/files/Updated%20RD%20Statistics%20at%20a%20Glance%202022-23.pdf",
  dstTables: "https://dst.gov.in/sites/default/files/S%26T%20Indicators%20Tables%2C%202019-20.pdf",
  nitiEodrd: "https://niti.gov.in/sites/default/files/2026-05/Ease-of-Doing-Research-and-Development-in-India.pdf",
  nitiPublic: "https://niti.gov.in/sites/default/files/2025-12/public_rd_institutes_in_india_opportunities_for_multisectoral_and_systemic_integration.pdf",
  giiIndia: "https://www.wipo.int/gii-ranking/en/india",
  wipi: "https://www.wipo.int/web-publications/world-intellectual-property-indicators-2025-highlights/en/patents-highlights.html",
  nsfPubs: "https://ncses.nsf.gov/pubs/nsb202333",
  oecdMsti: "https://www.oecd.org/en/data/insights/statistical-releases/2026/03/oecd-overall-rd-growth-stable-government-rd-budgets-decline-and-reorient-towards-defence.html",
  cgiarRoi: "https://ucanr.edu/blog/food-blog/article/report-finds-10-1-return-investment-international-agricultural-research",
  rdReturns: "https://www.frontier-economics.com/media/015adtpq/rate-of-return.pdf",
  isroCost: "https://www.business-standard.com/india-news/what-makes-india-s-space-missions-cost-less-than-hollywood-sci-fi-movies-124110400430_1.html",
  openBudgets: "https://openbudgetsindia.org/organization/department-of-science-and-technology",
  anrf: "https://anrfonline.in/ANRF/About?HomePage=New",
  rdiScheme: "https://www.pmindia.gov.in/en/news_updates/cabinet-approves-research-development-and-innovation-rdi-scheme/",
  wipoProfile: "https://www.wipo.int/edocs/statistics-country-profile/en/in.pdf"
};

const META = (extra = {}) => ({ sourceCategory: "Science & Technology", sourceSubcategory: "R&D", ...extra });

function pushSeries({ indicatorId, title, sourceId, sourceUrl, unit, observations, sourceIndicatorId = "", metadata = {} }) {
  const artifact = createSeriesArtifact({
    indicatorId, title, sourceId, sourceIndicatorId, sourceUrl, unit, frequency: "annual",
    geography: { type: "country", id: "IN", name: "India" }, fetchedAt, observations, metadata: META(metadata)
  });
  const name = `rnd-india.${indicatorId}`;
  manifest.push({ artifactId: indicatorId, write: writeSeriesArtifact({ sourceId, name, artifact }) });
  return manifest[manifest.length - 1].write;
}

function pushTable({ indicatorId, title, sourceId, sourceUrl, unit, rows, sourceIndicatorId = "", metadata = {} }) {
  const artifact = createTableArtifact({
    indicatorId, title, sourceId, sourceIndicatorId, sourceUrl, unit,
    geography: { type: "country", id: "IN", name: "India" }, fetchedAt, rows, metadata: META(metadata)
  });
  const name = `rnd-india.${indicatorId}`;
  manifest.push({ artifactId: indicatorId, write: writeSeriesArtifact({ sourceId, name, artifact }) });
  return manifest[manifest.length - 1].write;
}

const writes = [];

// ── GERD in current rupees ───────────────────────────────────────────────────
// DST S&T Indicators Tables 2019-20, Table 3 ("R&D Expenditure current prices,
// Rs. Crore"), 1995-96 → 2018-19; 2020-21 endpoint from the At-a-Glance 2022-23
// booklet ("...Rs 60,196.75 cr in 2010-11 to Rs 127,380.96 cr in 2020-21").
// 2018-19 is the source's estimate; 2019-20 is not published as a rupee figure.
writes.push(pushSeries({
  indicatorId: "rnd.in.gerd_inr", title: "India — Gross Expenditure on R&D (GERD)",
  sourceId: "dst", sourceUrl: SRC.dstTables, unit: "₹ crore (current prices)",
  observations: [
    { date: "1995-96", value: 7483.88 }, { date: "1996-97", value: 8913.61 }, { date: "1997-98", value: 10611.34 },
    { date: "1998-99", value: 12473.17 }, { date: "1999-00", value: 14397.60 }, { date: "2000-01", value: 16198.80 },
    { date: "2001-02", value: 17038.15 }, { date: "2002-03", value: 18088.16 }, { date: "2003-04", value: 20086.34 },
    { date: "2004-05", value: 24117.24 }, { date: "2005-06", value: 29932.58 }, { date: "2006-07", value: 34238.39 },
    { date: "2007-08", value: 39437.77 }, { date: "2008-09", value: 47353.38 }, { date: "2009-10", value: 53041.30 },
    { date: "2010-11", value: 60196.75 }, { date: "2011-12", value: 65961.33 }, { date: "2012-13", value: 73982.79 },
    { date: "2013-14", value: 79355.89 }, { date: "2014-15", value: 87473.44 }, { date: "2015-16", value: 95452.44 },
    { date: "2016-17", value: 103099.26 }, { date: "2017-18", value: 113825.03 }, { date: "2018-19", value: 123847.71 },
    { date: "2020-21", value: 127380.96 }
  ],
  metadata: { note: "2018-19 estimated in source; 2020-21 from At-a-Glance 2022-23 booklet." }
}));

// ── A flat 2% target reference line ──────────────────────────────────────────
// The 2% of GDP target dates to the 2013 STI Policy and is restated by NITI 2026.
// Built as a flat series so the multiLine chart can show India's actual GERD/GDP
// (World Bank/UNESCO series rnd.rd_gdp.in) against the goal it has never met.
writes.push(pushSeries({
  indicatorId: "rnd.in.target_2pct", title: "The 2% of GDP target (STI Policy 2013)",
  sourceId: "niti", sourceUrl: SRC.nitiEodrd, unit: "% of GDP",
  observations: Array.from({ length: 2024 - 1996 + 1 }, (_, i) => ({ date: String(1996 + i), value: 2.0 })),
  metadata: { note: "Policy target, not a measurement — a constant 2.0% reference line." }
}));

// ── Researchers per million (India, selected years) ──────────────────────────
// At-a-Glance 2022-23 booklet p.10: "researchers per million population in India
// has increased to 262 in 2020 from 255 in 2017, 218 in 2015, and 110 in 2000."
// Only these four years exist in the source — no interpolation.
writes.push(pushSeries({
  indicatorId: "rnd.in.researchers_per_million", title: "India — researchers per million population",
  sourceId: "dst", sourceUrl: SRC.dstGlance, unit: "researchers per million people",
  observations: [
    { date: "2000", value: 110 }, { date: "2015", value: 218 }, { date: "2017", value: 255 }, { date: "2020", value: 262 }
  ]
}));

// ── Performer split of GERD, 2020-21 (sums to 100) ───────────────────────────
// At-a-Glance 2022-23, "National R&D Expenditure Sector Wise, 2020-21" (p.3).
writes.push(pushTable({
  indicatorId: "rnd.in.performer_split", title: "Who performs India's R&D (2020-21)",
  sourceId: "dst", sourceUrl: SRC.dstGlance, unit: "% of national R&D spend",
  rows: [
    { label: "Central government", value: 43.7 },
    { label: "Private-sector industry", value: 36.4 },
    { label: "Higher education", value: 8.8 },
    { label: "State governments", value: 6.7 },
    { label: "Public-sector industry", value: 4.4 }
  ],
  metadata: { share: true, note: "Government bloc (central+state+higher-ed) = 59.2%; industry = 40.8%." }
}));

// ── Central-government R&D by agency, 2020-21 ────────────────────────────────
// At-a-Glance 2022-23 p.4: "84% of Central Government R&D came from 12 major
// scientific agencies." Shares are of central-government R&D (not the whole GERD).
writes.push(pushTable({
  indicatorId: "rnd.in.agency_split", title: "Where India's central-government research money goes (2020-21)",
  sourceId: "dst", sourceUrl: SRC.dstGlance, unit: "% of central-government R&D",
  rows: [
    { label: "DRDO (defence)", value: 30.7 },
    { label: "Dept of Space", value: 18.4 },
    { label: "ICAR (agriculture)", value: 12.4 },
    { label: "Dept of Atomic Energy", value: 11.4 },
    { label: "CSIR", value: 8.2 },
    { label: "Dept of Science & Tech", value: 6.8 },
    { label: "Dept of Biotechnology", value: 4.4 },
    { label: "ICMR (medical)", value: 3.1 },
    { label: "MeitY (electronics/IT)", value: 2.2 },
    { label: "Min. of Earth Sciences", value: 1.5 }
  ],
  metadata: { note: "Defence + space + atomic energy = ~60% of central-government R&D." }
}));

// ── Business share of R&D, cross-country ─────────────────────────────────────
// India's private-industry PERFORMER share (36.4%, DST 2020-21) set against the
// business-enterprise share of R&D in peer economies (OECD MSTI / WIPO / NITI).
// India is absent from OECD MSTI, so its figure is DST's own survey — flag it.
writes.push(pushTable({
  indicatorId: "rnd.business_share_compare", title: "Who pays for R&D: business vs the state",
  sourceId: "niti", sourceUrl: SRC.nitiEodrd, unit: "% of R&D from business / private sector",
  rows: [
    { label: "South Korea", value: 79 },
    { label: "China", value: 77 },
    { label: "United States", value: 75 },
    { label: "Germany", value: 67 },
    { label: "India", value: 36 }
  ],
  metadata: { note: "India = private-industry performer share (DST 2020-21, ~36%); comparators = business-enterprise share (OECD/WIPO). India is not in OECD MSTI." }
}));

// ── Absolute R&D spending, PPP$ ──────────────────────────────────────────────
// Mixed vintage (flagged): China & US from OECD MSTI 2024; India from DST/UNESCO
// 2020-21 (GERD = 57.9 bn PPP$). Point is the order-of-magnitude scale gap.
writes.push(pushTable({
  indicatorId: "rnd.absolute_ppp", title: "The absolute scale of the gap",
  sourceId: "oecd", sourceUrl: SRC.oecdMsti, unit: "R&D spend, PPP$ billions (latest available)",
  rows: [
    { label: "China (2024)", value: 860 },
    { label: "United States (2024)", value: 760 },
    { label: "India (2020-21)", value: 58 }
  ],
  metadata: { note: "China/US: OECD MSTI 2024 PPP$. India: DST/UNESCO 57.9 bn PPP$, 2020-21. Years differ." }
}));

// ── Illustrative returns to R&D (literature midpoints) ───────────────────────
// These are MIDPOINTS of wide literature ranges, shown to make the case that
// research pays — not precise measurements. Ranges carried in the chart caveat.
writes.push(pushTable({
  indicatorId: "rnd.returns_by_type", title: "Research pays — the question is who reaps it",
  sourceId: "research", sourceUrl: SRC.rdReturns, unit: "annual rate of return, % (midpoint of literature estimates)",
  rows: [
    { label: "Agricultural R&D", value: 50 },
    { label: "Social return (all R&D)", value: 40 },
    { label: "Private return (firm's own)", value: 18 }
  ],
  metadata: { note: "Ranges: agricultural ~40-60% (CGIAR/ASTI); social ~30-50%; private ~7-30% (Hall/Bloom). Midpoints only." }
}));

// ── ISRO frugal-science cost comparison ──────────────────────────────────────
// Mission costs, US$ million. India's Mangalyaan/Chandrayaan-3 vs MAVEN/Luna-25.
writes.push(pushTable({
  indicatorId: "rnd.isro_cost", title: "India does science cheap: mission costs",
  sourceId: "isro", sourceUrl: SRC.isroCost, unit: "mission cost, US$ million",
  rows: [
    { label: "Mangalyaan — India to Mars", value: 74 },
    { label: "Chandrayaan-3 — India Moon landing", value: 75 },
    { label: "Luna-25 — Russia (crashed)", value: 133 },
    { label: "MAVEN — NASA to Mars", value: 582 }
  ],
  metadata: { note: "Mangalyaan ~₹450 cr; Chandrayaan-3 ~₹600 cr. Approximate, news-sourced." }
}));

// ── R&D budget under-utilisation ─────────────────────────────────────────────
// Share of the budgeted allocation actually spent. 2023-24: DST R&D ₹200 cr of
// ₹592 cr; NRF/ANRF ₹259 cr of ₹2,000 cr. DST averaged ~18% under-spend 2018-24.
writes.push(pushTable({
  indicatorId: "rnd.budget_utilisation", title: "The research money that doesn't get spent",
  sourceId: "openbudgets", sourceUrl: SRC.openBudgets, unit: "% of budgeted allocation actually spent",
  rows: [
    { label: "DST average (2018-24)", value: 82 },
    { label: "DST R&D head (2023-24)", value: 34 },
    { label: "NRF / ANRF (2023-24)", value: 13 }
  ],
  metadata: { note: "34% = ₹200 cr of ₹592 cr; 13% = ₹259 cr of ₹2,000 cr. Lower = more unspent." }
}));

// ── Scientific publications by country, 2022 ─────────────────────────────────
// Scopus/NSF S&E Indicators: India 3rd by volume behind China and the US.
writes.push(pushTable({
  indicatorId: "rnd.publications_volume", title: "Third in the world for research papers",
  sourceId: "nsf", sourceUrl: SRC.nsfPubs, unit: "scientific papers, thousands (2022)",
  rows: [
    { label: "China", value: 1000 },
    { label: "United States", value: 721 },
    { label: "India", value: 278 }
  ],
  metadata: { note: "Scopus/NSF 2022, rounded. China ~1 million; India overtook the UK, Germany, Japan." }
}));

// ── GII 2025 input vs output rank (the efficiency paradox) ───────────────────
// WIPO Global Innovation Index 2025: India 38th overall, inputs 52nd, outputs 32nd.
writes.push(pushTable({
  indicatorId: "rnd.gii_subranks", title: "Spends like 50th, innovates like 30th",
  sourceId: "wipo", sourceUrl: SRC.giiIndia, unit: "India's world rank (lower = better), of 139",
  rows: [
    { label: "Innovation inputs (incl. R&D spend)", value: 52 },
    { label: "Innovation outputs", value: 32 }
  ],
  metadata: { note: "GII 2025: overall 38th. India has been an innovation 'overperformer' 15 years running." }
}));

// ── The new bets: ANRF + RDI Fund ────────────────────────────────────────────
// ANRF ₹50,000 cr over 2023-28 = ₹14,000 cr govt + ₹36,000 cr private (a TARGET,
// not committed money). RDI Fund = ₹1 lakh crore corpus (low-cost finance, not grants).
writes.push(pushTable({
  indicatorId: "rnd.new_funds", title: "The new bets on Indian research",
  sourceId: "anrf", sourceUrl: SRC.anrf, unit: "₹ crore",
  rows: [
    { label: "ANRF — government share", value: 14000 },
    { label: "ANRF — private share (target)", value: 36000 },
    { label: "RDI Fund — corpus", value: 100000 }
  ],
  metadata: { note: "ANRF over 2023-28; ₹36,000 cr private is an aspiration, not committed. RDI is a financing corpus (loans/equity), not grant money." }
}));

// ── Patent filings at the Indian Patent Office: resident vs non-resident ──────
// World Bank IP.PAT.RESD / IP.PAT.NRES (WIPO-sourced), 2013-2021, spliced to
// WIPI/WIPO country-profile 2022-2024. Same "filings at the office" basis (the
// resident shares reproduce WIPI's published figures to the decimal). Residents
// drew level in 2022 and reached 60.1% of filings by 2024. Calendar-year.
const PATENT_RES = { 2013: 10669, 2014: 12040, 2015: 12579, 2016: 13199, 2017: 14961, 2018: 16289, 2019: 19454, 2020: 23141, 2021: 26267, 2022: 38551, 2023: 49860, 2024: 63217 };
const PATENT_NON = { 2013: 32362, 2014: 30814, 2015: 33079, 2016: 31858, 2017: 31621, 2018: 33766, 2019: 34173, 2020: 33630, 2021: 35306, 2022: 38517, 2023: 40438, 2024: 41940 };
writes.push(pushSeries({
  indicatorId: "rnd.in.patents_resident", title: "India — resident patent filings",
  sourceId: "wipo", sourceUrl: SRC.wipoProfile, unit: "patent applications filed at the India office",
  observations: Object.entries(PATENT_RES).map(([date, value]) => ({ date, value }))
}));
writes.push(pushSeries({
  indicatorId: "rnd.in.patents_nonresident", title: "India — non-resident patent filings",
  sourceId: "wipo", sourceUrl: SRC.wipoProfile, unit: "patent applications filed at the India office",
  observations: Object.entries(PATENT_NON).map(([date, value]) => ({ date, value }))
}));

const results = await Promise.all(writes);
await writeSourceManifest("rnd-india", manifest.map((m, i) => ({ artifactId: m.artifactId, artifact: results[i] })));
console.log(`Wrote ${results.length} India R&D artifacts:`);
results.forEach((p) => console.log(`  ${p}`));
