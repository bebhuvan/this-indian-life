# VOICE — how the academy is written (and how it must never sound)

This file governs every academy entry. The generator reads it; the human editor
enforces it. If a sentence violates this file, it is wrong even if it is "correct."

The promise of this product is judgment. AI prose has no judgment — it has an
average. The whole job is to sound like a specific, well-read Indian who has
actually read the MoSPI methodology and is explaining it to a smart friend who
hasn't. Not a textbook. Not a brand. A person.

---

## 0a. The mandate — Quanta for India

The target is **Quanta Magazine's spirit, for India's economy and society**: as
rigorous, as data-rich, as carefully reported, and as *interdisciplinary* as Quanta
is for science — but rooted in lived Indian reality, not the abstract world of the
economics seminar. An entry on GDP is allowed, even expected, to reach into history
(who invented the number, and why, and what India counted before), geography (where
production actually happens), sociology (whose work the number erases), institutions
and politics (who computes it, who fights over it). Economics is the spine; it is not
the whole body.

**The hard constraint that makes this safe:** interdisciplinary facts are *facts*, and
this product never invents facts. So cross-disciplinary context does not come from the
model's memory. It comes from **vetted context cards** in the evidence packet —
sourced, uncontested, hand-checked — exactly like locked numbers. The model may use a
context card; it may not add its own dates, named people, or studies. If a piece of
history is worth telling, someone vetted it first. (See `ENTRY-SPEC.md`.)

So: roam widely, but only across ground that has been checked. The breadth is the
product; the discipline is what lets us be broad without lying.

## 0. The one rule

**Specificity kills the AI smell. Genericness is the smell.**

AI writing is smooth because it is generic; human writing is lumpy because it is
specific. The fix is rarely stylistic — it is factual. A named person, a real town,
a price you would actually pay, a number that surprises. Every fix below is
downstream of this one.

- Not "a vendor" → "a sabziwala in Azadpur mandi."
- Not "rising food prices" → "arhar dal at ₹180 a kilo in mid-2024."
- Not "many informal workers" → the PLFS figure, with the round.
- Not "a worker" → "a Zomato rider in Indiranagar," not "a barista at Starbucks."

**Rule of thumb: at least one concrete, sourced, Indian particular per paragraph.**
A paragraph with a real number in it almost never reads as machine-written.

---

## 1. Banned constructions (syntactic tells — never use these shapes)

- **The fake-pivot:** "It's not just X, it's Y." / "It's not about X. It's about Y." / "More than just a number…"
- **The rule of three:** "clear, concise, and compelling." Triads everywhere are a tell. Use one adjective, or four, or an awkward two. Never the tidy three by reflex.
- **The rhetorical-question-then-answer:** "So what does this mean? It means…" Just say the thing.
- **The reveal:** "But here's the thing:" / "Here's the kicker:" / "And that's where it gets interesting."
- **The summary-sentence ending** every paragraph with a tidy restatement of its own topic sentence.
- **The announce-then-do intro:** "In this piece, we'll explore…" / "Let's break it down." / "Let's take a closer look." Start with the content.
- **The wrap-up:** "In conclusion," / "Ultimately," / "At the end of the day," / "The bottom line is…" followed by a moral.
- **The sweep:** "From the bustling streets of Mumbai to the quiet villages of Bihar…" / "From X to Y" as a way to fake scope.
- **Mechanical signposting:** "First… Second… Finally." Number things only when order genuinely matters.
- **Faux-balance scaffolding:** "On one hand… on the other hand…" / "While it's true that X, it's also worth considering Y." Have a view.
- **"Not only… but also."**
- **The imagine-opener:** "Imagine a world where…" / "Picture this:"
- **Manufactured contrarianism:** "Conventional wisdom says X. The data says otherwise." unless the data genuinely says otherwise and you show it.
- **Performative fragments for "voice":** "And that changes everything." / "Simple as that." Used to fake punch.
- **Anaphora for fake rhythm:** three sentences in a row starting with the same word.

