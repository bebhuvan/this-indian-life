// The site's own Open Graph card (home page and every page without its own), generated at
// build time into /og/site.png. The home page's monsoon record is the picture: every
// all-India monsoon since 1901 as one stripe, dry in haldi and wet in hara, from the same
// series and scale as the home page band, under the question the site asks.
import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SCALES, ramp, INK } from "../../data/almanac";
import { heroPoints, hero } from "../../data/almanac-home";
import { SITE } from "../../data/seo";

const fontDir = resolve(process.cwd(), "src/assets/og-fonts");
const newsreader400 = readFileSync(resolve(fontDir, "Newsreader-Display-400.ttf"));
const grotesk400 = readFileSync(resolve(fontDir, "SchibstedGrotesk-400.ttf"));
const grotesk600 = readFileSync(resolve(fontDir, "SchibstedGrotesk-600.ttf"));

const el = (style: Record<string, unknown>, children?: unknown) => ({
  type: "div",
  props: { style, ...(children === undefined ? {} : { children }) }
});

// The stripes as a bare mark (satori sets all text in the brand fonts). Placed by year, so
// a gap in the record stays a gap; El Nino deficient years are flagged beneath in sindoor,
// as on the home page.
function stripesUri(W: number, H: number) {
  const col = ramp(SCALES.rain);
  const y0 = heroPoints[0].year, y1 = heroPoints[heroPoints.length - 1].year, sw = W / (y1 - y0 + 1), bh = H - 14;
  let b = "";
  for (const p of heroPoints) {
    const x = (p.year - y0) * sw;
    b += `<rect x="${x.toFixed(2)}" y="0" width="${(sw + 0.6).toFixed(2)}" height="${bh}" fill="${col(p.value)}"/>`;
    if (p.flag) b += `<rect x="${(x + sw / 2 - 3).toFixed(2)}" y="${bh + 6}" width="6" height="6" fill="${INK.sindoor}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${b}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export const GET: APIRoute = async () => {
  const BW = 1032, BH = 206;
  const tree = el(
    { width: "1200px", height: "630px", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", fontFamily: "Schibsted Grotesk", color: INK.ink },
    [
      el({ width: "1200px", height: "10px", backgroundColor: INK.ink }),
      el({ display: "flex", flexDirection: "column", flexGrow: 1, padding: "44px 84px 40px 84px" }, [
        el({ display: "flex", justifyContent: "space-between", alignItems: "baseline" }, [
          el({ fontFamily: "Newsreader", fontSize: "38px", fontWeight: 400 }, SITE.name),
          el({ fontSize: "20px", color: INK.ink2 }, "thisindianlife.today")
        ]),
        el({ fontFamily: "Newsreader", fontSize: "100px", fontWeight: 400, lineHeight: 1, letterSpacing: "-2px", marginTop: "46px" }, "How does India live?"),
        // Not the site description: under "How does India live?" it would say "how India lives" twice.
        el({ fontSize: "25px", color: INK.ink2, marginTop: "18px" }, "Charts and plain-language explainers, every number sourced."),
        el({ display: "flex", flexDirection: "column", marginTop: "auto" }, [
          { type: "img", props: { src: stripesUri(BW, BH), width: BW, height: BH } },
          el({ display: "flex", justifyContent: "space-between", fontSize: "16px", color: "#737373", marginTop: "8px" }, [
            el({}, `Every monsoon since ${hero.first}, one stripe each: dry years ochre, wet years green, El Niño droughts since 1950 marked`),
            el({}, "IMD; NOAA")
          ])
        ])
      ])
    ]
  );
  const svg = await satori(tree as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Newsreader", data: newsreader400, weight: 400, style: "normal" },
      { name: "Schibsted Grotesk", data: grotesk400, weight: 400, style: "normal" },
      { name: "Schibsted Grotesk", data: grotesk600, weight: 600, style: "normal" }
    ]
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
};
