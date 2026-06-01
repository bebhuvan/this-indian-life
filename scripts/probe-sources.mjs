import { loadEnv } from "./env.mjs";
import { fetchIndiaEconomyCategories } from "./adapters/indiadatahub.mjs";
import { fetchEmberDataset } from "./adapters/ember.mjs";
import { fetchOwidMetadata } from "./adapters/owid.mjs";
import { fetchWaqiCity } from "./adapters/waqi.mjs";
import { fetchCityEmissions } from "./adapters/dataportal-cities.mjs";
import { fetchWhoIndicatorForIndia } from "./adapters/who-gho.mjs";
import { fetchUnPopulationIndiaData, fetchUnPopulationLocation, fetchUnPopulationIndicators } from "./adapters/un-population.mjs";

loadEnv();

async function probe(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    console.log(JSON.stringify({ name, ok: true, ms: Date.now() - start, ...result }));
  } catch (error) {
    console.log(JSON.stringify({ name, ok: false, ms: Date.now() - start, error: String(error.message || error).slice(0, 220) }));
  }
}

async function requestPage(name, url) {
  await probe(name, async () => {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "Indica/0.1 source probe" }
    });
    const body = await response.text();
    return {
      status: response.status,
      type: response.headers.get("content-type"),
      bytes: body.length,
      finalUrl: response.url
    };
  });
}

await probe("World Bank Indicators API - India GDP", async () => {
  const response = await fetch("https://api.worldbank.org/v2/country/IN/indicator/NY.GDP.MKTP.CD?format=json&per_page=2");
  const json = await response.json();
  return { status: response.status, rows: Array.isArray(json?.[1]) ? json[1].length : 0, latest: json?.[1]?.[0]?.date };
});

await probe("India Data Hub - economy categories", async () => {
  const data = await fetchIndiaEconomyCategories();
  return { items: Array.isArray(data) ? data.length : Object.keys(data || {}).length };
});

await probe("Ember - India yearly electricity generation", async () => {
  const data = await fetchEmberDataset({ dataset: "electricity-generation", resolution: "yearly", entityCode: "IND", startDate: "2023" });
  return { items: Array.isArray(data?.data) ? data.data.length : Object.keys(data || {}).length };
});

await probe("OWID Grapher metadata - life expectancy", async () => {
  const data = await fetchOwidMetadata("life-expectancy");
  return { title: data?.chart?.title || data?.title || "metadata ok", columns: Object.keys(data?.columns || {}).length };
});

await probe("WAQI - Delhi feed", async () => {
  const data = await fetchWaqiCity("delhi");
  return { status: data?.status, city: data?.data?.city?.name, aqi: data?.data?.aqi };
});

await probe("Data Portal for Cities - sample emissions", async () => {
  const data = await fetchCityEmissions({ cityid: "2618424", scope: "total" });
  return { city: data?.city_name, country: data?.country_name, year: data?.year, sectors: Array.isArray(data?.data) ? data.data.length : 0 };
});

await probe("OECD SDMX - dataflow catalogue", async () => {
  const response = await fetch("https://sdmx.oecd.org/public/rest/dataflow/all", {
    headers: { accept: "application/vnd.sdmx.structure+xml", "accept-language": "en", "user-agent": "Indica/0.1 source probe" }
  });
  const body = await response.text();
  return { status: response.status, type: response.headers.get("content-type"), bytes: body.length };
});

await probe("WHO GHO - India life expectancy", async () => {
  const data = await fetchWhoIndicatorForIndia("WHOSIS_000001");
  return { rows: Array.isArray(data?.value) ? data.value.length : 0, firstYear: data?.value?.[0]?.TimeDim, firstValue: data?.value?.[0]?.NumericValue };
});

await probe("UN Population - India location metadata", async () => {
  const data = await fetchUnPopulationLocation(356);
  return { rows: Array.isArray(data) ? data.length : 0, name: data?.[0]?.name, iso3: data?.[0]?.iso3 };
});

await probe("UN Population - indicators metadata", async () => {
  const data = await fetchUnPopulationIndicators();
  return { total: data?.total, rows: Array.isArray(data?.data) ? data.data.length : 0 };
});

await probe("UN Population - India data endpoint", async () => {
  const data = await fetchUnPopulationIndiaData({ indicator: 46, start: 2020, end: 2025 });
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];
  return { rows: rows.length, firstKeys: rows[0] ? Object.keys(rows[0]).slice(0, 8).join(",") : "" };
});

await requestPage("Census India - data catalog page", "https://censusindia.gov.in/census.website/en/data");
await requestPage("Census India - population finder page", "https://censusindia.gov.in/census.website/en/data/population-finder");
await requestPage("NFHS official site", "https://www.nfhsiips.in/");
await requestPage("NFHS data.gov resource page", "https://www.data.gov.in/resource/all-india-and-stateut-wise-factsheets-national-family-health-survey-nfhs-5-2019-2021");
await requestPage("PLFS microdata catalog", "https://microdata.gov.in/NADA/index.php/catalog/PLFS");
await requestPage("HCES 2023-24 PIB release", "https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=2088390");
await requestPage("HCES 2023-24 final report PDF", "https://mospi.gov.in/sites/default/files/publication_reports/Final_Report_HCES_2023-24L.pdf");
await requestPage("UDISE+ API developer portal", "https://api.udiseplus.gov.in/");
await requestPage("AISHE official about survey", "https://aishe.gov.in/about-survey/");
await requestPage("NCRB data.gov ministry page", "https://up.data.gov.in/ministrydepartment/National%20Crime%20Records%20Bureau%20%28NCRB%29");
await requestPage("Jal Jeevan Mission Web API PDF", "https://ejalshakti.gov.in/webapi/Content/JJM_Web_API.pdf");
await requestPage("CEA API docs page", "https://cea.adgstaging.in/api-for-central-electricity-authority-data/?lang=en");
await requestPage("Agmarknet national portal page", "https://www.india.gov.in/category/agriculture-rural-environment/subcategory/agricultural-produce/details/website-of-agmarknet");
await requestPage("Data Portal for Cities API docs", "https://dataportalforcities.org/api");
