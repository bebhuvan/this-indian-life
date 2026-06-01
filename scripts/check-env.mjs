import { loadEnv } from "./env.mjs";

loadEnv();

const keys = [
  ["DEEPSEEK_API_KEY", "DeepSeek explanations"],
  ["INDIA_DATA_HUB_API_KEY", "India Data Hub feeds"],
  ["FRED_API_KEY", "FRED economic data"],
  ["EMBER_API_KEY", "Ember electricity data"],
  ["WAQI_API_KEY", "WAQI/AQICN air quality"],
  ["OPENAQ_API_KEY", "OpenAQ air quality"],
  ["CDSAPI_KEY", "Copernicus CDS"],
  ["UN_POPULATION_BEARER_TOKEN", "UN Population Data Portal"]
];

let missing = 0;

for (const [key, label] of keys) {
  const present = Boolean(process.env[key]);
  if (!present) missing += 1;
  console.log(`${present ? "ok" : "missing"} ${key} - ${label}`);
}

if (missing) {
  console.log(`${missing} optional key(s) are missing. Add them to .env when that adapter is needed.`);
}
