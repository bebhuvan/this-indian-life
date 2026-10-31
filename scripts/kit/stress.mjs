// Draws every gallery sample, and every kit chart on the given article URLs, at each width
// from 320 to 1040 px in 8 px steps. Fails on any exception or any text anchored outside
// the frame. Usage: node scripts/kit/stress.mjs [article-url ...]
import { build } from "esbuild";

const res = await build({
  stdin: { contents: `export { SAMPLES } from "./src/kit/samples/index.ts"; export { draw } from "./src/kit/index.ts";`, resolveDir: process.cwd(), loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { SAMPLES, draw } = await import("data:text/javascript;base64," + Buffer.from(res.outputFiles[0].text).toString("base64"));
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const sets = [["gallery", SAMPLES.map((s) => ({ id: s.id, spec: s.spec }))]];
for (const url of process.argv.slice(2)) {
  const html = await (await fetch(url)).text();
  sets.push([url, [...html.matchAll(/<div class="kit-host[^"]*" id="([^"]+)" data-kit="([^"]*)"/g)].map((m) => ({ id: m[1], spec: JSON.parse(unescape(m[2])) }))]);
}

let bad = 0;
for (const [name, charts] of sets) {
  let fails = 0, outside = 0;
  for (const c of charts)
    for (let w = 320; w <= 1040; w += 8) {
      try {
        const scene = draw(c.spec, w);
        if (scene.marks.some((m) => m.kind === "text" && (m.x < -1 || m.x > w + 1))) {
          outside++;
          if (outside <= 3) console.log(`  outside: ${c.id} @${w}`);
        }
      } catch (e) {
        fails++;
        if (fails <= 3) console.log(`  failed: ${c.id} @${w}: ${e.message}`);
      }
    }
  console.log(`${name}: ${charts.length} charts × 91 widths, ${fails} failures, ${outside} with text outside`);
  bad += fails + outside;
}
process.exit(bad ? 1 : 0);
