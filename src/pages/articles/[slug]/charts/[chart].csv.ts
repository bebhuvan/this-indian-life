import { questionPages } from "../../../../data/questions";
import { visualsForQuestion } from "../../../../data/viz";
import { fileSafe, payloadToCsv, visualPayload } from "../../../../data/chartDownloads";

export function getStaticPaths() {
  return questionPages.flatMap((page) => {
    const charts = new Map<string, string>();
    for (const visual of visualsForQuestion(page)) {
      const chart = fileSafe(visual.title);
      if (!charts.has(chart)) charts.set(chart, payloadToCsv(visualPayload(visual)));
    }
    return [...charts].map(([chart, csv]) => ({
      params: { slug: page.slug, chart },
      props: { csv }
    }));
  });
}

export function GET({ props }: { props: { csv: string } }) {
  return new Response(props.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8"
    }
  });
}
