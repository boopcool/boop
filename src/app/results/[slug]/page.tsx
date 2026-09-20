import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { AiSynthesis, AiSynthesisSkeleton } from "@/components/results/AiSynthesis";
import { ResultsChart } from "@/components/results/ResultsChart";
import { ShareRow } from "@/components/results/ShareRow";
import { VariantSurface } from "@/components/vote/VariantSurface";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar, Badge, DemoBadge, InfoTip, Meter } from "@/components/ui/Primitives";
import { categoryLabel, siteUrl } from "@/lib/config";
import { CONFIDENCE_EXPLAINER } from "@/lib/stats";
import { getResults, getViewer } from "@/lib/data/read";
import { shareHeadline } from "@/lib/share";
import type { SignalLevel, TestResults } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const results = await getResults(slug);
  if (!results) return { title: "Results not found" };

  const headline = shareHeadline(results);
  const title = `${headline} — ${results.test.question}`;

  return {
    title: headline,
    description: `${results.test.question} — ${results.totalVotes || results.fiveSecondAnswers.length} human responses on Boop.`,
    alternates: { canonical: `/results/${slug}` },
    robots: results.test.visibility === "public" ? undefined : { index: false },
    openGraph: {
      title,
      description: results.test.description ?? results.test.question,
      url: `/results/${slug}`,
      images: [{ url: `/results/${slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title },
  };
}

const SIGNAL_TONE: Record<SignalLevel, "neutral" | "caution" | "positive"> = {
  none: "neutral",
  early: "neutral",
  moderate: "caution",
  high: "positive",
};

export default async function ResultsPage({ params }: { params: Params }) {
  const { slug } = await params;
  const results = await getResults(slug);
  if (!results) notFound();

  const { test } = results;
  const viewer = await getViewer();
  const isOwner = viewer.profile?.id === test.ownerId;

  if (test.visibility === "private" && !isOwner) notFound();

  const answered = results.totalVotes || results.fiveSecondAnswers.length;
  const headline = shareHeadline(results);
  const url = `${siteUrl()}/t/${test.slug}`;

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
      <Link
        href={isOwner ? "/dashboard" : "/feed"}
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span>
        {isOwner ? "Your tests" : "Back to the feed"}
      </Link>

      {/* ---- Headline -------------------------------------------------- */}

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="outline">{categoryLabel(test.category)}</Badge>
          {test.mode === "five_second" && <Badge tone="ink">5 second</Badge>}
          {test.status === "closed" && <Badge tone="caution">Closed</Badge>}
          {test.visibility !== "public" && (
            <Badge tone="neutral">
              {test.visibility === "private" ? "Private" : "Unlisted"}
            </Badge>
          )}
          {test.isDemo && <DemoBadge />}
        </div>

        <p className="mt-4 text-[15px] text-muted">&ldquo;{test.question}&rdquo;</p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <h1 className="display max-w-[16ch] text-[clamp(2.25rem,7vw,4.5rem)]">
            {headline}
          </h1>

          <div className="flex flex-col items-start gap-2 pb-2">
            <Badge tone={SIGNAL_TONE[results.signal]}>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  results.signal === "high"
                    ? "bg-positive"
                    : results.signal === "moderate"
                      ? "bg-caution"
                      : "bg-faint"
                }`}
              />
              {results.signalLabel}
              <InfoTip label="How confidence is calculated">
                {CONFIDENCE_EXPLAINER}
              </InfoTip>
            </Badge>
            <span className="text-[14px] tabular-nums text-muted">
              {answered} {answered === 1 ? "human" : "humans"} · target{" "}
              {test.targetVotes}
            </span>
          </div>
        </div>

        <Meter
          value={results.progress}
          label="Responses collected"
          className="mt-6"
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/profile/${test.owner.username}`}
            className="flex items-center gap-2 text-[13px] text-muted transition-opacity hover:opacity-70"
          >
            <Avatar seed={test.owner.avatarSeed} name={test.owner.displayName} size={22} />
            {test.owner.displayName}
          </Link>
          <ShareRow url={url} question={test.question} headline={headline} />
        </div>
      </header>

      {/* ---- Body ------------------------------------------------------ */}

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
        <div className="space-y-6">
          {test.mode === "compare" ? (
            <section className="rounded-xl border border-line bg-paper p-5 sm:p-7">
              <ResultsChart results={results} />
            </section>
          ) : (
            <FiveSecondPanel results={results} />
          )}

          {/* The variants themselves, so the numbers have something to be about */}
          <section>
            <h2 className="eyebrow">What people saw</h2>
            <div
              className={`mt-4 grid gap-4 ${test.variants.length > 1 ? "sm:grid-cols-2" : ""}`}
            >
              {results.variants.map((v) => (
                <figure
                  key={v.variant.id}
                  className={`overflow-hidden rounded-xl border bg-paper ${
                    v.isWinner ? "border-ink" : "border-line"
                  }`}
                >
                  <figcaption className="flex items-center justify-between border-b border-line px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                          v.isWinner ? "bg-ink text-paper" : "bg-sand-deep"
                        }`}
                      >
                        {v.variant.label}
                      </span>
                      <span className="text-[13px] text-muted">
                        {v.variant.title ?? `Version ${v.variant.label}`}
                      </span>
                    </span>
                    <span className="text-[13px] font-medium tabular-nums">
                      {test.mode === "compare" ? `${v.share}%` : ""}
                    </span>
                  </figcaption>
                  <VariantSurface variant={v.variant} question={test.question} />
                </figure>
              ))}
            </div>
          </section>

          {results.reasons.length > 0 && (
            <section className="rounded-xl border border-line bg-paper p-5 sm:p-7">
              <h2 className="eyebrow">Why they picked it</h2>
              <ul className="mt-5 space-y-3">
                {results.reasons.map((reason) => {
                  const top = results.reasons[0]?.count ?? 1;
                  return (
                    <li key={reason.id} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 truncate text-[13px] text-muted sm:w-44">
                        {reason.label}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                        <span
                          className="block h-full rounded-full bg-ink/70"
                          style={{ width: `${(reason.count / top) * 100}%` }}
                        />
                      </span>
                      <span className="w-7 shrink-0 text-right text-[12px] tabular-nums text-faint">
                        {reason.count}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-5 border-t border-line pt-4 text-[12px] text-faint">
                Reason tags are optional, so these add up to less than the total
                vote count.
              </p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Suspense fallback={<AiSynthesisSkeleton />}>
            <AiSynthesis results={results} />
          </Suspense>

          {results.comments.length > 0 && (
            <section className="rounded-xl border border-line bg-paper p-5 sm:p-7">
              <div className="flex items-baseline justify-between">
                <h2 className="eyebrow">In their words</h2>
                <span className="text-[12px] tabular-nums text-faint">
                  {results.comments.length}
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                {results.comments.slice(0, 20).map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-line bg-sand px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-faint">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-paper font-semibold text-ink">
                        {c.variantLabel}
                      </span>
                      {c.reason && <span>{c.reason}</span>}
                    </div>
                    <p className="user-text mt-1.5 text-[13px] leading-relaxed">
                      {c.comment}
                    </p>
                  </li>
                ))}
              </ul>
              {results.comments.length > 20 && (
                <p className="mt-4 text-[12px] text-faint">
                  Showing the 20 most recent of {results.comments.length}.
                </p>
              )}
            </section>
          )}

          {!isOwner && results.comments.length === 0 && results.totalVotes > 0 && (
            <section className="rounded-xl border border-dashed border-line bg-sand p-5 text-[13px] leading-relaxed text-muted">
              Written feedback and reason tags are shown to the person who ran
              the test. The counts above are public.
            </section>
          )}

          <section className="rounded-xl border border-line bg-sand p-5 sm:p-6">
            <h2 className="text-[15px] font-medium tracking-[-0.015em]">
              {isOwner ? "Got what you needed?" : "Got a decision of your own?"}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {isOwner
                ? "Close the test when you've decided, or run the winner against a new challenger."
                : "Two versions, one question, and people who have no reason to be polite about it."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/new" size="sm">
                {isOwner ? "Run another test" : "Run a test"}
              </ButtonLink>
              <ButtonLink href="/feed" size="sm" variant="secondary">
                Open the feed
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FiveSecondPanel({ results }: { results: TestResults }) {
  const answers = results.fiveSecondAnswers;

  return (
    <section className="rounded-xl border border-line bg-paper p-5 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow">What they remembered</h2>
        <span className="text-[12px] tabular-nums text-faint">
          {answers.length} {answers.length === 1 ? "answer" : "answers"}
        </span>
      </div>

      <p className="mt-4 text-[14px] leading-relaxed text-muted">
        Each person saw the design for five seconds, then answered:{" "}
        <span className="text-ink">
          &ldquo;{results.test.fiveSecondPrompt ?? results.test.question}&rdquo;
        </span>
      </p>

      {answers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-sand px-4 py-8 text-center text-[13px] text-faint">
          No answers yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-2">
          {answers.slice(0, 30).map((a) => (
            <li
              key={a.id}
              className="user-text rounded-lg border border-line bg-sand px-3.5 py-3 text-[13px] leading-relaxed"
            >
              &ldquo;{a.answer}&rdquo;
            </li>
          ))}
        </ul>
      )}

      {answers.length > 30 && (
        <p className="mt-4 text-[12px] text-faint">
          Showing 30 of {answers.length}.
        </p>
      )}
    </section>
  );
}
