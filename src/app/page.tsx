import Link from "next/link";
import type { Metadata } from "next";
import { HeroDemo } from "@/components/home/HeroDemo";
import { FiveSecondDemo } from "@/components/home/FiveSecondDemo";
import { PricingTable } from "@/components/pricing/PricingTable";
import { TestCard } from "@/components/test/TestCard";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, DemoBadge, InfoTip, SectionLabel } from "@/components/ui/Primitives";
import { BoopMark } from "@/components/brand/Logo";
import {
  CREDITS,
  ROADMAP,
  SITE,
  isStripeEnabled,
  isSupabaseConfigured,
} from "@/lib/config";
import { CONFIDENCE_EXPLAINER } from "@/lib/stats";
import { getViewer, listFeed } from "@/lib/data/read";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [feed, viewer] = await Promise.all([listFeed({ limit: 6 }), getViewer()]);

  return (
    <>
      <Hero />
      <UpAndRunning />
      <HowItWorks />
      <LiveSignal tests={feed} />
      <NotAnAiOpinion />
      <FiveSecondSection />
      <UseCases />
      <ResultsSection />
      <Roadmap />
      <Philosophy />
      <Pricing signedIn={Boolean(viewer.profile)} />
      <Faq />
      <FinalCta />
    </>
  );
}

/* ========================================================================== */
/* Hero                                                                        */
/* ========================================================================== */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-14 sm:px-8 sm:pb-16 sm:pt-24">
        <p className="eyebrow">Human taste &gt; another AI opinion</p>

        <h1 className="display mt-5 max-w-[16ch] text-[clamp(2.75rem,8.5vw,5.5rem)]">
          Ship the one people actually pick.
        </h1>

        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted sm:text-[19px]">
          Drop two versions. Get fast human decisions on your landing page, logo,
          screenshot, pricing, or anything else you&rsquo;re about to ship.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/new" size="lg">
            Run a taste test
          </ButtonLink>
          <ButtonLink href="/feed" size="lg" variant="secondary">
            Start booping
          </ButtonLink>
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-faint">
          <span>{CREDITS.STARTER_GRANT} free credits to start</span>
          <span aria-hidden="true">·</span>
          <span>No card</span>
          <span aria-hidden="true">·</span>
          <span>Vote without an account</span>
        </p>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8 sm:pb-24">
        <HeroDemo />
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 01 — Up and running                                                         */
/* ========================================================================== */

const STEPS = [
  {
    n: "1",
    title: "Pick what you're testing",
    body: "Landing page, logo, screenshot, copy, pricing — or anything else.",
  },
  {
    n: "2",
    title: "Drop A and B",
    body: "Drag two images in, or type two lines of copy. Nothing else to configure.",
  },
  {
    n: "3",
    title: "Choose the question",
    body: "Take a suggested one or write your own. This is the only part that needs thought.",
  },
  {
    n: "4",
    title: "Set how many humans",
    body: `${CREDITS.RESPONSE_PRESETS.join(", ")} or a number you pick. One credit per response.`,
  },
];

