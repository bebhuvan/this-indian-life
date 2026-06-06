// World Bank cross-country battery for the "Why India stayed poor while Asia got rich"
// flagship (India vs China + the Asian tigers + later-wave peers). Dedicated namespace
// so it stays self-contained from the "How India Works"/trade compare lakes.
//
// One series artifact per (country, metric); indicatorId divergence.<metric>.<cc>,
// filename worldbank.divergence.<cc>.<CODE>. The renderer's multiLine path pulls one
// of these per country line, so each (metric × country) needs its own file.
//
// Metrics span the nine analytical angles of the "integrated East Asian model":
//   health · education · women/demography · capital & investment · structural
//   transformation/manufacturing · trade & sophistication · infrastructure/energy/
//   digital · innovation/state capacity · outcomes (income, poverty, productivity).
// History kept from 1960 so the divergence can be seen opening up over decades.
import { fetchJson } from "./lib/source-http.mjs";
import { createSeriesArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const fetchedAt = new Date().toISOString();

const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "CHN", name: "China" },
  { code: "KOR", name: "South Korea" },
  { code: "VNM", name: "Vietnam" },
  { code: "BGD", name: "Bangladesh" },
  { code: "IDN", name: "Indonesia" },
  { code: "THA", name: "Thailand" },
  { code: "MYS", name: "Malaysia" },
  { code: "PAK", name: "Pakistan" },
  { code: "SGP", name: "Singapore" },
  { code: "JPN", name: "Japan" },
  { code: "WLD", name: "World" }
];

// group is carried into metadata so charts/registry can filter by analytical angle.
const METRICS = [
  // — Human capital: health —
  { slug: "life_expectancy", code: "SP.DYN.LE00.IN", title: "Life expectancy at birth", unit: "years", group: "health" },
  { slug: "under5_mortality", code: "SH.DYN.MORT", title: "Under-five mortality", unit: "per 1,000 live births", group: "health" },
  { slug: "stunting", code: "SH.STA.STNT.ZS", title: "Child stunting", unit: "% of children under 5", group: "health" },
  { slug: "undernourishment", code: "SN.ITK.DEFC.ZS", title: "Undernourishment", unit: "% of population", group: "health" },
  { slug: "sanitation", code: "SH.STA.BASS.ZS", title: "Basic sanitation access", unit: "% of population", group: "health" },
  // — Human capital: education —
  { slug: "literacy", code: "SE.ADT.LITR.ZS", title: "Adult literacy", unit: "% of adults 15+", group: "education" },
  { slug: "literacy_female", code: "SE.ADT.LITR.FE.ZS", title: "Female adult literacy", unit: "% of women 15+", group: "education" },
  { slug: "primary_completion", code: "SE.PRM.CMPT.ZS", title: "Primary completion rate", unit: "% of relevant age group", group: "education" },
  { slug: "secondary_enroll", code: "SE.SEC.ENRR", title: "Secondary school enrolment", unit: "% gross", group: "education" },
  { slug: "tertiary_enroll", code: "SE.TER.ENRR", title: "Tertiary enrolment", unit: "% gross", group: "education" },
  // — Women & demography —
  { slug: "flfp", code: "SL.TLF.CACT.FE.ZS", title: "Female labour-force participation", unit: "% of women 15+", group: "women" },
  { slug: "lfp", code: "SL.TLF.CACT.ZS", title: "Labour-force participation", unit: "% of population 15+", group: "women" },
  { slug: "fertility", code: "SP.DYN.TFRT.IN", title: "Fertility rate", unit: "births per woman", group: "women" },
  { slug: "urban_share", code: "SP.URB.TOTL.IN.ZS", title: "Urban population", unit: "% of population", group: "demography" },
  { slug: "population", code: "SP.POP.TOTL", title: "Population", unit: "people", group: "demography" },
  // — Capital, investment & state capacity —
  { slug: "gfcf", code: "NE.GDI.FTOT.ZS", title: "Gross fixed capital formation", unit: "% of GDP", group: "capital" },
  { slug: "gross_savings", code: "NY.GNS.ICTR.ZS", title: "Gross savings", unit: "% of GDP", group: "capital" },
  { slug: "fdi_in", code: "BX.KLT.DINV.WD.GD.ZS", title: "Foreign direct investment, net inflows", unit: "% of GDP", group: "capital" },
  { slug: "credit_private", code: "FS.AST.PRVT.GD.ZS", title: "Domestic credit to private sector", unit: "% of GDP", group: "capital" },
  { slug: "tax_gdp", code: "GC.TAX.TOTL.GD.ZS", title: "Tax revenue", unit: "% of GDP", group: "state" },
  // — Structural transformation / manufacturing —
  { slug: "mfg_va", code: "NV.IND.MANF.ZS", title: "Manufacturing value added", unit: "% of GDP", group: "structure" },
  { slug: "industry_va", code: "NV.IND.TOTL.ZS", title: "Industry value added", unit: "% of GDP", group: "structure" },
  { slug: "services_va", code: "NV.SRV.TOTL.ZS", title: "Services value added", unit: "% of GDP", group: "structure" },
  { slug: "agri_va", code: "NV.AGR.TOTL.ZS", title: "Agriculture value added", unit: "% of GDP", group: "structure" },
  { slug: "emp_agriculture", code: "SL.AGR.EMPL.ZS", title: "Employment in agriculture", unit: "% of employment", group: "structure" },
  { slug: "emp_industry", code: "SL.IND.EMPL.ZS", title: "Employment in industry", unit: "% of employment", group: "structure" },
  // — Trade & sophistication —
  { slug: "exports_gdp", code: "NE.EXP.GNFS.ZS", title: "Exports of goods and services", unit: "% of GDP", group: "trade" },
  { slug: "manuf_exports_share", code: "TX.VAL.MANF.ZS.UN", title: "Manufactures exports", unit: "% of merchandise exports", group: "trade" },
  { slug: "hightech_exports_share", code: "TX.VAL.TECH.MF.ZS", title: "High-technology exports", unit: "% of manufactured exports", group: "trade" },
  // — Infrastructure, energy & digital —
  { slug: "electricity_access", code: "EG.ELC.ACCS.ZS", title: "Access to electricity", unit: "% of population", group: "infrastructure" },
  { slug: "electric_consumption_pc", code: "EG.USE.ELEC.KH.PC", title: "Electric power consumption per capita", unit: "kWh per capita", group: "infrastructure" },
  { slug: "internet_users", code: "IT.NET.USER.ZS", title: "Individuals using the internet", unit: "% of population", group: "infrastructure" },
  // — Innovation —
  { slug: "rnd_gdp", code: "GB.XPD.RSDV.GD.ZS", title: "Research & development expenditure", unit: "% of GDP", group: "innovation" },
  // — Agriculture productivity —
  { slug: "cereal_yield", code: "AG.YLD.CREL.KG", title: "Cereal yield", unit: "kg per hectare", group: "agriculture" },
  // — Outcomes: income, productivity, poverty —
  { slug: "gdp_pc_ppp", code: "NY.GDP.PCAP.PP.KD", title: "GDP per capita (PPP)", unit: "constant 2021 PPP $", group: "outcomes" },
  { slug: "productivity", code: "SL.GDP.PCAP.EM.KD", title: "GDP per person employed", unit: "constant 2021 PPP $", group: "outcomes" },
  { slug: "poverty_215", code: "SI.POV.DDAY", title: "Extreme poverty ($2.15/day)", unit: "% of population", group: "outcomes" }
];

