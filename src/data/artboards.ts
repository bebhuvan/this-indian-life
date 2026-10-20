// Artboards: every figure is drawn at a ladder of widths, and each card shows the drawing that
// best fits its own width (public/article-actions.js), so type in a chart is set in real pixels at
// any size.
//
// An SVG with a viewBox scales its text with its box. A chart drawn once at 1040 and shown in a
// 700-wide card set 12 px labels at 8 px; a 640 drawing stretched to 900 set them at 17. A card
// shows the widest drawing no wider than itself (4% grace), so type is never shrunk and, with
// the rungs a fifth apart, never enlarged by more than about a fifth: a 12 px label renders at
// 12 to 14 px. Two drawings ship in the page (the card's desktop width and the phone's); the
// rungs between are static JSON files ({ html }: the SVG, and for a line chart the key that goes
// with it), fetched when a card needs one.
//
// Card widths, measured: phones 316-386 (viewport less 44; 360-wide phones, the commonest in
// India, give 316), tablets 436-1000, desktops 1040 for a page-wide figure, 640 for a compact
// one, 508 for a half.

/** The ladder, about a fifth apart. 320 is the phone drawing; the others are fetched unless the
 *  card already carries a drawing within 6% of them. */
export const RUNGS = [320, 384, 460, 552, 660, 790, 940, 1040] as const;
/** Below this a figure is drawn in its phone layout (a key below, bare values, fewer ticks). */
export const PHONE_W = 480;
export const isPhoneW = (w: number) => w < PHONE_W;
/** The width the phone drawing is set at: a 360-wide phone's card, shown 1:1 there. */
export const PHONE_DRAW_W = 320;

/** A rung's drawings, collected during the build and written beside the page by the
 *  integration in astro.config.mjs (dist/articles/<slug>/charts/<file>@<w>.json). */
type Board = { w: number; path: string; svg: string };
const g = globalThis as unknown as { __indicaArtboards?: Map<string, string> };
export const artboardStore = () => (g.__indicaArtboards ??= new Map());

/** The rungs a card fetches: the ladder, less the widths already inline. */
export function fetchRungs(inline: number[]) {
  return RUNGS.filter((w) => !inline.some((i) => Math.abs(i - w) / w < 0.06));
}

/** Draw a figure at every rung it fetches and keep the drawings for the build. Returns the
 *  card's data attributes. In `astro dev` nothing is written, so the drawings are returned
 *  to be set inline in <template> elements instead. */
export function artboardsFor(base: string, file: string, inline: number[], draw: (w: number) => string, dev: boolean) {
  const rungs = fetchRungs(inline);
  const boards: Board[] = [];
  for (const w of rungs) {
    const svg = draw(w);
    if (!svg) continue;
    boards.push({ w, path: `${base.replace(/^\/+/, "")}/${file}@${w}.json`, svg });
  }
  if (!dev) for (const b of boards) artboardStore().set(b.path, b.svg);
  return {
    attrs: { "data-rungs": boards.map((b) => b.w).join(","), "data-rung-base": `${base}/${file}` },
    templates: dev ? boards.map((b) => ({ w: b.w, svg: b.svg })) : [],
  };
}
