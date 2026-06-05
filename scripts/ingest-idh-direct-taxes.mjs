// Ingest IndiaDataHub "Government Finances > Direct Taxes" series for the income-tax article.
// Triangulates with CBDT ITR Statistics + Time-Series; saves the genuine supplements
// (long collections history 1981-, by-type returns, persons filing/paying).
// IDH date convention: counts dated income-year-end Mar Y => AY (Y)/(Y+1);
//   collections dated Mar Y => FY (Y-1)-(Y).
import { loadEnv } from "./env.mjs";
import { buildUrl, fetchJson, requireEnv } from "./lib/source-http.mjs";
import fs from "fs";
loadEnv();
const baseUrl = process.env.INDIA_DATA_HUB_BASE_URL || "https://feeds.indiadatahub.com";
const key = () => ({ api_key: requireEnv("INDIA_DATA_HUB_API_KEY") });
const url = (p, q={}) => buildUrl(baseUrl, p, { ...q, ...key() });
async function ser(id){ const r=await fetchJson(url("/economy/data",{id,fields:"India"})); const d=r?.dataset?.[0]; const o={}; (d?.data||[]).forEach(x=>{o[+x.Date.slice(0,4)]=x.India;}); return {id,title:d?.Title,unit:d?.Unit,by:o}; }

const IDS={
  ret:{individual:"GFCFITRTOT11A",huf:"GFCFHTRTOT11A",firm:"GFCFFTRTOT11A",company:"GFCFCTRTOT11A",aop_boi:"GFCFATRTOT11A"},
  gti:{individual:"GFCFITITOT11A",huf:"GFCFHTITOT11A",firm:"GFCFFTITOT11A",company:"GFCFCTITOT11A",aop_boi:"GFCFATITOT11A"},
  persons:{filing_total:"GFCFPFRTOT11A",taxpayers_total:"GFCFNTPTOT11A",taxpayers_individual:"GFCFNTPIND11A"},
  collections:{gross_direct_tax:"GFCFGDTTOT11A",net_direct_tax:"GFCFNDIRTX11A",advance_tax_q:"GFDTADVTOT11Q"},
};
const out={_meta:{source:"IndiaDataHub feeds.indiadatahub.com /economy, category 'Government Finances'/'Direct Taxes', src Ministry of Finance",
  fetched:"see git", note:"counts: IDH year Y = AY Y/(Y+1). collections: IDH year Y = FY (Y-1)/Y. 'taxpayers' = CBDT broad def (filed-or-TDS), NOT positive-tax payers."}};
const ay=y=>`AY_${y}-${String((y+1)%100).padStart(2,'0')}`;
const fy=y=>`FY${y-1}-${String(y%100).padStart(2,'0')}`;

// returns + GTI by type, keyed by AY
out.returns_by_type={}; out.gti_by_type_cr={};
for (const [t,id] of Object.entries(IDS.ret)){ const s=await ser(id); for(const[y,v] of Object.entries(s.by)){const k=ay(+y);(out.returns_by_type[k]??={})[t]=v;} }
for (const [t,id] of Object.entries(IDS.gti)){ const s=await ser(id); for(const[y,v] of Object.entries(s.by)){const k=ay(+y);(out.gti_by_type_cr[k]??={})[t]=Math.round(v/1e7);} }
// persons by AY
out.persons={};
for (const [t,id] of Object.entries(IDS.persons)){ const s=await ser(id); for(const[y,v] of Object.entries(s.by)){const k=ay(+y);(out.persons[k]??={})[t]=v;} }
// collections by FY (₹ crore)
out.collections_cr={};
for (const [t,id] of Object.entries(IDS.collections)){ if(t.endsWith('_q')) continue; const s=await ser(id); for(const[y,v] of Object.entries(s.by)){const k=fy(+y);(out.collections_cr[k]??={})[t]=Math.round(v/1e7);} }
fs.writeFileSync("data/income-tax-return-statistics/idh-direct-taxes.json", JSON.stringify(out,null,1));
const ny=Object.keys(out.collections_cr).length;
console.log(`saved idh-direct-taxes.json — collections ${ny} FYs (${Object.keys(out.collections_cr).sort()[0]}..${Object.keys(out.collections_cr).sort().pop()}), returns_by_type ${Object.keys(out.returns_by_type).length} AYs, persons ${Object.keys(out.persons).length} AYs`);
