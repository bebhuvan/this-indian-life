import { loadEnv } from "../env.mjs";
import { requireEnv, timeoutSignal } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.DATACOMMONS_BASE_URL || "https://api.datacommons.org";

// Google Data Commons v2 observation API. Aggregates many sources (OWID, World
// Bank, UN, ClimateTrace, ...) behind a knowledge graph. Coverage is uneven per
// (variable, place) — always check the returned facet. Use as a SUPPLEMENTARY
// source for series that are fresher or absent in our direct adapters, never as a
// primary spine. Requires a free API key (apikeys.datacommons.org) as DATACOMMONS_API_KEY.
export async function fetchDataCommonsSeries(variableDcid, entityDcid = "country/IND", { latestOnly = false } = {}) {
  const key = requireEnv("DATACOMMONS_API_KEY");
  const select = ["variable", "entity", "date", "value", "facet"].map((s) => `select=${s}`).join("&");
  const dateParam = latestOnly ? "&date=LATEST" : "";
  const url = `${baseUrl}/v2/observation?key=${key}&entity.dcids=${entityDcid}&variable.dcids=${variableDcid}&${select}${dateParam}`;
  const response = await fetch(url, {
    signal: timeoutSignal(Number(process.env.INDICA_DEEPSEEK_TIMEOUT_MS || 60000)),
    headers: { accept: "application/json", "user-agent": "Indica/0.1 data ingest" }
  });
  if (!response.ok) throw new Error(`Data Commons failed ${response.status}: ${url.replace(key, "<redacted>")}`);
  const payload = await response.json();
  const entity = payload?.byVariable?.[variableDcid]?.byEntity?.[entityDcid];
  const facets = entity?.orderedFacets || [];
  if (!facets.length) return null;
  // orderedFacets[0] is Data Commons' preferred facet (usually the freshest/most complete).
  const best = facets[0];
  const facetMeta = payload?.facets?.[best.facetId] || {};
  const observations = (best.observations || []).map((o) => ({ date: String(o.date), value: Number(o.value) }));
  return {
    observations,
    facet: {
      importName: facetMeta.importName,
      provenanceUrl: facetMeta.provenanceUrl,
      unit: facetMeta.unit,
      measurementMethod: facetMeta.measurementMethod
    }
  };
}
