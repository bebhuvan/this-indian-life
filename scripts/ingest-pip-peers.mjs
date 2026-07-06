// Cross-country poverty panel for the "Has India ended poverty?" article.
//
// Pulls the $3 and $4.20 (2021 PPP) poverty headcounts for India and four Asian
// peers straight from PIP (version-pinned, survey years only), so the article
// can show where India's fall sits against China, Indonesia, Vietnam and
// Bangladesh on the SAME source and PPP basis as its national series.
//
// Honest limit, stated in the series metadata and worth repeating in prose:
// these are survey-year points and each country surveys on its own calendar
// (China has dozens of years, Bangladesh ten, Indonesia runs to 2024 while the
// others stop at 2022). The lines therefore have different, sparse x-points;
// read them as trajectories, not as a like-for-like same-year race. The
// India-vs-Asia divergence flagship covers this comparison in more depth.

import { createSeriesArtifact, mergeSourceManifest, writeSeriesArtifact } from "./core/artifacts.mjs";
import { fetchPipNational, PIP_RELEASE, PIP_PPP, PIP_VERSION } from "./adapters/pip.mjs";

const fetchedAt = new Date().toISOString();
const entries = [];

const PEERS = [
  ["IND", "India"],
  ["CHN", "China"],
  ["IDN", "Indonesia"],
  ["VNM", "Vietnam"],
  ["BGD", "Bangladesh"]
];
const LINES = [
  ["300", "3.00", "$3/day"],
  ["420", "4.20", "$4.20/day"]
];

for (const [code3, line, label] of LINES) {
  for (const [iso, name] of PEERS) {
    const fetched = await fetchPipNational({ povline: line, country: iso });
    const id = `econ.poverty.pip_peer_${code3}_${iso.toLowerCase()}`;
    const artifact = createSeriesArtifact({
      indicatorId: id,
      title: `Poverty headcount at ${label}, ${name}`,
      sourceId: "worldbank",
      sourceIndicatorId: `PIP: ${name} poverty headcount, $${line}/day (2021 PPP)`,
      sourceUrl: fetched.sourceUrl,
      unit: "% of population",
      frequency: "survey years",
      geography: { type: "country", id: iso, name },
      fetchedAt,
      observations: fetched.headcountObs,
      metadata: {
        provenance: `World Bank Poverty and Inequality Platform (PIP), version ${PIP_RELEASE} (${PIP_PPP} PPP), ${name} national survey-year estimates.`,
        method: `Survey-year poverty headcount at the $${line}/day line (${PIP_PPP} PPP), fill_gaps=false. Cross-country panel: each country surveys on its own calendar, so the survey years differ between countries and are sparse.`,
        pipVersion: PIP_VERSION,
        caveat: "Survey-year points on different national calendars; read as trajectories, not a same-year comparison. The India-vs-Asia divergence article covers this in depth."
      }
    });
    const file = await writeSeriesArtifact({ sourceId: "poverty", name: `poverty.${iso}.${id.split(".").pop()}`, artifact });
    entries.push({ status: "ready", indicatorId: id, sourceIndicatorId: artifact.sourceIndicatorId, source: "worldbank", artifact: file, observations: fetched.headcountObs.length, fetchedAt });
    console.log(`pip peer ${id} (${fetched.headcountObs.length} survey yrs, latest ${fetched.headcountObs.at(-1)?.date}=${fetched.headcountObs.at(-1)?.value}%)`);
  }
}

await mergeSourceManifest("poverty", entries);
