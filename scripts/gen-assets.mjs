// Generates branding assets into public/: default OG image, favicons, app icons.
// Mark: a serif "i" whose tittle is a pink data-point (India / information / one number).
// Run: `node scripts/gen-assets.mjs`. Re-run if the mark or default OG copy changes.
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PUB = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const INK = "#0b0b0b";
const PINK = "#db5c97";
const COLORS = ["#db5c97", "#3a5bd0", "#15a382", "#efa227", "#ee6a4c"];

// The mark, authored in a 0..100 box. `fg` is the letterform colour; the dot stays pink.
const markInner = (fg) => `
  <rect x="46.3" y="34" width="7.4" height="39" rx="1.6" fill="${fg}"/>
  <rect x="40.5" y="34" width="19"  height="5"   rx="2.5" fill="${fg}"/>
  <rect x="38"   y="70" width="24"  height="5.4" rx="2.7" fill="${fg}"/>
  <circle cx="50" cy="23.5" r="6.2" fill="${PINK}"/>`;
const tile100 = (bg = INK, fg = "#fff") => `<rect width="100" height="100" rx="22" fill="${bg}"/>${markInner(fg)}`;
const tileSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${tile100()}</svg>`;
const render = (size) => sharp(Buffer.from(tileSvg(size))).png().toBuffer();

// Default 1200x630 OG card.
const ogBars = COLORS.map((c, i) => {
  const h = [70, 118, 168, 100, 140][i];
  return `<rect x="${980 + i * 30}" y="${500 - h}" width="17" height="${h}" rx="3.5" fill="${c}"/>`;
}).join("");
const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <g transform="translate(80,60) scale(0.52)">${tile100()}</g>
  <text x="156" y="103" font-family="'DejaVu Sans',sans-serif" font-size="26" font-weight="600"
        letter-spacing="6" fill="${INK}">THIS INDIAN LIFE</text>
  <text x="78" y="300" font-family="Georgia,'Times New Roman',serif" font-size="88" fill="${INK}">India, one number</text>
  <text x="78" y="392" font-family="Georgia,'Times New Roman',serif" font-size="88" fill="${INK}">at a time.</text>
  ${ogBars}
  <text x="80" y="560" font-family="'DejaVu Sans',sans-serif" font-size="24" fill="#5c5c5c">thisindianlife.today</text>
</svg>`;

// PNG-wrapped .ico (modern browsers read PNG payloads in ICO containers).
function pngToIco(png) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  const dir = Buffer.alloc(16);
  dir.writeUInt8(32, 0); dir.writeUInt8(32, 1); dir.writeUInt8(0, 2); dir.writeUInt8(0, 3);
  dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(png.length, 8); dir.writeUInt32LE(22, 12);
  return Buffer.concat([head, dir, png]);
}

await sharp(Buffer.from(og)).png().toFile(join(PUB, "og-default.png"));
await writeFile(join(PUB, "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${tile100()}</svg>`);
await writeFile(join(PUB, "apple-touch-icon.png"), await render(180));
await writeFile(join(PUB, "icon-192.png"), await render(192));
await writeFile(join(PUB, "icon-512.png"), await render(512));
await writeFile(join(PUB, "favicon.ico"), pngToIco(await render(32)));

await writeFile(join(PUB, "site.webmanifest"), JSON.stringify({
  name: "This Indian Life",
  short_name: "This Indian Life",
  description: "Sourced charts and plain-language explainers about how India lives.",
  start_url: "/en/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#0b0b0b",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/favicon.svg", type: "image/svg+xml", sizes: "any" }
  ]
}, null, 2));

console.log("Generated: og-default.png, favicon.svg, favicon.ico, apple-touch-icon.png, icon-192/512.png, site.webmanifest");
