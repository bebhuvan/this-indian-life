# Source Probe Results

Probe date: 2026-06-01.

This is a connectivity check, not a full data-quality audit. Results can be reproduced with:

```bash
npm run probe:sources
```

## API-ready

| Source | Probe | Result |
| --- | --- | --- |
| World Bank Indicators | `country/IN/indicator/NY.GDP.MKTP.CD` | JSON returned successfully. |
| India Data Hub | `/economy/category_list` | Authenticated request returned 31 category items. |
| Ember | `/electricity-generation/yearly?entity_code=IND` | Authenticated request returned India electricity rows. |
| OWID Grapher | `/grapher/life-expectancy.metadata.json` | Metadata JSON returned successfully. |
| WAQI | `/feed/delhi` | Authenticated request returned Delhi AQI payload. |
| Data Portal for Cities | `/api/emissions?cityid=2618424&scope=total` | JSON returned for Copenhagen sample city. Indian city IDs still need lookup/request. |
| OECD SDMX | `/public/rest/dataflow/all`; targeted CLI dataflow | Dataflow catalogue XML returned successfully. Targeted India dataflow fetch wrote 5,956 OECD rows. |
| WHO GHO | `/api/WHOSIS_000001?$filter=SpatialDim eq 'IND'` | OData JSON returned India life expectancy records successfully. |
| UN Population | `/api/v1/locations/356`, `/api/v1/Indicators`, protected `/api/v1/data/...` | Metadata endpoints are public. Protected India data endpoint works with local bearer token and wrote 2,394 rows for indicator 46. |

## Downloadable or page-backed

| Source | Probe | Result |
| --- | --- | --- |
| Census India | Data catalog and Population Finder | Reachable by curl; Node fetch had TLS/network issues. Treat as downloadable/page-backed first. |
| NFHS | data.gov resource page | Reachable. Official NFHS site redirected to an error page from this environment; use data.gov/IIPS downloads as primary path. |
| PLFS | MoSPI microdata catalog | Reachable HTML catalog. Unit files need dataset-specific handling. |
| HCES | PIB release and MoSPI PDF | Reachable; final report PDF downloaded. Needs PDF/table extraction or microdata workflow. |
| AISHE | Official survey page | Reachable HTML/report source. Needs report/table extraction unless a data endpoint is found. |
| NCRB | data.gov ministry page | Reachable HTML catalog. Needs resource-specific extraction and careful caveats. |
| Jal Jeevan Mission | Web API PDF | Reachable PDF. Needs endpoint extraction from the PDF before adapter work. |
| CEA | API docs page | Reachable. Needs endpoint enumeration from the docs page. |
| Agmarknet | National Portal page | Reachable. Need direct Agmarknet endpoint discovery. |

## Blocked or needs follow-up

| Source | Issue |
| --- | --- |
| UDISE+ API | Root and common Swagger paths returned 404. The developer portal exists in search results, but public endpoint discovery needs more work or credentials. |
| CGWB | Timed out from this environment. Retry from another network and/or use India-WRIS/secondary official links. |
| Agriculture Census official link | The `agricorpgov.org` host did not resolve from this environment. Need a canonical official endpoint before adapter work. |
| data.gov.in API | Resource API attempts returned `Key not authorised` with the public sample key. Need a valid data.gov.in API key or rely on direct file downloads/pages. |
| OECD wide discovery | Individual OECD data queries work when `Accept-Language: en` is supplied, but broad discovery hit API rate limits. Fetch targeted flows first; run full discovery slowly in batches. |
