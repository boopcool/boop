import "server-only";

import { CREDITS, isSupabaseConfigured } from "@/lib/config";
import { demoId, demoState, DEMO_VIEWER_ID } from "@/lib/demo/store";
import { getOrCreateAnonId } from "@/lib/anon";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";
import type { CreateTestInput } from "@/lib/validation";
import type { Profile, TestWithVariants } from "@/lib/types";
import type { ReasonId } from "@/lib/config";

export type WriteResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: "duplicate" | "credits" | "auth" | "state" };

/* -------------------------------------------------------------------------- */
/* Slugs                                                                       */
/* -------------------------------------------------------------------------- */

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
  return base.length >= 3 ? base : `test-${Date.now().toString(36)}`;
}

async function uniqueSlug(base: string): Promise<string> {
  const suffix = () => Math.random().toString(36).slice(2, 6);

  if (!isSupabaseConfigured()) {
    const st = demoState();
    const taken = new Set([...st.tests.values()].map((t) => t.slug));
    let candidate = base;
    while (taken.has(candidate)) candidate = `${base}-${suffix()}`;
    return candidate;
  }

  const sb = await supabaseServer();
  if (!sb) return `${base}-${suffix()}`;

  let candidate = base;
  for (let i = 0; i < 5; i++) {
    const { data } = await sb
      .from("tests")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix()}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/* -------------------------------------------------------------------------- */
/* Voting                                                                      */
/* -------------------------------------------------------------------------- */

export type VoteOutcome = {
  /** Per-variant share, keyed by variant id, revealed after the boop lands. */
  shares: Record<string, number>;
  counts: Record<string, number>;
  total: number;
  creditsEarned: number;
  /** Lets the voter attach a reason after the fact, without a second vote. */
  voteId: string | null;
};

export async function castVote(args: {
  test: TestWithVariants;
  variantId: string;
  reason: ReasonId | null;
  comment: string | null;
  viewer: Profile | null;
}): Promise<WriteResult<VoteOutcome>> {
  const { test, variantId, reason, comment, viewer } = args;

  if (test.status !== "live") {
    return { ok: false, error: "This test is closed.", code: "state" };
  }
  if (!test.variants.some((v) => v.id === variantId)) {
    return { ok: false, error: "That version is not part of this test." };
  }
  if (viewer && viewer.id === test.ownerId) {
    return { ok: false, error: "You can't boop your own test.", code: "state" };
  }

  /* --- Demo Mode --------------------------------------------------------- */

  if (!isSupabaseConfigured()) {
    const st = demoState();
    const voterId = viewer?.id ?? DEMO_VIEWER_ID;

    if (st.votes.some((v) => v.testId === test.id && v.voterId === voterId)) {
      return { ok: false, error: "You've already booped this one.", code: "duplicate" };
    }

    const voteId = demoId("vote");
    st.votes.push({
      id: voteId,
      testId: test.id,
      variantId,
      voterId,
      reason,
      comment,
      createdAt: new Date().toISOString(),
    });

    const earned = awardDemoCredits(voterId, comment);
    return {
      ok: true,
      data: { ...tallyDemo(test), creditsEarned: earned, voteId },
    };
  }

  /* --- Supabase ---------------------------------------------------------- */

  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "Storage unavailable." };

  let voteId: string | null = null;

  if (viewer) {
    const { data, error } = await sb
      .from("votes")
      .insert({
        test_id: test.id,
        variant_id: variantId,
        voter_id: viewer.id,
        reason,
        comment,
      })
      .select("id")
      .single();
    if (error) return insertError(error);
    voteId = String((data as Record<string, unknown>).id);
  } else {
    // Anonymous votes carry no auth.uid(), so RLS cannot attribute them.
    // They are written with the service role after the hash is derived here.
    const admin = supabaseAdmin();
    if (!admin) {
      return {
        ok: false,
        error: "Sign in to boop — anonymous voting needs a server key.",
        code: "auth",
      };
    }
    const { hash } = await getOrCreateAnonId();
    const { data, error } = await admin
      .from("votes")
      .insert({
        test_id: test.id,
        variant_id: variantId,
        anonymous_session_hash: hash,
        reason,
        comment,
      })
      .select("id")
      .single();
    if (error) return insertError(error);
    voteId = String((data as Record<string, unknown>).id);
  }

  return {
    ok: true,
    data: { ...(await tallySupabase(test)), creditsEarned: 0, voteId },
  };
}