function UpAndRunning() {
  return (
    <section className="section-rule paperfield">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionLabel index="01">Up and running</SectionLabel>
        <h2 className="display mt-5 max-w-[18ch] text-[clamp(2rem,5vw,3.25rem)]">
          From upload to an answer in under a minute.
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-paper p-6">
              <span className="font-mono text-[11px] tabular-nums text-faint">
                0{step.n}
              </span>
              <h3 className="mt-4 text-[15px] font-medium tracking-[-0.01em]">
                {step.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ButtonLink href="/new" variant="secondary">
            Open the builder
          </ButtonLink>
          <span className="text-[13px] text-faint">
            Seven steps, most of them one tap.
          </span>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 02 — How it works                                                           */
/* ========================================================================== */

const LOOP = [
  {
    verb: "Drop it.",
    body: "Two versions of the thing you can't decide on. Images or copy.",
  },
  {
    verb: "Ask it.",
    body: "One question, in plain language. “Which one would you trust enough to buy?”",
  },
  {
    verb: "Boop it.",
    body: "Real people compare and pick. One tap, one reason, thirty seconds.",
  },
  {
    verb: "Ship it.",
    body: "You get counts, a confidence read and the reasons behind the split.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="section-rule scroll-mt-20">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionLabel index="02">How it works</SectionLabel>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <h2 className="display text-[clamp(2.25rem,6vw,4rem)]">
              Drop it.
              <br />
              Ask it.
              <br />
              Boop it.
              <br />
              Ship it.
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted">
              The loop runs both ways. Give boops to earn credits, spend credits
              to get boops. That&rsquo;s the entire economy — no seats, no
              contracts, no waiting for a research panel to schedule you in.
            </p>
          </div>

          <ol className="space-y-px overflow-hidden rounded-xl border border-line bg-line">
            {LOOP.map((item, i) => (
              <li key={item.verb} className="flex gap-5 bg-paper p-6">
                <span className="font-mono text-[11px] tabular-nums text-faint">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="text-[17px] font-medium tracking-[-0.02em]">
                    {item.verb}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* The flywheel, stated plainly. */}
        <div className="mt-12 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-sand px-5 py-4 text-[13px]">
          <span className="font-medium">The loop:</span>
          {[
            "Give boops",
            "Earn credits",
            "Run your test",
            "Others boop it",
            "You ship",
          ].map((step, i, arr) => (
            <span key={step} className="flex items-center gap-2 text-muted">
              {step}
              {i < arr.length - 1 && (
                <span aria-hidden="true" className="text-faint">
                  →
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 03 — Live signal                                                            */
/* ========================================================================== */

function LiveSignal({ tests }: { tests: Awaited<ReturnType<typeof listFeed>> }) {
  if (tests.length === 0) return null;
  const anyDemo = tests.some((t) => t.isDemo);

  return (
    <section className="section-rule bg-sand">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel index="03">Live signal</SectionLabel>
            <h2 className="display mt-5 max-w-[16ch] text-[clamp(2rem,5vw,3.25rem)]">
              Open right now, waiting on humans.
            </h2>
          </div>
          <ButtonLink href="/feed" variant="secondary">
            Open the feed
          </ButtonLink>
        </div>

        {anyDemo && (
          <p className="mt-6 flex items-center gap-2 text-[13px] text-muted">
            <DemoBadge />
            Tests marked Demo are fictional examples seeded with this
            deployment, not real human responses.
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.slice(0, 6).map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 04 — Not another AI opinion                                                 */
/* ========================================================================== */

function NotAnAiOpinion() {
  return (
    <section className="section-rule">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-28">
        <SectionLabel index="04">Not another AI opinion</SectionLabel>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <h2 className="display text-[clamp(2.25rem,6vw,4.25rem)]">
            Machines generate options.
            <br />
            <span className="text-muted">People choose products.</span>
          </h2>

          <div className="space-y-5 text-[15px] leading-relaxed text-muted lg:pt-3">
            <p>
              You can produce forty homepages before lunch now. That was the hard
              part, and it stopped being hard. The bottleneck moved: you have
              options and no idea which one a stranger would trust.
            </p>
            <p>
              Ask a model which one is better and you get a confident paragraph
              assembled from everything that has ever been written about design.
              It is articulate, it is instant, and it is not a preference. Nobody
              chose anything.
            </p>
            <p className="text-ink">
              Boop measures the choice. Someone looked at both, picked one, and
              told you why. That&rsquo;s a different kind of number — and it is
              the only one that predicts what happens when you ship.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          <div className="bg-paper p-6 sm:p-8">
            <span className="eyebrow">What a model gives you</span>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              &ldquo;Variant B demonstrates stronger visual hierarchy and a more
              conventional information architecture, which may improve
              comprehension for first-time visitors.&rdquo;
            </p>
            <p className="mt-4 text-[13px] text-faint">
              Plausible. Unfalsifiable. Zero humans involved.
            </p>
          </div>
          <div className="bg-paper p-6 sm:p-8">
            <span className="eyebrow">What Boop gives you</span>
            <p className="mt-4 text-[34px] font-medium leading-none tracking-[-0.04em]">
              67% picked B
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              82 people. Top reason: &ldquo;Easier to understand.&rdquo; Eleven of
              them wrote a sentence explaining it.
            </p>
            <p className="mt-4 text-[13px] text-faint">
              A count, an interval, and the reasons underneath.
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-faint">
          Boop does use a model for one job: reading the written comments and
          grouping them into themes, so you don&rsquo;t have to skim ninety
          sentences. It never casts a vote and never invents feedback. Every
          number on a results page comes from a person who clicked.
        </p>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 05 — Five second test                                                       */
/* ========================================================================== */

function FiveSecondSection() {
  return (
    <section id="five-second" className="section-rule scroll-mt-20 bg-ink text-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-28">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] tabular-nums text-[#6a6a68]">05</span>
          <span className="eyebrow text-[#8f8f8d]">5 Second Test</span>
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="display text-[clamp(2.25rem,6vw,4rem)]">
              Five seconds is sometimes all you get.
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#a8a8a6]">
              Nobody studies your homepage. They glance, they form an impression,
              and they decide whether to keep reading. A comparison tells you
              which version wins. A 5 Second Test tells you whether anything
              landed at all.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                ["Show one design for exactly five seconds.", "No scrubbing, no second look."],
                ["Hide it, then ask one question.", "What do you remember? What does it do?"],
                ["Read the answers side by side.", "The gap between intent and recall is the finding."],
              ].map(([head, sub]) => (
                <li key={head} className="flex gap-4">
                  <BoopMark size={16} ripple={false} />
                  <div>
                    <p className="text-[14px] font-medium">{head}</p>
                    <p className="mt-0.5 text-[13px] text-[#8f8f8d]">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-ink">
            <FiveSecondDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 06 — Use cases                                                              */
/* ========================================================================== */

const USE_CASES = [
  { title: "Landing pages", body: "Hero, above the fold, the whole page.", q: "Which one would make you try it?" },
  { title: "Logos", body: "Marks, wordmarks, the small-size test.", q: "Which would you remember tomorrow?" },
  { title: "UI", body: "Screens, components, navigation shape.", q: "Which one feels easier to use?" },
  { title: "Pricing", body: "Tables, tiers, packaging.", q: "Which is easier to understand?" },
  { title: "Screenshots", body: "App store, listings, docs.", q: "Which makes you want to try it?" },
  { title: "Ads", body: "Static creative, social graphics.", q: "Which would you stop scrolling for?" },
  { title: "Names", body: "Two finalists, said out loud.", q: "Which is easier to say?" },
  { title: "Copy", body: "Taglines, CTAs, empty states.", q: "Which line would make you click?" },
];

function UseCases() {
  return (
    <section className="section-rule">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionLabel index="06">Use cases</SectionLabel>
        <h2 className="display mt-5 max-w-[20ch] text-[clamp(2rem,5vw,3.25rem)]">
          If you can put two of them side by side, you can test it.
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((c) => (
            <div key={c.title} className="group bg-paper p-6">
              <h3 className="text-[15px] font-medium tracking-[-0.01em]">{c.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.body}</p>
              <p className="mt-4 border-t border-line pt-3 text-[12px] leading-snug text-faint">
                &ldquo;{c.q}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 07 — Results                                                                */
/* ========================================================================== */

function ResultsSection() {
  const bars = [
    { label: "A", title: "Centered", share: 33, votes: 27 },
    { label: "B", title: "Split, with the product", share: 67, votes: 55 },
  ];
  const reasons = [
    { label: "Easier to understand", count: 31 },
    { label: "More trustworthy", count: 18 },
    { label: "I'd click this", count: 12 },
    { label: "Cleaner", count: 9 },
  ];

  return (
    <section className="section-rule bg-sand">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionLabel index="07">Results</SectionLabel>
        <h2 className="display mt-5 max-w-[18ch] text-[clamp(2rem,5vw,3.25rem)]">
          A number, an interval, and the reasons underneath.
        </h2>

        <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-paper">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-8 sm:py-6">
            <div>
              <p className="text-[13px] text-muted">
                &ldquo;Which homepage would make you try the product?&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-[40px] font-medium leading-none tracking-[-0.04em] sm:text-[52px]">
                  B wins
                </span>
                <span className="text-[28px] font-medium tabular-nums leading-none tracking-[-0.03em] text-muted sm:text-[34px]">
                  67%
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge tone="positive">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                High confidence
                <InfoTip label="How confidence is calculated">
                  {CONFIDENCE_EXPLAINER}
                </InfoTip>
              </Badge>
              <span className="text-[13px] tabular-nums text-muted">82 boops</span>
              <DemoBadge />
            </div>
          </div>

          <div className="grid gap-px bg-line lg:grid-cols-[1.2fr_1fr]">
            {/* Chart */}
            <div className="bg-paper px-5 py-6 sm:px-8 sm:py-8">
              <span className="eyebrow">Split</span>
              <div className="mt-5 space-y-5">
                {bars.map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-2 text-[14px]">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                            bar.share > 50 ? "bg-ink text-paper" : "bg-sand-deep"
                          }`}
                        >
                          {bar.label}
                        </span>
                        <span className="text-muted">{bar.title}</span>
                      </span>
                      <span className="tabular-nums text-[14px] font-medium">
                        {bar.share}%
                        <span className="ml-2 text-[12px] font-normal text-faint">
                          {bar.votes}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line-soft">
                      <div
                        className={`h-full rounded-full ${bar.share > 50 ? "bg-ink" : "bg-faint"}`}
                        style={{ width: `${bar.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-line pt-5">
                <span className="eyebrow">Top reasons</span>
                <ul className="mt-4 space-y-2.5">
                  {reasons.map((r) => (
                    <li key={r.label} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 truncate text-[13px] text-muted sm:w-48">
                        {r.label}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                        <span
                          className="block h-full rounded-full bg-ink/70"
                          style={{ width: `${(r.count / 31) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-faint">
                        {r.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Synthesis */}
            <div className="bg-paper px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex items-center gap-2">
                <span className="eyebrow">AI summary of human feedback</span>
              </div>
              <p className="mt-4 text-[14px] leading-relaxed">
                B won on comprehension, not aesthetics — people said A looked
                better and still picked B because it showed the product. The
                recurring complaint about A is that nothing on screen says what
                the company does.
              </p>

              <div className="mt-6 space-y-4">
                {[
                  ["Strongest signal", "Seeing a real payout row made the product feel legitimate — six people mentioned it unprompted."],
                  ["Biggest concern", "Three voters found B's right-hand panel busy. The win is the screenshot, not the density."],
                  ["Next action", "Ship B, then test B against a version with one card removed from the panel."],
                ].map(([head, body]) => (
                  <div key={head}>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-faint">
                      {head}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-faint">
                The model reads the comments. It never casts a vote, never writes
                one, and never changes a count.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[12px] text-faint">
          Illustrative results page built from the fictional sample test above.
        </p>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 08 — Roadmap                                                                */
/* ========================================================================== */

function Roadmap() {
  return (
    <section id="roadmap" className="section-rule scroll-mt-20">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel index="08">What we&rsquo;re building next</SectionLabel>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(2rem,5vw,3.25rem)]">
              Not shipped yet. Being built in the open.
            </h2>
          </div>
          <p className="max-w-xs text-[13px] leading-relaxed text-faint">
            Everything on this page above this line exists today. Everything
            below is planned work — no dates, no promises.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((item) => (
            <div
              key={item.id}
              className="flex flex-col rounded-xl border border-dashed border-line bg-sand p-6"
            >
              <div className="flex items-center justify-between">
                <Badge tone="outline">{item.status}</Badge>
                <span className="text-[10px] uppercase tracking-[0.14em] text-faint">
                  Planned
                </span>
              </div>
              <h3 className="mt-5 text-[17px] font-medium tracking-[-0.02em]">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">
                {item.body}
              </p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {item.signals.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] text-faint"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 09 — Philosophy / who's behind it                                           */
/* ========================================================================== */

function Philosophy() {
  return (
    <section className="section-rule bg-sand">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionLabel index="09">Behind it</SectionLabel>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <h2 className="display text-[clamp(1.875rem,4.5vw,2.75rem)]">
            Built by people who kept shipping the version they liked, and being
            wrong about it.
          </h2>
          <div className="space-y-5 text-[15px] leading-relaxed text-muted">
            <p>
              Boop is a small, independent product. It exists because the loop it
              describes is one we wanted and couldn&rsquo;t buy: not a research
              platform with a sales call, not a Slack poll of four colleagues who
              already know what you&rsquo;re hoping to hear.
            </p>
            <p>
              The design of the product is the argument. It is quiet, it is
              mostly white, and it gets out of the way of the thing you uploaded
              — because the thing you uploaded is what people are supposed to be
              looking at.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-[14px] text-ink underline-offset-4 hover:underline"
            >
              Read why human taste still matters
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 10 — Pricing                                                                */
/* ========================================================================== */

function Pricing({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="pricing" className="section-rule scroll-mt-20">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionLabel index="10">Pricing</SectionLabel>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display max-w-[16ch] text-[clamp(2rem,5vw,3.25rem)]">
            One credit. One human response.
          </h2>
          <p className="max-w-sm text-[14px] leading-relaxed text-muted">
            No seats, no subscription required. Earn credits by helping other
            builders, or buy a pack when you&rsquo;re in a hurry.
          </p>
        </div>

        <div className="mt-12">
          <PricingTable stripeEnabled={isStripeEnabled()} signedIn={signedIn} />
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 11 — FAQ                                                                    */
/* ========================================================================== */

const FAQ = [
  {
    q: "What is a Boop?",
    a: "One human decision. A person looks at your two versions, picks one, and optionally tags why. That single act is the unit Boop is built around — it's the vote, the credit and the name.",
  },
  {
    q: "Who is voting?",
    a: "Other people using Boop: founders, designers, developers, marketers and anyone who wandered into the feed. It's a general audience of internet builders, not a screened research panel. That's the right sample for “does this read as trustworthy” and the wrong one for “would a hospital procurement officer buy this.” Audience filters and private panels are on the roadmap, and are marked as not built yet.",
  },
  {
    q: "Can tests be private?",
    a: "Yes. Unlisted tests stay out of the public feed and are reachable only by link. Private tests are visible to you alone and are how you'd run a test against an audience you bring yourself. Public tests are the default because they're what earns you responses from the feed.",
  },
  {
    q: "How do credits work?",
    a: `New accounts get ${CREDITS.STARTER_GRANT} credits. You earn ${CREDITS.EARN_AMOUNT} more for every ${CREDITS.VOTES_PER_EARN} boops you give, plus a bonus for leaving written feedback. Requesting one human response costs ${CREDITS.COST_PER_RESPONSE} credit. Buying a pack is a shortcut, not a requirement — the loop works without spending anything.`,
  },
  {
    q: "Can I test copy instead of images?",
    a: "Yes, and it's one of the most useful things to test. Type two names, taglines or CTA lines and Boop typesets them properly rather than showing them as raw text, because how a line reads at size is part of what you're judging.",
  },
  {
    q: "What is a 5 Second Test?",
    a: "You show one design for exactly five seconds, then hide it and ask a single recall question — what do you remember, what does this do, what would you click. It measures whether anything landed at all, which a head-to-head comparison can't tell you.",
  },
  {
    q: "Are responses AI generated?",
    a: "No. Every vote and every comment comes from a person. AI is used for exactly one job: reading the written feedback and grouping it into themes so you don't have to skim ninety comments. It is labelled as such everywhere it appears, it never casts a vote, and it never changes a count. Sample tests seeded with the app are clearly marked Demo.",
  },
  {
    q: "How is confidence calculated?",
    a: "With a 95% Wilson score interval on the leading variant's share. A winner is only declared once the whole interval sits above 50% — meaning the observed preference is consistent enough that a coin flip is excluded at that sample size. Below that you'll see “Early signal” or “Moderate signal” instead of a result. It describes consistency at this sample size, not a guarantee about everyone on the internet.",
  },
];

function Faq() {
  return (
    <section id="faq" className="section-rule scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        <SectionLabel index="11">Questions</SectionLabel>
        <h2 className="display mt-5 text-[clamp(2rem,5vw,3.25rem)]">Answered.</h2>

        <div className="mt-12 overflow-hidden rounded-xl border border-line bg-paper">
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              className="group border-line [&:not(:last-child)]:border-b"
              open={i === 0}
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 px-5 py-5 text-[15px] font-medium transition-colors hover:bg-sand sm:px-7">
                {item.q}
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-faint transition-transform duration-200 group-open:rotate-45"
                >
                  <svg width="13" height="13" viewBox="0 0 14 14">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="max-w-3xl px-5 pb-6 text-[14px] leading-relaxed text-muted sm:px-7">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* 12 — Final CTA                                                              */
/* ========================================================================== */

function FinalCta() {
  const demo = !isSupabaseConfigured();

  return (
    <section className="section-rule bg-ink text-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-20 text-center sm:px-8 sm:py-32">
        <BoopMark size={32} className="mx-auto text-paper" />
        <h2 className="display mx-auto mt-8 max-w-[14ch] text-[clamp(2.5rem,8vw,5rem)]">
          Know before you ship.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-[16px] leading-relaxed text-[#a8a8a6]">
          {SITE.tagline} Two versions, a question, and a room full of people who
          have no reason to be polite about it.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/new"
            className="inline-flex h-12 items-center rounded-full bg-paper px-6 text-[15px] font-medium text-ink transition-colors hover:bg-[#ededeb]"
          >
            Run your first test
          </Link>
          <Link
            href="/feed"
            className="inline-flex h-12 items-center rounded-full border border-[#3a3a38] px-6 text-[15px] font-medium transition-colors hover:bg-[#1e1e1e]"
          >
            Start booping
          </Link>
        </div>

        <p className="mt-5 text-[13px] text-[#6f6f6d]">
          {demo
            ? "Running in Demo Mode — everything works, nothing is stored permanently."
            : `${CREDITS.STARTER_GRANT} free credits when you sign up.`}
        </p>
      </div>
    </section>
  );
}
