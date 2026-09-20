import "server-only";

import { cleanEnv, isOpenAIConfigured, textModel } from "@/lib/config";
import type { AiSummary, TestResults } from "@/lib/types";

/**
 * AI is used for exactly one thing in Boop: organising feedback that humans
 * already gave. It never generates a vote, never invents a quote and never
 * decides a winner — the counts and the confidence interval are computed from
 * real rows before this module is called, and are passed in as fixed facts.
 *
 * With no OPENAI_API_KEY the deterministic path below runs instead, so the
 * results page is always complete.
 */

const SYSTEM_PROMPT = `You summarise real human feedback from a preference test.

Rules you must follow:
- The vote counts, percentages and winner are FACTS supplied to you. Never change, recompute or contradict them.
- Only describe themes that actually appear in the supplied reason tags or written comments. Never invent a quote, a person, or a sentiment nobody expressed.
- If there is little or no written feedback, say so plainly rather than padding.
- Write like a blunt, useful colleague. No marketing voice, no hedging clichés, no exclamation marks.
- British or American spelling is fine; match the comments.
- Never claim statistical certainty. The caller already decided how strong the signal is.`;

type SummarySchemaShape = {
  summary: string;
  themes: { label: string; mentions: number; note: string }[];
  strongestSignal: string;
  biggestConcern: string;
  nextAction: string;
};

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "themes", "strongestSignal", "biggestConcern", "nextAction"],
  properties: {
    summary: {
      type: "string",
      description: "Exactly two sentences describing what the humans chose and why.",
    },
    themes: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "mentions", "note"],
        properties: {
          label: { type: "string", description: "Two to four words." },
          mentions: {
            type: "integer",
            description: "How many supplied comments or tags support this theme.",
          },
          note: { type: "string", description: "One sentence of detail." },
        },
      },
    },
    strongestSignal: { type: "string", description: "One sentence." },
    biggestConcern: { type: "string", description: "One sentence." },
    nextAction: {
      type: "string",
      description: "One concrete, specific thing the creator should do next.",
    },
  },
} as const;

