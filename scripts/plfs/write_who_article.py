#!/usr/bin/env python3
"""Write the explanation artifact for q.work.who_works_in_india."""
import json, os

OUT = "/home/bhuvanesh.r/Documents/Bhuvan projects/Indica/data/explanations/en/q.work.who_works_in_india.json"

body = r"""India's unemployment rate is 3.2%. On paper, that is the labour market of a rich, contented country — full employment, near enough. It is also one of the most misleading numbers in Indian public life.

The number is true. It just answers the wrong question. "Are you unemployed?" turns out to tell you almost nothing about a person's working life in India, because in a country with no real unemployment benefits, almost nobody can afford to be openly unemployed. You take whatever work exists. The real questions are the ones the headline hides: *Do you work at all? What kind of work? Are you even paid for it? And how much?*

Ask those, and the single Indian labour market dissolves into a dozen of them. Whether you work, what you do, and what you earn turns out to depend less on the economy than on **who you are** — your sex, your schooling, your caste, your faith, whether you're married — and **where you were born**. This is a tour of those fault lines, built entirely from the 2025 round of the Periodic Labour Force Survey, India's official employment survey, read one person at a time.

## First fault line: are you a man or a woman?

This is the deepest cut, and everything else sits on top of it. Among Indians aged 15 and over, **79% of men are in the labour force, but only 40% of women** — a gap so large it makes India a global outlier. More than half the country's working-age women are neither working nor looking for work.

And the 40% flatters the picture. Of the women who *are* counted as working, **nearly a third are unpaid family labour** — helping on the family farm or in the family shop, for no wage of their own — against about 8% of working men. A woman is counted as "employed" for weeding the household's field; whether that gives her an income, or any say over it, is another matter entirely.

When women do earn a salary, they earn less: the median salaried woman takes home about ₹10,000 a month against ₹15,500 for the median salaried man.

## Second fault line: how far did you get in school?

Here is the fact that detonates the 3.2% headline. Plot unemployment against education and it runs the *wrong way*: joblessness is near zero for those who never went to school and climbs with every certificate.

Among all adults, an Indian who is not literate has an unemployment rate of **0.2%**. A graduate? **13%**. Among the young, where India's jobs crisis actually lives, it is brutal: youth unemployment for graduates is **26%**, and for postgraduates **32%** — against under 5% for young people who stopped at secondary school.

This is not because education makes you unemployable. It is because the unlettered cannot afford to be idle and take any work going, however bad; while the educated — who *can* lean on family for a while — hold out for the salaried, white-collar job their degree was supposed to buy, and increasingly cannot find it. Unemployment in India is, perversely, a luxury. It is what you can afford once you have options.

## Third fault line: which caste were you born into?

Caste does not show up loudly in the unemployment rate — every social group clusters near the low national figure, for the same reason the poor everywhere can't afford to search. It shows up in the *kind* of work you get handed.

The most insecure work — casual day labour, no income on a day without a job — falls hardest on those at the bottom of the caste order. **More than a quarter of Scheduled Caste (29%) and Scheduled Tribe (26%) workers are casual labourers**, against one in eight (13%) "Other", upper-caste, workers. The secure salaried jobs run the other way: an upper-caste worker is more than twice as likely to hold one as an Adivasi. And among those who do draw a salary, the median upper-caste worker earns ₹18,000 a month to a Dalit worker's ₹12,500. Birth still sorts Indians into kinds of work.

## Fourth fault line: are you married — and to what faith?

For men, marital status barely moves the labour market. For women it is decisive. Female participation runs from **25% among the never-married** (many still studying), to **45% among the married**, to **65% among the divorced and separated** — the clearest sign in the data that much of women's work is driven by necessity, not opportunity. A woman alone has to work; a woman with a husband's income often, by choice or constraint, does not.

Faith tracks it too: female participation is highest among Christian (47%) and Buddhist women and lowest among Muslim (31%) and Jain women — though this is tangled up with where people live and how rich they are, and is a correlate, not a cause.

## Fifth fault line: how old are you?

Unemployment in India is almost entirely a young person's condition. The rate for prime-age workers (30–59) is **0.7%**; for those over 60 it is near zero — not because old age brings job security, but because the poor cannot retire. For the young (15–29) it is **10%**, several times higher.

The starker number is NEET — the share of young people not in employment, education or training. Overall it is 26%. Split by sex, it is **8% for young men and 44% for young women**. Four in ten young Indian women are, officially, doing nothing — which mostly means doing unpaid domestic and care work that the statistics refuse to count as work at all.

## Sixth fault line: where were you born?

Geography may matter most of all. A woman's chance of being in the workforce swings from **18% in Delhi and the mid-20s in Haryana, Bihar and Punjab to nearly 69% in Sikkim** and roughly two-thirds across the rest of the North-East and the hill states. That is not a rich-versus-poor story — if anything it runs backwards, because the high-participation states are often poorer and more agricultural, where women work the land out of need, while rich, urban Delhi sits at the very bottom. The northern plains sit low; the North-East, the hill states and the poorer central belt sit far higher. Tellingly, **Kerala — among the richest and most educated states — manages only about 40%**, a reminder that prosperity and schooling do not, on their own, pull women into paid work. Where a girl is born shapes her working life more than almost any national policy.

## What the work actually is

Step back from who works to what the work *is*, and the second great fact arrives: **most Indians don't have a job — they have work.** Over half of all workers (55%) are self-employed; only a quarter (25%) are regular salaried; a fifth (21%) are casual labourers. The salaried job with a payslip — the thing the word "job" conjures — is a minority experience.

And most of that work is informal: **85% of all jobs come with no written contract, no social security, and no paid leave** — rising to 91% in the countryside. Even the salaried aren't safe: among regular wage workers, 56% have no written contract and 53% no social security. This is informal employment hiding inside the formal-looking economy — a payslip without a safety net.

What do all these people do? For all the talk of an IT and services superpower, the largest single thing Indian workers do is **farm: 41% are in agriculture** — which produces only about a sixth of GDP. Manufacturing, the classic ladder out of poverty that China and Vietnam climbed, employs barely one in eight. In the village, six in ten workers work for themselves, mostly on the land; in the city, half draw a wage. They are nearly different economies.

## What it pays

Pay is where every divide compounds. A formal salaried job — one with social security — pays a median of about **₹25,000 a month**; an informal salaried job, **₹12,000**. A casual labourer earns around **₹400 on a day they find work**, and nothing on a day they don't. The median Indian household gets by on consumption of about ₹11,400 a month.

And the divides stack. Informality is **93% among workers in the poorest quarter of households** and still **71% in the richest** — bad work keeps households poor, and poor households can only get bad work.

## The compounding

Each fault line in this piece is a single cut. The real shape of Indian work is what happens when you stack them. Take the secure formal job — a regular salary with social security, the thing every chart here circles around — and ask what share of different Indians actually hold one.

For an **urban, upper-caste, male graduate, it is 39%**. Add the disadvantages one by one and it collapses: an urban OBC man with a secondary education, 11%; a rural OBC man, 4%; a rural Dalit man with little schooling, 1%; and a **rural Dalit or Adivasi woman with little schooling — 0.3%**. The most advantaged profile is more than a hundred times likelier to hold a good job than the least. Same country, same year, same economy; the odds were mostly handed out at birth.

## So — who works in India?

Everyone, more or less; almost nobody can afford not to. That is why the unemployment rate is so low and so useless. The real story is not whether Indians work but on what terms — and the terms are handed out, to a degree that should be uncomfortable, at birth. There is no single Indian labour market. There is one for men and one for women; one for the schooled and one for the unschooled; one for the upper castes and one for the Dalits; one for Sikkim and one for Delhi. The same survey, asked one person at a time, contains all of them."""

