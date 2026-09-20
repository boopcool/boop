import Link from "next/link";
import type { Metadata } from "next";
import { TestCard } from "@/components/test/TestCard";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Avatar, Badge, EmptyState } from "@/components/ui/Primitives";
import { CREDITS } from "@/lib/config";
import { getCreditLedger, getViewer, listOwnedTests } from "@/lib/data/read";
import { closeTestAction } from "@/app/actions/test";
import { signOutAction } from "@/app/actions/auth";
import type { CreditEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const LEDGER_LABEL: Record<CreditEntry["type"], string> = {
  starter_grant: "Welcome credits",
  vote_earn: "Earned by booping",
  comment_bonus: "Written feedback bonus",
  test_spend: "Spent on a test",
  test_refund: "Refunded",
  purchase: "Credit pack",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { purchase } = await searchParams;
  const viewer = await getViewer();

  if (!viewer.profile) {
    return (
      <div className="mx-auto max-w-[560px] px-5 py-24 text-center sm:px-8">
        <h1 className="display text-[2rem]">Sign in to see your tests.</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Your credits, your results and everything you&rsquo;ve booped live
          behind a sign-in.
        </p>
        <div className="mt-7 flex justify-center gap-2">
          <ButtonLink href="/sign-in?next=/dashboard">Sign in</ButtonLink>
          <ButtonLink href="/feed" variant="secondary">
            Open the feed
          </ButtonLink>
        </div>
      </div>
    );
  }

  const profile = viewer.profile;
  const [tests, ledger] = await Promise.all([
    listOwnedTests(profile.id),
    getCreditLedger(profile.id, 12),
  ]);

  const live = tests.filter((t) => t.status === "live");
  const closed = tests.filter((t) => t.status !== "live");
  const toNextCredit =
    CREDITS.VOTES_PER_EARN - (profile.boopsGiven % CREDITS.VOTES_PER_EARN);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 sm:py-12">
      {purchase === "success" && (
        <p className="mb-8 rounded-xl border border-line bg-sand px-4 py-3 text-[14px]">
          Payment received — your credits are on the balance below.
        </p>
      )}

      {viewer.demoMode && (
        <p className="mb-8 rounded-xl border border-dashed border-line bg-sand px-4 py-3 text-[13px] leading-relaxed text-muted">
          <span className="font-medium text-ink">Demo Mode.</span> You&rsquo;re
          signed in as a local sample account. Tests you create here are real
          and fully functional, but they live in memory and reset when the
          server restarts. Configure Supabase for persistent accounts.
        </p>
      )}

      {/* ---- Header --------------------------------------------------- */}

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar seed={profile.avatarSeed} name={profile.displayName} size={52} />
          <div>
            <h1 className="text-[26px] font-medium tracking-[-0.03em]">
              {profile.displayName}
            </h1>
            <Link
              href={`/profile/${profile.username}`}
              className="text-[13px] text-muted transition-colors hover:text-ink"
            >
              @{profile.username}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/new">Run a test</ButtonLink>
          <ButtonLink href="/feed" variant="secondary">
            Earn credits
          </ButtonLink>
          {!viewer.demoMode && (
            <form action={signOutAction}>
              <Button variant="ghost" size="md" type="submit">
                Sign out
              </Button>
            </form>
          )}
        </div>
      </header>

      {/* ---- Stats ----------------------------------------------------- */}

      <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Credits"
          value={profile.credits.toLocaleString()}
          hint={`${CREDITS.COST_PER_RESPONSE} credit = 1 human response`}
        />
        <Stat
          label="Boops given"
          value={profile.boopsGiven.toLocaleString()}
          hint={`${toNextCredit} more until your next credit`}
        />
        <Stat
          label="Tests running"
          value={String(live.length)}
          hint={live.length ? "Collecting responses now" : "Nothing live"}
        />
        <Stat
          label="Responses collected"
          value={tests.reduce((sum, t) => sum + t.voteCount, 0).toLocaleString()}
          hint="Across every test you've run"
        />
      </div>

      {/* ---- Body ------------------------------------------------------ */}

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <div className="space-y-12">
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-[18px] font-medium tracking-[-0.02em]">
                Running now
              </h2>
              <span className="text-[13px] tabular-nums text-faint">
                {live.length}
              </span>
            </div>

            <div className="mt-5">
              {live.length === 0 ? (
                <EmptyState
                  title="Nothing running"
                  body="Put a decision in front of people and it'll show up here with a live count."
                  action={<ButtonLink href="/new">Run your first test</ButtonLink>}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {live.map((test) => (
                    <div key={test.id} className="flex flex-col gap-2">
                      <TestCard test={test} href={`/results/${test.slug}`} />
                      <form action={closeTestAction} className="flex justify-end">
                        <input type="hidden" name="slug" value={test.slug} />
                        <button
                          type="submit"
                          className="rounded-full border border-line px-3 py-1 text-[12px] text-muted transition-colors hover:border-faint hover:text-ink"
                        >
                          Close voting
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {closed.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[18px] font-medium tracking-[-0.02em]">
                  Closed
                </h2>
                <span className="text-[13px] tabular-nums text-faint">
                  {closed.length}
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {closed.map((test) => (
                  <TestCard key={test.id} test={test} href={`/results/${test.slug}`} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ---- Ledger --------------------------------------------------- */}

        <aside>
          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow">Credit activity</h2>
              <Link
                href="/pricing"
                className="text-[12px] text-muted transition-colors hover:text-ink"
              >
                Top up
              </Link>
            </div>

            {ledger.length === 0 ? (
              <p className="mt-5 text-[13px] leading-relaxed text-muted">
                Nothing yet. Boop {CREDITS.VOTES_PER_EARN} tests in the feed and
                your first earned credit shows up here.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {ledger.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px]">
                        {LEDGER_LABEL[entry.type]}
                      </p>
                      <p className="text-[11px] text-faint">
                        {new Date(entry.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[13px] font-medium tabular-nums ${
                        entry.amount > 0 ? "text-positive" : "text-muted"
                      }`}
                    >
                      {entry.amount > 0 ? "+" : ""}
                      {entry.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-5 rounded-xl border border-line bg-sand p-5">
            <Badge tone="outline">The loop</Badge>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Give {CREDITS.VOTES_PER_EARN} boops, earn {CREDITS.EARN_AMOUNT}{" "}
              credit. Leave a written comment and earn{" "}
              {CREDITS.COMMENT_BONUS} more. Spend credits to put your own
              decision in front of people.
            </p>
            <ButtonLink href="/feed" size="sm" variant="secondary" className="mt-4 w-full">
              Open the feed
            </ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-paper px-5 py-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2.5 text-[32px] font-medium tabular-nums leading-none tracking-[-0.035em]">
        {value}
      </p>
      <p className="mt-2 text-[12px] leading-snug text-faint">{hint}</p>
    </div>
  );
}
