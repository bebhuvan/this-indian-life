// Per-article Open Graph card, generated at build time into /og/articles/<slug>.png.
// The Almanac's downloaded-figure look: a domain-colour rule, the subject as a
// grotesque kicker, the question in Newsreader, and beside it the article's own lead
// series drawn as a chart with its latest value. Static PNGs, shipped as assets.
import type { APIRoute } from "astro";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { questionPages } from "../../../data/questions";
import { domains } from "../../../data/site";
import { dataFileFor } from "../../../data/dataManifest";

export function getStaticPaths() {
  return questionPages.map((page) => ({ params: { slug: page.slug }, props: { page } }));
}

const fontDir = resolve(process.cwd(), "src/assets/og-fonts");
const newsreader400 = readFileSync(resolve(fontDir, "Newsreader-Display-400.ttf"));
const grotesk400 = readFileSync(resolve(fontDir, "SchibstedGrotesk-400.ttf"));
const grotesk600 = readFileSync(resolve(fontDir, "SchibstedGrotesk-600.ttf"));

// The named data inks each subject borrows (see the tokens in src/styles/indica.css).
const DOMAIN_INK: Record<string, string> = {
  people: "#c24a2e",
  economy: "#008a6e",
  energy: "#b98014",
  climate: "#1f6f8b",
  health: "#7b4790",
  society: "#33489a"
};

const INK = "#121212";
const MID = "#4f4f4f";
const RULE = "#dadada";

// Bigger type for short questions, smaller for long ones, so the card stays balanced.
function questionSize(text: string): number {
  const n = text.length;
  if (n <= 28) return 96;
  if (n <= 45) return 82;
  if (n <= 64) return 70;
  return 58;
}

// Minimal hyperscript helper so we can build the tree in a .ts file (no JSX).
const el = (style: Record<string, unknown>, children?: unknown) => ({
  type: "div",
  props: { style, ...(children === undefined ? {} : { children }) }
});

type Obs = { date: string; value: number | null };
type Lead = { points: Array<[number, number]>; unit: string; title: string };
// The article's lead series: the first charted indicator with a long yearly series,
// preferring a national one so the card's number speaks for India, not one state.
function leadSeries(page: any): Lead | null {
  const ids: string[] = [...new Set([
    ...(page.visualPlan ?? []).flatMap((e: any) => [e.indicator, ...(e.series ?? []).map((x: any) => x.indicator)]),
    ...(page.core ?? []), ...(page.indicators ?? [])
  ].filter(Boolean) as string[])];
  let fallback: Lead | null = null;
  for (const id of ids) {
    const meta = dataFileFor(id);
    if (!meta) continue;
    try {
      const art = JSON.parse(readFileSync(resolve(process.cwd(), "data/series", meta.file), "utf8"));
      const pts = ((art.observations ?? []) as Obs[])
        .filter((o) => o.value != null && /^\d{4}$/.test(String(o.date)))
        .map((o) => [Number(o.date), o.value as number] as [number, number]);
      if (pts.length < 8) continue;
      const lead = { points: pts.sort((x, y) => x[0] - y[0]), unit: String(art.unit ?? ""), title: String(art.title ?? "") };
      if (art.geography?.type === "country" && art.geography?.id === "IN") return lead;
      fallback ??= lead;
    } catch { /* unreadable artifact: try the next one */ }
  }
  return fallback;
}

