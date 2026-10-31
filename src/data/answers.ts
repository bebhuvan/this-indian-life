// The answer each question gives, as the contents, the home page and the chapter pages
// print it beside the question: a figure or a short word, and a note in the margin voice.
// Every figure is stated in the article's own headline, dek or body. Questions still in
// progress have none and are listed as such.

export type Answer = { value: string; note: string };

export const ANSWERS: Record<string, Answer> = {
  "q.econ.size": { value: "₹357 lakh crore", note: "of output a year, fifth largest" },
  "q.econ.motorisation": { value: "Two-wheelers", note: "still most of the registrations" },
  "q.econ.foreign_investment": { value: "No", note: "gross FDI hit a record; net fell" },
  "q.econ.fdi_development": { value: "$38.9 bn", note: "of FDI in 2025, 11th in the world" },
  "q.econ.lrs_remittances": { value: "$28.98 bn", note: "sent abroad in 2025–26" },
  "q.econ.lrs_controls": { value: "+$538 m", note: "net rise, April–August 2026" },
  "q.econ.income_classification": { value: "Per head", note: "income shared by 146 crore people" },
  "q.econ.inflation": { value: "Unevenly", note: "some prices run far ahead of others" },
  "q.econ.borrow": { value: "Personally", note: "credit has moved from industry to people" },
  "q.econ.trade": { value: "$445 bn", note: "of goods exported in 2025" },
  "q.econ.trade_partners": { value: "China", note: "the widest deficit" },
  "q.econ.trade_services": { value: "$415 bn", note: "of services exported in 2025" },
  "q.econ.trade_competitiveness": { value: "1.7%", note: "of world exports, less than in 1948" },
  "q.econ.income_tax": { value: "3 crore", note: "returns pay tax, of nearly 8 crore filed" },
  "q.econ.industrial_policy": { value: "Not yet", note: "imports fell; jobs and exports did not rise" },
  "q.econ.rnd": { value: "0.6%", note: "of GDP, against a 2% target" },
  "q.econ.innovation": { value: "38th", note: "of 139 economies, 2026" },
  "q.econ.poverty": { value: "5.3%", note: "below $3 a day; 23.9% below $4.20" },
  "q.econ.poverty_debate": { value: "The line", note: "decides the answer" },
  "q.econ.state_finances": { value: "₹7.5 lakh crore", note: "of capital outlay, 2023–24" },
  "q.econ.oil_shock_2026": { value: "$22.8 bn", note: "extra for four months of crude" },

  "q.people.total": { value: "145 crore", note: "fertility now below replacement" },
  "q.people.growth": { value: "0.9%", note: "a year, and slowing" },
  "q.people.age": { value: "28.4 years", note: "the median age in 2024" },
  "q.people.pyramid": { value: "22.4%", note: "under 15 by 2030, from 35.6%" },
  "q.people.old_before_rich": { value: "$2,695", note: "a head as the elderly pass 7%" },
  "q.people.population": { value: "Tripled", note: "since 1960" },
  "q.people.fertility_divergence": { value: "1.5 and 2.8", note: "Kerala and Bihar, 2023" },

  "q.health.life": { value: "72 years", note: "at birth, 2023" },
  "q.health.transition": { value: "Mostly", note: "longer lives, more chronic disease" },
  "q.health.deaths": { value: "Heart disease", note: "31 lakh deaths a year" },
  "q.health.road_safety_2024": { value: "1,77,175", note: "killed on the roads in 2024" },
  "q.health.pedestrian_safety_2024": { value: "36,526", note: "pedestrians killed, 100 a day" },

  "q.energy.demand_shape": { value: "7 pm", note: "the peak, after the sun sets" },
  "q.energy.state_transitions": { value: "Some", note: "about thirty separate paths" },

  "q.work.how_india_works": { value: "Self-employed", note: "most workers, in low-output jobs" },
  "q.work.who_works_in_india": { value: "It depends", note: "on sex, caste, faith and schooling" },
  "q.work.jobs_challenge": { value: "23.8 crore", note: "young people of working age by 2035" },
  "q.work.force": { value: "61.8 crore", note: "55.7% of adults take part" },
  "q.work.women": { value: "41.7%", note: "of working-age women take part" },
  "q.work.agriculture": { value: "41.6%", note: "of workers, for 16.3% of GDP" },
  "q.society.connected": { value: "70%", note: "online in 2025" },
  "q.agriculture.edible_oil_imports": { value: "The seed", note: "is grown here; the oil is bought" },
  "q.states.demographic_finances": { value: "Pensions", note: "the richest states age first" },

  "q.air.data_poverty": { value: "Too little", note: "of the history behind the index" },
  "q.climate.city_heat": { value: "36 of 38", note: "warmer than in the 1940s" },
  "q.climate.heat_mortality": { value: "97.2%", note: "of deaths registered, few with a cause" },
  "q.climate.co2": { value: "3.19 bn t", note: "in 2024" },
  "q.climate.co2_pc": { value: "2.2 t", note: "far below the world average" },
  "q.climate.el_nino_india": { value: "Twice", note: "the odds of a weak monsoon" },
  "q.climate.monsoon_2026": { value: "60%", note: "IMD's odds of a deficient season" },
};
