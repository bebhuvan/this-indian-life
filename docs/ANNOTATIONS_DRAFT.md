# Chart annotations: draft for approval

Proposed year marks for a few lead line charts. Each would render as a dotted hairline at the
year with a short label beside it (the `bands` field of a registry `visualPlan` entry; three or
fewer marks draw as annotations, more as pale shaded bands). Nothing here is live. Approve,
edit or strike each line, then add the approved ones to `scripts/registry/v1-indicators.mjs`.

Rules used: label only events the article's own prose or a standard history supports; at most
two marks per chart; no causal claim in the label (a mark says "when", the prose says "why").

| Chart (registry line) | Proposed `bands` | Basis |
|---|---|---|
| "India's economy, 1950-51 to today" (`q.econ.size`, line ~1120) | `{ year: 1991, label: "1991 reforms" }`, `{ year: 2020, label: "Covid year" }` | Balance-of-payments crisis and liberalisation, July 1991; real GDP contracted in 2020-21 (MoSPI). The nominal series barely shows 1991, so this may be better on the real-GDP chart. |
| "India's inflation rate, 1960 to today" (`q.econ.inflation`, line ~2259) | `{ year: 1974, label: "1973-74 oil shock" }` | The chart's own peak (World Bank CPI, about 28% in 1974) follows the 1973 OPEC embargo. |
| "How much India trades, 1948 to today" (`q.econ.trade`, line ~6271) | `{ year: 1991, label: "1991 reforms" }` | Tariff cuts and rupee devaluation in 1991; the export line turns up after it. |
| "India's population, 1960 to today" (`q.people.*`, lines ~669, 719, 846) | `{ year: 2011, label: "Last census" }` | Census 2011 is the last full count; later points are estimates, which the prose already stresses. |
| "India went into the shock accelerating" (`q.econ.oil_shock_2026`, line ~8553) | none proposed | The chart already makes its point; a mark would crowd it. |

Separately, and not editorial: projection segments (after a "projection" mark) could be drawn
dashed so measured and projected values read differently. That is a rendering change for the
design pass, not an annotation.
