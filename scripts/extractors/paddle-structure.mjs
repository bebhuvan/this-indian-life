import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { sourceSlug } from "../core/artifacts.mjs";

const defaultAksharaDir = process.env.AKSHARA_PADDLE_DIR || "/home/bhuvanesh.r/Documents/Akshara/Paddle";
const defaultTimeoutMs = Number(process.env.AKSHARA_TIMEOUT_MS || "120000");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function firstJsonFile(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const file = entries.find((entry) => entry.isFile() && entry.name.endsWith("_page_0000.json"));
  if (!file) throw new Error(`No Paddle structure raw page JSON found in ${dir}`);
  return `${dir}/${file.name}`;
}

export async function runPaddleStructurePage({
  pdfPath,
  page = 1,
  dpi = 180,
  outputRoot = "data/extracted/paddle-structure",
  aksharaDir = defaultAksharaDir,
  timeoutMs = defaultTimeoutMs,
  reuseExisting = true
}) {
  const runId = `${sourceSlug(basename(pdfPath))}.page-${String(page).padStart(2, "0")}.r${dpi}`;
  const outputDir = `${outputRoot}/${runId}`;
  const imageStem = `${outputDir}/page-${String(page).padStart(2, "0")}`;
  const imagePath = `${imageStem}.png`;
  const absolutePdfPath = resolve(pdfPath);
  const absoluteImageStem = resolve(imageStem);
  const absoluteImagePath = resolve(imagePath);
  const absoluteAksharaOutput = resolve(`${outputDir}/akshara`);
  await mkdir(outputDir, { recursive: true });

  if (!reuseExisting || !(await exists(imagePath))) {
    execFileSync("pdftoppm", ["-r", String(dpi), "-f", String(page), "-l", String(page), "-singlefile", "-png", absolutePdfPath, absoluteImageStem], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000
    });
  }

  let rawJsonPath = "";
  if (reuseExisting && await exists(`${outputDir}/akshara/_raw`)) {
    try {
      rawJsonPath = await firstJsonFile(`${outputDir}/akshara/_raw`);
    } catch {
      rawJsonPath = "";
    }
  }

  if (!rawJsonPath) {
    execFileSync("bash", [
      "-lc",
      [
        "set -euo pipefail",
        "[ -f .env ] && set -a && source .env && set +a",
        ".venv/bin/python -m akshara \"$1\" -o \"$2\" --model structure-v3 --no-dewarp --no-orient --no-chart --no-combine"
      ].join("\n"),
      "akshara-runner",
      absoluteImagePath,
      absoluteAksharaOutput
    ], {
      cwd: aksharaDir,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: timeoutMs
    });
    rawJsonPath = await firstJsonFile(`${outputDir}/akshara/_raw`);
  }

  const rawJsonText = await readFile(rawJsonPath, "utf8");
  const raw = JSON.parse(rawJsonText);
  const rawHash = createHash("sha256").update(rawJsonText).digest("hex");
  const blocks = raw?.prunedResult?.parsing_res_list || [];

  return {
    method: "paddle_structure_v3",
    model: "structure-v3",
    page,
    dpi,
    outputDir,
    imagePath,
    rawJsonPath,
    rawHash,
    raw,
    blocks
  };
}
