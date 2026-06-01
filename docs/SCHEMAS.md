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
  artifactType: "series";
  indicatorId: string;
  title: string;
  sourceId: string;
  sourceIndicatorId: string;
  sourceUrl: string;
  unit: string;
  frequency: "annual" | "quarterly" | "monthly" | "daily";
  geography: { type: string; id: string; name: string };
  fetchedAt: string;
  observations: Array<{ date: string; value: number | null }>;
};
```

## Table Artifact

Use this for multidimensional source data that should not be flattened too early: age-sex population tables, Ember source-level electricity rows, WHO rows with dimensions, and OWID Grapher exports.

```ts
type TableArtifact = {
  schemaVersion: 1;
  artifactType: "table";
  indicatorId: string;
  title: string;
  sourceId: string;
  sourceIndicatorId: string;
  sourceUrl: string;
  unit: string;
  geography: { type: string; id: string; name: string };
  fetchedAt: string;
  dimensions: string[];
  rows: Array<Record<string, unknown>>;
  metadata: Record<string, unknown>;
};
```

## Source Manifest

Each ingest writes `data/catalog/<source>-manifest.json`. The manifest is the audit index for the source run.

```ts
type SourceManifestEntry = {
  status: "ready" | "failed";
  indicatorId: string;
  sourceIndicatorId: string | number;
  artifact?: string;
  snapshot?: string;
  rawHash?: string;
  observations?: number;
  rows?: number;
  fetchedAt: string;
  error?: string;
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
  schemaVersion: 1;
  questionId: string;
  question: string;
  requiredIndicatorIds: string[];
  availableIndicatorIds: string[];
  lockedNumbers: Array<{
    label: string;
    value: number;
    date?: string;
    unit: string;
    sourceId: string;
    indicatorId: string;
  }>;
  sourceSummaries: Array<Record<string, unknown>>;
  caveats: string[];
  forbiddenClaims: string[];
};
```

The LLM receives only the evidence packet, source notes, register instructions, and style guide. It does not receive permission to invent new figures.

## Explanation Artifact

```ts
type ExplanationArtifact = {
  schemaVersion: 1;
  questionId: string;
  status: "ready" | "needs_data";
  short: {
    headline: string;
    dek: string;
    body: string;
  };
  article: {
    title: string;
    standfirst: string;
    bodyMarkdown: string;
  };
  sourceNotes: string[];
  caveats: string[];
  lockedNumbersUsed: string[];
  qualityFlags: string[];
  generatedAt: string;
  model: string;
  evidence: EvidencePacket;
};
```
