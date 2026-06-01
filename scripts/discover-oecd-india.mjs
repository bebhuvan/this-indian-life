import { mkdir, writeFile } from "node:fs/promises";
import { fetchOecdDataflows, oecdUrl } from "./adapters/oecd.mjs";

const args = new Set(process.argv.slice(2));
const maxArg = process.argv.find((arg) => arg.startsWith("--limit="));
const delayArg = process.argv.find((arg) => arg.startsWith("--delay="));
const limit = maxArg ? Number(maxArg.split("=")[1]) : Infinity;
const delayMs = delayArg ? Number(delayArg.split("=")[1]) : 1250;
const fetchSamples = args.has("--samples");
const fetchedAt = new Date().toISOString();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, attempts = 4) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429 || attempt === attempts) return response;

    const retryAfter = Number(response.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delayMs * attempt * 4;
    console.warn(`OECD rate limit on ${url}; retrying in ${wait}ms`);
    await sleep(wait);
  }
}

function textBetween(xml, start, end) {
  const startIndex = xml.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = xml.indexOf(end, startIndex + start.length);
  if (endIndex === -1) return "";
  return xml.slice(startIndex + start.length, endIndex);
}

function attr(xml, name) {
  return xml.match(new RegExp(`${name}="([^"]+)"`))?.[1] || "";
}

function parseName(block) {
  return block.match(/<common:Name xml:lang="en">([\s\S]*?)<\/common:Name>/)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
}

function parseDescription(block) {
  return block.match(/<common:Description xml:lang="en">([\s\S]*?)<\/common:Description>/)?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
}

function parseDataflows(xml) {
  return [...xml.matchAll(/<structure:Dataflow\b[\s\S]*?<\/structure:Dataflow>/g)].map((match) => {
    const block = match[0];
    const dsdRef = block.match(/<Ref id="([^"]+)" version="([^"]+)" agencyID="([^"]+)" package="datastructure" class="DataStructure"/);
    return {
      id: attr(block, "id"),
      agencyId: attr(block, "agencyID"),
      version: attr(block, "version"),
      name: parseName(block),
      description: parseDescription(block),
      nonProduction: block.includes("<common:AnnotationType>NonProductionDataflow</common:AnnotationType>") && block.includes("<common:AnnotationText xml:lang=\"en\">true</common:AnnotationText>"),
      dsd: dsdRef ? {
        id: dsdRef[1],
        version: dsdRef[2],
        agencyId: dsdRef[3]
      } : null
    };
  }).filter((flow) => flow.agencyId?.startsWith("OECD") && flow.dsd);
}

