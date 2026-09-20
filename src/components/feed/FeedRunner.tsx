"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { CompareStage } from "@/components/vote/CompareStage";
import { FiveSecondStage } from "@/components/vote/FiveSecondStage";
import { Avatar, Badge, DemoBadge } from "@/components/ui/Primitives";
import { ButtonLink } from "@/components/ui/Button";
import { categoryLabel } from "@/lib/config";
import type { TestWithVariants } from "@/lib/types";

/**
 * The feed loop: look, decide, boop, next.
 *
 * One test fills the stage at a time. Everything secondary — who asked, how
 * many responses are left, the category — sits in a thin rail so the two
 * things being compared get the attention.
 */
export function FeedRunner({ tests }: { tests: TestWithVariants[] }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());

  const test = tests[index];

  const next = useCallback(() => {
    if (!test) return;
    setDone((prev) => new Set(prev).add(test.id));
    setIndex((i) => i + 1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [test]);

  const remaining = tests.length - index;
  const progressLabel = useMemo(
    () => `${Math.min(index + 1, tests.length)} of ${tests.length}`,
    [index, tests.length],
  );

  if (!test) {
    return (
      <div className="rounded-xl border border-line bg-sand px-6 py-16 text-center sm:py-24">
        <h2 className="text-[24px] font-medium tracking-[-0.03em] sm:text-[30px]">
          That&rsquo;s everything open right now.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          You booped {done.size} {done.size === 1 ? "test" : "tests"}. New ones
          land whenever someone else is stuck on a decision — which, judging by
          the internet, will be shortly.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/new">Run your own test</ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            See your credits
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_248px] lg:gap-12">
      {/* Stage */}
      <div className="order-2 lg:order-1">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="outline">{categoryLabel(test.category)}</Badge>
            {test.mode === "five_second" && <Badge tone="ink">5 second</Badge>}
            {test.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-3 text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[32px]">
            {test.question}
          </h1>
          {test.description && (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
              {test.description}
            </p>
          )}
        </div>

        {test.mode === "five_second" ? (
          <FiveSecondStage
            key={test.id}
            test={test}
            onNext={remaining > 1 ? next : undefined}
            nextLabel="Next test"
          />
        ) : (
          <CompareStage
            key={test.id}
            test={test}
            onNext={remaining > 1 ? next : undefined}
            nextLabel="Next test"
            compact
          />
        )}

        {remaining <= 1 && (
          <p className="mt-6 text-[13px] text-faint">
            Last one in the queue. After this you&rsquo;ll get the wrap-up.
          </p>
        )}
      </div>

      {/* Rail */}
      <aside className="order-1 lg:order-2 lg:pt-1">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-sand px-4 py-3 lg:flex-col lg:items-start lg:gap-4 lg:px-5 lg:py-5">
          <div className="lg:w-full">
            <p className="eyebrow">In the queue</p>
            <p className="mt-1.5 text-[15px] tabular-nums">{progressLabel}</p>
            <div className="mt-2.5 hidden h-[2px] w-full overflow-hidden rounded-full bg-line lg:block">
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-300"
                style={{ width: `${(index / tests.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="hidden lg:block lg:w-full lg:border-t lg:border-line lg:pt-4">
            <p className="eyebrow">Asked by</p>
            <Link
              href={`/profile/${test.owner.username}`}
              className="mt-2 flex items-center gap-2 text-[14px] transition-opacity hover:opacity-70"
            >
              <Avatar seed={test.owner.avatarSeed} name={test.owner.displayName} size={24} />
              <span className="truncate">{test.owner.displayName}</span>
            </Link>
          </div>

          <div className="text-right lg:w-full lg:border-t lg:border-line lg:pt-4 lg:text-left">
            <p className="eyebrow">Responses</p>
            <p className="mt-1.5 text-[14px] tabular-nums text-muted">
              {test.voteCount} of {test.targetVotes}
            </p>
          </div>

          <div className="hidden lg:block lg:w-full lg:border-t lg:border-line lg:pt-4">
            <p className="eyebrow">Shortcuts</p>
            <dl className="mt-2.5 space-y-1.5 text-[12px] text-muted">
              <Shortcut keys={["A", "←"]} label="Pick A" />
              <Shortcut keys={["B", "→"]} label="Pick B" />
              <Shortcut keys={["Space"]} label="Next" />
            </dl>
          </div>
        </div>

        <p className="mt-4 hidden text-[12px] leading-relaxed text-faint lg:block">
          Results stay hidden until you&rsquo;ve picked — otherwise the first
          few votes decide the rest.
        </p>
      </aside>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt>{label}</dt>
      <dd className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-paper px-1.5 font-mono text-[10px]"
          >
            {k}
          </kbd>
        ))}
      </dd>
    </div>
  );
}
