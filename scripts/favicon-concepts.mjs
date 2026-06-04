// Favicon finalists. Renders each concept on a dark AND light tile, large + at true
// 16/32px, into favicon-lab/ so we judge elegance and small-size legibility.
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "favicon-lab");
await mkdir(OUT, { recursive: true });
const PINK = "#db5c97", BLUE = "#3a5bd0", GREEN = "#15a382", AMBER = "#efa227";

// mark(fg) draws light-or-dark strokes in fg; the dot stays accent on both tiles.
const concepts = {
  "A · serif i": (fg) => `
    <rect x="46.3" y="34" width="7.4" height="39" rx="1.6" fill="${fg}"/>
    <rect x="40.5" y="34" width="19" height="5" rx="2.5" fill="${fg}"/>
    <rect x="38" y="70" width="24" height="5.4" rx="2.7" fill="${fg}"/>
    <circle cx="50" cy="23.5" r="6.2" fill="${PINK}"/>`,
  "B · minimal i": (fg) => `
    <rect x="45" y="39" width="10" height="33" rx="5" fill="${fg}"/>
    <circle cx="50" cy="25" r="7.4" fill="${PINK}"/>`,
  "C · sparkline": (fg) => `
    <polyline points="25,66 42,55 56,61 73,35" fill="none" stroke="${fg}" stroke-width="6.2"
      stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="73" cy="35" r="6.5" fill="${PINK}"/>`,
  "D · i + axis": (fg) => `
    <rect x="45" y="38" width="10" height="30" rx="5" fill="${fg}"/>
    <circle cx="50" cy="24" r="7.2" fill="${PINK}"/>
    <rect x="28" y="73" width="44" height="4.6" rx="2.3" fill="${fg}" opacity="0.45"/>`,
  "E · rising bars": (fg) => `
    <rect x="33" y="52" width="9" height="20" rx="4.5" fill="${fg}" opacity="0.5"/>
    <rect x="45.5" y="44" width="9" height="28" rx="4.5" fill="${fg}" opacity="0.75"/>
    <rect x="58" y="36" width="9" height="36" rx="4.5" fill="${fg}"/>
    <circle cx="62.5" cy="25" r="6.2" fill="${PINK}"/>`
};

const tile = (inner, size, bg) =>
  `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>` +
  `<g transform="scale(${size / 100})">${inner}</g>`;
const doc = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`;
const DARK = "#0b0b0b", LIGHT = "#ffffff";

const names = Object.keys(concepts);
const cw = 230, rowY = 50, x0 = 30;
let s = `<rect width="${names.length * cw}" height="440" fill="#f2f2f0"/>`;
names.forEach((name, i) => {
  const x = i * cw + x0;
  const fnDark = concepts[name](LIGHT); // light mark on dark tile
  const fnLight = concepts[name](DARK); // dark mark on light tile
  s += `<g transform="translate(${x},${rowY})">${tile(fnDark, 120, DARK)}</g>`;
  s += `<g transform="translate(${x + 140},${rowY})">${tile(fnLight, 120, LIGHT)}</g>`;
  // true small sizes (dark tile)
  s += `<g transform="translate(${x},${rowY + 140})">${tile(fnDark, 32, DARK)}</g>`;
  s += `<g transform="translate(${x + 44},${rowY + 140 + 16})">${tile(fnDark, 16, DARK)}</g>`;
  s += `<text x="${x}" y="${rowY + 215}" font-family="'DejaVu Sans',sans-serif" font-size="18" fill="#111">${name}</text>`;
});
await sharp(Buffer.from(doc(names.length * cw, 440, s))).png().toFile(join(OUT, "_sheet.png"));

// also export each finalist as a standalone 512 dark tile
for (const name of names) {
  const slug = name.replace(/[^0-9a-z]+/gi, "-");
  await sharp(Buffer.from(doc(512, 512, tile(concepts[name](LIGHT), 512, DARK)))).png().toFile(join(OUT, `${slug}.png`));
}
console.log("wrote favicon-lab/_sheet.png +", names.length, "tiles");