macha_body = r"""Bro, forget the unemployment rate. Everyone quotes "3.2%, full employment basically" — it's nonsense. In India there's no dole, so nobody can *sit* unemployed. You take whatever chhota-mota work you get. So "are you unemployed?" tells you nothing.

The real question is: *what kind* of work, and do you even get paid? And the punchline is brutal — the answer depends on who you are before it depends on the economy.

Watch this: the more you study, the *more* likely you're jobless. Never went to school? 0.2% unemployment. Graduate? 13%. Young graduate? 26%. Postgrad? 32%. Because the poor guy can't afford to wait, he takes any job; the graduate holds out for the "achhi naukri" that doesn't exist.

Then layer it on. Woman? Half as likely to work as a man — and if she does, one in three works for *free* on the family farm. Dalit or Adivasi? Way more likely to be doing daily-wage casual kaam. Born in Delhi vs Sikkim? Totally different odds. Married woman vs divorced woman? The divorced one works way more — because she has to.

And 85% of everyone works with no contract, no PF, no paid leave. Even half the "salaried" log have no contract. There isn't one Indian job market, bro. There are about ten, and which one you land in got mostly decided the day you were born."""

obj = {
  "schemaVersion": 1,
  "questionId": "q.work.who_works_in_india",
  "status": "ready",
  "short": {
    "headline": "Who works in India? It depends who you are",
    "dek": "Unemployment is 3.2% — and that number explains nothing. Whether you work, what you do, and what you earn is decided by your sex, schooling, caste, faith, age and state. There is no single Indian labour market.",
    "body": "India's 3.2% unemployment rate looks like full employment. It isn't — with no unemployment benefits, almost nobody can afford to be jobless, so they take any work. The real divides are in the kind of work: 79% of men are in the workforce but only 40% of women; the more educated you are the more likely you're unemployed (graduates 13%, young postgraduates 32%); 85% of all jobs are informal; and where you're born swings a woman's odds of working from 18% (Delhi) to 69% (Sikkim). The same workforce, re-cut by who you are."
  },
  "macha": {
    "heading": "Tell me straight — who actually works in India, bro?",
    "body": macha_body,
    "soWhat": "Stop reading the unemployment rate as good news. It's low because Indians can't afford to be unemployed, not because there are enough good jobs. What to actually watch: the kind of work (85% informal, half the country self-employed), and the fact that your sex, caste, schooling and home state decide your odds before the economy gets a vote."
  },
  "article": {
    "title": "Who Works in India?",
    "standfirst": "The unemployment rate says 3.2% and means almost nothing. Read India's official labour survey one person at a time and the single job market splits into a dozen — sorted by sex, schooling, caste, faith, age and birthplace. A portrait of the world's largest workforce, and how unequally it is shared.",
    "bodyMarkdown": body
  },
  "editorialPlan": {
    "audience": "the average curious Indian reader",
    "heroDescription": "The male-female participation gap as the opening fault line: 79% of men in the workforce, 40% of women.",
    "selectedDataPoints": [
      {"label": "Male vs female LFPR: 79% vs 40%", "reason": "The deepest single divide in who works; sets up the whole identity thesis.", "use": "hero"},
      {"label": "Unemployment rises with education: 0.2% illiterate to 13% graduate (26% young graduates)", "reason": "The counterintuitive hook that dissolves the low-unemployment puzzle.", "use": "chart"},
      {"label": "85% of jobs are informal; 55% self-employed", "reason": "The nature-of-work backbone.", "use": "chart"},
      {"label": "Female NEET 44% vs male 8%", "reason": "The young edge of the missing-women story.", "use": "chart"},
      {"label": "Female LFPR 18% (Delhi) to 69% (Sikkim)", "reason": "The geography-is-destiny showcase only microdata can show.", "use": "chart"},
      {"label": "Caste casual-labour gradient: SC 29% vs upper-caste 13%", "reason": "Birth sorts Indians into kinds of work.", "use": "chart"},
      {"label": "Formal salaried ₹25k vs informal ₹12k; casual ₹400/day", "reason": "Where the divides compound into money.", "use": "chart"}
    ],
    "pullQuotes": [
      {"quote": "Unemployment in India is, perversely, a luxury. It is what you can afford once you have options.", "numberLabel": "Graduate unemployment 13% vs 0.2% for the not-literate"},
      {"quote": "Most Indians don't have a job — they have work.", "numberLabel": "55% self-employed, 85% informal"},
      {"quote": "Four in ten young Indian women are, officially, doing nothing.", "numberLabel": "Female NEET 44%"},
      {"quote": "Where a girl is born shapes her working life more than almost any national policy.", "numberLabel": "Female LFPR 18%–69% across states"},
      {"quote": "Same country, same year, same economy; the odds were mostly handed out at birth.", "numberLabel": "Good-job odds: 39% vs 0.3%"}
    ],
    "glossaryBlocks": [
      {"term": "LFPR (Labour Force Participation Rate)", "plainMeaning": "The share of working-age people (15+) who are either working or actively looking for work.", "whyItMattersHere": "It is the cleanest measure of who even shows up to the labour market — and the male-female gap in it is India's biggest labour fact."},
      {"term": "Usual status (ps+ss)", "plainMeaning": "A person's main activity over the past year, including subsidiary work; the standard PLFS lens for structural questions.", "whyItMattersHere": "It is how 'worker', 'unemployed' and 'out of the labour force' are defined throughout this piece."},
      {"term": "Informal employment", "plainMeaning": "Work with no written contract, no social security and no paid leave — whether self-employed or in a job.", "whyItMattersHere": "It is the default Indian working condition (85%), and it sits even inside salaried, formal-looking jobs."},
      {"term": "NEET", "plainMeaning": "Young people (here 15–29) Not in Employment, Education or Training.", "whyItMattersHere": "It exposes the female labour gap at its sharpest — much female NEET is uncounted unpaid care work."},
      {"term": "Casual labour", "plainMeaning": "Day-to-day wage work with no continuing employer and no income on a day without work.", "whyItMattersHere": "It is the most precarious rung, and who lands on it tracks caste and sex closely."},
      {"term": "MPCE (Monthly Per-capita / household Consumer Expenditure)", "plainMeaning": "How much a household spends each month — used here as a stand-in for living standards.", "whyItMattersHere": "It lets us show that informality and poverty reinforce each other (93% informal in the poorest quartile)."}
    ]
  },
  "dataSelectionAudit": {
    "areSelectedDataPointsGood": "yes",
    "addDataPoints": [],
    "removeDataPoints": [],
    "visualizationDecisions": [
      {"indicatorOrVisual": "all work.who.* cuts", "bestChartType": "latestBars", "timeWindow": "latest", "frequency": "annual", "reason": "Each is a single 2025 cross-sectional snapshot comparing categories (sex, education, caste, state...), so ranked/grouped bars are the right form; this article's value is granularity, not trend."}
    ]
  },
  "sourceNotes": [
    "Built exclusively from PLFS 2025 unit-level microdata (microdata.gov.in NADA archive, calendar-2025 person + household files), recomputed in scripts/plfs/build_who_works.py.",
    "All figures are usual status (principal+subsidiary) for 15+ unless noted, weighted by the survey multiplier (Subsample_Multiplier/100). Caste, religion and household consumption come from the household file joined to persons.",
    "Companion to, not a replacement for, q.work.how_india_works (the macro/long-run flagship); this piece is the granular, identity-and-place cut."
  ],
  "caveats": [
    "This is a single cross-section (calendar 2025, visit 1) — it shows structure, not trend; the existing How India Works flagship carries the time series and international comparisons.",
    "Two definitions of 'informal' are used: the all-worker informality rate (no social security OR informal-sector enterprise) for the 85% headline, and a social-security-only split for the formal-vs-informal salaried wage comparison.",
    "Female participation depends heavily on counting unpaid family work as employment; 'women working' should be read with that in mind.",
    "Religion and caste differences are correlates entangled with region, urbanisation and income — not isolated causes.",
    "Self-employed and casual earnings are far noisier than salaried earnings; wage comparisons centre on salaried medians."
  ],
  "lockedNumbersUsed": [],
  "qualityFlags": [],
  "generatedAt": "2026-06-04T00:00:00.000Z",
  "model": "claude-opus-4-8",
  "evidence": {
    "lockedNumbers": [],
    "availableIndicatorIds": [],
    "themeIndicatorIds": [],
    "requiredIndicatorIds": [],
    "sourceSummaries": []
  }
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    json.dump(obj, f, indent=2, ensure_ascii=False)
print("wrote", OUT)
print("bodyMarkdown words:", len(body.split()))
