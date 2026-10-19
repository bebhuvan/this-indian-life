// Post-generation finisher for q.people.fertility_divergence.
//
// Run this after EVERY `generate-explanations.mjs --questions=q.people.fertility_divergence`.
// It is idempotent. It overwrites sourceNotes and furtherReading with the verified,
// linked list below, because the generator emits plain strings (which render as dead
// text in the evidence block) and can invent attributions.
//
// Every URL was checked by CONTENT in a real browser, not just by status code
// (October 2026): each page was searched for a term that must appear.
//  - censusindia.gov.in and nfhsiips.in serve a broken TLS chain to command-line
//    tools (curl needs -k) but load normally in browsers.
//  - MoSPI's PLFS report pages render a generic shell to automated checks, so the
//    labour-force note links the eSankhyiki portal the series was taken from, and
//    says so in the label.
//  - Business Standard blocks automated access, so its delimitation story was matched
//    by title and date through a web search rather than by page content; The India
//    Forum's analysis of the same debate, which did verify, is linked beside it.
// Exits non-zero if any entry lacks a URL, so a regeneration cannot silently drop links.

import { readFile, writeFile } from "node:fs/promises";

const PATH = "data/explanations/en/q.people.fertility_divergence.json";

const SOURCE_NOTES = [
  { label: "Sample Registration System, Office of the Registrar General of India: state total fertility rates, statistical reports 1971-2023.", url: "https://censusindia.gov.in/census.website/en/data/srsstat" },
  { label: "Data For India, fertility: the long state series assembled from SRS reports, 1971-2023, used for the state charts.", url: "https://www.dataforindia.com/fertility/" },
  { label: "RBI Database on Indian Economy (DBIE): per-capita Net State Domestic Product at current prices, 1980-2024 (an app; the table sits under state statistics).", url: "https://data.rbi.org.in/DBIE/" },
  { label: "RBI Handbook of Statistics on Indian States: state population estimates 2011-2024, used for population growth and the circle sizes in the state scatters.", url: "https://www.rbi.org.in/Scripts/AnnualPublications.aspx?head=Handbook+of+Statistics+on+Indian+States" },
  { label: "National Family Health Survey 6 (2023-24), International Institute for Population Sciences: state fertility and the share of women with ten or more years of schooling.", url: "https://www.nfhsiips.in/nfhsuser/index.php" },
  { label: "MoSPI eSankhyiki portal (home page), where the Periodic Labour Force Survey 2023-24 state female participation rates are published.", url: "https://esankhyiki.mospi.gov.in/" },
  { label: "National Commission on Population, Technical Group on Population Projections (2019): state fertility projected to 2031-35 (PDF).", url: "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf" },
  { label: "World Bank: India's total fertility rate since 1960 (SP.DYN.TFRT.IN).", url: "https://data.worldbank.org/indicator/SP.DYN.TFRT.IN?locations=IN" },
  { label: "UN World Population Prospects 2024: India's fertility projected to 2100, median variant.", url: "https://population.un.org/wpp/" },
];

const FURTHER_READING = [
  { label: "Data For India, interactive fertility charts drawing on SRS", url: "https://www.dataforindia.com/fertility/" },
  { label: "National Commission on Population, Population Projections for India and States 2011-2036 (2019)", url: "https://nhm.gov.in/New_Updates_2018/Report_Population_Projection_2019.pdf" },
  { label: "Business Standard, 'Fearing political loss, 2 south CMs seek to reverse population policies' (October 2024), on the delimitation debate", url: "https://www.business-standard.com/politics/fearing-political-loss-2-south-cms-seek-to-reverse-population-policies-124102101208_1.html" },
  { label: "The India Forum, 'South Indian Politicians Want Larger Families: What's in It for the Women?', on fertility and the delimitation debate", url: "https://www.theindiaforum.in/health/south-indian-politicians-want-larger-families" },
];

const missing = [...SOURCE_NOTES, ...FURTHER_READING].filter((item) => !item.url);
if (missing.length) {
  console.error(`finish-fertility: ${missing.length} entries lack a URL`);
  process.exit(1);
}

const d = JSON.parse(await readFile(PATH, "utf8"));
d.sourceNotes = SOURCE_NOTES;
d.furtherReading = FURTHER_READING;
await writeFile(PATH, JSON.stringify(d, null, 2) + "\n");
console.log(`finish-fertility: ${SOURCE_NOTES.length} source notes and ${FURTHER_READING.length} reading links written to ${PATH}`);
