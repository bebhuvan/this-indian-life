import { whoGhoUrl } from "./adapters/who-gho.mjs";
import { fetchJson } from "./lib/source-http.mjs";

const res = await fetchJson(whoGhoUrl(`/FINPROTECTION_CATA_TOT_10_POP`, { "$filter": `SpatialDim eq 'IND'` }));
const rows = res.value || [];
const types = [...new Set(rows.map((r) => `${r.Dim1Type}|${r.Dim1}`))];
console.log(types.join("\n"));
console.log("--- rows with Dim1 null:");
for (const r of rows.filter((x) => x.Dim1 == null)) console.log(r.TimeDim, r.NumericValue, r.Dim2);
