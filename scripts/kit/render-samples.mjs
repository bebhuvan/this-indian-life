// Renders every gallery sample at phone, column and page widths to PNG, for checking by eye.
// Usage: node scripts/kit/render-samples.mjs [outDir] [--only=<id>]
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const out = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "/tmp/kit-samples";
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const WIDTHS = [360, 680, 1040];

const res = await build({
  stdin: { contents: `export { SAMPLES } from "./src/kit/samples/index.ts"; export { draw, renderSvg } from "./src/kit/index.ts";`, resolveDir: process.cwd(), loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  loader: { ".json": "json" },
});
const url = "data:text/javascript;base64," + Buffer.from(res.outputFiles[0].text).toString("base64");
const { SAMPLES, draw, renderSvg } = await import(url);

mkdirSync(out, { recursive: true });
const fonts = ["src/assets/og-fonts/SchibstedGrotesk-400.ttf", "src/assets/og-fonts/SchibstedGrotesk-600.ttf", "src/assets/og-fonts/Newsreader-Display-400.ttf"];
let failed = 0;
for (const s of SAMPLES) {
  if (only && s.id !== only) continue;
  for (const w of WIDTHS) {
    try {
      const scene = draw(s.spec, w);
      const svg = renderSvg(scene, { chrome: { title: s.title, dek: s.dek, source: s.source } });
      writeFileSync(`${out}/${s.id}.w${w}.svg`, svg);
      const png = new Resvg(svg, { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: "Schibsted Grotesk", serifFamily: "Newsreader" }, fitTo: { mode: "zoom", value: 1.5 } }).render().asPng();
      writeFileSync(`${out}/${s.id}.w${w}.png`, png);
      const offFrame = scene.marks.filter((m) => m.kind === "text" && (m.x < -1 || m.x > w + 1)).length;
      console.log(`${s.id} @${w}: ${scene.height}px tall, ${scene.marks.length} marks${offFrame ? `, ${offFrame} text anchors outside the frame` : ""}`);
    } catch (e) {
      failed++;
      console.log(`${s.id} @${w}: FAILED ${e.stack}`);
    }
  }
}
console.log(`wrote ${out}${failed ? `; ${failed} failures` : ""}`);
process.exit(failed ? 1 : 0);