/**
 * Attaches a reason tag and/or written comment to a boop the voter has already
 * cast. Keeping this separate is what lets the percentages appear the instant
 * someone picks, with the "why" asked afterwards.
 *
 * Ownership is enforced by the caller's session (RLS) or, in Demo Mode, by
 * matching the voter id — a client can never annotate somebody else's vote.
 */
export async function annotateVote(args: {
  voteId: string;
  reason: ReasonId | null;
  comment: string | null;
  viewer: Profile | null;
  anonHash: string | null;
}): Promise<WriteResult<{ creditsEarned: number }>> {
  const { voteId, reason, comment, viewer, anonHash } = args;

  if (!isSupabaseConfigured()) {
    const st = demoState();
    const vote = st.votes.find((v) => v.id === voteId);
    const voterId = viewer?.id ?? DEMO_VIEWER_ID;
    if (!vote || vote.voterId !== voterId) {
      return { ok: false, error: "Couldn't find that boop.", code: "auth" };
    }
    // Only pay the comment bonus the first time prose is attached.
    const firstComment = !vote.comment && Boolean(comment);
    vote.reason = reason;
    vote.comment = comment;

    let earned = 0;
    if (firstComment && comment && comment.trim().length >= CREDITS.COMMENT_BONUS_MIN_CHARS) {
      earned = CREDITS.COMMENT_BONUS;
      const profile = st.profiles.get(voterId);
      if (profile) profile.credits += earned;
      st.credits.push({
        id: demoId("credit"),
        userId: voterId,
        amount: earned,
        type: "comment_bonus",
        reference: voteId,
        createdAt: new Date().toISOString(),
      });
    }
    return { ok: true, data: { creditsEarned: earned } };
  }

  if (viewer) {
    const sb = await supabaseServer();
    if (!sb) return { ok: false, error: "Storage unavailable." };
    const { error } = await sb
      .from("votes")
      .update({ reason, comment })
      .eq("id", voteId)
      .eq("voter_id", viewer.id);
    if (error) return { ok: false, error: "Couldn't save that." };
    return { ok: true, data: { creditsEarned: 0 } };
  }

  // Anonymous: verify the hash matches before touching the row.
  const admin = supabaseAdmin();
  if (!admin || !anonHash) {
    return { ok: false, error: "Couldn't save that.", code: "auth" };
  }
  const { error } = await admin
    .from("votes")
    .update({ reason, comment })
    .eq("id", voteId)
    .eq("anonymous_session_hash", anonHash);
  if (error) return { ok: false, error: "Couldn't save that." };
  return { ok: true, data: { creditsEarned: 0 } };
}

export async function submitFiveSecond(args: {
  test: TestWithVariants;
  answer: string;
  viewer: Profile | null;
}): Promise<WriteResult<{ total: number }>> {
  const { test, answer, viewer } = args;

  if (test.status !== "live") {
    return { ok: false, error: "This test is closed.", code: "state" };
  }

  if (!isSupabaseConfigured()) {
    const st = demoState();
    const voterId = viewer?.id ?? DEMO_VIEWER_ID;
    if (st.fiveSecond.some((f) => f.testId === test.id && f.voterId === voterId)) {
      return { ok: false, error: "You've already answered this one.", code: "duplicate" };
    }
    st.fiveSecond.push({
      id: demoId("five"),
      testId: test.id,
      voterId,
      answer,
      createdAt: new Date().toISOString(),
    });
    awardDemoCredits(voterId, answer);
    return {
      ok: true,
      data: { total: st.fiveSecond.filter((f) => f.testId === test.id).length },
    } as const;
  }

  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "Storage unavailable." };

  if (viewer) {
    const { error } = await sb.from("five_second_responses").insert({
      test_id: test.id,
      voter_id: viewer.id,
      answer,
    });
    if (error) return insertError(error);
  } else {
    const admin = supabaseAdmin();
    if (!admin) {
      return { ok: false, error: "Sign in to answer.", code: "auth" };
    }
    const { hash } = await getOrCreateAnonId();
    const { error } = await admin.from("five_second_responses").insert({
      test_id: test.id,
      anonymous_session_hash: hash,
      answer,
    });
    if (error) return insertError(error);
  }

  const { count } = await sb
    .from("five_second_responses")
    .select("id", { count: "exact", head: true })
    .eq("test_id", test.id);

  return { ok: true, data: { total: count ?? 0 } };
}

