// Round 2 extras: Indonesia CPI (calm EM peer for the comparison, replacing Brazil's
// hyperinflation outlier) + IDH bank lending rate (repo->EMI transmission companion).
import { fetchIndiaEconomySeries } from "./adapters/indiadatahub.mjs";
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";
const fetchedAt = new Date().toISOString();
const man = [];
async function write(o){ const c=o.observations.filter(x=>x.value!=null&&Number.isFinite(x.value)); if(c.length<2){console.warn("skip",o.indicatorId);return;}
  const a=createSeriesArtifact({...o,observations:c,geography:{type:"country",id:"IND",name:"India"},fetchedAt});
  const p=await writeSeriesArtifact({sourceId:o.sourceId,name:`${o.sourceId}.IN.${o.indicatorId}`,artifact:a});
  man.push({status:"ready",indicatorId:o.indicatorId,observations:c.length,artifact:p,fetchedAt,latest:c.at(-1)});}

// Indonesia CPI inflation (World Bank)
const raw = await fetchJson("https://api.worldbank.org/v2/country/IDN/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20000");
await writeSnapshot("world-context","wb_cpi_idn",raw);
const obs=(raw[1]||[]).filter(r=>r.value!=null).map(r=>({date:String(r.date),value:Number(r.value)})).sort((a,b)=>a.date.localeCompare(b.date));
await write({indicatorId:"compare.cpi_inflation.idn",title:"CPI inflation — Indonesia",unit:"% per year",frequency:"annual",sourceId:"world-context",sourceUrl:"https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG",sourceIndicatorId:"FP.CPI.TOTL.ZG.IDN",observations:obs,metadata:{sourceCategory:"Inflation",country:"IDN"}});
console.log("idn cpi:",obs.length,"points");

// IDH lending rate (SCB WALR on outstanding loans, monthly)
const idhUrl="https://feeds.indiadatahub.com/documentation?urls.primaryName=Economic%20Monitor";
const lr=await fetchIndiaEconomySeries({id:"MOIRCBOALR11M",fields:"India"});
await writeSnapshot("indiadatahub","MOIRCBOALR11M",lr);
const ds=Array.isArray(lr?.dataset)?lr.dataset[0]:null; const rows=Array.isArray(ds?.data)?ds.data:[];
const lobs=rows.map(r=>({date:String(r.Date||r.date||"").slice(0,7),value:r.India==null?null:Number(r.India)})).filter(r=>r.date&&r.value!=null).sort((a,b)=>a.date.localeCompare(b.date));
await write({indicatorId:"prices.lending_rate",title:"Bank lending rate (SCB weighted average, outstanding)",unit:"% per year",frequency:"monthly",sourceId:"indiadatahub",sourceUrl:idhUrl,sourceIndicatorId:"MOIRCBOALR11M",observations:lobs,metadata:{sourceCategory:"Interest Rates",sourceSubcategory:"Lending Rates"}});
console.log("lending rate:",lobs.length,"points",lobs[0]?.date,"->",lobs.at(-1)?.date+"="+lobs.at(-1)?.value);

await writeSourceManifest("india-inflation-extras2",man);
console.log("wrote",man.length,"series");
