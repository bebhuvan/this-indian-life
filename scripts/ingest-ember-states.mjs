// Ember India sub-national (state-level) electricity data.
//
// NOTE: this is a DIFFERENT product from the country-level Ember v1 API that
// scripts/ingest-ember.mjs uses. The v1 API is country-only (no states). The
// state data is a flat long-format CSV on Ember's Google Cloud Storage CDN
// (files.ember-energy.org) — NOT behind the Cloudflare wall that blocks the
// main ember-energy.org site, so a plain fetch works.
//
// We snapshot the raw CSV bytes for provenance and write a parsed yearly JSON
// to data/snapshots/ember-states/ for derive-ember-states.mjs to consume.
import { mkdir, writeFile } from "node:fs/promises";
import { writeRawSnapshot } from "./core/artifacts.mjs";

const YEARLY_URL = "https://files.ember-energy.org/public-downloads/india_yearly_full_release_long_format.csv";
const MONTHLY_URL = "https://files.ember-energy.org/public-downloads/india_monthly_full_release_long_format.csv";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Minimal RFC-4180-ish CSV parser. The Ember file has at least one quoted field
// with an embedded comma ("Hydro, Bioenergy and Other Renewables"), so a naive
// split(",") corrupts that row — parse properly.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c === "\r") {
      // ignore; handled by \n
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toObjects(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.length === header.length && r.some((c) => c !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const text = await res.text();
  if (/^\s*<!doctype|<html/i.test(text)) throw new Error(`${url} -> got HTML (blocked?)`);
  return text;
}

async function main() {
  const fetchedAt = new Date().toISOString();
  await mkdir("data/snapshots/ember-states", { recursive: true });

  const yearlyText = await fetchText(YEARLY_URL);
  const monthlyText = await fetchText(MONTHLY_URL);

  const yearlySnap = await writeRawSnapshot("ember-states", "india_yearly_full_release_long_format", yearlyText, "csv");
  const monthlySnap = await writeRawSnapshot("ember-states", "india_monthly_full_release_long_format", monthlyText, "csv");

  const yearly = toObjects(parseCsv(yearlyText));
  const monthly = toObjects(parseCsv(monthlyText));

  await writeFile(
    "data/snapshots/ember-states/india_yearly.parsed.json",
    `${JSON.stringify({ fetchedAt, sourceUrl: YEARLY_URL, rawSnapshot: yearlySnap.path, rows: yearly }, null, 2)}\n`
  );

  const years = [...new Set(yearly.map((r) => Number(r.Year)))].sort((a, b) => a - b);
  const states = [...new Set(yearly.map((r) => r.State))];
  console.log(`Ember states: yearly ${yearly.length} rows (${years[0]}-${years.at(-1)}, ${states.length} state entries), monthly ${monthly.length} rows`);
  console.log(`Raw snapshots: ${yearlySnap.path} / ${monthlySnap.path}`);
  console.log(`Parsed yearly -> data/snapshots/ember-states/india_yearly.parsed.json`);
}

main().catch((err) => { console.error(err); process.exit(1); });
