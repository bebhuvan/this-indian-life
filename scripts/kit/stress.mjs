// Draws every gallery sample, and every kit chart on the given article URLs, at each width
// from 320 to 1040 px in 8 px steps. Fails on any exception or any broken invariant
// (src/kit/check.ts): text over text, text outside the frame, text under 11 px, or text
// under 4.5:1 against the ground. Usage: node scripts/kit/stress.mjs [article-url ...] [--verbose]
import { build } from "esbuild";

const res = await build({
  stdin: { contents: `export { SAMPLES } from "./src/kit/samples/index.ts"; export { draw } from "./src/kit/index.ts"; export { checkScene } from "./src/kit/check.ts";`, resolveDir: process.cwd(), loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { SAMPLES, draw, checkScene } = await import("data:text/javascript;base64," + Buffer.from(res.outputFiles[0].text).toString("base64"));
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const sets = [["gallery", SAMPLES.map((s) => ({ id: s.id, spec: s.spec }))]];
const verbose = process.argv.includes("--verbose");
for (const url of process.argv.slice(2).filter((a) => !a.startsWith("--"))) {
  const html = await (await fetch(url)).text();
  sets.push([url, [...html.matchAll(/<div class="kit-host[^"]*" id="([^"]+)" data-kit="([^"]*)"/g)].map((m) => ({ id: m[1], spec: JSON.parse(unescape(m[2])) }))]);
}

let bad = 0;
for (const [name, charts] of sets) {
  let fails = 0;
  const kinds = { overlap: 0, outside: 0, small: 0, contrast: 0 }, seen = new Set();
  for (const c of charts)
    for (let w = 320; w <= 1040; w += 8) {
      try {
        for (const p of checkScene(draw(c.spec, w))) {
          kinds[p.kind]++;
          // One line per chart and kind and text, at the first width it appears.
          const key = `${c.id}|${p.kind}|${p.text}`;
          if (!seen.has(key) && (verbose || seen.size < 12)) console.log(`  ${p.kind}: ${c.id} @${w}: "${p.text}" ${p.detail}`);
          seen.add(key);
        }
      } catch (e) {
        fails++;
        if (fails <= 3) console.log(`  failed: ${c.id} @${w}: ${e.message}`);
      }
    }
  console.log(`${name}: ${charts.length} charts × 91 widths, ${fails} failures, ${kinds.overlap} overlaps, ${kinds.outside} outside, ${kinds.small} small, ${kinds.contrast} low contrast`);
  bad += fails + kinds.overlap + kinds.outside + kinds.small + kinds.contrast;
}
process.exit(bad ? 1 : 0);