function insertError(error: { code?: string; message: string }): WriteResult<never> {
  if (error.code === "23505") {
    return { ok: false, error: "You've already booped this one.", code: "duplicate" };
  }
  if (error.code === "42501") {
    return { ok: false, error: "You're not allowed to vote on this test.", code: "auth" };
  }
  return { ok: false, error: "Couldn't record that boop. Try again." };
}

/* -------------------------------------------------------------------------- */
/* Tallies                                                                     */
/* -------------------------------------------------------------------------- */

type Tally = Pick<VoteOutcome, "shares" | "counts" | "total">;

function tallyDemo(test: TestWithVariants): Tally {
  const st = demoState();
  const rows = st.votes.filter((v) => v.testId === test.id);
  return buildTally(
    test,
    Object.fromEntries(
      test.variants.map((v) => [
        v.id,
        rows.filter((r) => r.variantId === v.id).length,
      ]),
    ),
  );
}

async function tallySupabase(test: TestWithVariants): Promise<Tally> {
  const sb = await supabaseServer();
  const counts: Record<string, number> = Object.fromEntries(
    test.variants.map((v) => [v.id, 0]),
  );

  if (sb) {
    const { data } = await sb.rpc("test_tally", { p_test_id: test.id });
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const id = String(row.variant_id ?? "");
      if (id in counts) counts[id] = Number(row.votes ?? 0);
    }
  }
  return buildTally(test, counts);
}

function buildTally(
  test: TestWithVariants,
  counts: Record<string, number>,
): Tally {
  const total = Object.values(counts).reduce((a, x) => a + x, 0);
  const shares: Record<string, number> = {};

  // Largest-remainder rounding so the displayed percentages sum to 100.
  const exact = test.variants.map((v) => ((counts[v.id] ?? 0) / (total || 1)) * 100);
  const floors = exact.map(Math.floor);
  let left = total === 0 ? 0 : 100 - floors.reduce((a, x) => a + x, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, x) => x.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] = (floors[i] ?? 0) + 1;
    left -= 1;
  }
  test.variants.forEach((v, i) => {
    shares[v.id] = total === 0 ? 0 : (floors[i] ?? 0);
  });

  return { shares, counts, total };
}

/** Demo-mode mirror of the `votes_bookkeeping` trigger. */
function awardDemoCredits(voterId: string, comment: string | null): number {
  const st = demoState();
  const profile = st.profiles.get(voterId);
  if (!profile) return 0;

  profile.boopsGiven += 1;
  let earned = 0;

  if (profile.boopsGiven % CREDITS.VOTES_PER_EARN === 0) {
    earned += CREDITS.EARN_AMOUNT;
    st.credits.push({
      id: demoId("credit"),
      userId: voterId,
      amount: CREDITS.EARN_AMOUNT,
      type: "vote_earn",
      reference: `boops:${profile.boopsGiven}`,
      createdAt: new Date().toISOString(),
    });
  }

  if (comment && comment.trim().length >= CREDITS.COMMENT_BONUS_MIN_CHARS) {
    earned += CREDITS.COMMENT_BONUS;
    st.credits.push({
      id: demoId("credit"),
      userId: voterId,
      amount: CREDITS.COMMENT_BONUS,
      type: "comment_bonus",
      reference: demoId("c"),
      createdAt: new Date().toISOString(),
    });
  }

  profile.credits += earned;
  return earned;
}

/* -------------------------------------------------------------------------- */
/* Creating a test                                                             */
/* -------------------------------------------------------------------------- */

