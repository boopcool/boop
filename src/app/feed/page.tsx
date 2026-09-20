import Link from "next/link";
import type { Metadata } from "next";
import { FeedRunner } from "@/components/feed/FeedRunner";
import { TestCard } from "@/components/test/TestCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Primitives";
import { CATEGORIES, CREDITS, type CategoryId } from "@/lib/config";
import { getViewer, hasAnswered, listFeed } from "@/lib/data/read";

export const metadata: Metadata = {
  title: "Feed",
  description:
    "Compare two versions and boop the one you'd ship. Earn credits for your own tests while you're at it.",
  alternates: { canonical: "/feed" },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string }>;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category: rawCategory } = await searchParams;
  const category = (
    CATEGORIES.some((c) => c.id === rawCategory) ? rawCategory : "all"
  ) as CategoryId | "all";

  const viewer = await getViewer();
  const all = await listFeed({ category, limit: 40 });

  // Don't put a test in someone's queue twice, and never show people their own.
  const answered = await Promise.all(all.map((t) => hasAnswered(t, viewer)));
  const queue = all.filter(
    (t, i) => !answered[i] && t.ownerId !== viewer.profile?.id,
  );
  const alreadySeen = all.filter((t, i) => answered[i]);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The feed</p>
          <h1 className="display mt-3 text-[clamp(1.875rem,5vw,2.75rem)]">
            Look. Decide. Boop.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
            Every {CREDITS.VOTES_PER_EARN} boops earns you{" "}
            {CREDITS.EARN_AMOUNT} credit — which is {CREDITS.EARN_AMOUNT} human
            response on a test of your own.
          </p>
        </div>
        <ButtonLink href="/new" variant="secondary">
          Run a test
        </ButtonLink>
      </div>

      {/* Category filter */}
      <nav
        aria-label="Filter by category"
        className="no-scrollbar mt-8 flex gap-2 overflow-x-auto border-b border-line pb-4"
      >
        <FilterChip href="/feed" active={category === "all"}>
          Everything
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.id}
            href={`/feed?category=${c.id}`}
            active={category === c.id}
          >
            {c.label}
          </FilterChip>
        ))}
      </nav>

      <div className="mt-10">
        {queue.length > 0 ? (
          <FeedRunner tests={queue} />
        ) : (
          <EmptyState
            title={
              alreadySeen.length > 0
                ? "You've booped everything here"
                : "Nothing open in this category"
            }
            body={
              alreadySeen.length > 0
                ? "Come back later, or switch categories — new tests appear as soon as someone launches one."
                : "Try another category, or be the first to put a decision in front of people."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink href="/feed">Everything</ButtonLink>
                <ButtonLink href="/new" variant="secondary">
                  Run a test
                </ButtonLink>
              </div>
            }
          />
        )}
      </div>

      {alreadySeen.length > 0 && (
        <section className="mt-20">
          <h2 className="eyebrow">Already booped</h2>
          <p className="mt-2 text-[14px] text-muted">
            Results are open to you now.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alreadySeen.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                href={`/results/${test.slug}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
        active
          ? "border-ink bg-ink text-paper"
          : "border-line bg-paper text-muted hover:border-faint hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
