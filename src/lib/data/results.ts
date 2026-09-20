import { REASONS, reasonLabel } from "@/lib/config";
import { apportion, hasWinner, signalLevel, wilsonInterval } from "@/lib/stats";
import type {
  CommentEntry,
  FiveSecondResponse,
  ReasonTally,
  TestResults,
  TestWithVariants,
  Vote,
} from "@/lib/types";
import type { ReasonId } from "@/lib/config";

/**
 * Turns raw rows into everything a results page renders. Pure, so it is shared
 * unchanged between the Supabase path, the demo store and the OG image route,
 * and so the statistics are unit-testable without a database.
 */
export function computeResults(
  test: TestWithVariants,
  votes: Vote[],
  fiveSecond: FiveSecondResponse[],
): TestResults {
  const totalVotes = votes.length;

  const counts = test.variants.map(
    (v) => votes.filter((x) => x.variantId === v.id).length,
  );
  const shares = apportion(counts);

  const leaderVotes = counts.length ? Math.max(...counts) : 0;
  const leaderIndex = counts.indexOf(leaderVotes);
  const winnerDeclared =
    test.variants.length === 2 && hasWinner(leaderVotes, totalVotes);

  // With a tie at the top, nobody wins regardless of interval.
  const tiedAtTop = counts.filter((c) => c === leaderVotes).length > 1;
  const winnerId =
    winnerDeclared && !tiedAtTop
      ? (test.variants[leaderIndex]?.id ?? null)
      : null;

  const variants = test.variants.map((variant, i) => {
    const v = counts[i] ?? 0;
    const { low, high } = wilsonInterval(v, totalVotes);
    return {
      variant,
      votes: v,
      share: shares[i] ?? 0,
      low,
      high,
      isWinner: variant.id === winnerId,
    };
  });

  const sortedShares = [...(shares as number[])].sort((a, b) => b - a);
  const margin = (sortedShares[0] ?? 0) - (sortedShares[1] ?? 0);

  const { level, label } = signalLevel(leaderVotes, totalVotes);

  /* --- Reason tallies ---------------------------------------------------- */

  const reasons: ReasonTally[] = REASONS.map((r) => {
    const matching = votes.filter((v) => v.reason === r.id);
    const byVariant: Record<string, number> = {};
    for (const v of matching) {
      byVariant[v.variantId] = (byVariant[v.variantId] ?? 0) + 1;
    }
    return { id: r.id as ReasonId, label: r.label, count: matching.length, byVariant };
  })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  /* --- Written feedback -------------------------------------------------- */

  const labelById = new Map(test.variants.map((v) => [v.id, v.label]));

  const comments: CommentEntry[] = votes
    .filter((v): v is Vote & { comment: string } => Boolean(v.comment))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((v) => ({
      id: v.id,
      variantLabel: labelById.get(v.variantId) ?? "?",
      reason: reasonLabel(v.reason),
      comment: v.comment,
      createdAt: v.createdAt,
    }));

  const answered =
    test.mode === "five_second" ? fiveSecond.length : totalVotes;

  return {
    test,
    totalVotes,
    variants,
    winnerId,
    margin,
    signal: level,
    signalLabel: label,
    reasons,
    comments,
    fiveSecondAnswers: fiveSecond
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((f) => ({ id: f.id, answer: f.answer, createdAt: f.createdAt })),
    progress:
      test.targetVotes > 0
        ? Math.min(1, answered / test.targetVotes)
        : 0,
  };
}
