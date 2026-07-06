// The "$30 thought experiment" line for the "Has India ended poverty?" article.
//
// Max Roser / Our World in Data make the point that the World Bank's extreme- and
// lower-middle-income poverty lines are extremely low by rich-country standards:
// raise the line to roughly a rich-country threshold and almost the entire world,
// India included, is below it (https://ourworldindata.org/extreme-poverty-in-brief).
//
// To make that point in the article's own 2021-PPP frame (not OWID's 2011-PPP $30
// grapher), we use the World Bank's own PROSPERITY LINE of $28/day (2021 PPP) - the
// same standard the brief's "prosperity gap" is measured against. Pulled straight
// from PIP, version-pinned, survey years only, so it sits on the identical source
// and PPP basis as the $3 / $4.20 / $8.30 national series already in the article.
//
// The finding: India's share below $28/day has barely moved (99.8% in 2011-12 to
// 99.7% in 2022-23) and was 100% through the 1980s-90s. The huge progress is all at
// the bottom of the distribution; by a rich-country line, almost nothing changed.

import { createSeriesArtifact, mergeSourceManifest, writeSeriesArtifact } from "./core/artifacts.mjs";
import { fetchPipNational, PIP_RELEASE, PIP_PPP, PIP_VERSION } from "./adapters/pip.mjs";

const fetchedAt = new Date().toISOString();
const fetched = await fetchPipNational({ povline: "28.00", country: "IND" });
const id = "econ.poverty.wb_poverty_2800";

const artifact = createSeriesArtifact({
  indicatorId: id,
  title: "Poverty headcount at $28/day prosperity line, India",
  sourceId: "worldbank",
  sourceIndicatorId: "PIP: India poverty headcount, $28.00/day prosperity line (2021 PPP)",
  sourceUrl: fetched.sourceUrl,
  unit: "% of population",
  frequency: "survey years",
  geography: { type: "country", id: "IND", name: "India" },
  fetchedAt,
  observations: fetched.headcountObs,
  metadata: {
    provenance: `World Bank Poverty and Inequality Platform (PIP), version ${PIP_RELEASE} (${PIP_PPP} PPP), India national survey-year estimates.`,
    method: `Survey-year poverty headcount at the World Bank's $28/day prosperity line (${PIP_PPP} PPP), fill_gaps=false. This is the rich-country-standard line behind the brief's prosperity gap; it is the article's own 2021-PPP version of Roser/OWID's $30-a-day thought experiment.`,
    pipVersion: PIP_VERSION,
    caveat: "A very high line by Indian standards: almost the entire population sits below it, so this measures how far India is from a rich-country floor, not extreme poverty."
  }
});

const file = await writeSeriesArtifact({ sourceId: "poverty", name: `poverty.IN.${id.split(".").pop()}`, artifact });
await mergeSourceManifest("poverty", [{ status: "ready", indicatorId: id, sourceIndicatorId: artifact.sourceIndicatorId, source: "worldbank", artifact: file, observations: fetched.headcountObs.length, fetchedAt }]);
console.log(`prosperity line ${id}: ${fetched.headcountObs.length} survey yrs, 2011=${fetched.headcountObs.find(o => o.date === "2011")?.value}% latest ${fetched.headcountObs.at(-1)?.date}=${fetched.headcountObs.at(-1)?.value}%`);
