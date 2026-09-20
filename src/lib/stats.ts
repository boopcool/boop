import type { SignalLevel } from "@/lib/types";

/**
 * Wilson score interval for a binomial proportion.
 *
 * Chosen over the normal approximation because Boop tests routinely run at
 * n = 10–50, where the naive interval is both too narrow and capable of
 * producing bounds outside [0, 1]. Wilson stays well-behaved at small n and
 * at proportions near 0 or 1, which is exactly where taste tests land.
 *
 * @param successes votes for the variant
 * @param total     total votes cast on the test
 * @param z         z-score; 1.959964 == 95% two-sided
 */
export function wilsonInterval(
  successes: number,
  total: number,
  z = 1.959964,
): { low: number; high: number; center: number } {
  if (total <= 0) return { low: 0, high: 1, center: 0 };

  const n = total;
  const phat = successes / n;
  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const centre = phat + z2 / (2 * n);
  const spread =
    z * Math.sqrt((phat * (1 - phat)) / n + z2 / (4 * n * n));

  return {
    low: clamp01((centre - spread) / denominator),
    high: clamp01((centre + spread) / denominator),
    center: clamp01(centre / denominator),
  };
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * How much to trust a two-way result.
 *
 * The rule is deliberately conservative and easy to explain: a result only
 * graduates when the *whole* 95% Wilson interval for the leader sits above
 * 50%, and the sample is large enough that a couple of extra votes would not
 * flip it. Everything short of that is labelled "Early signal".
 */
export function signalLevel(
  leaderVotes: number,
  totalVotes: number,
): { level: SignalLevel; label: string } {
  if (totalVotes < 5) return { level: "none", label: "Not enough boops yet" };

  const { low } = wilsonInterval(leaderVotes, totalVotes);

  if (low > 0.5 && totalVotes >= 60) {
    return { level: "high", label: "High confidence" };
  }
  if (low > 0.5 && totalVotes >= 20) {
    return { level: "moderate", label: "Moderate signal" };
  }
  return { level: "early", label: "Early signal" };
}

/**
 * A winner is only declared once the leader's lower bound clears 50% — i.e.
 * the observed preference is consistent enough that the interval excludes a
 * coin flip. Below that the result page shows a split with no winner.
 */
export function hasWinner(leaderVotes: number, totalVotes: number): boolean {
  if (totalVotes < 5) return false;
  return wilsonInterval(leaderVotes, totalVotes).low > 0.5;
}

/** Percentage rounded to whole numbers that still sum to 100. */
export function apportion(counts: number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts.map(() => 0);

  const exact = counts.map((c) => (c / total) * 100);
  const floors = exact.map(Math.floor);
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const out = [...floors];
  for (const { i } of order) {
    if (remainder <= 0) break;
    out[i] = (out[i] ?? 0) + 1;
    remainder -= 1;
  }
  return out;
}

export const CONFIDENCE_EXPLAINER =
  "Confidence describes how consistent the observed preference is at this sample size, using a 95% Wilson score interval. It is not a claim about the wider population — a taste test tells you what these humans picked, not what everyone would pick.";
