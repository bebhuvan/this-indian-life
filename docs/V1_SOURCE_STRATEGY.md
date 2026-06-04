# V1 Source Strategy

Indica V1 should start with sources that already passed a lightweight probe and can produce machine-readable artifacts without heroic scraping. The goal is to publish a credible first catalog quickly, while keeping harder official sources in a structured adapter backlog.

Probe results are tracked in [SOURCE_PROBE_RESULTS.md](./SOURCE_PROBE_RESULTS.md).

## Start Now

These sources are API-ready or close enough to start adapter work immediately.

| Source | Use in V1 | Why start now | First adapter output |
| --- | --- | --- | --- |
| World Bank Indicators | GDP, population, life expectancy, electricity access, urbanization, poverty, global comparisons | Stable public JSON, no key, already powering seed pages | Country annual series artifacts |
| India Data Hub | RBI, MoSPI, Ministry of Finance, macro, financial, district and multilateral feeds | Auth works; one API can cover many India-specific economic datasets | Source registry + selected economy series |
| Ember | Electricity generation, demand, carbon intensity, power-sector emissions, capacity | Clean OpenAPI, India data available, good energy/climate backbone | India yearly/monthly electricity series |
| EIA International | Broad energy balance, fuel consumption/production/imports, energy-related CO2 by fuel | API key works; India has hundreds of historical annual series | Selected India annual energy and emissions series |
| OWID Grapher | Health, climate, energy, demography, global comparison context | Excellent metadata + CSV/JSON model, no key | India series plus comparison country series |
| WAQI | Reader-facing AQI snapshots and city/station pages | Auth works; quick way to explain current air quality | City/station AQI snapshots with provider metadata |
| Data Portal for Cities | City greenhouse-gas inventory comparisons | Clean JSON API; useful if Indian city IDs are available | City emissions sector series |
| OECD SDMX | International comparison context for economy, education, health, tax, trade, regions | Dataflow catalogue works; high-reputation source | Dataset discovery first, then validated SDMX data queries |
| WHO GHO | Health indicators: life expectancy, mortality, disease burden, risk factors, UHC | Clean documented OData API, country filters work for India | India health indicator series |
| UN Population Data Portal | Population, fertility, mortality, age-sex structure, projections | Official UN API; metadata public; token available for protected data endpoints | India demographic series and projection artifacts |

## Use As Page-Backed or Download Sources

These should be included, but not treated as simple APIs yet. They need parsers, manual source discovery, or table extraction.

| Source | Use | Current status | Adapter approach |
| --- | --- | --- | --- |
| Census India | Population, geography, villages, towns, literacy, workers, housing | Pages reachable by curl; Node fetch had TLS/network issues | Download canonical files manually/with curl; parse into geography and indicator tables |
| NFHS | Fertility, nutrition, anaemia, sanitation, household assets, women/child health | data.gov page reachable; official site redirected oddly from this environment | Start with data.gov/IIPS factsheets; later add DHS API/microdata |
| PLFS | Employment, labour-force participation, wages, informality | MoSPI microdata catalog reachable | Adapter should download catalog metadata first; microdata pipeline later |
| HCES | Consumption, poverty-adjacent household spending, food/non-food mix | MoSPI final report PDF reachable | PDF/table extraction first; microdata later if accessible |
| AISHE | Higher education enrolment, institutions, GER, gender/caste mix | Official page reachable | Report/table extraction unless direct data endpoint found |
| NCRB | Crime, suicides, accidental deaths | data.gov ministry catalog reachable | Use only with strong caveats: reported cases, not true incidence |
| Jal Jeevan Mission | Drinking water connections and household tap-water access | Web API PDF reachable | Extract endpoints from PDF, then build JSON adapter |
| CEA | Electricity generation/capacity official India data | API docs page reachable | Enumerate docs, then build official-power adapter |
| Agmarknet | Mandi prices and arrivals | Portal page reachable | Discover direct endpoints and rate limits |
| MoSPI Energy Statistics | Official annual India energy balance: reserves, capacity, production, consumption, trade | Annual PDF/report source, useful as canonical India reference | Table extraction from annual Energy Statistics publication |
| PPAC | Petroleum products, crude/LNG imports, oil and gas data | Official portal and reports available; file shapes need discovery | Download report tables first, then normalize petroleum dependence series |
| Grid India / CEA | Daily demand, shortages, capacity/generation reports | Official reports and web endpoints exist; endpoint stability needs probing | Start with daily PSP/demand snapshots, then monthly generation/capacity |
| MNRE | Renewable capacity and generation statistics | Official statistics page and PDFs | Parse renewable statistics tables after file discovery |
| Ministry of Coal | Coal production/import/export | Official pages provide current files and historical summaries | Download official coal import/export files and normalize annual series |
| UN Comtrade | Trade origin story for crude, coal, gas, solar modules | API-ready with registration/rate limits; needs commodity-code registry | Country-origin import tables for selected HS codes |

## Backlog / Re-Test Later

| Source | Current blocker | Next action |
| --- | --- | --- |
| UDISE+ API | Root and common Swagger paths returned 404 | Find correct developer portal route or credentials; otherwise use downloadable reports |
| CGWB | Timed out from current network | Retry from another network; check India-WRIS or alternate official mirrors |
| Agriculture Census | Candidate host did not resolve | Find canonical official domain/files before adapter work |
| data.gov.in API | Public/sample key returned `Key not authorised` | Add a valid `DATA_GOV_IN_API_KEY`; then retest resource endpoints |
| NDAP | Undocumented frontend API discovered, but response shapes are unstable without exact payloads | Keep experimental; snapshot only, no production dependency yet |
| OECD wide discovery | Targeted dataflow fetches work with `Accept-Language: en`, but broad discovery hits OECD rate limits | Fetch targeted flows first; run full discovery slowly in batches |

## V1 Publishing Themes

With the start-now sources, V1 can publish a useful first version across:

1. **How India grows**: GDP, GDP per capita, real growth, inflation once India Data Hub/RBI series are mapped.
2. **How India lives demographically**: population, urban share, life expectancy, fertility from World Bank/OWID/NFHS once added.
3. **How India powers itself**: generation mix, demand, carbon intensity, electricity access using Ember + World Bank + CEA later.
4. **How India breathes**: AQI/station snapshots from WAQI, later concentration data from OpenAQ/CPCB.
5. **How Indian cities compare**: city emissions from Data Portal for Cities if Indian city IDs are available.

## Adapter Acceptance Criteria

An adapter is ready when it can:

- load secrets through `.env` without logging them;
- fetch a small known sample;
- write an immutable raw snapshot;
- normalize to the canonical series artifact shape;
- include source URL, fetched timestamp, units, geography, and caveats;
- fail loudly on schema changes;
- run through `npm run probe:sources` or a source-specific probe.
