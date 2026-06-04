# Indica Editorial North Star

Last updated: 2026-06-02

This is the production framework for Indica articles. It turns the project brief into an operating rule: every page must help a normal reader understand what the data answers, what it does not answer, and why the distinction matters.

## The Product Standard

Indica is not a chart gallery and not a data warehouse. It is an answer engine for public-interest data about India.

Every published page must have:

- a question a real reader would ask;
- a one-sentence answer thesis;
- one primary chart that carries the answer;
- supporting charts that add distinct lenses, not repeated facts;
- a short explanation for a busy reader;
- a deeper article for a curious reader;
- visible source, method, caveat, and freshness notes;
- a clear statement of what the data cannot prove.

If the page cannot produce an answer thesis, it should not pretend. It should either be marked `needs_data`, retitled to match the evidence, or published as a data-gap explainer.

## The Answer Rule

Questions are the product surface, but answers are the editorial obligation.

Each article must land in one of three answer types:

| Type | Use when | Example shape |
| --- | --- | --- |
| Direct answer | The evidence directly answers the question. | "Yes. India's electricity is getting greener, but coal still supplies most generation." |
| Qualified answer | The evidence answers part of the question and limits the claim. | "India is more connected than ever, but the connection is mobile-first and unequal." |
| Evidence gap | The question is important, but current data cannot answer it honestly. | "The data shows women's participation is low; it does not prove why." |

No page should leave the reader with only a question. If the answer is partial, say that early.

## The Production Loop

The goal is fast, repeatable production with at most two serious editorial iterations after data is ready.

1. **Pick the civic question.**
   Write the question in reader language. If it sounds like an indicator title, rewrite it.

2. **Write the provisional answer thesis before drafting.**
   One sentence, no caveat pile-up. If the thesis cannot be written from current data, mark the page as `needs_data` or change the question.

3. **Lock the evidence packet.**
   List only the indicators the page may cite. Split them into `core`, `context`, and `missing`. Numbers must come from local artifacts, not model memory.

4. **Lock the chart list before prose.**
   Walk the lenses in `docs/CHART_SELECTION_PHILOSOPHY.md`: level, rate, composition, distribution, comparison, projection, normalization, mechanism, and snapshot. Include every distinct lens that helps the reader. Delete duplicate facts.

5. **Map each chart to one narrative job.**
   Every chart gets a `beat`: answer, mechanism, comparison, caveat, exposure, fairness, distribution, or missing-data. If a chart has no job, cut it.

6. **Draft from the answer, not from the chart order alone.**
   The article should read like an argument with evidence, not a tour that says "this chart shows" ten times.

7. **Run the claim audit.**
   For every factual sentence, ask: which locked number or source note supports this? If none, delete or rephrase as a question.

8. **Run the voice audit.**
   Remove AI tells, report language, filler balance paragraphs, theatrical transitions, and fake certainty.

9. **Publish only with a caveat and next-data note.**
   A reader should know whether the number is observed, estimated, projected, modeled, a snapshot, or stale.

## The Chart Selection Contract

Charts are not decorations. Each chart earns its place by answering a different reader question.

The default article shape:

- Hero chart: the direct answer.
- Context chart: the denominator or comparison that stops misreading.
- Mechanism chart: the related trend that helps explain the movement.
- Distribution chart: who, where, or what the average hides.
- Caveat chart or note: the missing dimension, stale source, model estimate, or snapshot warning.

Do not create four charts that all say "the line went up." A dense page is good only when density adds different kinds of understanding.

## The Prose Contract

Indica's voice should feel like a sharp human editor explaining public data to a smart reader who has limited time.

Use:

- short sentences with concrete nouns;
- Indian English where it sounds natural, not performative;
- plain definitions near the first use of a concept;
- judgement that is anchored to a comparison;
- caveats before the reader can misuse the number.

Avoid:

- "the chart shows" as the main verb of every paragraph;
- "it is important to note," "moreover," "furthermore," "crucial," "delve," "tapestry," and similar AI tells;
- "not just X, it is Y" constructions;
- vague balance paragraphs;
- unsupported causality;
- fake conversational gimmicks;
- policy claims not present in the evidence.

The `macha` layer should sound like a smart friend compressing the answer, not a stand-up bit and not a WhatsApp forward.

## The No-Overclaim Rule

The fastest way to lose trust is to answer a causal question with non-causal data.

Examples:

- A female labour-force participation line shows participation, not why women are outside paid work.
- An AQI snapshot shows today's air in selected cities, not India's annual pollution burden.
- GDP per capita shows average output per person, not salary, household income, or the typical person's life.
- Renewables' share of electricity shows generation share, not capacity, reliability, or emissions by itself.

When a page lacks causal data, the article should say: "This data proves the pattern. It does not prove the cause."

## Current Storytelling Diagnosis

The project has improved most where the chart list has been locked before prose. `q.energy.renewables` and `q.climate.impact` work better because they have real narrative beats: answer, pressure, composition, responsibility, exposure, and caveat.

The remaining weakness is that several pages still behave like questions with captions. They ask good things but do not force a thesis. Some drafts also use context indicators as if they explain the topic when they only sit nearby.

The fix is not more prose. The fix is stricter answer discipline:

- write the thesis first;
- classify the answer type;
- reject charts without narrative jobs;
- mark causal gaps honestly;
- make the final paragraph say what the reader should now believe, and what they should not conclude.

## Two-Iteration Rule

To keep production fast:

1. First pass locks the evidence, answer thesis, and chart list. No prose polishing yet.
2. Second pass drafts prose and chart explainers against the locked plan.
3. Final pass is a claim and voice audit, not a full rewrite.

If a page still does not work after that, the problem is usually one of three things: the question is too broad, the data does not answer it, or the chart list is repeating itself.

