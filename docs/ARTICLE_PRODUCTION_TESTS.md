# Article Production Tests

Last updated: 2026-06-02

This document records the first end-to-end editorial production run using the Indica north-star framework: choose the story, verify data, fix source problems, lock chart plans, generate a draft, rewrite the prose, bind charts to sections, lint, and build.

## Test Pair

| Article | Why this test matters | Status |
| --- | --- | --- |
| How connected is India? | A rich, lived-economy story: electricity, mobile networks, cheap data, UPI, rural-urban divide, gender divide, and world comparison. | Built |
| Are India's big cities getting hotter? | A climate story that forces discipline: the data is mixed, so the article cannot make a lazy "everything goes up" claim. | Built, Kolkata deferred |

## Test 1: How Connected Is India?

Answer thesis: India is now a connected country, but it is connected mostly through mobile, and that connection is not equal.

Local source stack:

- `society.owid.internet_share`
- `energy.electricity_access`
- `society.mobile_subscriptions_p100`
- `society.broadband_subscriptions_p100`
- `society.fixed_telephone_p100`
- `society.idh.data_per_user`
- `society.idh.data_cost`
- `society.idh.upi_volume`
- `society.idh.internet_subs_wireless`
- `society.idh.internet_subs_fixed`
- `society.idh.telecom_subs_rural`
- `society.idh.telecom_subs_urban`
- `society.internet_users_female`
- `society.internet_users_male`
- `compare.society.internet_users`

Chart spine:

1. Indians online, % of population.
2. Access to electricity.
3. Mobile vs fixed broadband vs landline.
4. Mobile data used per subscriber per month.
5. Cost of mobile data.
6. UPI transactions each month.
7. Wireless vs fixed internet subscribers.
8. Rural vs urban telecom subscribers.
9. Women vs men online.
10. India vs China vs world internet use.

Editorial outcome:

- Rewrote the generated article into ten reader-question sections.
- Added explicit `sectionVisualMap` so each section binds to its intended chart.
- Kept caveats visible: users are not subscriptions, mobile access is not quality, UPI transaction count is not value, and gender gap data proves the gap but not every cause.

Rendered route:

```text
/en/articles/how-connected-is-india/
```

## Test 2: Are India's Big Cities Getting Hotter?

Answer thesis: The answer is mixed. Mumbai, Chennai, and Bengaluru are warmer by annual average than in 1940, but Delhi does not show that first-to-latest pattern in this point series. Hot nights in Chennai and Mumbai are the stronger lived warning.

Local source stack:

- `climate.openmeteo.delhi.mean_temperature`
- `climate.openmeteo.mumbai.mean_temperature`
- `climate.openmeteo.chennai.mean_temperature`
- `climate.openmeteo.bengaluru.mean_temperature`
- `climate.openmeteo.delhi.very_hot_days`
- `climate.openmeteo.mumbai.very_hot_days`
- `climate.openmeteo.chennai.very_hot_days`
- `climate.openmeteo.bengaluru.very_hot_days`
- `climate.openmeteo.delhi.hot_nights`
- `climate.openmeteo.mumbai.hot_nights`
- `climate.openmeteo.chennai.hot_nights`
- `climate.openmeteo.bengaluru.hot_nights`

Chart spine:

1. Annual average temperature in four Indian cities.
2. Very hot days each year.
3. Hot nights each year.

Data fix discovered during production:

- Kolkata's local Open-Meteo artifact had only ten January 2025 daily rows.
- A full-history Kolkata refetch failed twice.
- The article excludes Kolkata rather than publishing a fake annual chart.
- The Open-Meteo ingest now excludes incomplete calendar years from annual derived series, so partial 2026 data does not masquerade as a full annual observation.

Editorial outcome:

- Rejected the first generated draft's over-simple framing.
- Rewrote the article around the actual evidence: annual averages, daytime threshold counts, and night heat tell different stories.
- Added source caveats: ERA5 is reanalysis, city coordinates are not neighbourhoods, and fixed thresholds fit different cities differently.

Rendered route:

```text
/en/articles/are-indias-big-cities-getting-hotter/
```

## Verification

Commands run:

```bash
npm run explain:v1:dry-run -- --questions=q.climate.city_heat
npm run explain:v1:fast -- --questions=q.climate.city_heat
npm run build
```

Additional checks:

- Targeted prose lint on `q.society.connected.json` and `q.climate.city_heat.json`: zero findings.
- Chart-section binding check: every planned chart for both pages is bound to the intended section.
- Full Astro build: passes, 80 static pages generated.

Known limitation:

`npm run explain:v1:validate` still fails on older unrelated generated artifacts with pre-existing AI-phrase findings. The two articles from this production run lint clean.

