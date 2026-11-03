# Storytelling: how a This Indian Life article is built for its reader

`docs/STORY_PLAYBOOK.md` makes an article true. This file makes it understood.
`docs/academy/VOICE.md` governs the sentence; this file governs the reader's path
through the whole piece: what they ask, in what order, and what they need to know
before each answer lands. `docs/ARTICLE_RUBRIC.md` scores the result.

An article can pass every audit and still fail here. The World Bank poverty-report
article of October 2026 reconciled 621 data cells and nobody could follow it. Accuracy
is the floor. Understanding is the job.

## 1. Who is talking, and to whom

**The writer** is an economist who has read the whole report, the methodology annex
and the arguments about it, and who can explain any of it to anyone. They do not
show off. They do not talk down. When a word is hard, they explain it once, plainly,
and move on. When the evidence is disputed, they say who disagrees and why, in a
sentence each, and say what they themselves make of it.

**The reader** is a curious Indian adult who has heard the headline ("India has
ended extreme poverty", "the Gini says we are the fourth most equal country") and
thinks: *ye kya ho raha hai? Is that true? What does it mean for people like me?*
They are intelligent and busy. They do not know what PPP, a lined-up estimate or a
consumption Gini is, and should not need to before they start reading.

Two failures to avoid, in equal measure:

- **Dumbing down.** Dropping the dispute, the caveat or the uncomfortable number
  because it is hard to explain. The hard part is usually the point.
- **Talking up.** Writing for the economists who will check the piece instead of the
  reader who came to understand it. Method detail in the body, file names, field
  codes, "lined-up", "nowcast", "comparability spell" without translation.

## 2. Read the whole source before asking a single question

You cannot know what a reader should ask until you know everything the source can
answer. Before any outline:

1. Convert every report PDF to Markdown (`liteparse parse <pdf> --format markdown
   -o <pdf-stem>.liteparse.md`; use `liteparse`, not `lit`, which clashes with LLVM)
   and keep it beside the PDF as a reading aid. Numbers still come from the PDF page
   or the data file. Running text converts well; values inside charts often come
   out garbled. For a figure you need, render the page (`liteparse screenshot <pdf>`)
   and read the image, or take the value from the report's replication data.
2. Write a **source digest** (`templates/source-digest.md` in the `indica-story`
   skill): the report's own argument in order, every India finding with its page,
   the global numbers that place India, every concept the report defines, the
   questions it raises, the literature it leans on, and the debate and history
   around the question (section 7a). That last part usually needs sources beyond
   the report.
3. Sweep the **neighbouring indicators**. A report is one lens. Ask what else the
   World Bank (WDI, PIP, ASPIRE social protection, Gender data), MoSPI, NFHS, PLFS
   or RBI publish that answers a question the report raises but does not chart.
   Record each as *pull*, *mention* or *skip, because*.

The digest and the indicator sweep are written once, as files, so later passes read
them instead of the PDF.

## 3. The question ladder

The spine of every article is a list of questions a lay reader would actually ask,
in their words, in the order they would ask them. Write 15 to 25, then cut and
order them. Each answer should make the reader ask the next one.

Good ladder questions are concrete and slightly naive:

- "The World Bank says 2% of Indians are extremely poor. Two percent of what? Living on how much?"
- "Rs 68 a day? Who lives on that?"
- "So if almost nobody is that poor, why does it still feel like most people are struggling?"
- "Why does the World Bank use dollars for India at all?"
- "If poor people work as many hours as everyone else, why are they still poor?"
- "Why do economists keep fighting about this number?"

Bad ladder questions are indicator titles in a question mark: "What is the trend in
the $4.20 headcount ratio?" If a question would not be asked out loud by someone at
a chai stall or a family dinner, rewrite it.

Section headings come from the ladder. The first two sentences under a heading answer
its question. Everything after that is how we know and what it means.

## 4. Sequence: from the biggest beat down

Every article runs the same arc. The proportions change; the order rarely should.

1. **The big beat.** The single largest true statement a normal person can feel,
   in the first two sentences, with a number they can picture. Not the most
   technical finding, not the newest; the one that changes how the reader sees the
   country. For poverty: almost nobody is below the world's lowest line any more,
   and four in five Indians still live on less than about Rs 187 a day.
2. **What that means in a life.** Translate the units into rupees, a household, a
   month's budget, a day's wage. Before the reader can care about a trend, they
   must be able to picture one point on it.
3. **How we got here.** The long change, told as change: what moved, how fast,
   compared with whom.
4. **Who and where.** What the average hides: states, rural and urban, children,
   caste, women, the bunching just above a line.
5. **Why.** The mechanism the evidence supports (jobs, wages, prices, transfers),
   with the honest limit on causation.
6. **The fight over the number.** Measurement disputes belong in the story, and
   usually as one section, after the reader understands what is being measured.
   Opening with them loses the reader before they know why it matters.
7. **What we cannot see, and what would change the answer.** The data gaps, the
   next survey, the open question. End on the sharpest concrete point, not a
   summary.

Parts (the `parts` field) group these into three or four acts. A part's title should
say something, not label a topic ("Out of the pit, not out of the woods", not
"Measurement controversies").

## 5. Explain before you name

- **The thing first, the term second.** "Living on less than about Rs 68 a day, at
  2021 prices, is the World Bank's line for extreme poverty" comes before "$3.00 a
  day in 2021 PPP".
- **Translate every unit into something the reader can hold**: rupees a day or a
  month, people in crore, one in five. Keep the official unit beside it the first
  time, then use whichever reads better.
- **Compare like with like.** When two numbers sit side by side to be compared, put
  them in the same unit and over the same period: "GDP per person grew 62%; a farm
  labourer's wage grew 9%", not "grew by three-fifths" against "0.8% a year". Never set
  a fraction against a percentage, a yearly rate against a total, or crore against
  millions. If a source gives a different form (an annual rate, say), give it once,
  after the matched comparison.
- **One term budget.** An article may lean on a handful of technical terms (often
  three to six). Each gets a plain explanation the first time it appears, then is
  used consistently. A term used once does not need a name at all.
- **No internal vocabulary** in reader text: no file names (`Country_FGT`,
  `DataFig4C_123.dta`), field names, release codes, or modelling jargon like
  "lined-up", "nowcast", "comparability spell" unless explained in the same sentence.

## 6. Boxes: where depth goes without stopping the story

Some ideas need a paragraph the main line cannot afford. Put them in a box beside the
story rather than in the story. Three kinds:

- **Concept box** ("What is PPP?"): what the measure is, how it is built, what it
  can tell you and what it cannot, in 80 to 150 words. One concrete example.
- **Controversy box** ("Tendulkar or Rangarajan: where should the line be?"): the
  question, each side in a sentence or two with who holds it, what the evidence can
  settle and what it cannot, and the writer's honest read.
- **Definition** (one line, the existing `glossaryBlocks`): for a term the reader
  just needs to recognise.

Two to five boxes per article. A box never carries a number the main story depends
on; if the reader skips every box, the story still makes sense.

Until the box component exists, write box text in `glossaryBlocks` (`term`,
`plainMeaning`, `whyItMattersHere`); the first one or two render inline as a box.

## 7. Depth and comprehensiveness

Use the source fully, then choose. The digest lists everything; the story uses what
answers the ladder.

- **Different cuts, one point.** Drive the big beat home from several angles: over
  time, against neighbours, by state, by group, at several lines. Each cut must add
  a new fact, not restate the last.
- **Every major finding in the source about India is either in the story or in the
  digest's skip list with a reason.** The coverage reviewer checks this.
- **Bring in a second source** where the report is silent or contested: the
  Indian survey itself, the government's own line, the critics' estimates.
- **Cross-cutting evidence.** Test the story's claim against series from other
  domains that should move with it. If poverty fell, did wages rise? Did GDP per
  person, household consumption in the national accounts, and the survey all tell
  the same story? A chart that indexes such series to a common year (GDP per person
  against real salaried, casual and self-employed earnings, say) often explains more
  than another cut of the main measure. Before calling a series unavailable, search
  `data/series/` (thousands of artifacts), the MOSPI API adapters, the RBI DBIE client
  (`~/Documents/Bhuvan/Bhuvan projects/RBI DBIE/`) and the Data bank warehouse. Align
  the periods (fiscal years against July-June survey years) and name the deflator.
- **The literature section.** Four to eight papers or reports a reader could go to
  next, each with authors, year, a link, and one line on what it found and why it
  matters here. Only works that were actually opened and checked. Distinct from
  Sources, which list where our numbers came from. Until a dedicated component
  exists, use `furtherReading`.

## 7a. The conversation the article joins

Most questions worth asking already have an argument around them. "Has India ended
poverty?" has been fought over since the 1970s and flares up whenever a survey, a
government claim or a well-known economist's paper lands. A reader who has seen the
latest flare-up on the news needs to know where this article stands in that argument,
or the article reads as if it came from nowhere.

Before designing, the drafting agent writes down two things in the digest:

- **The live debate.** Who is arguing now, what each side claims, what evidence each
  leans on and what set off the latest round. Name people and institutions, and state
  their positions fairly, in terms they would accept.
- **The history, if it explains the present.** The earlier round that set today's
  terms: why a poverty line was drawn where it was, why a survey was redesigned, why
  a number became politically loaded. Use history when it answers "why is it like
  this?". Skip it when it only adds a date.

Use them with judgement:

- **Not every article needs history.** Use it when today's number or dispute cannot
  be understood without it. One well-chosen paragraph usually does more than a timeline.
- **The debate usually belongs after the reader understands what is measured**
  (beat 6 in section 4). The exception is an article that a flare-up prompted: then
  the flare-up can be the hook, in a sentence, before the big beat.
- **Report positions; then hold a view.** Say what each side gets right, what the
  evidence can and cannot settle, and what the writer makes of it. Do not referee by
  word count.
- **Every name, date, quote and position is sourced** and frozen like a number (the
  context-card rule in `docs/academy/VOICE.md`). Nothing comes from model memory, however
  familiar it feels. If a fact cannot be sourced in time, leave it out.
- A long-running controversy is a good candidate for a controversy box (section 6); the
  key papers on each side go into the literature section.

## 7b. Let the sources speak, sparingly

A sentence from the report itself, a government release or a key paper can carry
more authority than our paraphrase, and it shows the reader we read the original.
Use two to four quotes per article, only where the source says the point better
than we could, or where its exact words are what is being argued over.

- Write them as a quote block in the prose: lines starting `> `, closed by a line
  `> Source: author or body, document, year`. They render as a pull quote with
  its source.
- Quote verbatim from the frozen file and record the page in the claim ledger.
  Keep each one under about 40 words. Never quote from memory or a secondary report
  of the words.
- Introduce the quote with a sentence of our own that says why it matters; do not
  stack quotes back to back.
- Short phrases worth keeping ("virtual stagnation") can stay inline in quotation
  marks.

## 8. Rhythm

- **Uneven sections.** The big beat may take six paragraphs; a turn may take two
  lines. Equal-sized sections are a sign that no judgement was made.
- **Alternate the registers**: a number, then what it means in a life, then why.
  Three paragraphs of method in a row is a wall.
- **One chart, one beat.** A chart sits where its question is asked. The prose
  around it says what to see and why it matters, never "the chart shows".
- **A turn in each part.** Each act should change the reader's mind about
  something: the floor rose, *but*; people work, *yet*.
- **Short paragraphs**, two to four sentences. A three-word sentence beside a long one.

## 9. Honesty without hedging every line

Accuracy is enforced by the evidence pipeline. It lives in the right layer:

- **Body text** states the finding plainly, with the one qualifier the reader needs
  not to misuse it ("an estimate, since the last survey was 2023-24").
- **Chart notes** carry how to read the chart and its specific limits.
- **Boxes** carry definitions and disputes.
- **Methodology and caveats** at the end carry the rest: bins, rounding, vintages,
  replication details.

**Reviewers flag; the writer edits.** An audit that finds an overclaim reports it.
It does not insert its own hedge into the prose. The writer fixes the sentence so it
is true *and* readable. Stacked qualifications ("These ratios are approximate because
the API inputs are rounded") are an audit artefact, not writing.

## 10. The macha box

The "Okay bro, what does this mean?" block is the article in three or four sentences
said to a friend: the big beat, what it means for a household, the one thing not to
conclude. It uses the article's most important numbers, never a projection as "the
main number", and never boilerplate. If it could be pasted under any other article,
rewrite it.
