import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { BoopMark } from "@/components/brand/Logo";
import { CONFIDENCE_EXPLAINER } from "@/lib/stats";
import { CREDITS } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why human taste tests still matter when a machine can generate a hundred options before lunch.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-14 sm:px-8 sm:py-24">
      <BoopMark size={28} />

      <h1 className="display mt-8 text-[clamp(2.25rem,6.5vw,3.75rem)]">
        AI can generate infinite options. Humans still decide what feels right.
      </h1>

      <div className="mt-12 space-y-6 text-[16px] leading-[1.75] text-ink">
        <p>
          Making things used to be the bottleneck. You had one designer, one
          week, and one idea you could afford to execute properly. The scarce
          resource was production, so that&rsquo;s what tools optimised for.
        </p>

        <p className="text-muted">
          That constraint is gone. A founder with no design background can
          produce nine credible homepages in an afternoon. The hard part moved
          somewhere less comfortable: you now have nine options, a strong
          personal preference, and no idea whether a stranger would agree with
          you. Taste didn&rsquo;t get automated. It got exposed.
        </p>

        <p className="text-muted">
          The obvious move is to ask a model which one is better. You get a
          fluent, well-structured answer in three seconds, and it&rsquo;s worth
          almost nothing — not because the model is stupid, but because it
          isn&rsquo;t doing the thing you need. It&rsquo;s predicting what a
          design critique sounds like. Nobody looked at your work and{" "}
          <em className="not-italic text-ink">chose</em>.
        </p>

        <h2 className="pt-6 text-[24px] font-medium tracking-[-0.03em]">
          A preference is a different kind of fact.
        </h2>

        <p className="text-muted">
          When 55 of 82 people pick B, that number isn&rsquo;t an opinion about
          B. It&rsquo;s a record of 82 small decisions made by people with their
          own histories, their own screens and their own reasons for being
          unimpressed. It can be wrong about the wider world, and Boop is
          careful to say so — but it cannot be fluent nonsense. Something
          actually happened.
        </p>

        <p className="text-muted">
          That&rsquo;s the whole product. Two versions, one question, and a
          count. The interesting part is what sits underneath: the reason tags
          that tell you it won on comprehension rather than beauty, and the
          eleven people who bothered to write a sentence explaining why your
          favourite version confused them.
        </p>

        <h2 className="pt-6 text-[24px] font-medium tracking-[-0.03em]">
          Where we do use a model.
        </h2>

        <p className="text-muted">
          Exactly one job: reading written feedback and grouping it into themes,
          so ninety comments become three things you can act on. It never casts
          a vote, never writes one, and never changes a count. Every number on a
          results page came from a person who clicked. Where a summary is
          model-written, it says so on the page.
        </p>

        <h2 className="pt-6 text-[24px] font-medium tracking-[-0.03em]">
          What we&rsquo;re honest about.
        </h2>

        <ul className="space-y-4 text-muted">
          <li className="border-l-2 border-line pl-5">
            <span className="text-ink">The sample is not representative.</span>{" "}
            Boop&rsquo;s voters are internet builders who wandered into a feed.
            That&rsquo;s the right room for &ldquo;does this read as
            trustworthy&rdquo; and the wrong room for anything requiring a
            specific profession or demographic. Audience filters are planned and
            clearly marked as not built.
          </li>
          <li className="border-l-2 border-line pl-5">
            <span className="text-ink">Small samples are small.</span>{" "}
            {CONFIDENCE_EXPLAINER}
          </li>
          <li className="border-l-2 border-line pl-5">
            <span className="text-ink">Anonymous voting is a speed bump.</span>{" "}
            We hash an anonymous session identifier server-side and enforce one
            vote per test. Someone determined to skew a result with fresh
            browsers can. We don&rsquo;t fingerprint, and we don&rsquo;t pretend
            otherwise — the response count is always on the page so you can
            judge for yourself.
          </li>
          <li className="border-l-2 border-line pl-5">
            <span className="text-ink">Sample tests are fictional.</span> Boop
            ships with a seeded corpus so the product isn&rsquo;t an empty room
            on your first visit. Every one of those tests is marked{" "}
            <span className="uppercase tracking-[0.1em]">Demo</span>.
          </li>
        </ul>

        <h2 className="pt-6 text-[24px] font-medium tracking-[-0.03em]">
          Why it&rsquo;s a loop, not a subscription.
        </h2>

        <p className="text-muted">
          A preference-testing platform with no voters is a database. The credit
          system exists to make giving feedback worth something: {CREDITS.EARN_AMOUNT}{" "}
          credit for every {CREDITS.VOTES_PER_EARN} boops you give, and{" "}
          {CREDITS.COST_PER_RESPONSE} credit for every human response you
          request. Buying a pack is a shortcut for people in a hurry. It is not
          the entrance.
        </p>

        <p>
          The design of this site is the argument, too. It&rsquo;s quiet and
          mostly white and gets out of the way, because the thing you uploaded
          is what people are supposed to be looking at.
        </p>
      </div>

      <div className="mt-14 flex flex-wrap gap-3 border-t border-line pt-10">
        <ButtonLink href="/new">Run a test</ButtonLink>
        <ButtonLink href="/feed" variant="secondary">
          Start booping
        </ButtonLink>
      </div>
    </div>
  );
}
