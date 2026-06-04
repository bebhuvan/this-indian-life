import { readFileSync, writeFileSync } from "node:fs";

const inputs = [
  {
    file: "data/series/mospi.IN.plfs.status_self_employed.json",
    label: "Self-employed",
    note: "PLFS 2023-24, usual status, share of workers"
  },
  {
    file: "data/series/mospi.IN.plfs.status_casual.json",
    label: "Casual labour",
    note: "PLFS 2023-24, usual status, share of workers"
  },
  {
    file: "data/series/mospi.IN.plfs.status_regular_wage.json",
    label: "Regular wage/salaried",
    note: "PLFS 2023-24, usual status, share of workers"
  },
  {
    file: "data/series/ilostat.IN.SDG_0831.informal_rate_total.json",
    label: "Informal employment",
    note: "ILOSTAT SDG 8.3.1, total informal employment rate"
  },
  {
    file: "data/series/ilostat.IN.SDG_0831.informal_rate_agriculture.json",
    label: "Informal agriculture",
    note: "ILOSTAT SDG 8.3.1, informal employment rate in agriculture"
  }
];

function latest(observations = []) {
  return observations.filter((row) => row.value !== null && row.value !== undefined).at(-1);
}

const rows = inputs.map((input) => {
  const artifact = JSON.parse(readFileSync(input.file, "utf8"));
  const point = latest(artifact.observations);
  if (!point) throw new Error(`No latest point in ${input.file}`);
  return {
    label: input.label,
    value: Number(point.value.toFixed(1)),
    date: point.date,
    group: input.file.includes("ilostat") ? "Informality rate" : "Worker status",
    sourceId: artifact.sourceId,
    indicatorId: artifact.indicatorId,
    note: input.note
  };
});

const artifact = {
  artifactType: "table",
  indicatorId: "heat.work.worker_security_exposure",
  title: "Worker exposure and employment security",
  sourceId: "heat-work",
  sourceIndicatorId: "MoSPI PLFS 2023-24 worker status + ILOSTAT SDG 8.3.1 informality",
  sourceUrl: "https://api.mospi.gov.in/api/plfs/getData?indicator_code=4&frequency_code=1&Format=JSON",
  unit: "% of workers / employment",
  rows,
  metadata: {
    sourceUrls: [
      "https://api.mospi.gov.in/api/plfs/getData?indicator_code=4&frequency_code=1&Format=JSON",
      "https://ilostat.ilo.org/methods/concepts-and-definitions/description-informality/"
    ],
    method: "Combines latest PLFS worker-status shares with latest ILOSTAT informal-employment rates to contextualize heat exposure at work.",
    caveat: "PLFS worker status and ILOSTAT informality are different measures and years. Read each bar independently; do not add them."
  }
};

writeFileSync("data/series/heat-work.IN.worker_security_exposure.json", `${JSON.stringify(artifact, null, 2)}\n`);
console.log(`wrote heat work-security table: ${rows.length} rows`);
