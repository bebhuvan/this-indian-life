import { createTableArtifact, writeSeriesArtifact, writeSnapshot, writeSourceManifest } from "./core/artifacts.mjs";

const DMI_URL = "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/dmi.had.long.data";
const fetchedAt = new Date().toISOString();

const MONTHS = [
  ["01", "Jan"], ["02", "Feb"], ["03", "Mar"], ["04", "Apr"],
  ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Aug"],
  ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dec"]
];

function iodPhase(value) {
  if (value >= 0.4) return "Positive IOD";
  if (value <= -0.4) return "Negative IOD";
  return "Neutral";
}

function parseDmi(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows = [];

  for (const line of lines.slice(1)) {
    const parts = line.split(/\s+/);
    const year = Number(parts[0]);
    if (!Number.isFinite(year) || parts.length < 13) continue;
    for (let index = 0; index < 12; index += 1) {
      const value = Number(parts[index + 1]);
      if (!Number.isFinite(value) || value <= -90) continue;
      const [month, monthName] = MONTHS[index];
      rows.push({
        date: `${year}-${month}`,
        year,
        month: Number(month),
        month_name: monthName,
        dmi_anomaly_c: value,
        iod_phase: iodPhase(value)
      });
    }
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

try {
  const response = await fetch(DMI_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();
  const rows = parseDmi(text);
  if (!rows.length) throw new Error("No DMI rows parsed");

  const snapshot = await writeSnapshot("noaa-iod", "dmi.had.long.data", {
    sourceUrl: DMI_URL,
    text
  });

  const artifact = createTableArtifact({
    indicatorId: "climate.iod.dmi_monthly",
    title: "Dipole Mode Index, monthly",
    sourceId: "noaa-iod",
    sourceIndicatorId: "dmi.had.long.data",
    sourceUrl: DMI_URL,
    unit: "degrees C anomaly",
    geography: { type: "ocean-region-pair", id: "iod_west_minus_east_indian_ocean", name: "Western minus eastern equatorial Indian Ocean SST anomaly" },
    fetchedAt,
    rows,
    dimensions: Object.keys(rows[0] || {}),
    metadata: {
      note: "Monthly Dipole Mode Index from NOAA PSL. Phase labels here use simple +/-0.4 C thresholds for article screening, not official event declarations."
    }
  });

  const artifactPath = await writeSeriesArtifact({
    sourceId: "noaa-iod",
    name: "noaa-iod.global.dmi_monthly",
    artifact
  });

  await writeSourceManifest("noaa-iod", [{
    status: "ready",
    indicatorId: artifact.indicatorId,
    sourceIndicatorId: artifact.sourceIndicatorId,
    artifact: artifactPath,
    snapshot: snapshot.path,
    rawHash: snapshot.hash,
    rows: rows.length,
    earliest: rows[0]?.date,
    latest: rows.at(-1)?.date,
    fetchedAt
  }]);

  console.log(`noaa-iod DMI ${rows.length} rows (${rows[0]?.date} to ${rows.at(-1)?.date})`);
} catch (error) {
  await writeSourceManifest("noaa-iod", [{
    status: "failed",
    indicatorId: "climate.iod.dmi_monthly",
    sourceIndicatorId: "dmi.had.long.data",
    sourceUrl: DMI_URL,
    fetchedAt,
    error: error.message
  }]);
  throw error;
}
