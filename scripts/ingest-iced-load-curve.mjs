// Ingest India's hourly electricity demand from NITI Aayog's India Climate & Energy
// Dashboard (ICED), original source Grid-India (NLDC). ICED serves every payload
// AES-encrypted (CryptoJS "Salted__"/OpenSSL aes-256-cbc, MD5 key derivation); the
// passphrase is shipped in the public web bundle as `environment.KEY`. We decrypt the
// public response client-side exactly as the dashboard's own browser code does, snapshot
// the decrypted JSON, and derive one artifact: the all-India annual PEAK demand (GW),
// 2017-2025 — the "demand keeps setting records" context for the duck-curve article.
//
// The full-year hourly series (8,760 points/yr) is snapshotted raw for reuse; the
// intraday typical-day duck itself is built from the Mendeley/Grid-India hourly
// demand+solar dataset (see ingest-mendeley-grid-demand.py) because ICED's generation
// side is daily-only.
//
//   node scripts/ingest-iced-load-curve.mjs
import crypto from "node:crypto";
import { writeSnapshot, writeSeriesArtifact, createTableArtifact } from "./core/artifacts.mjs";

const API = "https://icedapi.niti.gov.in/energy/electricity/distribution";
const PAGE = "https://iced.niti.gov.in/energy/electricity/distribution/national-level-consumption/load-curve";
const KEY = "AHten@VP0W3R"; // environment.KEY from ICED's public main.*.js bundle

function evpKDF(pass, salt) {
  let derived = Buffer.alloc(0), prev = Buffer.alloc(0);
  while (derived.length < 48) {
    prev = crypto.createHash("md5").update(Buffer.concat([prev, Buffer.from(pass), salt])).digest();
    derived = Buffer.concat([derived, prev]);
  }
  return { key: derived.subarray(0, 32), iv: derived.subarray(32, 48) };
}

function decrypt(b64) {
  const raw = Buffer.from(b64, "base64");
  if (raw.subarray(0, 8).toString() !== "Salted__") throw new Error("unexpected payload (no Salted__ header)");
  const { key, iv } = evpKDF(KEY, raw.subarray(8, 16));
  const dec = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return JSON.parse(Buffer.concat([dec.update(raw.subarray(16)), dec.final()]).toString("utf8"));
}

async function getDecrypted(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  let body = await res.text();
  if (body.startsWith('"') && body.endsWith('"')) body = JSON.parse(body);
  return decrypt(body);
}

async function main() {
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const yearly = await getDecrypted(`${API}/loadCurveYearly?year=${years.join(",")}`);
  await writeSnapshot("grid-india", "iced-loadCurveYearly-2017-2025", yearly);

  const peaks = [];
  for (const block of yearly) {
    if (!Array.isArray(block?.data) || !block.data.length) continue;
    let max = block.data[0];
    for (const row of block.data) if (row.v > max.v) max = row;
    peaks.push({ date: String(block.year), peak_gw: Math.round(max.v / 100) / 10, peak_at: max.d });
  }
  peaks.sort((a, b) => Number(a.date) - Number(b.date));

  const fetchedAt = new Date().toISOString();
  const annualPeak = createTableArtifact({
    indicatorId: "energy.griddemand.annual_peak",
    title: "India's all-India peak electricity demand",
    sourceId: "grid-india",
    sourceIndicatorId: "loadCurveYearly:annual_max",
    sourceUrl: PAGE,
    unit: "GW",
    frequency: "annual",
    fetchedAt,
    rows: peaks,
    dimensions: ["date", "peak_gw", "peak_at"],
    metadata: {
      note: "Annual maximum of the all-India hourly Demand Met series. Original source: Grid-India (NLDC), republished via NITI Aayog ICED.",
      originalSource: "Grid-India (National Load Despatch Centre)"
    }
  });
  const path = await writeSeriesArtifact({ sourceId: "grid-india", name: "grid-india.IN.demand.annual-peak", artifact: annualPeak });
  console.log(`wrote ${path}`);
  console.log(peaks.map((p) => `  ${p.date}: ${p.peak_gw} GW (${p.peak_at})`).join("\n"));
}

main().catch((err) => { console.error(err); process.exit(1); });
