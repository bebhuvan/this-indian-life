/* Generates maskable PWA icons from the brand "serif i" mark, using the same
   @resvg/resvg-js pipeline as the OG images. Maskable icons fill the whole
   canvas (launchers crop to a circle/squircle), so the mark is scaled to ~58%
   and centred to stay well inside the 80% safe zone.
   Run:  node scripts/build-pwa-icons.mjs   (or  npm run build:pwa-icons) */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PINK = '#db5c97';
const INK = '#0b0b0b';
const WHITE = '#ffffff';

// Brand mark (concept A · serif i) in a 100×100 space.
const mark = (fg) => `
  <rect x="46.3" y="34" width="7.4" height="39"  rx="1.6" fill="${fg}"/>
  <rect x="40.5" y="34" width="19"  height="5"   rx="2.5" fill="${fg}"/>
  <rect x="38"   y="70" width="24"  height="5.4" rx="2.7" fill="${fg}"/>
  <circle cx="50" cy="23.5" r="6.2" fill="${PINK}"/>`;

// Full-bleed dark canvas; mark scaled ×3.4 (→340/512 ≈ 66%) and centred.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${INK}"/>
  <g transform="translate(86,100) scale(3.4)">${mark(WHITE)}</g>
</svg>`;

for (const size of [192, 512]) {
  const png = new Resvg(maskable, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(join(PUBLIC, `maskable-${size}.png`), png);
  console.log(`wrote public/maskable-${size}.png`);
}
