import { writeFile } from "node:fs/promises";
import { discoverPpacHistoryDownloads, fetchPpacPage } from "./adapters/ppac.mjs";
import { writeRawSnapshot } from "./core/artifacts.mjs";

async function probeCandidate(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "Indica/0.1 data discovery"
      }
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get("content-type"),
      bytes: buffer.length,
      xlsxSignature: buffer.subarray(0, 4).equals(Buffer.from("504b0304", "hex"))
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message
    };
  }
}

const fetchedAt = new Date().toISOString();
const html = await fetchPpacPage("/import-export/history");
const htmlSnapshot = await writeRawSnapshot("ppac", "import-export-history", html, "html");
const discovery = discoverPpacHistoryDownloads(html);

for (const item of discovery.downloads) {
  item.directCandidateProbe = await probeCandidate(item.directCandidateUrl);
  item.pageDownloadProbe = await probeCandidate(item.pageDownloadUrl);
  item.accessStatus = item.directCandidateProbe.xlsxSignature || item.pageDownloadProbe.xlsxSignature
    ? "public_xlsx_candidate"
    : "login_gated_or_html_wrapped";
  item.evidenceEligible = item.accessStatus === "public_xlsx_candidate";
}

const artifact = {
  schemaVersion: 1,
  sourceId: "ppac",
  sourceName: "Petroleum Planning & Analysis Cell",
  pageUrl: discovery.pageUrl,
  pageUpdatedAt: discovery.updatedAt,
  fetchedAt,
  snapshot: htmlSnapshot.path,
  rawHash: htmlSnapshot.hash,
  downloads: discovery.downloads,
  qualityNotes: [
    "The history page exposes file names and report labels in data-url attributes.",
    "A file is not article evidence unless a direct candidate URL returns an XLSX ZIP signature.",
    "Login/download-modal HTML responses are catalogued as discovery only."
  ]
};

await writeFile("data/catalog/ppac-import-export-history-discovery.json", `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  ok: true,
  downloads: artifact.downloads.length,
  evidenceEligible: artifact.downloads.filter((item) => item.evidenceEligible).length,
  pageUpdatedAt: artifact.pageUpdatedAt,
  output: "data/catalog/ppac-import-export-history-discovery.json"
}, null, 2));
