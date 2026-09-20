"use server";

import { getViewer, getTestBySlug } from "@/lib/data/read";
import {
  annotateVote,
  castVote,
  submitFiveSecond,
  type VoteOutcome,
} from "@/lib/data/write";
import { getOrCreateAnonId } from "@/lib/anon";
import { rateLimitKey } from "@/lib/request";
import { voteLimiter } from "@/lib/rate-limit";
import { fiveSecondAnswerSchema, voteSchema } from "@/lib/validation";
import type { ReasonId } from "@/lib/config";

export type VoteActionResult =
  | { ok: true; outcome: VoteOutcome }
  | { ok: false; error: string; code?: string };

/**
 * Records a boop.
 *
 * Every authorization decision here is made on the server from the session —
 * the client sends a slug and a variant id and nothing else that matters.
 */
export async function voteAction(input: {
  slug: string;
  variantId: string;
  reason: ReasonId | null;
  comment: string | null;
}): Promise<VoteActionResult> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That vote didn't look right." };
  }

  const viewer = await getViewer();

  // Mint the anonymous cookie inside the action, where cookies are writable.
  if (!viewer.profile) await getOrCreateAnonId();

  const limit = await voteLimiter.check(
    await rateLimitKey(viewer.profile?.id, viewer.anonHash),
  );
  if (!limit.success) {
    return { ok: false, error: "Slow down a moment.", code: "rate" };
  }

  const test = await getTestBySlug(parsed.data.slug);
  if (!test) return { ok: false, error: "That test no longer exists." };

  const result = await castVote({
    test,
    variantId: parsed.data.variantId,
    reason: (parsed.data.reason ?? null) as ReasonId | null,
    comment: parsed.data.comment ?? null,
    viewer: viewer.profile,
  });

  if (!result.ok) return { ok: false, error: result.error, code: result.code };

  // Deliberately no revalidatePath here. Every page that shows a tally is
  // `force-dynamic`, so there is no cache to bust — and revalidating from
  // inside a vote would re-render the feed underneath the voter, throwing away
  // the percentages and the "why?" prompt they just earned.
  return { ok: true, outcome: result.data };
}

export type AnnotateResult =
  | { ok: true; creditsEarned: number }
  | { ok: false; error: string };

/** Attaches the optional "why" to a boop that has already been recorded. */
export async function annotateVoteAction(input: {
  slug: string;
  voteId: string;
  reason: ReasonId | null;
  comment: string | null;
}): Promise<AnnotateResult> {
  const parsed = voteSchema
    .omit({ variantId: true })
    .extend({ voteId: voteSchema.shape.variantId })
    .safeParse(input);

  if (!parsed.success) return { ok: false, error: "Couldn't save that." };

  const viewer = await getViewer();
  const result = await annotateVote({
    voteId: parsed.data.voteId,
    reason: (parsed.data.reason ?? null) as ReasonId | null,
    comment: parsed.data.comment ?? null,
    viewer: viewer.profile,
    anonHash: viewer.anonHash,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, creditsEarned: result.data.creditsEarned };
}

export type FiveSecondActionResult =
  | { ok: true; total: number }
  | { ok: false; error: string; code?: string };

export async function fiveSecondAction(input: {
  slug: string;
  answer: string;
}): Promise<FiveSecondActionResult> {
  const parsed = fiveSecondAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Write a few words before submitting." };
  }

  const viewer = await getViewer();
  if (!viewer.profile) await getOrCreateAnonId();

  const limit = await voteLimiter.check(
    await rateLimitKey(viewer.profile?.id, viewer.anonHash),
  );
  if (!limit.success) {
    return { ok: false, error: "Slow down a moment.", code: "rate" };
  }

  const test = await getTestBySlug(parsed.data.slug);
  if (!test) return { ok: false, error: "That test no longer exists." };

  const result = await submitFiveSecond({
    test,
    answer: parsed.data.answer,
    viewer: viewer.profile,
  });

  if (!result.ok) return { ok: false, error: result.error, code: result.code };
  return { ok: true, total: result.data.total };
}
