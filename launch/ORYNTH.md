# Boop — Orynth launch kit

Everything below is copy-paste ready. Nothing in it invents a user count,
revenue figure, partner, award or testimonial, because none exist yet.

---

## The basics

**Product name**
Boop

**Tagline**
Know what people pick before you ship.

**One-line pitch**
Human taste tests for builders — drop two versions, get real decisions, ship the
winner.

**Ticker suggestion**
BOOP

**URL**
https://boop.cool

**Suggested categories**
SaaS · Productivity · Design Tools · Marketing Tools

---

## Orynth description (< 500 characters)

> AI can generate a hundred homepages before lunch. It can't tell you which one
> a stranger would trust.
>
> Boop is a human taste test. Drop two versions of anything you're about to
> ship — a hero, a logo, a pricing table, two CTA lines — ask one question, and
> real people pick one. You get counts, a confidence read, and the reasons
> behind the split.
>
> Give boops, earn credits, spend credits. Free to start.

*(486 characters.)*

---

## Founder's first comment

> Hi — I built Boop.
>
> The thing that broke for me this year is that making options stopped being
> hard. I can produce nine credible versions of a homepage in an afternoon now.
> What I can't do is tell which one a stranger would trust, and I'm the worst
> possible judge because I made all nine.
>
> So I'd ask a model. And I'd get a fluent, confident paragraph about visual
> hierarchy that was worth absolutely nothing, because nobody had chosen
> anything. It was predicting what a design critique sounds like.
>
> Boop does the boring, unglamorous thing instead: it puts both versions in
> front of people and counts. One tap. Optionally one reason. That's the whole
> interaction.
>
> Some specifics, since this crowd will ask:
>
> - **The confidence number is real.** A winner is only declared once the entire
>   95% Wilson interval for the leader clears 50%. Below that you get "Early
>   signal", not a result. I'd rather tell you your test is inconclusive than
>   sell you a 55/45 as a decision.
> - **AI does exactly one job.** It reads the written comments and groups them
>   into themes so you don't skim ninety sentences. It never votes, never writes
>   a comment, never changes a count. It's labelled everywhere it appears.
> - **The sample is self-selected internet builders.** That's the right room for
>   "does this read as trustworthy" and the wrong room for anything needing a
>   specific profession. Audience filters are on the roadmap and clearly marked
>   as not built.
> - **The sample tests you'll see are fictional** and badged Demo. I seeded them
>   so the feed isn't an empty room on day one, not to imply traffic I don't
>   have.
>
> It's free to use — you earn credits by giving feedback to other people. Buying
> a pack is a shortcut for when you're in a hurry, not the entrance.
>
> There's also a 5 Second Test: one design for five seconds, then it's gone, then
> one recall question. A comparison tells you which version wins. That tells you
> whether anything landed at all. It's the feature I use most on my own work and
> the one that's most often humbling.
>
> Happy to answer anything. If you've got a decision you're stuck on, post the
> two versions in the comments and I'll run it.

---

## Suggested screenshots (5, in order)

1. **The homepage hero with the interactive demo mid-reveal.**
   67% / 33%, winner badge, "High confidence", reason chips visible. This is the
   whole product in one frame — lead with it.

2. **The feed, mid-decision.**
   Two variants side by side, question above, keyboard shortcut rail on the
   right. Shows that giving feedback takes seconds, which is the half of the
   loop people don't expect.

3. **A results page, full width.**
   "B wins — 67%", the split with confidence whiskers, reason breakdown, and the
   AI summary panel with its "Model-written" badge and the disclaimer visible.
   The whiskers are the differentiator; don't crop them out.

4. **The 5 Second Test, at the recall question.**
   Black "Time's up" state with "What does this product do?" and the empty
   answer field. It reads as a distinct product, not a setting.

5. **The create wizard on step 2 or 5.**
   Either the two dropzones or the response-count picker with the live credit
   cost. Proves the "under a minute" claim rather than asserting it.

---

## Suggested launch post for X

**Option A — the thesis**

> AI can generate a hundred homepages before lunch.
>
> It still can't tell you which one a stranger would trust.
>
> So I built Boop. Drop two versions, ask one question, real people pick one.
> You get counts, a confidence interval, and the reasons behind the split.
>
> Free to start → boop.cool

**Option B — the demo**

> I keep shipping the version I like and being wrong about it.
>
> Boop: two versions, one question, real humans pick.
>
> No AI critique. No "consider the visual hierarchy." Just 82 people, 67%, and
> eleven sentences explaining why.
>
> boop.cool

**Reply to either, with the 5 Second Test clip:**

> There's also a 5 Second Test. You see one design for five seconds, then it's
> gone, then one question: what do you remember?
>
> A comparison tells you which version wins. This tells you whether anything
> landed at all.
>
> It is consistently the most humbling five seconds of my week.

---

## Product thumbnail treatment

Square, 240×240, and it has to survive being 48px in a list.

- Pure black `#111111` field, generous margin, nothing else.
- The Boop mark centred in white: filled circle, outlined circle, one small
  contact dot between them. Drop the outer ripple ring — it turns to mush below
  64px.
- No wordmark, no gradient, no drop shadow, no 3D. The mark alone.

The mark is already built for this. `public/brand/favicon.svg` is the
small-size cut; scale it up rather than redrawing.

If the listing supports a wide banner instead, use the black type-only
treatment: "Know what people pick before you ship." set large in white on
`#111111`, one thin rule underneath, `boop.cool` bottom-left. Every other
listing on the page will be white and colourful.

---

## Things to not say

Written down because they'd be easy to drift into:

- No user, vote, revenue or waitlist numbers. There aren't any yet.
- No testimonials, no logos, no "trusted by".
- Nothing framing BOOP as an investment, a return, or a financial instrument.
- Don't describe roadmap items — audience filters, private panels, team
  workspaces, the API — as available. They're marked "Planned" in-product and
  should be marked that way anywhere else.
- Don't call the seeded tests real activity. They're fictional and badged Demo.
- Don't claim statistical representativeness. Boop measures what these humans
  picked, not what everyone would pick, and the product says so in three places.
