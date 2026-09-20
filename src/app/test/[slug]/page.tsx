import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CompareStage } from "@/components/vote/CompareStage";
import { FiveSecondStage } from "@/components/vote/FiveSecondStage";
import { Avatar, Badge, DemoBadge, Meter } from "@/components/ui/Primitives";
import { ButtonLink } from "@/components/ui/Button";
import { categoryLabel } from "@/lib/config";
import { getTestBySlug, getViewer, hasAnswered } from "@/lib/data/read";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) return { title: "Test not found" };

  const title = test.question;
  const description =
    test.description ??
    `${test.variants.length} versions of ${test.title}. Pick the one you'd ship.`;

  return {
    title,
    description,
    alternates: { canonical: `/test/${slug}` },
    robots: test.visibility === "public" ? undefined : { index: false },
    openGraph: {
      title,
      description,
      url: `/test/${slug}`,
      images: [{ url: `/results/${slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/results/${slug}/opengraph-image`],
    },
  };
}

export default async function TestPage({ params }: { params: Params }) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) notFound();

  const viewer = await getViewer();
  const isOwner = viewer.profile?.id === test.ownerId;
  const answered = await hasAnswered(test, viewer);

  if (test.visibility === "private" && !isOwner) notFound();

  return (
    <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 sm:py-14">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span> Back to the feed
      </Link>

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

        <h1 className="mt-4 text-[28px] font-medium leading-tight tracking-[-0.035em] sm:text-[40px]">
          {test.question}
        </h1>

        {test.description && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            {test.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
          <Link
            href={`/profile/${test.owner.username}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-70"
          >
            <Avatar seed={test.owner.avatarSeed} name={test.owner.displayName} size={22} />
            {test.owner.displayName}
          </Link>
          <span className="tabular-nums">
            {test.voteCount} of {test.targetVotes} responses
          </span>
        </div>

        <Meter
          value={test.voteCount / Math.max(1, test.targetVotes)}
          label="Responses collected"
          className="mt-4"
        />
      </header>

      <div className="mt-10">
        {isOwner ? (
          <OwnerNotice slug={test.slug} />
        ) : test.status !== "live" ? (
          <ClosedNotice slug={test.slug} />
        ) : test.mode === "five_second" ? (
          <FiveSecondStage test={test} initiallyAnswered={answered} />
        ) : (
          <CompareStage test={test} initiallyAnswered={answered} />
        )}
      </div>

      {!isOwner && test.status === "live" && (
        <p className="mt-8 text-[12px] leading-relaxed text-faint">
          Results stay hidden until you&rsquo;ve answered — seeing the tally
          first would change what you pick, and then the tally would be about
          the tally.
        </p>
      )}
    </div>
  );
}

function OwnerNotice({ slug }: { slug: string }) {
  return (
    <div className="rounded-xl border border-line bg-sand px-6 py-12 text-center">
      <h2 className="text-[20px] font-medium tracking-[-0.02em]">
        This one&rsquo;s yours.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
        You can&rsquo;t boop your own test — that would be a very expensive way
        to agree with yourself. Share the link instead, and watch the results
        come in.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href={`/results/${slug}`}>See results</ButtonLink>
        <ButtonLink href="/feed" variant="secondary">
          Go boop someone else&rsquo;s
        </ButtonLink>
      </div>
    </div>
  );
}

function ClosedNotice({ slug }: { slug: string }) {
  return (
    <div className="rounded-xl border border-line bg-sand px-6 py-12 text-center">
      <h2 className="text-[20px] font-medium tracking-[-0.02em]">
        Voting is closed on this one.
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
        The creator called it. The results are still up.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href={`/results/${slug}`}>See results</ButtonLink>
        <ButtonLink href="/feed" variant="secondary">
          Open the feed
        </ButtonLink>
      </div>
    </div>
  );
}
