// Two NHP 2023 time series the article otherwise lacks (real trends, not 2-point surveys):
//  - Medically-certified share of registered deaths, 1995-2020 (Table 1.3.3, RGI CRS/MCCD)
//  - Accidental deaths and suicides, 2011-2021 (Table 3.4.2, NCRB ADSI)
import { writeFile } from "node:fs/promises";
import { createSeriesArtifact, stableJson } from "./core/artifacts.mjs";

const SOURCE_URL =
  "https://cbhidghs.mohfw.gov.in/sites/default/files/NHP/NHP-2023-Last-Final.pdf";
const FETCHED_AT = new Date().toISOString();

// ---- Table 1.3.3: % of registered deaths that were medically certified ----
const CERT_YEARS = [1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020];
const CERT_PCT = [14.2, 13.8, 12.6, 14.9, 13.6, 14.5, 14.4, 12.8, 13.5, 14.2, 13.5, 16.6, 18.9, 19.3, 19.9, 20.2, 20, 20, 20.2, 20.5, 22, 19, 22, 21.1, 20.7, 22.5];

// ---- Table 3.4.2: accidental deaths & suicides, totals and by sex ----
const ADSI_YEARS = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];
const ACCIDENT_TOTAL = [390884, 394982, 400517, 451757, 413457, 418221, 396584, 411824, 421104, 374397, 397490];
const SUICIDE_TOTAL = [135585, 135445, 134799, 131666, 133623, 131008, 129887, 134516, 139123, 153052, 164033];
const SUICIDE_MALE = [87839, 88453, 90543, 89129, 91528, 88997, 89019, 92114, 97613, 108532, 118979];
const SUICIDE_FEMALE = [47746, 46992, 44256, 42521, 42088, 41997, 40852, 42391, 41493, 44498, 45026];

function obs(years, vals) {
  return years.map((y, i) => ({ date: String(y), value: vals[i] }));
}

async function write(artifact) {
  const file = `data/series/${artifact.sourceId === "crsmccd" ? "crsmccd" : "ncrb"}.IN.${artifact.indicatorId}.json`;
  await writeFile(file, `${stableJson(artifact)}\n`);
  return file;
}

async function main() {
  const written = [];

  written.push(
    await write(
      createSeriesArtifact({
        indicatorId: "health.crsmccd.medically_certified_pct",
        title: "Share of registered deaths that are medically certified",
        sourceId: "crsmccd",
        sourceIndicatorId: "medically_certified_pct",
        sourceUrl: SOURCE_URL,
        unit: "% of registered deaths",
        fetchedAt: FETCHED_AT,
        observations: obs(CERT_YEARS, CERT_PCT),
        metadata: {
          publisher: "Office of the Registrar General, India (Civil Registration System / MCCD)",
          sourceFile: "NHP-2023-Last-Final.pdf",
          sourceTable: "NHP 2023, Table 1.3.3: Growth in Medical Certification as a part of total registered deaths (1995-2020)",
          method:
            "Medical Certification of Cause of Death (MCCD) covers only a subset of registered deaths, skewed to hospital and urban deaths. A low share means most deaths have no doctor-assigned cause, which is why nationally representative cause data relies on the SRS verbal-autopsy survey and on modelled estimates.",
          caveat: "Coverage and the number of reporting states/UTs vary year to year."
        }
      })
    )
  );

  const adsiSeries = [
    ["health.ncrb.accidental_deaths_total", "Accidental deaths (all)", "accidental_deaths_total", ACCIDENT_TOTAL, "accidental deaths a year"],
    ["health.ncrb.suicides_total", "Suicides (all)", "suicides_total", SUICIDE_TOTAL, "suicides a year"],
    ["health.ncrb.suicides_male", "Suicides (men)", "suicides_male", SUICIDE_MALE, "male suicides a year"],
    ["health.ncrb.suicides_female", "Suicides (women)", "suicides_female", SUICIDE_FEMALE, "female suicides a year"]
  ];
  for (const [indicatorId, title, sourceIndicatorId, vals, unit] of adsiSeries) {
    written.push(
      await write(
        createSeriesArtifact({
          indicatorId,
          title,
          sourceId: "ncrb",
          sourceIndicatorId,
          sourceUrl: SOURCE_URL,
          unit,
          fetchedAt: FETCHED_AT,
          observations: obs(ADSI_YEARS, vals),
          metadata: {
            publisher: "National Crime Records Bureau, Accidental Deaths & Suicides in India (ADSI)",
            sourceFile: "NHP-2023-Last-Final.pdf",
            sourceTable: "NHP 2023, Table 3.4.2: Number of Accidental Deaths & Suicides in India during 2011 to 2021",
            method:
              "Police-reported counts (NCRB ADSI). Suicides are widely understood to be under-reported, so these are a floor, not a true total. Accidental deaths dipped in 2020 during the COVID lockdown.",
            caveat: "Counts, not rates; a growing population lifts totals even when risk is flat."
          }
        })
      )
    );
  }

  console.log(`wrote ${written.length} NHP vital-statistics series:`);
  written.forEach((f) => console.log("  " + f));
}

main();
