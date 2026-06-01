# Canonical Schemas

These are intentionally small. The goal is a stable contract between ingestion, chart rendering, explanations, and future R transforms.

## Source Registry

```ts
type Source = {
  id: string;
  name: string;
  owner: string;
  homepage: string;
  api?: string;
  license?: string;
  cadence: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "irregular";
  reliability: "official" | "multilateral" | "research" | "aggregator" | "commercial";
  notes?: string;
};
```

## Indicator

```ts
type Indicator = {
  id: string;
  sourceId: string;
  sourceIndicatorId: string;
  name: string;
  domain: "people" | "economy" | "energy" | "climate" | "health" | "society";
  unit: string;
  frequency: "daily" | "monthly" | "quarterly" | "annual";
  geography: "country" | "state" | "district" | "city" | "station" | "grid";
  dimensions: string[];
  license?: string;
  caveats: string[];
};
```

## Observation

```ts
type Observation = {
  indicatorId: string;
  date: string;
  value: number | null;
  unit: string;
  geography: {
    type: "country" | "state" | "district" | "city" | "station" | "grid";
    id: string;
    name: string;
  };
  dimensions?: Record<string, string>;
  source: {
    sourceId: string;
    fetchedAt: string;
    sourceUrl?: string;
    sourceRevision?: string;
  };
};
```

## Series Artifact

```ts
type SeriesArtifact = {
  schemaVersion: 1;
  indicatorId: string;
  title: string;
  sourceId: string;
  sourceUrl: string;
  unit: string;
  frequency: "annual" | "quarterly" | "monthly" | "daily";
  geography: { type: string; id: string; name: string };
  fetchedAt: string;
  observations: Array<{ date: string; value: number | null }>;
};
```

## Chart Record

```ts
type ChartRecord = {
  id: string;
  slug: string;
  domain: string;
  locale: string;
  title: string;
  dek: string;
  chartType: "line" | "area" | "bar" | "rank" | "stack";
  seriesPath: string;
  encoding: {
    x: "date";
    y: "value";
    unit: string;
    scale?: "linear" | "log";
  };
  display: {
    colorToken: string;
    valueFormat: "usd_trillion" | "usd" | "people_billion" | "years" | "percent" | "raw";
    yAxisFormat: string;
  };
  explanations: Record<"reading" | "plain" | "ground", string>;
  methodology: {
    sourceIds: string[];
    transformations: string[];
    caveats: string[];
  };
  aliases: string[];
};
```

## Explanation Evidence Packet

```ts
type EvidencePacket = {
  chartId: string;
  lockedNumbers: Array<{
    label: string;
    value: number;
    formatted: string;
    date?: string;
    sourceId: string;
  }>;
  trendFacts: string[];
  caveats: string[];
  forbiddenClaims: string[];
};
```

The LLM receives only the evidence packet, source notes, register instructions, and style guide. It does not receive permission to invent new figures.

