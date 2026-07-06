# Article Plan: "Why are Indian women missing from paid work?"

Last updated: 2026-06-06
Indicator prefix: `q.work.women`

## Answer thesis

Indian women haven't left the workforce — they were never let in. Female labour force participation has been falling for two decades while GDP doubled and women's education overtook men's. The PLFS tells you they're not in paid work. The Time Use Survey tells you where they are: doing 5+ hours of unpaid domestic and care work every day, against men's <1 hour. The international comparison shows this is not a developing-country norm — Bangladesh, poorer than India, has 6 percentage points higher FLFP. The digital economy is largely closed to women: only 56% own a mobile phone, only 37% use online banking. The story is not one thing. It is the intersection of stalled structural transformation, an economy that created too few suitable jobs, household patriarchy measured in hours, and infrastructure burdens (water, sanitation, cooking fuel) that fall almost entirely on women.

## Evidence packet

### Core (must-have)
| Indicator ID | Source | Description |
|---|---|---|
| `work.tus.time_unpaid_total_female` | TUS 2024 | Female unpaid work: 305 min/day |
| `work.tus.time_unpaid_total_male` | TUS 2024 | Male unpaid work: 56 min/day |
| `work.plfs.lfpr_female` | PLFS API | Female LFPR trend 2017-18 → 2023-24 |
| `work.plfs.lfpr_male` | PLFS API | Male LFPR trend |
| `work.labor_force_participation_female` | World Bank | Female FLFP long arc 1990-2025 |

### Context
| Indicator ID | Source | Description |
|---|---|---|
| `compare.lfpr_female.{in,bgd,chn,vnm,idn,wld}` | World Bank | International FLFP comparison |
| `work.tus.time_unpaid_female_{rural,urban}` | TUS | Rural vs urban unpaid burden |
| `work.who.flfpr_mar_{never_married,married,divorced,widowed}` | PLFS 2025 | FLFP by marital status |
| `work.who.neet_{female,male}` | PLFS 2025 | NEET rate 15-29 by gender |
| `work.who.unpaid_share_{female,male}` | PLFS 2025 | Unpaid family workers |
| `work.who.goodjob_{a,b,c,d,e}_*` | PLFS 2025 | Compounding disadvantage |
| `people.nfhs.women_paid_work` | NFHS-6 | 30.8% women paid in cash |
| `people.nfhs.women_decisions` | NFHS-6 | 89% in household decisions |
| `people.nfhs.women_mobile` | NFHS-6 | 63.6% own mobile phone |
| `people.nfhs.spousal_violence` | NFHS-6 | 22.3% spousal violence |
| `people.nss.nss80_own_mobile_{male,female}` | NSS80 | Mobile ownership by gender (F 56%, M 84%) |
| `people.nss.nss80_internet_use_{male,female}` | NSS80 | Internet use by gender |
| `people.nss.nss80_online_banking_{male,female}` | NSS80 | Online banking by gender |
| `people.nss.nss79_literacy_{male,female}` | NSS79 | Literacy by gender |
| `people.nss.nss78_water_piped` | NSS78 | 35.5% piped water — explains time burden |
| `edu.aishe.ger_{male,female}` | AISHE | GER comparison (F 28.5%, M 28.3%) |
| `work.plfs.ur_edu_{graduate,postgraduate}` | PLFS API | Education-unemployment paradox |

## Chart list (25 charts, 4 acts)

### ACT 1: Where Are the Women? (The Hours Answer)
Charts 1-6 establish the central argument: women are working — just not for pay.

| # | Beat | Chart | Data | Size |
|---|---|---|---|---|
| 1 | **answer** | Women spend 5+ hours on unpaid work, men <1 hour | `work.tus.time_unpaid_total_female` + `_male` (latestBars) | hero |
| 2 | **anatomy** | Breakdown of women's time: unpaid domestic vs caregiving vs paid work | `work.tus.time_unpaid_domestic_female`, `time_unpaid_care_female`, `time_paid_total_female` (stackedBars, latest) | feature |
| 3 | **participation** | % of women vs men who do any unpaid domestic work | `work.tus.pct_unpaid_total_female` vs `_male` (latestBars) | small |
| 4 | **primary-activity** | % of women for whom unpaid work is their *main* daily activity | `work.tus.major_pct_unpaid_total_female` vs `_male` (latestBars) | small |
| 5 | **rural-burden** | Unpaid work time by rural vs urban, by gender | `work.tus.time_unpaid_female_rural`, `_urban`, `_male_rural`, `_male_urban` (groupedBars, latest) | feature |
| 6 | **care-work** | Care for children/sick/elderly by gender | `work.tus.time_unpaid_care_female` vs `_male` (latestBars) | small |

