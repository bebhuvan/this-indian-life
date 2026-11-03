// What the kit actually prints, as text: for every kit chart on the given served articles,
// its unit, caption, the bold values (end labels, bar values) and the first ticks. Money
// and big-number formats are wrong in ways a layout check cannot see ("₹3,57,13,886 crore",
// "1,450,935,791"); read this before moving articles onto the kit.
//   node scripts/kit/values.mjs <article-url> [...]
import { build } from "esbuild";
const r = await build({ stdin: { contents: `export { draw } from "./src/kit/index.ts";`, resolveDir: process.cwd(), loader: "ts" }, bundle: true, format: "esm", platform: "node", write: false });
const { draw } = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));
const un = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
for (const url of process.argv.slice(2)) {
  const html = await (await fetch(url)).text();
  console.log("\n## " + url.split("/")[4]);
  for (const m of html.matchAll(/<div class="kit-host[^"]*" id="([^"]+)" data-kit="([^"]*)"[^>]*data-title="([^"]*)"/g)) {
    const spec = JSON.parse(un(m[2])), sc = draw(spec, 1040);
    const vals = sc.marks.filter((k) => k.kind === "text" && (k.bold || k.role === "value")).map((k) => k.text).slice(0, 4);
    const ticks = sc.marks.filter((k) => k.kind === "text" && k.role === "axis").map((k) => k.text).slice(0, 3);
    console.log(`- ${un(m[3]).slice(0, 55)} | ${spec.form} unit=${spec.unit ?? "-"} cap=${spec.unitLabel ?? "-"} | ${vals.join(", ")} | ticks ${ticks.join(" ")}`);
  }
}