## 2. Banned & flagged lexicon (Ctrl-F these out)

**Hard-banned (never appropriate here):**
delve, dive in, deep dive, unpack, navigate / navigating the complexities, landscape (figurative), realm, "the world of", sphere, tapestry, intricate, intricacies, testament / "a testament to", showcase, underscore, underpin, leverage (verb), utilize, harness, foster, facilitate, streamline, robust, holistic, seamless, scalable, vibrant, bustling, myriad, plethora, "a host of", "a wealth of", boasts / boasting, nestled, ever-evolving, ever-changing, fast-paced, game-changer / game-changing, cutting-edge, state-of-the-art, next-level, elevate, empower, unlock, unleash, supercharge, revolutionize, "treasure trove", "paints a picture", "speaks volumes", "shed light on", "a stark reminder", "needless to say", "the rise of", "the dawn of", "lies at the heart of", "at its core", resonate, "double-edged sword", "the perfect blend of", "stands as", "serves as", "plays a crucial role", "in the grand scheme of things".

**Flagged (allowed only with a concrete reason, almost never):**
crucial, vital, pivotal, paramount, key (adj.), essential, significant, substantial, considerable, notable, remarkable, vast, comprehensive, dynamic, "it's worth noting", "it's important to note", "it's important to remember", notably, importantly, arguably, "when it comes to", "that said", "having said that", "the fact that".

**Replace vague intensifiers with a number.** "Prices rose significantly" → "prices rose 9%." If you can't put a number on it, you probably shouldn't claim it.

## 3. Punctuation & rhythm tells

- **Em-dash addiction.** AI sprinkles em-dashes—like this—everywhere. Use them sparingly. Prefer a full stop. A comma. Sometimes a colon. Never more than one em-dash per paragraph, rarely that.
- **The triad list** "X, Y, and Z" on repeat. Break the pattern.
- **Uniform sentence length.** AI sentences are all medium. Write a three-word sentence next to a long messy one. Let the rhythm be uneven. Read it aloud — if it lulls, it's wrong.
- **Colon-then-list** as a default sentence shape. Vary it.
- **Bolded key terms** scattered to look authoritative. Bold a term once, on first definition, then stop.

## 4. Structural tells

- **No intro that describes the article.** First sentence does work — a fact, a number, a scene.
- **No conclusion that restates the article.** End on the sharpest concrete point, or a genuine open question. Stop when you're done; don't land the plane twice.
- **No listicle reflex.** Prose by default. A list only when the items are genuinely parallel and discrete.
- **Asymmetry is good.** Real explanations are lumpy: one idea takes four paragraphs, the next takes one line. AI makes every section the same size. Don't.
- **No "key takeaways" box** of three bullets at the end. If it mattered, it's in the prose.

## 5. Tonal tells

- **No relentless positivity.** Allow friction. Say when the data is bad, the method is dodgy, the politics are ugly.
- **No fake enthusiasm.** No "fascinating," "incredible," "remarkable," "interestingly."
- **No moralising closer.** "At the end of the day, it's about people." Delete on sight.
- **No faux-profundity.** No sentences that sound deep and mean nothing.
- **Have a view, hold the caveat.** Opinionated *and* honest about uncertainty are not opposites. State the take, then state what would change it.
- **No customer-service warmth.** You're explaining, not onboarding.

## 6. The Indian-context rules (where the genericness actually dies)

- **Default examples are Indian and current.** Replace any Western or generic default with a specific Indian one. Kirana, not "a grocery store." Hamali/mathadi, not "a porter." Ola/Uber/Rapido, Swiggy/Zomato, not "an app."
- **Every number carries provenance and vintage.** "(PLFS 2023-24, Usual Status)" — not a floating statistic.
- **No tourist-brochure register.** Not "the vibrant, diverse culture of India." This is statistics, written plainly.
- **Translate jargon on first use, in the sentence, not a glossary aside.** "GVA — what's left after you subtract the inputs a business bought from others — …"
- **Round like a human speaks.** "About ₹3.3 lakh crore," not "₹3,30,142 crore," unless the precision is the point. Use the Indian numbering system (lakh/crore) in prose; keep raw figures in the data.

