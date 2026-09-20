import type { TestResults } from "@/lib/types";

/** The line that appears on the results page, the OG card and the X intent. */
export function shareHeadline(results: TestResults): string {
  if (results.test.mode === "five_second") {
    const n = results.fiveSecondAnswers.length;
    return n > 0 ? `${n} people, five seconds` : "5 Second Test";
  }

  const winner = results.variants.find((v) => v.isWinner);
  if (winner) return `${winner.variant.label} wins — ${winner.share}%`;
  if (results.totalVotes === 0) return "No boops yet";

  const leader = [...results.variants].sort((a, b) => b.votes - a.votes)[0];
  return leader
    ? `Too close to call — ${leader.share}/${100 - leader.share}`
    : "Split";
}

/** Short, punchy variant used on the 1200x630 card. */
export function ogHeadline(results: TestResults): { big: string; sub: string } {
  if (results.test.mode === "five_second") {
    const n = results.fiveSecondAnswers.length;
    return {
      big: "5 seconds.",
      sub: n > 0 ? `${n} humans answered` : "No answers yet",
    };
  }

  const winner = results.variants.find((v) => v.isWinner);
  const total = results.totalVotes;

  if (winner) {
    return {
      big: `${winner.variant.label} wins.`,
      sub: `${winner.share}% / ${total} ${total === 1 ? "human" : "humans"}`,
    };
  }
  if (total === 0) return { big: "Open for boops.", sub: "Be the first" };

  const leader = [...results.variants].sort((a, b) => b.votes - a.votes)[0];
  return {
    big: "Too close.",
    sub: leader
      ? `${leader.share}/${100 - leader.share} · ${total} ${total === 1 ? "human" : "humans"}`
      : `${total} humans`,
  };
}
