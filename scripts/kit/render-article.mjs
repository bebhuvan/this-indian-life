// Renders every kit chart on a served article page at 360 and 1040 px, as one PNG each.
// Usage: node scripts/kit/render-article.mjs <article-url> <outDir> <tag>
import { build } from "esbuild";
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
const [url, out, tag] = process.argv.slice(2);
const html = await (await fetch(url)).text();
const un = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const hosts = [...html.matchAll(/<div class="kit-host[^"]*" id="([^"]+)" data-kit="([^"]*)"[^>]*data-title="([^"]*)"/g)].map((m) => ({ id: m[1], spec: JSON.parse(un(m[2])), title: un(m[3]) }));
const r = await build({ stdin: { contents: `export { draw, renderSvg } from "./src/kit/index.ts";`, resolveDir: process.cwd(), loader: "ts" }, bundle: true, format: "esm", platform: "node", write: false });
const { draw, renderSvg } = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));
const fonts = ["src/assets/og-fonts/SchibstedGrotesk-400.ttf", "src/assets/og-fonts/SchibstedGrotesk-600.ttf", "src/assets/og-fonts/Newsreader-Display-400.ttf"];
for (const w of [360, 1040]) {
  let y = 0, parts = [], W = 0;
  hosts.forEach((h) => {
    const s = renderSvg(draw(h.spec, w), { chrome: { title: h.title } });
    const m = s.match(/width="([\d.]+)" height="([\d.]+)"/);
    parts.push(s.replace("<svg ", `<svg x="0" y="${y}" `)); y += +m[2] + 16; W = Math.max(W, +m[1]);
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}"><rect width="100%" height="100%" fill="#bbb"/>${parts.join("")}</svg>`;
  writeFileSync(`${out}/${tag}.w${w}.png`, new Resvg(svg, { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: "Schibsted Grotesk", serifFamily: "Newsreader" }, fitTo: { mode: "zoom", value: w === 360 ? 0.75 : 0.55 } }).render().asPng());
}
console.log(tag, hosts.length, "kit charts:", hosts.map((h) => h.spec.form).join(", "));
