// World Bank Poverty and Inequality Platform (PIP) adapter.
//
// PIP (pip.worldbank.org) is the *canonical* source for the World Bank's
// international poverty lines. The WDI API (`SI.POV.*`) is a periodic, rounded
// snapshot of PIP, and the Poverty & Equity Brief PDFs are a hand-readable
// extract of it. Sourcing straight from PIP gives us:
//   - a reproducible, re-pullable API call (the brief PDF is neither);
//   - an explicit data *version* we can pin, so the numbers don't silently move
//     when the World Bank publishes its next vintage;
//   - the survey/interpolation/projection flags (`estimate_type`,
//     `is_interpolated`), which is exactly the survey-comparability question the
//     poverty article is about.
//
// IMPORTANT — what PIP does and does NOT serve for India:
//   - National headcount + poverty gap at any line: yes (this is what we use).
//   - Rural/urban splits for India: NOT available from the /pip endpoint (it
//     returns empty for reporting_level=rural|urban). Those stay sourced from
//     the Poverty & Equity Brief.
//   - The brief's special tabulations (age/education group cuts, the published
//     million-person counts): brief-only. PIP cannot reproduce them.
//
// We pin PIP_VERSION to the 2025-09-30 / 2021-PPP release, which is the vintage
// underneath the October 2025 India brief the article cites. Pinning means the
// article's locked numbers stay reproducible; a newer release (e.g. 20260324)
// can shift a value by a rounding step. To refresh against a new vintage, bump
// PIP_VERSION and re-run, then re-check the locked numbers in the explanation.

import { mkdir, writeFile } from "node:fs/promises";

// Release 2025-09-30, 2021 PPP, PROD. Matches the Oct 2025 India brief.
export const PIP_VERSION = "20250930_2021_01_02_PROD";
export const PIP_RELEASE = "20250930";
export const PIP_PPP = "2021";

const SNAPSHOT_DIR = "data/snapshots/pip";

// Build the exact, reproducible API URL we store as the series sourceUrl.
export function pipUrl({ povline, fillGaps = false, version = PIP_VERSION, country = "IND" }) {
  const params = new URLSearchParams({
    country,
    povline: String(povline),
    fill_gaps: String(fillGaps),
    version,
    format: "json"
  });
  return `https://api.worldbank.org/pip/v1/pip?${params.toString()}`;
}

async function snapshot(name, payload) {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  await writeFile(`${SNAPSHOT_DIR}/${name}.json`, JSON.stringify(payload, null, 2));
}

// Fetch India national survey-year rows for one poverty line. fillGaps=false ->
// real survey points only (the honest series for a comparability-sensitive
// article); estimate_type stays "survey" on every row we keep.
export async function fetchPipNational({ povline, fillGaps = false, version = PIP_VERSION, country = "IND" }) {
  const sourceUrl = pipUrl({ povline, fillGaps, version, country });
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`PIP API ${response.status} for ${country} povline ${povline}`);
      const payload = await response.json();
      if (!Array.isArray(payload) || payload.length === 0) {
        throw new Error(`PIP returned no rows for ${country} povline ${povline} (version ${version})`);
      }
      await snapshot(`${country}_pl${String(povline).replace(".", "_")}_${version}`, payload);
      // Keep national rows only. Many countries (China, Indonesia, ...) return
      // separate national/urban/rural rows per year; mixing them would duplicate
      // years and corrupt the series. India is national-only, but filter anyway.
      const rows = payload
        .filter((r) => r.headcount != null && r.reporting_year != null && r.reporting_level === "national")
        .sort((a, b) => Number(a.reporting_year) - Number(b.reporting_year));
      const round1 = (x) => Number((x * 100).toFixed(1));
      return {
        sourceUrl,
        version,
        rows,
        // Convenience: ready-to-store observation arrays, headcount + gap, as
        // percentages rounded to one decimal (the brief's published precision).
        headcountObs: rows.map((r) => ({ date: String(r.reporting_year), value: round1(r.headcount) })),
        gapObs: rows.map((r) => ({ date: String(r.reporting_year), value: round1(r.poverty_gap) })),
        estimateTypes: [...new Set(rows.map((r) => r.estimate_type))]
      };
    } catch (err) {
      lastErr = err;
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

// A reusable provenance/method block so every PIP-sourced series reads the same.
export function pipMeta({ povline, measure = "headcount" }) {
  return {
    provenance: `World Bank Poverty and Inequality Platform (PIP), version ${PIP_RELEASE} (${PIP_PPP} PPP), India national survey-year estimates.`,
    method: `Survey-year ${measure} at the $${povline}/day line (${PIP_PPP} PPP), pulled with fill_gaps=false so only real survey points are kept, not interpolated or projected years. This is the canonical PIP series; the WDI SI.POV.* codes are a rounded snapshot of it and the Poverty & Equity Brief is a hand-readable extract.`,
    pipVersion: PIP_VERSION,
    caveat: "PIP serves India at national level only; rural/urban splits and the brief's group cuts are not available here and remain sourced from the October 2025 Poverty & Equity Brief. PIP and the WDI API can differ by a rounding step because WDI lags PIP."
  };
}
