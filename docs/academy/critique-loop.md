# The critique loop

Every academy draft goes through this loop before it can be called ready. The model
self-critiques against these questions; the human runs them again. The point is not
to grade — it is to make the next draft better. Keep looping until a pass produces
nothing worth changing.

## The questions (asked of every draft, in this order)

1. **What is wrong?** Any number not traceable to a locked figure or context card. Any
   claim of cause the data doesn't prove. Any date/name/study not in the evidence. Any
   factual slip. These are disqualifying — fix before anything else.
2. **What is missing?** What would a curious reader still ask after finishing? What
   obvious "but…" went unanswered? Which discipline (history, geography, sociology,
   politics, institutions) would have deepened this and wasn't used?
3. **What can we add?** Which vetted context card, which locked number, which concrete
   Indian scene would make it richer — without padding?
4. **How can this be more relevant to a normal person?** Would a sharp 16-year-old in a
   small town, with no economics, follow every sentence? Where does it still assume
   knowledge they don't have? Where is the abstraction not yet cashed out in something
   they can see — a price, a payslip, a field, a queue?
5. **Does it sound human, or like AI?** Run the `VOICE.md` ban lists and the prose
   linter. Any tell is a defect. Is the rhythm uneven? Is there a real opinion with an
   honest caveat, or just balanced mush?
6. **How can this be better, full stop?** The open question. Cut what isn't working.
   Sharpen the opening and the close. Earn every sentence.

## The bar (a draft is "ready" only when all are true)

- A domain expert finds nothing dumbed-down or wrong.
- A reader with no economics understands every sentence.
- Zero invented numbers, dates, names. Every figure has a vintage and a source.
- At least one concrete, sourced Indian particular per paragraph.
- Zero hard AI-tells from the linter; the human read-aloud doesn't lull.
- It teaches the concept, holds a view, and names the honest caveat.
- It reaches at least one discipline beyond economics, using a vetted card.

## How the loop runs in code

`generate-entry.mjs` does: **draft → lint → self-critique (these questions) → revise**,
and writes both the draft and the revised version plus the critique so a human can
see what the model thought was weak. Re-run with a sharpened brief until it converges.