const manifest = [];
const failures = [];

for (const metric of METRICS) {
  for (const country of COUNTRIES) {
    const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${metric.code}?format=json&per_page=20000`;
    try {
      const raw = await fetchJson(url, { headers: { "user-agent": "Mozilla/5.0" }, timeoutMs: 60000, retries: 3 });
      const rows = Array.isArray(raw?.[1]) ? raw[1] : [];
      const observations = rows
        .map((r) => ({ date: String(r.date), value: r.value == null ? null : Number(r.value) }))
        .filter((r) => r.date && r.date >= "1960")
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!observations.some((o) => Number.isFinite(o.value))) throw new Error("no finite observations");
      const indicatorId = `divergence.${metric.slug}.${country.code.toLowerCase()}`;
      const artifact = createSeriesArtifact({
        indicatorId,
        title: `${metric.title} — ${country.name}`,
        sourceId: "worldbank",
        sourceIndicatorId: metric.code,
        sourceUrl: url,
        unit: metric.unit,
        frequency: "annual",
        geography: { type: "country", id: country.code, name: country.name },
        fetchedAt,
        observations,
        metadata: { angle: metric.group, metric: metric.slug, country: country.name }
      });
      const path = await writeSeriesArtifact({ sourceId: "worldbank", name: `worldbank.divergence.${country.code.toLowerCase()}.${metric.code.replaceAll(".", "_")}`, artifact });
      await writeSnapshot("worldbank", `divergence.${country.code}.${metric.code}`, raw);
      const last = observations.filter((o) => Number.isFinite(o.value)).at(-1);
      manifest.push({ status: "ready", indicatorId, sourceIndicatorId: metric.code, artifact: path, observations: observations.length, latest: last?.date, fetchedAt });
      console.log(`divergence ${indicatorId} (${observations.length} obs, →${last?.date})`);
    } catch (error) {
      failures.push({ status: "failed", indicatorId: `divergence.${metric.slug}.${country.code.toLowerCase()}`, sourceIndicatorId: metric.code, fetchedAt, error: error.message });
      console.warn(`divergence ${metric.slug}.${country.code} failed: ${error.message}`);
    }
  }
}

await writeSourceManifest("worldbank-divergence", [...manifest, ...failures]);
console.log(`\nWrote ${manifest.length} divergence artifacts across ${COUNTRIES.length} countries × ${METRICS.length} metrics; ${failures.length} failure(s).`);
