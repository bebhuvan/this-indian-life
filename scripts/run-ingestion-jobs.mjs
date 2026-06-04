import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { readJson } from "./core/artifacts.mjs";

const CONFIG_PATH = "data/catalog/ingestion-jobs.json";

function parseArgs(argv) {
  const args = {
    group: null,
    jobs: [],
    dryRun: false,
    list: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--group") args.group = argv[++index];
    else if (arg === "--job") args.jobs.push(argv[++index]);
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--list") args.list = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function commandText(command) {
  return command.map((part) => /\s/.test(part) ? JSON.stringify(part) : part).join(" ");
}

function run(command) {
  return new Promise((resolve, reject) => {
    const [program, ...args] = command;
    const child = spawn(program, args, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${commandText(command)} exited with ${code}`));
    });
  });
}

function selectJobs(config, args) {
  const jobs = Array.isArray(config.jobs) ? config.jobs : [];
  if (args.jobs.length) {
    const wanted = new Set(args.jobs);
    return jobs.filter((job) => wanted.has(job.jobId));
  }
  if (args.group) {
    return jobs.filter((job) => Array.isArray(job.groups) && job.groups.includes(args.group));
  }
  throw new Error("Pass --group <group> or at least one --job <jobId>. Use --list to inspect jobs.");
}

function validateJobShape(job) {
  const required = ["jobId", "sourceId", "kind", "cadence", "groups", "command", "requiredEnv", "writes"];
  for (const field of required) {
    if (!(field in job)) throw new Error(`Job ${job.jobId || "<unknown>"} missing ${field}`);
  }
  if (!Array.isArray(job.command) || !job.command.length) throw new Error(`Job ${job.jobId} command must be a non-empty array`);
  if (!Array.isArray(job.requiredEnv)) throw new Error(`Job ${job.jobId} requiredEnv must be an array`);
  if (!Array.isArray(job.writes)) throw new Error(`Job ${job.jobId} writes must be an array`);
}

function validateEnv(job) {
  const missing = job.requiredEnv.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Job ${job.jobId} missing required env vars: ${missing.join(", ")}`);
}

async function validateWrites(job) {
  for (const path of job.writes) {
    if (!(await exists(path))) throw new Error(`Job ${job.jobId} did not write expected path: ${path}`);
  }
}

const args = parseArgs(process.argv.slice(2));
const config = await readJson(CONFIG_PATH);
if (config.schemaVersion !== 1) throw new Error(`${CONFIG_PATH} schemaVersion must be 1`);

for (const job of config.jobs || []) validateJobShape(job);

if (args.list) {
  const rows = (config.jobs || []).map((job) => ({
    jobId: job.jobId,
    kind: job.kind,
    sourceId: job.sourceId,
    cadence: job.cadence,
    groups: job.groups,
    requiredEnv: job.requiredEnv,
    command: commandText(job.command)
  }));
  console.log(JSON.stringify({ path: CONFIG_PATH, jobs: rows }, null, 2));
  process.exit(0);
}

const selected = selectJobs(config, args);
if (!selected.length) throw new Error(`No ingestion jobs selected for ${args.group ? `group ${args.group}` : args.jobs.join(", ")}`);

const startedAt = new Date().toISOString();
const completed = [];

for (const job of selected) {
  validateEnv(job);
  console.log(`\n[ingestion-job] ${job.jobId} (${job.kind}, ${job.cadence})`);
  console.log(`[ingestion-job] ${commandText(job.command)}`);
  if (!args.dryRun) {
    await run(job.command);
    await validateWrites(job);
  }
  completed.push(job.jobId);
}

console.log(JSON.stringify({
  ok: true,
  dryRun: args.dryRun,
  group: args.group,
  jobs: completed.length,
  completed,
  startedAt,
  finishedAt: new Date().toISOString()
}, null, 2));