async function fetchStructure(dsd) {
  const url = oecdUrl(`/public/rest/datastructure/${dsd.agencyId}/${dsd.id}/${dsd.version}`, {
    references: "none"
  });
  await sleep(delayMs);
  const response = await fetchWithRetry(url, {
    headers: {
      accept: "application/vnd.sdmx.structure+xml",
      "accept-language": "en",
      "user-agent": "Indica/0.1 OECD discovery"
    }
  });
  if (!response.ok) throw new Error(`DSD ${dsd.agencyId}/${dsd.id}/${dsd.version} failed ${response.status}`);
  return response.text();
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

function indiaDimension(dimensions) {
  const candidates = ["REF_AREA", "LOCATION", "COUNTRY", "COU", "REPORTER", "REPORTER_COUNTRY"];
  return dimensions.find((dimension) => candidates.includes(dimension.id));
}

function availabilityKey(dimensions, geoDimension) {
  return dimensions.map((dimension) => dimension.id === geoDimension.id ? "IND" : "*").join(".");
}

function dataKey(dimensions, geoDimension) {
  return dimensions.map((dimension) => dimension.id === geoDimension.id ? "IND" : "").join(".");
}

async function fetchAvailability(flow, dimensions, geoDimension) {
  const key = availabilityKey(dimensions, geoDimension);
  const url = oecdUrl(`/public/rest/v2/availability/dataflow/${flow.agencyId}/${flow.id}/${flow.version}/${key}`, {
    mode: "exact"
  });
  await sleep(delayMs);
  const response = await fetchWithRetry(url, {
    headers: {
      accept: "application/vnd.sdmx.structure+xml",
      "accept-language": "en",
      "user-agent": "Indica/0.1 OECD discovery"
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`availability failed ${response.status}: ${body.slice(0, 120)}`);
  const obsCount = Number(body.match(/<common:AnnotationTitle>(\d+)<\/common:AnnotationTitle>/)?.[1] || 0);
  const startPeriod = body.match(/<common:StartPeriod isInclusive="true">([^<]+)<\/common:StartPeriod>/)?.[1] || null;
  const endPeriod = body.match(/<common:EndPeriod isInclusive="true">([^<]+)<\/common:EndPeriod>/)?.[1] || null;
  return { obsCount, startPeriod, endPeriod, availabilityUrl: url.toString() };
}

async function fetchSample(flow, dimensions, geoDimension) {
  const key = dataKey(dimensions, geoDimension);
  const url = oecdUrl(`/public/rest/data/${flow.agencyId},${flow.id},${flow.version}/${key}`, {
    lastNObservations: 1,
    dimensionAtObservation: "AllDimensions",
    format: "csvfilewithlabels"
  });
  await sleep(delayMs);
  const response = await fetchWithRetry(url, {
    headers: {
      accept: "text/csv,*/*",
      "accept-language": "en",
      "user-agent": "Indica/0.1 OECD discovery"
    }
  });
  const body = await response.text();
  return {
    sampleStatus: response.status,
    sampleBytes: body.length,
    sampleHeader: body.split(/\r?\n/)[0] || "",
    sampleUrl: url.toString()
  };
}

await mkdir("data/catalog", { recursive: true });

const dataflowsXml = await fetchOecdDataflows();
const flows = parseDataflows(dataflowsXml).slice(0, limit);
const dsdCache = new Map();
const manifest = [];
const errors = [];

for (let index = 0; index < flows.length; index += 1) {
  const flow = flows[index];
  const dsdKey = `${flow.dsd.agencyId}/${flow.dsd.id}/${flow.dsd.version}`;

  try {
    let dimensions = dsdCache.get(dsdKey);
    if (!dimensions) {
      const structureXml = await fetchStructure(flow.dsd);
      dimensions = parseDimensions(structureXml);
      dsdCache.set(dsdKey, dimensions);
    }

    const geoDimension = indiaDimension(dimensions);
    if (!geoDimension) continue;

    const availability = await fetchAvailability(flow, dimensions, geoDimension);
    if (!availability.obsCount) continue;

    const item = {
      ...flow,
      dimensions: dimensions.map((dimension) => dimension.id),
      indiaDimension: geoDimension.id,
      indiaKey: dataKey(dimensions, geoDimension),
      fetchedAt,
      ...availability
    };

    if (fetchSamples) Object.assign(item, await fetchSample(flow, dimensions, geoDimension));
    manifest.push(item);
    console.log(`ok ${manifest.length}: ${flow.agencyId}/${flow.id}/${flow.version} ${availability.obsCount} obs`);
  } catch (error) {
    errors.push({
      id: flow.id,
      agencyId: flow.agencyId,
      version: flow.version,
      name: flow.name,
      error: String(error.message || error).slice(0, 300)
    });
    console.warn(`skip ${flow.agencyId}/${flow.id}/${flow.version}: ${String(error.message || error).slice(0, 120)}`);
  }
}

const output = {
  schemaVersion: 1,
  fetchedAt,
  source: "oecd",
  totalDataflowsChecked: flows.length,
  indiaDataflows: manifest.length,
  errors: errors.length,
  dataflows: manifest,
  errorDetails: errors
};

await writeFile("data/catalog/oecd-india-dataflows.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${manifest.length} India-available OECD dataflows to data/catalog/oecd-india-dataflows.json`);
