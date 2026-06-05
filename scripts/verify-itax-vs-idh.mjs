import { loadEnv } from "./env.mjs";
import { buildUrl, fetchJson, requireEnv } from "./lib/source-http.mjs";
import fs from "fs";
loadEnv();
const base = process.env.INDIA_DATA_HUB_BASE_URL || "https://feeds.indiadatahub.com";
const key = () => ({ api_key: requireEnv("INDIA_DATA_HUB_API_KEY") });
const url = (p, q={}) => buildUrl(base, p, { ...q, ...key() });
async function ser(id){ const r=await fetchJson(url("/economy/data",{id,fields:"India"})); const d=r?.dataset?.[0]; const o={}; (d?.data||[]).forEach(x=>{o[+x.Date.slice(0,4)]=x.India;}); return o; }
const A = id => JSON.parse(fs.readFileSync(`data/series/${id.replaceAll('.','_')}.json`)).observations.reduce((m,p)=>(m[+p.date]=p.value,m),{});
const cmp = (a,b)=> a==null||b==null ? "—" : (Math.abs(a-b) < Math.max(1, Math.abs(b)*0.001) ? "✓" : `✗ Δ${(a-b).toLocaleString()}`);

// IDH pulls
const idh = {
  ind: await ser("GFCFITRTOT11A"), huf: await ser("GFCFHTRTOT11A"), firm: await ser("GFCFFTRTOT11A"),
  comp: await ser("GFCFCTRTOT11A"), aop: await ser("GFCFATRTOT11A"), others_pay: await ser("GFCFPFROTR11A"),
  net_dt: await ser("GFCFNDIRTX11A"), cen_tot_tax: await ser("GFCFNTOTTX11A"),
  gti_ind: await ser("GFCFITITOT11A"),
};

console.log("== 1) TOTAL RETURNS: our returns_total (AY) vs IDH sum-of-types (income year = AY-1) ==");
const rt = A("tax.itr.returns_total");
console.log("AYstart  ours        IDH(ind+huf+firm+comp+aop)  match");
for (const ay of Object.keys(rt).map(Number).sort()){
  const iy = ay; // IDH dates by income-year-end Mar(iy) = AY iy/(iy+1); our AY label uses start year = iy
  const idhsum = (idh.ind[iy]||0)+(idh.huf[iy]||0)+(idh.firm[iy]||0)+(idh.comp[iy]||0)+(idh.aop[iy]||0);
  console.log(`  ${ay}    ${String(rt[ay]).padStart(11)}   ${String(idhsum||"-").padStart(12)}   ${cmp(idhsum, rt[ay])}  (note: ours incl 'Others')`);
}
console.log("\n  individual-only exact check (ours not stored; IDH indiv):");
for (const iy of [2012,2018,2020,2021,2023]) console.log(`   AY${iy}-${(iy+1)%100}: IDH indiv ${idh.ind[iy]?.toLocaleString()}`);

console.log("\n== 2) COLLECTIONS: our (personal+corporate) (FY) vs IDH net direct tax (₹ crore) ==");
const per=A("tax.collect.personal"), cor=A("tax.collect.corporate");
console.log("FYstart  ours(pers+corp)  IDH net DT   match");
for (const fy of Object.keys(per).map(Number).sort()){
  const idhfy = fy+1; // IDH collections dated Mar(fy+1) = FY fy/(fy+1)
  const ours = (per[fy]||0)+(cor[fy]||0);
  const idhv = idh.net_dt[idhfy] ? Math.round(idh.net_dt[idhfy]/1e7) : null;
  console.log(`  ${fy}    ${String(ours).padStart(11)}   ${String(idhv||"-").padStart(10)}   ${idhv?cmp(ours, idhv- (idhv-ours>4000&&idhv-ours<6000?idhv-ours:0)):"—"}  (ours excl 'other' ~few k)`);
}

console.log("\n== 3) DIRECT SHARE: our extras (§1.3, central) vs IDH net_dt/central_total_tax ==");
const ex = JSON.parse(fs.readFileSync("data/income-tax-return-statistics/extras.json")).direct_vs_indirect;
console.log("FY       ours%   IDH%(net_dt/cen_tot)  ");
for (const k of Object.keys(ex).sort()){
  const fy = +k.replace("FY","").split("-")[0]; const idhfy=fy+1;
  const idhpct = idh.net_dt[idhfy]&&idh.cen_tot_tax[idhfy] ? (100*idh.net_dt[idhfy]/idh.cen_tot_tax[idhfy]) : null;
  console.log(`  ${k}  ${String(ex[k].direct_pct_of_total).padStart(6)}  ${idhpct?idhpct.toFixed(1):"-"}`);
}

console.log("\n== 4) COMPOSITION sanity: our salary/business/ltcg (AY) vs IDH individual GTI ==");
console.log("(IDH has GTI by type, not income-by-source; checking individual GTI scale only)");
const sal=A("tax.income.salary"), bus=A("tax.income.business");
for (const ay of [2018,2020,2023]) console.log(`  AY${ay}: our salary ${sal[ay]?.toLocaleString()} | our business(all types incl COMPANIES) ${bus[ay]?.toLocaleString()} | IDH indiv GTI ${idh.gti_ind[ay]?Math.round(idh.gti_ind[ay]/1e7).toLocaleString():"-"}`);