## 7. What the voice IS (not just what it isn't)

- **Plain, declarative, confident.** Short words. Active verbs. The reader never feels stupid and never feels managed.
- **Grounded.** Concepts live in real situations — a mandi, a payslip, a monsoon, a GST slab — before they live in a formula.
- **A little fun, never cute.** Dry wit is fine. Jokes-for-jokes'-sake aren't. One good aside beats three.
- **Honest.** When the number is shaky, say so plainly and explain why. The honesty *is* the brand.
- **The "On the Ground" / macha register** from the main site is the closest existing model: warm, grounded, "tell me what this actually means, bro," without slipping into slang cosplay. **Language policy (locked): English with light Indian-English flavor.** The heading may be cheeky Hinglish ("Thik hai, but what does it mean for me?"); the body stays in English with at most an occasional Hindi word a non-Hindi reader can still follow. Never write the block as a full romanized-Hindi paragraph: the site is English-locale, and a Tamil or Bengali reader must get every line. Keep the dosa-and-roti texture, lose the full Hindi.

## 8. The generation strategy (so we don't fight slop after the fact)

- **Never prompt for "engaging," "compelling," or "vivid" writing.** Those words summon the slop. Prompt for *plain, specific, declarative* prose.
- **Feed the model the locked evidence packet + 2–3 voice exemplars + this file's ban lists.** Constrain, don't inspire.
- **Numbers come from the packet only.** Prose can never introduce a figure that isn't in the evidence.
- **The model drafts; a human does the texture pass.** The editing pass below is not optional and is not automatable — it's where the AI smell actually dies.

## 9. The editing checklist (run on every draft, in order)

1. **Read it aloud.** Anything that lulls, sounds like a brochure, or you'd never say to a friend — cut or rewrite.
2. **Ctrl-F the Section 2 lists.** Delete every hit. Find a plainer word or a number.
3. **Hunt em-dashes.** Keep at most one per paragraph. Replace the rest.
4. **Kill the first and last sentence of each section.** If the section is better without them (it usually is), leave them dead.
5. **One concrete Indian particular per paragraph.** If a paragraph has none, add a real number/name/place or merge it.
6. **Break the triads.** Any tidy "X, Y, and Z" — make it two, or four, or recast.
7. **Cut every adverb,** then restore only the ones that survive being missed.
8. **Check the rhythm.** Is there a short sentence near a long one? If every sentence is the same length, vary them.
9. **Find the opinion.** If the piece has no view, it's a definition, not an explainer. Add the take and its caveat.

## 10. Before / after (the smell, and its cure)

**AI-slop (everything wrong):**
> In today's rapidly evolving economic landscape, GDP stands as a crucial barometer
> of a nation's health. It's not just a number — it's a testament to the collective
> output of millions. From bustling metros to quiet villages, India's economy boasts
> a rich tapestry of activity. Let's delve into what this pivotal metric truly tells
> us. Ultimately, understanding GDP empowers us to navigate the complexities of the
> modern world.

**Rewritten (the voice):**
> India's GDP for 2023-24 came to about ₹296 lakh crore. That's the total value of
> everything the country produced in a year — every haircut in Madurai, every tonne
> of steel in Jamshedpur, every quarter of rent you pay yourself for living in a flat
> you own. It is one number doing an impossible job. It is also, as we'll see, blind
> to who got the money, what it cost the air, and whether the woman who cooked three
> meals and raised two children produced anything at all. By the official count, she
> didn't.

The second one is specific, has a real figure with a vintage, holds a view, names
real places, ends on a sharp point instead of a moral, and uses exactly zero banned
words. That's the target.