function buildUserPrompt(results: TestResults): string {
  const { test } = results;

  const tally = results.variants
    .map(
      (v) =>
        `  ${v.variant.label}${v.variant.title ? ` (${v.variant.title})` : ""}: ${v.votes} votes, ${v.share}%${v.isWinner ? " — WINNER" : ""}`,
    )
    .join("\n");

  const reasons = results.reasons.length
    ? results.reasons.map((r) => `  ${r.label}: ${r.count}`).join("\n")
    : "  (none tagged)";

  const comments = results.comments.length
    ? results.comments
        .slice(0, 60)
        .map((c) => `  [picked ${c.variantLabel}] ${c.comment}`)
        .join("\n")
    : "  (no written feedback)";

  const fiveSecond = results.fiveSecondAnswers.length
    ? results.fiveSecondAnswers
        .slice(0, 60)
        .map((f) => `  ${f.answer}`)
        .join("\n")
    : "";

  return [
    `Question asked: ${test.question}`,
    test.description ? `Creator's context: ${test.description}` : "",
    `Mode: ${test.mode === "five_second" ? "5 Second Test" : "A/B comparison"}`,
    `Total responses: ${results.totalVotes || results.fiveSecondAnswers.length}`,
    `Signal strength (already computed, do not restate as certainty): ${results.signalLabel}`,
    "",
    "Vote tally:",
    tally,
    "",
    "Reason tags:",
    reasons,
    "",
    "Written comments:",
    comments,
    fiveSecond ? `\nFive-second recall answers:\n${fiveSecond}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/* -------------------------------------------------------------------------- */
/* Deterministic fallback                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Built purely from the counts. Runs when OpenAI is not configured, when the
 * call fails, or when there is too little feedback to be worth a model call.
 * Everything it says is arithmetic — nothing is inferred.
 */
export function deterministicSummary(results: TestResults): AiSummary {
  const total = results.totalVotes || results.fiveSecondAnswers.length;
  const leader = [...results.variants].sort((a, b) => b.votes - a.votes)[0];
  const runnerUp = [...results.variants].sort((a, b) => b.votes - a.votes)[1];
  const topReason = results.reasons[0];

  const summary =
    total === 0
      ? "No responses yet. Share the test or add it to the feed and the numbers will fill in here."
      : results.winnerId && leader
        ? `${leader.variant.label} leads with ${leader.share}% of ${total} ${total === 1 ? "boop" : "boops"}${runnerUp ? `, against ${runnerUp.share}% for ${runnerUp.variant.label}` : ""}. The 95% interval for ${leader.variant.label} runs from ${pct(leader.low)} to ${pct(leader.high)}, which clears a coin flip at this sample size.`
        : leader
          ? `${leader.variant.label} is ahead at ${leader.share}% of ${total} ${total === 1 ? "boop" : "boops"}, but the 95% interval (${pct(leader.low)}–${pct(leader.high)}) still includes 50%. This is a lean, not a result.`
          : "No responses yet.";

  const themes = results.reasons.slice(0, 3).map((r) => ({
    label: r.label,
    mentions: r.count,
    note: `Tagged ${r.count} ${r.count === 1 ? "time" : "times"} — ${sharePhrase(r.count, total)} of everyone who answered.`,
  }));

  return {
    summary,
    themes: themes.length
      ? themes
      : [
          {
            label: "No reason tags yet",
            mentions: 0,
            note: "Voters can tag a reason after they boop. None have so far.",
          },
        ],
    strongestSignal: topReason
      ? `"${topReason.label}" was the most common reason, chosen ${topReason.count} ${topReason.count === 1 ? "time" : "times"}.`
      : "Not enough tagged reasons to name a strongest signal.",
    biggestConcern:
      total < 20
        ? `Only ${total} ${total === 1 ? "person has" : "people have"} answered. Treat this as direction, not a decision.`
        : results.winnerId
          ? "None from the numbers alone — read the written feedback for anything the tags missed."
          : "The two options are close enough that the current sample can't separate them.",
    nextAction:
      total === 0
        ? "Get the first ten boops in — the feed is the fastest route."
        : results.winnerId
          ? `Ship ${leader?.variant.label ?? "the leader"} and move on.`
          : `Collect more responses, or change one thing between the versions so there's something clear to prefer.`,
    generatedAt: new Date().toISOString(),
    source: "deterministic",
  };
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function sharePhrase(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

/* -------------------------------------------------------------------------- */
/* Model path                                                                  */
/* -------------------------------------------------------------------------- */

export async function summarizeFeedback(
  results: TestResults,
): Promise<AiSummary> {
  const feedbackCount =
    results.comments.length + results.fiveSecondAnswers.length;

  // A model adds nothing over arithmetic when there is no prose to organise.
  if (!isOpenAIConfigured() || feedbackCount < 3) {
    return deterministicSummary(results);
  }

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({
      apiKey: cleanEnv(process.env.OPENAI_API_KEY)!,
      timeout: 25_000,
      maxRetries: 1,
    });

    const response = await client.responses.create({
      model: textModel(),
      instructions: SYSTEM_PROMPT,
      input: buildUserPrompt(results),
      text: {
        format: {
          type: "json_schema",
          name: "feedback_synthesis",
          strict: true,
          schema: JSON_SCHEMA,
        },
      },
    });

    const raw = response.output_text;
    if (!raw) return deterministicSummary(results);

    const parsed = JSON.parse(raw) as SummarySchemaShape;

    return {
      summary: parsed.summary,
      themes: (parsed.themes ?? []).slice(0, 3),
      strongestSignal: parsed.strongestSignal,
      biggestConcern: parsed.biggestConcern,
      nextAction: parsed.nextAction,
      generatedAt: new Date().toISOString(),
      source: "model",
    };
  } catch (error) {
    // Never let a summariser outage break a results page.
    console.error(
      "[boop] feedback synthesis failed, falling back to deterministic summary:",
      error instanceof Error ? error.message : error,
    );
    return deterministicSummary(results);
  }
}
