import { mkdir, writeFile } from "node:fs/promises";
import { oecdUrl } from "./adapters/oecd.mjs";

const [flowRef = "OECD.SDD.STES:DSD_STES@DF_CLI:4.1"] = process.argv.slice(2);
const [agencyId, flowId, version] = flowRef.split(":");

if (!agencyId || !flowId || !version) {
  throw new Error("Usage: node scripts/fetch-oecd-india-flow.mjs OECD.SDD.STES:DSD_STES@DF_CLI:4.1");
}

function attr(xml, name) {
  return xml.match(new RegExp(`${name}="([^"]+)"`))?.[1] || "";
}

function textBetween(xml, start, end) {
  const startIndex = xml.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = xml.indexOf(end, startIndex + start.length);
  if (endIndex === -1) return "";
  return xml.slice(startIndex + start.length, endIndex);
}

function parseDimensions(structureXml) {
  const list = textBetween(structureXml, '<structure:DimensionList id="DimensionDescriptor">', "</structure:DimensionList>");
  return [...list.matchAll(/<structure:(Dimension|TimeDimension)\b[\s\S]*?<\/structure:\1>/g)]
    .map((match, index) => ({
      id: attr(match[0], "id"),
      position: Number(attr(match[0], "position") || index + 1),
      time: match[1] === "TimeDimension"
    }))
    .filter((dimension) => dimension.id && !dimension.time)
    .sort((a, b) => a.position - b.position);
}

async function fetchText(url, accept = "*/*") {
  const response = await fetch(url, {
    headers: {
      accept,
      "accept-language": "en",
      "user-agent": "Indica/0.1 OECD ingest"
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`OECD request failed ${response.status}: ${body.slice(0, 200)}`);
  return body;
}

const structureXml = await fetchText(
  oecdUrl(`/public/rest/dataflow/${agencyId}/${flowId}/${version}`, { references: "all" }),
  "application/vnd.sdmx.structure+xml"
);
const dimensions = parseDimensions(structureXml);
const refArea = dimensions.find((dimension) => dimension.id === "REF_AREA");

if (!refArea) {
  throw new Error(`Flow ${flowRef} does not expose a REF_AREA dimension. Dimensions: ${dimensions.map((d) => d.id).join(", ")}`);
}

const key = dimensions.map((dimension) => dimension.id === "REF_AREA" ? "IND" : "").join(".");
const csv = await fetchText(
  oecdUrl(`/public/rest/data/${agencyId},${flowId},${version}/${key}`, {
    dimensionAtObservation: "AllDimensions",
    format: "csvfilewithlabels"
  }),
  "text/csv,*/*"
);

await mkdir("data/snapshots/oecd", { recursive: true });
const safeFlow = flowId.replace(/[^A-Za-z0-9_.@-]/g, "_");
const out = `data/snapshots/oecd/${agencyId}.${safeFlow}.${version}.IND.csv`;
await writeFile(out, csv);

const rows = csv.trim().split(/\r?\n/).length - 1;
console.log(`Wrote ${rows} India OECD rows to ${out}`);

