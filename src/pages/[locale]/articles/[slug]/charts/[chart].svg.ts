import { locales } from "../../../../../data/site";
import { questionPages } from "../../../../../data/questions";
import { visualsForQuestion } from "../../../../../data/viz";
import { fileSafe } from "../../../../../data/chartDownloads";
import { renderChoroplethSvg } from "../../../../../data/chartSvg";

export function getStaticPaths() {
  return locales.flatMap((locale) =>
    questionPages.flatMap((page) => {
      const charts = new Map<string, string>();
      for (const visual of visualsForQuestion(page)) {
        if (visual.kind !== "choropleth") continue;
        const chart = fileSafe(visual.title);
        if (!charts.has(chart)) charts.set(chart, renderChoroplethSvg(visual));
      }
      return [...charts].map(([chart, svg]) => ({
        params: { locale, slug: page.slug, chart },
        props: { svg }
      }));
    })
  );
}

export function GET({ props }: { props: { svg: string } }) {
  return new Response(props.svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8"
    }
  });
}