export async function createTest(args: {
  input: CreateTestInput;
  owner: Profile;
}): Promise<WriteResult<{ slug: string }>> {
  const { input, owner } = args;
  const cost = input.targetVotes * CREDITS.COST_PER_RESPONSE;

  if (owner.credits < cost) {
    return {
      ok: false,
      code: "credits",
      error: `That test costs ${cost} credits and you have ${owner.credits}. Boop a few tests in the feed or top up.`,
    };
  }

  const slug = await uniqueSlug(slugify(input.title));

  /* --- Demo Mode --------------------------------------------------------- */

  if (!isSupabaseConfigured()) {
    const st = demoState();
    const testId = demoId("test");
    const now = new Date().toISOString();

    st.tests.set(testId, {
      id: testId,
      ownerId: owner.id,
      slug,
      title: input.title,
      question: input.question,
      description: input.description,
      category: input.category as CreateTestInput["category"] & string,
      mode: input.mode,
      visibility: input.visibility,
      status: "live",
      targetVotes: input.targetVotes,
      fiveSecondPrompt: input.fiveSecondPrompt,
      isDemo: false,
      createdAt: now,
      closesAt: null,
    } as never);

    input.variants.forEach((v, i) => {
      st.variants.push({
        id: demoId("variant"),
        testId,
        label: v.label,
        title: v.title,
        imageUrl: v.imageUrl,
        copyValue: v.copyValue,
        displayOrder: i,
      });
    });

    const profile = st.profiles.get(owner.id);
    if (profile) profile.credits -= cost;
    st.credits.push({
      id: demoId("credit"),
      userId: owner.id,
      amount: -cost,
      type: "test_spend",
      reference: testId,
      createdAt: now,
    });

    return { ok: true, data: { slug } };
  }

  /* --- Supabase ---------------------------------------------------------- */

  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "Storage unavailable." };

  const { data: created, error } = await sb
    .from("tests")
    .insert({
      owner_id: owner.id,
      slug,
      title: input.title,
      question: input.question,
      description: input.description,
      category: input.category,
      mode: input.mode,
      visibility: input.visibility,
      // Opens as a draft; `spend_credits_for_test` flips it to live only once
      // the credits have actually been debited inside the same transaction.
      status: "draft",
      target_votes: input.targetVotes,
      five_second_prompt: input.fiveSecondPrompt,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false, error: "Couldn't create that test. Try again." };
  }

  const testId = String((created as Record<string, unknown>).id);

  const { error: variantError } = await sb.from("variants").insert(
    input.variants.map((v, i) => ({
      test_id: testId,
      label: v.label,
      title: v.title,
      image_url: v.imageUrl,
      copy_value: v.copyValue,
      display_order: i,
    })),
  );

  if (variantError) {
    await sb.from("tests").delete().eq("id", testId);
    return { ok: false, error: "Couldn't save those versions. Try again." };
  }

  const { error: spendError } = await sb.rpc("spend_credits_for_test", {
    p_test_id: testId,
    p_amount: cost,
  });

  if (spendError) {
    await sb.from("tests").delete().eq("id", testId);
    return {
      ok: false,
      code: "credits",
      error: spendError.message.includes("insufficient")
        ? "Not enough credits for that many responses."
        : "Couldn't launch that test. Try again.",
    };
  }

  return { ok: true, data: { slug } };
}

export async function closeTest(
  slug: string,
  ownerId: string,
): Promise<WriteResult<null>> {
  if (!isSupabaseConfigured()) {
    const st = demoState();
    const test = [...st.tests.values()].find((t) => t.slug === slug);
    if (!test || test.ownerId !== ownerId) {
      return { ok: false, error: "Not your test.", code: "auth" };
    }
    test.status = "closed";
    return { ok: true, data: null };
  }

  const sb = await supabaseServer();
  if (!sb) return { ok: false, error: "Storage unavailable." };

  const { error } = await sb
    .from("tests")
    .update({ status: "closed" })
    .eq("slug", slug)
    .eq("owner_id", ownerId);

  if (error) return { ok: false, error: "Couldn't close that test." };
  return { ok: true, data: null };
}