### ACT 2: The Paid Work Gap
Charts 7-13 present the labour market story — participation, trends, international comparison.

| # | Beat | Chart | Data | Size |
|---|---|---|---|---|
| 7 | **gap** | Male vs female LFPR, PLFS time-series | `work.plfs.lfpr_male` + `_female` (multiLine, 2017-24) | hero |
| 8 | **long-arc** | FLFP from 1990 to today — the two-decade fall | `work.labor_force_participation_female` (line, 1990-2025) | feature |
| 9 | **cross-country** | India at the bottom: FLFP vs VN, CN, ID, BD, World | `compare.lfpr_female.{vnm,chn,idn,bgd,wld,in}` (multiLine) | feature |
| 10 | **education-paradox** | Female GER rising past male GER while FLFP fell — single dual-axis chart | `edu.aishe.ger_female`, `edu.aishe.ger_male`, `work.labor_force_participation_female` (dualAxis) | feature |
| 11 | **marriage-penalty** | FLFP plummets with marriage | `work.who.flfpr_mar_never_married`, `_married`, `_widowed`, `_divorced` (latestBars) | feature |
| 12 | **rural-urban-puzzle** | Rural women work more than urban women | `work.plfs.lfpr_female_rural` + `_urban` (multiLine) | feature |
| 13 | **sector** | Where women work vs men: agriculture dominates for women | Derive from PLFS microdata: sector share by gender (stackedBars, latest) | small |

### ACT 3: The Infrastructure Burden
Charts 14-20 explain *why* women's time and opportunities are constrained — water, digital access, safety.

| # | Beat | Chart | Data | Size |
|---|---|---|---|---|
| 14 | **water** | Only 35.5% of Indians have piped water — the rest requires fetching | `people.nss.nss78_water_piped` (latestBars vs 95.7% improved source) | feature |
| 15 | **mobile-ownership** | Digital divide: 56% of women own a mobile vs 84% of men | `people.nss.nss80_own_mobile_female` vs `_male` (latestBars) | feature |
| 16 | **internet** | Internet use by gender: 63% vs 77% | `people.nss.nss80_internet_use_female` vs `_male` (latestBars) | small |
| 17 | **online-banking** | Online banking: 37% of women vs 60% of men | `people.nss.nss80_online_banking_female` vs `_male` (latestBars) | small |
| 18 | **literacy** | Female literacy 75% vs male 88% | `people.nss.nss79_literacy_female` vs `_male` (latestBars) | small |
| 19 | **safety** | 22.3% of ever-married women experienced spousal violence | `people.nfhs.spousal_violence` (bigNumber or latestBar) | small |
| 20 | **nfhs-context** | Women's agency dashboard: paid in cash (31%), in decisions (89%), own mobile (64%), own bank account (89%) | NFHS-6 multi-indicator (latestBars) | feature |

### ACT 4: Who Gets a Job? (The Compounding Disadvantage)
Charts 21-25 close with the intersectional reality — the odds collapse when you're female, rural, lower-caste, and less-educated.

| # | Beat | Chart | Data | Size |
|---|---|---|---|---|
| 21 | **unpaid-family** | 29% of working women are unpaid family helpers (vs 8% of men) | `work.who.unpaid_share_female` vs `_male` (latestBars) | feature |
| 22 | **neet** | Young women not in work, school, or training: the invisible ones | `work.who.neet_female` vs `_male` (latestBars) | feature |
| 23 | **compounding** | Good job odds collapse: from group A (urban upper-caste male grad) to group E (rural SC/ST female low-edu) | `work.who.goodjob_a` through `_e` (waterfall or descendingBars) | hero |
| 24 | **state-map** | Where a woman is born shapes her odds: FLFP by state | `work.who.flfpr_state_choropleth` (choropleth, latest) | feature |
| 25 | **ur-education** | The paradox: more educated women face HIGHER unemployment | `work.plfs.ur_female` by education level (descendingBars, latest) | feature |

## Data sources and provenance

| Source | Years | Geography | Access | Validation |
|---|---|---|---|---|
| PLFS API | 2017-18 to 2023-24 | All India + states | `api.mospi.gov.in` | MoSPI official survey |
| PLFS 2025 microdata | Calendar 2025 | All India + states | NADA microdata, derived via `scripts/plfs/build_who_works.py` | Survey weights applied, validated against published headline |
| TUS API | 2019, 2024 | All India | `api.mospi.gov.in` | MoSPI official survey |
| NFHS-6 | 2023-24 | All India + 36 states/UTs | Factshet from `rchiips.org` | Published NFHS-6 factsheet |
| World Bank | 1990-2025 | Multi-country | `api.worldbank.org` | ILO modelled estimates |
| AISHE | 2017-18 to 2021-22 | All India | `api.mospi.gov.in` | MoSPI official survey, cross-checked against published AISHE report |
| NSS78 | 2020-21 | All India | `api.mospi.gov.in` | MoSPI NSS 78th round |
| NSS79 | 2022-23 | All India | `api.mospi.gov.in` | MoSPI NSS 79th round |
| NSS80 | 2025 | All India | `api.mospi.gov.in` | MoSPI NSS 80th round |

