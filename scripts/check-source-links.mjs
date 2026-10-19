// Re-verify the pinned source links by CONTENT, not status code.
//
//   node scripts/check-source-links.mjs                 every pinned entry
//   node scripts/check-source-links.mjs --question=q.id one question
//
// For each { label, url, check } in scripts/registry/source-notes.mjs (and any inline
// registry lists that carry a `check`), fetch the URL with a browser user agent and
// search the text for every check term. A 200 that lacks the term is a FAIL: that is
// how a wrong page gets caught (psl.noaa.gov's DMI path once served an AMO page).
//  - curl runs with -k because several Indian government hosts serve broken TLS chains
//    to command-line tools; browsers load them fine, so the link itself is not at fault.
//  - PDFs go through pdftotext, XLSX files through unzip, so the term is searched in
//    the document text rather than the raw bytes.
//  - Client-rendered pages (MoSPI, UNCTADstat, IHME and similar) show only a shell to
//    curl. If puppeteer-core and Chrome are available
//    (INDICA_CHROME=/usr/bin/google-chrome), such pages are re-checked in a headless
//    browser via document.body.innerText; otherwise they are reported as RENDER.
//    puppeteer-core is not a project dependency: install it anywhere outside the repo
//    (npm i puppeteer-core@23.11.1) and point INDICA_PUPPETEER_DIR at that directory.
//  - --file=path.json checks a draft { sourceNotes, furtherReading } list before it is
//    pinned, so new entries can be verified while they are being written.
//  - A few hosts refuse every automated client (SSRN, some news sites). Such an entry
//    may carry `manual: "<how and when it was checked by hand>"`; when the automated
//    check fails it is reported as MANUAL with that note instead of FAIL. Use it only
//    after a human-equivalent check of the page, and keep the reason specific.
// Exits 1 on any FAIL. Network-dependent, so it is a manual check, not part of build.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { v1Questions } from "./registry/v1-indicators.mjs";
import { pinnedReferences } from "./registry/source-notes.mjs";

const run = promisify(execFile);
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const only = process.argv.find((a) => a.startsWith("--question="))?.slice(11);
const draft = process.argv.find((a) => a.startsWith("--file="))?.slice(7);

async function fetchText(url) {
  const dir = await mkdtemp(join(tmpdir(), "indica-link-"));
  const out = join(dir, "body");
  try {
    const { stdout } = await run("curl", ["-sSL", "-k", "--compressed", "--max-time", "60", "-A", UA, "-o", out, "-w", "%{http_code}", url], { maxBuffer: 1 << 26 });
    // Some servers emit stray whitespace before the magic bytes (cgwb.gov.in's PDFs do).
    const head = (await readFile(out)).subarray(0, 64).toString("latin1").trimStart().slice(0, 5);
    if (head.startsWith("%PDF")) {
      await run("pdftotext", ["-q", out, out + ".txt"]).catch(() => {});
      return { code: stdout, text: existsSync(out + ".txt") ? await readFile(out + ".txt", "utf8") : "" };
    }
    if (head.startsWith("PK")) {
      const r = await run("unzip", ["-p", out], { maxBuffer: 1 << 28 }).catch((e) => ({ stdout: e.stdout || "" }));
      return { code: stdout, text: String(r.stdout).replace(/<[^>]+>/g, " ") };
    }
    return { code: stdout, text: await readFile(out, "utf8") };
  } catch (e) {
    return { code: "ERR", text: "" };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

let browser = null;
async function renderText(url) {
  const chrome = process.env.INDICA_CHROME;
  if (!chrome) return null;
  try {
    if (!browser) {
      const base = process.env.INDICA_PUPPETEER_DIR ? join(process.env.INDICA_PUPPETEER_DIR, "noop.js") : import.meta.url;
      const puppeteer = createRequire(base)("puppeteer-core");
      browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--ignore-certificate-errors"] });
    }
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(() => null);
    await new Promise((r) => setTimeout(r, 2500));
    const text = (await page.title().catch(() => "")) + "\n" + (await page.evaluate(() => document.body?.innerText || "").catch(() => ""));
    await page.close();
    return text;
  } catch {
    return null;
  }
}

const hits = (text, term) => text.toLowerCase().split(term.toLowerCase()).length - 1;

let fails = 0;
let checked = 0;
let manual = 0;
// Registry questions (with pinned lists attached), plus pinned lists for explanations
// that have no registry question: those are not built, but their JSON is still linked.
const targets = draft
  ? [{ id: draft, ...JSON.parse(await readFile(draft, "utf8")) }]
  : [...v1Questions, ...Object.entries(pinnedReferences).filter(([id]) => !v1Questions.some((q) => q.id === id)).map(([id, refs]) => ({ id, ...refs }))];
for (const q of targets) {
  if (only && q.id !== only) continue;
  for (const field of ["sourceNotes", "furtherReading"]) {
    for (const entry of q[field] || []) {
      if (typeof entry === "string" || !entry.url || entry.url.startsWith("/")) continue;
      const terms = [].concat(entry.check || []);
      if (!terms.length) { console.log(`SKIP  ${q.id} ${entry.url} (no check term)`); continue; }
      checked += 1;
      let { code, text } = await fetchText(entry.url);
      let counts = terms.map((t) => hits(text, t));
      let how = "curl";
      if (counts.some((n) => !n)) {
        const rendered = await renderText(entry.url);
        if (rendered !== null) { counts = terms.map((t) => hits(rendered, t)); how = "chrome"; }
        else how = "curl, RENDER needed";
      }
      const ok = counts.every((n) => n > 0);
      const status = ok ? "PASS" : entry.manual ? "MANUAL" : "FAIL";
      if (status === "FAIL") fails += 1;
      if (status === "MANUAL") manual += 1;
      console.log(`${status}  ${code} ${how}  ${q.id}  ${entry.url}  ${terms.map((t, i) => `${t}=${counts[i]}`).join("; ")}${status === "MANUAL" ? `  (${entry.manual})` : ""}`);
    }
  }
}
if (browser) await browser.close();
console.log(`${checked} link(s) checked, ${fails} failure(s), ${manual} manual.`);
process.exit(fails ? 1 : 0);
