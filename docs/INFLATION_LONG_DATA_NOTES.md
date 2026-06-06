# Long Inflation Data Notes

Last updated: 2026-06-06

## Decision

Use two complementary sources rather than forcing one source to do everything:

| Need | Source | Artifact | Coverage | Use |
| --- | --- | --- | --- | --- |
| Long annual headline inflation | World Bank `FP.CPI.TOTL.ZG`, spliced with full-year MoSPI monthly CPI when World Bank has not yet published the year | `data/series/worldbank.IN.prices.cpi.headline_annual_long.json` | 1960-2025 | Long article backbone and cumulative price-level charts |
| Annual World Bank source-only series | World Bank `FP.CPI.TOTL.ZG` | `data/series/worldbank.IN.prices.cpi.inflation_annual.json` | 1960-2024 | Source-pure annual CPI inflation line |
| Modern official monthly CPI | MoSPI / eSankhyiki CPI API and MCP | `data/series/mospi.IN.prices.cpi.combined.general.inflation.json` | 2012-2025 | Monthly inflation, recent volatility, official component detail |
| Modern food/component inflation | MoSPI / eSankhyiki CPI API and MCP | `data/series/mospi.IN.prices.cpi.combined.consumer_food_price.inflation.json` and related group/item artifacts | 2012-2025; item series mostly 2015-2025 | Food-price transmission and monsoon/crop analysis |
| Rural labour inflation supplement | MoSPI CPI-AL/RL via eSankhyiki MCP/API | Not yet promoted to repo artifact | 1999-2000 onward, plus 2025/2026 current-year monthly rows | Rural cost-of-living context, not the headline CPI backbone |

## Reproducible Command

```bash
npm run ingest:inflation-long
```

This runs `scripts/ingest-inflation-long-backbone.mjs`.

The script fetches World Bank CPI inflation live, snapshots the raw response, writes a source-only annual series, then appends only full calendar years from MoSPI monthly CPI inflation that are later than the latest finite World Bank year. As of this run, World Bank covers 1960-2024 and 2025 is spliced from the annual mean of MoSPI monthly CPI inflation.

## Current Outputs

- `data/series/worldbank.IN.prices.cpi.inflation_annual.json`
- `data/series/worldbank.IN.prices.cpi.headline_annual_long.json`
- `data/series/worldbank.IN.prices.cpi.price_level_since_1960.json`
- `data/series/worldbank.IN.prices.cpi.price_multiple_since_1960.json`
- `data/series/worldbank.IN.prices.cpi.purchasing_power_1960.json`
- `data/series/worldbank.IN.prices.cpi.decade_avg_inflation.json`
- `data/catalog/india-inflation-long-manifest.json`

Latest locked values in the derived long backbone:

- `1960-2025` annual inflation coverage.
- 2025 inflation: `2.23%`, from the annual mean of MoSPI monthly CPI YoY inflation.
- 2025 cumulative price multiple since 1960: `92.1x`.

## Source Notes

World Bank is the best current backbone for a single long annual consumer-inflation line back to 1960. It is not the source for modern component-level detail.

MoSPI is the canonical modern official source for CPI/CFPI group and item inflation. Use MoSPI artifacts for claims about current monthly inflation, food inflation, cereals, pulses, vegetables, oils, milk, and item-level prices.

The hosted MoSPI MCP server is available at `https://mcp.mospi.gov.in/`, and the server code is published at `https://github.com/nso-india/esankhyiki-mcp`. It is useful for metadata discovery and spot checks. The repo's direct MoSPI adapter remains better for reproducible bulk ingestion.