## Key caveats

1. **PLFS counts unpaid family work as employment.** A woman counted as "in the labour force" on PLFS's usual status (PS+SS) may be unpaid help on the family farm. This inflates measured female participation.

2. **TUS has only two rounds (2019 and 2024).** Read as structural portrait, not trend. The 305→305 flat line is two data points, not proof of stagnation.

3. **NFHS-6 is a household survey with sampling errors.** Treat rank order seriously, not decimal points. Urban/rural splits have wider margins.

4. **World Bank FLFP is ILO-modelled, not directly observed.** The modelled estimates smooth year-to-year variation and may differ from PLFS.

5. **Causal claims are not supported.** The data proves patterns. It does not prove why women aren't in paid work. Language must reflect this: "one visible pattern is", "the data shows", never "because".

6. **NEET coding in India differs from Europe.** Most "NEET" women in India are coded as "attending to domestic duties" — they are working, just not for pay. Use NEET alongside unpaid-work charts, not as a standalone.

7. **AISHE GER uses 2011 Census population projections.** The denominator (population aged 18-23) is estimated, not counted. The 2027 Census will provide new denominators.

## Prose structure

### Introduction (200-250 words)
Open with the paradox: India's economy has grown 7x since 2000. Women's education has overtaken men's. Yet fewer women are in paid work today than in 1990. The question is not "why don't Indian women work?" — they work, constantly, for 5+ hours a day. The question is why that work is unpaid, unrecognized, and economically invisible.

### Section 1: The hours answer (300-400 words)
The TUS data. Women's 305 minutes of unpaid work vs men's 56. What that 5 hours consists of. Rural vs urban burden. The care economy. % for whom unpaid work is their primary daily activity.

### Section 2: The labour market gap (400-500 words)
PLFS trends. The gap with men. The long arc: FLFP fell from ~32% (2005) to ~20% (2018), then recovered to ~33% (2024). What the recovery really is: self-employment and unpaid family work.

### Section 3: The world comparison (250-300 words)
India at 32% vs Vietnam at 69%, China at 59%, Indonesia at 54%, Bangladesh at 39%. The Bangladesh story: garment factories. The structure of the economy — not just culture or income — determines female FLFP.

### Section 4: The education paradox (250-300 words)
Women's GER overtaking men's (28.5% vs 28.3%) while FLFP was falling. In most countries, education raises employment. In India, it doesn't — because the economy creates too few suitable jobs and social norms around "respectable" work tighten with status.

### Section 5: The marriage penalty (200-250 words)
FLFP by marital status. Women's participation drops with marriage in a way men's never does. The divorce/widow figures show that necessity drives female work.

### Section 6: The infrastructure burden (300-400 words)
Water, sanitation, cooking fuel. Only 35.5% have piped water. The digital divide: 56% of women own a mobile, 37% use online banking. Without a phone, you can't find jobs, build a business, or work remotely. Female literacy at 75% vs male 88%.

### Section 7: Who gets a good job? (250-300 words)
The compounding disadvantage chart. From a ~40% chance of a regular salaried job (urban upper-caste male graduate) to near-zero (rural SC/ST female with low education). Each layer of disadvantage — gender, caste, location, education — compounds.

### Section 8: The honest caveat (150-200 words)
What the data can and cannot prove. We know the pattern. We don't know the cause. PLFS measures participation, not liberation. TUS proves the hours burden, not why it exists. NFHS proves the agency gap, not its origin.

### Macha section (150-200 words)
Plain-language compression of the entire argument. "All this data is saying one thing: Indian women work harder than anyone and get paid for it the least."

## Build commands

```bash
# Validate all data
node scripts/ingest-mospi-tus.mjs
node scripts/ingest-nfhs-women.mjs
node scripts/ingest-mospi-aishe.mjs
node scripts/ingest-nss-women.mjs

# Verify data integrity
npm run explain:v1:validate

# Generate article
npm run explain:v1:fast -- --questions=q.work.women

# Build and check
npm run build
rg -n "api_key|6pcp" dist data/series data/explanations || true
```
