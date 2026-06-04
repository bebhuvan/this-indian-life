// Per-article Open Graph card — generated at build time into /og/articles/<slug>.png.
// Minimal by design: pure white, the question set in Cormorant as the hero, a single
// domain-coloured accent, a quiet wordmark and URL. No runtime — these are static PNGs,
// so they ship as plain assets on the Workers deploy.
import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { questionPages } from "../../../data/questions";
import { domains } from "../../../data/site";

export function getStaticPaths() {
  return questionPages.map((page) => ({ params: { slug: page.slug }, props: { page } }));
}

const fontDir = resolve(process.cwd(), "src/assets/og-fonts");
const cormorant500 = readFileSync(resolve(fontDir, "Cormorant-500.woff"));
const dmSans400 = readFileSync(resolve(fontDir, "DMSans-400.woff"));
const dmSans500 = readFileSync(resolve(fontDir, "DMSans-500.woff"));

const DOMAIN_INK: Record<string, string> = {
  people: "#DB5C97",
  economy: "#3A5BD0",
  energy: "#EFA227",
  climate: "#EE6A4C",
  health: "#15A382",
  society: "#7C5AD6"
};

const INK = "#0b0b0b";
const DIM = "#9a9a9a";

// Bigger type for short questions, smaller for long ones — keeps the card balanced.
function questionSize(text: string): number {
  const n = text.length;
  if (n <= 28) return 92;
  if (n <= 45) return 78;
  if (n <= 64) return 66;
  return 54;
}

// Minimal hyperscript helper so we can build the tree in a .ts file (no JSX).
const el = (style: Record<string, unknown>, children?: unknown) => ({
  type: "div",
  props: { style, ...(children === undefined ? {} : { children }) }
});

export const GET: APIRoute = async ({ props }) => {
  const page = (props as any).page;
  const ink = DOMAIN_INK[page.domain] ?? INK;
  const domainLabel = (domains.find((d) => d.id === page.domain)?.label ?? page.domain).toUpperCase();
  const question = page.question as string;

  const tree = el(
    {
      width: "1200px",
      height: "630px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: "#ffffff",
      padding: "78px 84px",
      fontFamily: "DM Sans"
    },
    [
      // top row: wordmark · domain
      el({ display: "flex", justifyContent: "space-between", alignItems: "center" }, [
        el({ fontSize: "23px", fontWeight: 500, letterSpacing: "6px", color: DIM }, "THIS INDIAN LIFE"),
        el({ display: "flex", alignItems: "center" }, [
          el({ width: "13px", height: "13px", borderRadius: "13px", backgroundColor: ink, marginRight: "13px" }),
          el({ fontSize: "20px", fontWeight: 500, letterSpacing: "3px", color: ink }, domainLabel)
        ])
      ]),

      // hero: accent bar + question
      el({ display: "flex", flexDirection: "column", justifyContent: "center", flexGrow: 1, paddingTop: "36px" }, [
        el({ width: "60px", height: "5px", borderRadius: "3px", backgroundColor: ink, marginBottom: "42px" }),
        el(
          {
            fontFamily: "Cormorant",
            fontWeight: 500,
            fontSize: `${questionSize(question)}px`,
            lineHeight: 1.04,
            letterSpacing: "-0.5px",
            color: INK,
            maxWidth: "1010px"
          },
          question
        )
      ]),

      // footer: url · tagline
      el({ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }, [
        el({ fontSize: "22px", fontWeight: 500, letterSpacing: "1px", color: ink }, "thisindianlife.today"),
        el({ fontSize: "20px", fontWeight: 400, letterSpacing: "0.5px", color: DIM }, "India, one number at a time")
      ])
    ]
  );

  const svg = await satori(tree as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Cormorant", data: cormorant500, weight: 500, style: "normal" },
      { name: "DM Sans", data: dmSans400, weight: 400, style: "normal" },
      { name: "DM Sans", data: dmSans500, weight: 500, style: "normal" }
    ]
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
};
