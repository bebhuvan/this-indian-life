import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { loadEnv } from "../env.mjs";
import { fetchText } from "../lib/source-http.mjs";

loadEnv();

// UNCTADstat bulk-download API. The Liner Shipping Connectivity Index (US.LSCI)
// is served only as a 7-zip-compressed CSV; there is no JSON/SDMX observation
// endpoint. We extract with python3 + py7zr (available in this environment).
// Use GET (the host's Cloudflare blocks HEAD). India = M49 356.
const baseUrl = process.env.UNCTAD_API_BASE_URL || "https://unctadstat-api.unctad.org";

export async function fetchUnctadLsciCsv() {
  const url = `${baseUrl}/bulkdownload/US.LSCI/US_LSCI`;
  const res = await fetch(url, { headers: { "user-agent": "Indica/0.1 data ingest" } });
  if (!res.ok) throw new Error(`UNCTAD LSCI fetch failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dir = await mkdtemp(join(tmpdir(), "unctad-lsci-"));
  const archive = join(dir, "US_LSCI.7z");
  await writeFile(archive, buf);
  try {
    execFileSync("python3", ["-c", `import py7zr,sys; py7zr.SevenZipFile(${JSON.stringify(archive)},'r').extractall(${JSON.stringify(dir)})`], { stdio: "pipe" });
    const csv = await readFile(join(dir, "US_LSCI.csv"), "utf8");
    return { csv, url };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// Quarter code "2006Q01" -> mid/end-of-quarter month "2006-03" for time-axis sorting.
export function quarterToDate(q) {
  const m = String(q).match(/^(\d{4})Q0?(\d)$/);
  if (!m) return null;
  return `${m[1]}-${String(Number(m[2]) * 3).padStart(2, "0")}`;
}

// Parse the LSCI CSV. Columns: Quarter,"Quarter Label",Economy,"Economy Label",Index,...
export function parseLsci(csv) {
  return csv.split(/\r?\n/).slice(1).map((line) => {
    const m = line.match(/^([^,]+),"[^"]*",(\d+),"([^"]*)",([^,]*)/);
    if (!m) return null;
    return { quarter: m[1], economy: m[2], label: m[3], index: m[4] === "" ? null : Number(m[4]) };
  }).filter((r) => r && r.index !== null && Number.isFinite(r.index));
}