// The series as a bare mark with no text (satori sets the text in the brand fonts).
// A series that crosses zero is drawn as columns up and down from a zero line; any
// other series as a line with a light wash. Returned as a data URI for an <img>.
function chartUri(points: Array<[number, number]>, ink: string, W = 440, H = 220) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), signed = Math.min(...ys) < 0;
  const lo = signed ? Math.min(...ys) * 1.06 : 0, hi = Math.max(...ys) * 1.06 || 1;
  const X = (v: number) => 8 + ((v - x0) / (x1 - x0 || 1)) * (W - 24), Y = (v: number) => H - 6 - ((v - lo) / (hi - lo || 1)) * (H - 20);
  let body: string;
  if (signed) {
    const bw = Math.max(1.5, (W - 24) / points.length - 1);
    body = points.map(([a, b]) => `<rect x="${(X(a) - bw / 2).toFixed(1)}" y="${Math.min(Y(b), Y(0)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.abs(Y(b) - Y(0)).toFixed(1)}" fill="${b < 0 ? ink : "#b3b3b3"}"/>`).join("") +
      `<line x1="0" y1="${Y(0).toFixed(1)}" x2="${W}" y2="${Y(0).toFixed(1)}" stroke="#121212" stroke-width="1.5"/>`;
  } else {
    const d = points.map(([a, b], i) => `${i ? "L" : "M"}${X(a).toFixed(1)} ${Y(b).toFixed(1)}`).join("");
    const last = points[points.length - 1];
    body = `<path d="${d}L${X(x1).toFixed(1)} ${H - 6}L${X(x0).toFixed(1)} ${H - 6}Z" fill="${ink}" fill-opacity="0.1"/>` +
      `<line x1="0" y1="${H - 6}" x2="${W}" y2="${H - 6}" stroke="#121212" stroke-width="1.5"/>` +
      `<path d="${d}" fill="none" stroke="${ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` +
      `<circle cx="${X(last[0]).toFixed(1)}" cy="${Y(last[1]).toFixed(1)}" r="8" fill="${ink}" stroke="#fff" stroke-width="3"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
  return { uri: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, signed };
}

const fmtValue = (v: number) => (Math.abs(v) >= 1e7 ? `${(v / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 })} cr` : Math.abs(v) >= 100 ? Math.round(v).toLocaleString("en-IN") : Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1));
const clip = (u: string, n: number) => (u.length > n ? `${u.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : u);

export const GET: APIRoute = async ({ props }) => {
  const page = (props as any).page;
  const ink = DOMAIN_INK[page.domain] ?? INK;
  const domainLabel = (domains.find((d) => d.id === page.domain)?.label ?? page.domain).toUpperCase();
  const question = page.question as string;

  const lead = leadSeries(page);
  const last = lead?.points[lead.points.length - 1];
  const first = lead?.points[0];
  const chart = lead ? chartUri(lead.points, ink) : null;
  const qSize = Math.round(questionSize(question) * (lead ? 0.82 : 1));

  const tree = el(
    { width: "1200px", height: "630px", display: "flex", flexDirection: "column", backgroundColor: "#ffffff", fontFamily: "Schibsted Grotesk" },
    [
      el({ width: "1200px", height: "10px", backgroundColor: ink }),
      el({ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, padding: "56px 72px 48px 84px" }, [
        el({ fontSize: "22px", fontWeight: 600, letterSpacing: "2px", color: ink }, domainLabel),
        el({ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }, [
          el(
            { fontFamily: "Newsreader", fontWeight: 400, fontSize: `${qSize}px`, lineHeight: 1.05, letterSpacing: "-1px", color: INK, maxWidth: lead ? "560px" : "1030px" },
            question
          ),
          lead && last && first && chart
            ? el({ display: "flex", flexDirection: "column", width: "440px" }, [
                el({ display: "flex", alignItems: "baseline", marginBottom: "4px" }, [
                  el({ fontSize: "64px", fontWeight: 600, letterSpacing: "-2px", color: ink, lineHeight: 1 }, `${chart.signed && last[1] > 0 ? "+" : ""}${fmtValue(last[1])}`),
                  el({ fontSize: "20px", color: MID, marginLeft: "14px" }, `in ${last[0]}`)
                ]),
                el({ fontSize: "18px", color: INK, fontWeight: 600 }, clip(lead.title, 44)),
                el({ fontSize: "17px", color: MID, marginBottom: "12px" }, clip(lead.unit, 44)),
                { type: "img", props: { src: chart.uri, width: 440, height: 220 } },
                el({ display: "flex", justifyContent: "space-between", fontSize: "16px", color: "#8a8a8a", marginTop: "8px" }, [el({}, String(first[0])), el({}, String(last[0]))])
              ])
            : el({ display: "none" })
        ]),
        el({ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `1.5px solid ${RULE}`, paddingTop: "20px" }, [
          el({ fontSize: "21px", fontWeight: 400, color: MID }, "thisindianlife.today"),
          el({ fontFamily: "Newsreader", fontSize: "34px", fontWeight: 400, color: INK }, "This Indian Life")
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

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
};
