import "server-only";

import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/config";
import { computeResults } from "@/lib/data/results";
import { demoState, demoViewer, DEMO_VIEWER_ID } from "@/lib/demo/store";
import { peekAnonHash } from "@/lib/anon";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  CreditEntry,
  FiveSecondResponse,
  Profile,
  Test,
  TestResults,
  TestWithVariants,
  Variant,
  Vote,
} from "@/lib/types";
import type { CategoryId, TestMode } from "@/lib/config";

/* -------------------------------------------------------------------------- */
/* Row mappers — the database speaks snake_case, the app speaks camelCase.     */
/* -------------------------------------------------------------------------- */

type Row = Record<string, unknown>;

const s = (v: unknown): string => (typeof v === "string" ? v : "");
const sn = (v: unknown): string | null => (typeof v === "string" ? v : null);
const n = (v: unknown): number => (typeof v === "number" ? v : 0);
const b = (v: unknown): boolean => v === true;

function toProfile(r: Row): Profile {
  return {
    id: s(r.id),
    username: s(r.username),
    displayName: s(r.display_name),
    bio: sn(r.bio),
    avatarSeed: s(r.avatar_seed) || s(r.username),
    credits: n(r.credits),
    boopsGiven: n(r.boops_given),
    createdAt: s(r.created_at),
    isDemo: b(r.is_demo),
  };
}

function toVariant(r: Row): Variant {
  return {
    id: s(r.id),
    testId: s(r.test_id),
    label: s(r.label),
    title: sn(r.title),
    imageUrl: sn(r.image_url),
    copyValue: sn(r.copy_value),
    displayOrder: n(r.display_order),
  };
}

function toTest(r: Row): Test {
  return {
    id: s(r.id),
    ownerId: s(r.owner_id),
    slug: s(r.slug),
    title: s(r.title),
    question: s(r.question),
    description: sn(r.description),
    category: (s(r.category) || "other") as CategoryId,
    mode: (s(r.mode) || "compare") as TestMode,
    visibility: (s(r.visibility) || "public") as Test["visibility"],
    status: (s(r.status) || "live") as Test["status"],
    targetVotes: n(r.target_votes),
    fiveSecondPrompt: sn(r.five_second_prompt),
    isDemo: b(r.is_demo),
    createdAt: s(r.created_at),
    closesAt: sn(r.closes_at),
  };
}

function toVote(r: Row): Vote {
  return {
    id: s(r.id),
    testId: s(r.test_id),
    variantId: s(r.variant_id),
    voterId: sn(r.voter_id),
    reason: sn(r.reason) as Vote["reason"],
    comment: sn(r.comment),
    createdAt: s(r.created_at),
  };
}

function toFiveSecond(r: Row): FiveSecondResponse {
  return {
    id: s(r.id),
    testId: s(r.test_id),
    voterId: sn(r.voter_id),
    answer: s(r.answer),
    createdAt: s(r.created_at),
  };
}

const TEST_SELECT =
  "id, owner_id, slug, title, question, description, category, mode, visibility, status, target_votes, five_second_prompt, is_demo, created_at, closes_at, " +
  "variants ( id, test_id, label, title, image_url, copy_value, display_order ), " +
  "profiles!tests_owner_id_fkey ( id, username, display_name, avatar_seed, is_demo )";

function assembleTest(r: Row, voteCount: number): TestWithVariants {
  const owner = (r.profiles ?? {}) as Row;
  const variants = ((r.variants ?? []) as Row[])
    .map(toVariant)
    .sort((a, x) => a.displayOrder - x.displayOrder);

  return {
    ...toTest(r),
    variants,
    owner: {
      id: s(owner.id),
      username: s(owner.username) || "someone",
      displayName: s(owner.display_name) || "Someone",
      avatarSeed: s(owner.avatar_seed) || s(owner.username),
      isDemo: b(owner.is_demo),
    },
    voteCount,
  };
}

/* -------------------------------------------------------------------------- */
/* Demo-store helpers                                                          */
/* -------------------------------------------------------------------------- */

function demoAssemble(test: Test): TestWithVariants {
  const st = demoState();
  const owner = st.profiles.get(test.ownerId);
  const variants = st.variants
    .filter((v) => v.testId === test.id)
    .sort((a, b2) => a.displayOrder - b2.displayOrder);

  const voteCount =
    test.mode === "five_second"
      ? st.fiveSecond.filter((f) => f.testId === test.id).length
      : st.votes.filter((v) => v.testId === test.id).length;

  return {
    ...test,
    variants,
    owner: {
      id: owner?.id ?? "",
      username: owner?.username ?? "someone",
      displayName: owner?.displayName ?? "Someone",
      avatarSeed: owner?.avatarSeed ?? "x",
      isDemo: owner?.isDemo ?? true,
    },
    voteCount,
  };
}

/* -------------------------------------------------------------------------- */
/* Viewer                                                                      */
/* -------------------------------------------------------------------------- */

export type Viewer = {
  profile: Profile | null;
  /** True when the app is running against the in-memory demo store. */
  demoMode: boolean;
  anonHash: string | null;
};

/**
 * `cache()` dedupes this across a single render pass, so a page that needs the
 * viewer in four places still makes one auth round trip.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  if (!isSupabaseConfigured()) {
    return { profile: demoViewer(), demoMode: true, anonHash: null };
  }

  const sb = await supabaseServer();
  if (!sb) return { profile: null, demoMode: false, anonHash: await peekAnonHash() };

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return { profile: null, demoMode: false, anonHash: await peekAnonHash() };
  }

  const { data } = await sb
    .from("profiles")
    .select("id, username, display_name, bio, avatar_seed, credits, boops_given, is_demo, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    profile: data ? toProfile(data as Row) : null,
    demoMode: false,
    anonHash: await peekAnonHash(),
  };
});

/* -------------------------------------------------------------------------- */
/* Feed                                                                        */
/* -------------------------------------------------------------------------- */

export type FeedOptions = {
  category?: CategoryId | "all";
  mode?: TestMode | "all";
  limit?: number;
};

export async function listFeed(
  options: FeedOptions = {},
): Promise<TestWithVariants[]> {
  const { category = "all", mode = "all", limit = 40 } = options;

  if (!isSupabaseConfigured()) {
    const st = demoState();
    return [...st.tests.values()]
      .filter((t) => t.visibility === "public" && t.status === "live")
      .filter((t) => category === "all" || t.category === category)
      .filter((t) => mode === "all" || t.mode === mode)
      .sort((a, x) => x.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map(demoAssemble);
  }

  const sb = await supabaseServer();
  if (!sb) return [];

  let query = sb
    .from("tests")
    .select(TEST_SELECT)
    .eq("visibility", "public")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category !== "all") query = query.eq("category", category);
  if (mode !== "all") query = query.eq("mode", mode);

  const { data, error } = await query;
  if (error || !data) return [];

  const rows = data as unknown as Row[];
  const counts = await voteCounts(rows.map((r) => s(r.id)));
  return rows.map((r) => assembleTest(r, counts.get(s(r.id)) ?? 0));
}

async function voteCounts(testIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (testIds.length === 0) return out;

  const sb = await supabaseServer();
  if (!sb) return out;

  const { data } = await sb.rpc("test_vote_counts", { p_test_ids: testIds });
  for (const row of (data ?? []) as Row[]) {
    out.set(s(row.test_id), Number(row.votes ?? 0));
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Single test                                                                 */
/* -------------------------------------------------------------------------- */

export const getTestBySlug = cache(
  async (slug: string): Promise<TestWithVariants | null> => {
    if (!isSupabaseConfigured()) {
      const st = demoState();
      const test = [...st.tests.values()].find((t) => t.slug === slug);
      return test ? demoAssemble(test) : null;
    }

    const sb = await supabaseServer();
    if (!sb) return null;

    const { data, error } = await sb
      .from("tests")
      .select(TEST_SELECT)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as unknown as Row;
    const counts = await voteCounts([s(row.id)]);
    return assembleTest(row, counts.get(s(row.id)) ?? 0);
  },
);

/**
 * Has this viewer already answered? Drives whether the feed shows the test and
 * whether the voting page reveals results immediately.
 */
export async function hasAnswered(
  test: TestWithVariants,
  viewer: Viewer,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const st = demoState();
    const id = viewer.profile?.id ?? DEMO_VIEWER_ID;
    return test.mode === "five_second"
      ? st.fiveSecond.some((f) => f.testId === test.id && f.voterId === id)
      : st.votes.some((v) => v.testId === test.id && v.voterId === id);
  }

  const sb = await supabaseServer();
  if (!sb) return false;

  const table = test.mode === "five_second" ? "five_second_responses" : "votes";

  if (viewer.profile) {
    const { count } = await sb
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("test_id", test.id)
      .eq("voter_id", viewer.profile.id);
    return (count ?? 0) > 0;
  }

  // Anonymous rows are written with the service role and are not readable
  // under RLS, so the answered check for anonymous visitors is done inside the
  // vote action (which owns the unique-index conflict) rather than here.
  return false;
}

/* -------------------------------------------------------------------------- */
/* Results                                                                     */
/* -------------------------------------------------------------------------- */

export async function getResults(slug: string): Promise<TestResults | null> {
  const test = await getTestBySlug(slug);
  if (!test) return null;

  if (!isSupabaseConfigured()) {
    const st = demoState();
    return computeResults(
      test,
      st.votes.filter((v) => v.testId === test.id),
      st.fiveSecond.filter((f) => f.testId === test.id),
    );
  }

  const sb = await supabaseServer();
  if (!sb) return computeResults(test, [], []);

  // The owner can read raw rows through RLS. Everyone else gets the aggregate
  // tally from the SECURITY DEFINER function, plus public comment text.
  const viewer = await getViewer();
  const isOwner = viewer.profile?.id === test.ownerId;

  if (isOwner) {
    const [{ data: votes }, { data: five }] = await Promise.all([
      sb.from("votes").select("*").eq("test_id", test.id),
      sb.from("five_second_responses").select("*").eq("test_id", test.id),
    ]);
    return computeResults(
      test,
      ((votes ?? []) as Row[]).map(toVote),
      ((five ?? []) as Row[]).map(toFiveSecond),
    );
  }

  const { data: tally } = await sb.rpc("test_tally", { p_test_id: test.id });

  // Synthesise one vote row per counted vote so the pure results function can
  // be reused. Reasons and comments are unavailable to non-owners by design.
  const synthetic: Vote[] = [];
  for (const row of (tally ?? []) as Row[]) {
    const variantId = s(row.variant_id);
    for (let i = 0; i < Number(row.votes ?? 0); i++) {
      synthetic.push({
        id: `${variantId}:${i}`,
        testId: test.id,
        variantId,
        voterId: null,
        reason: null,
        comment: null,
        createdAt: test.createdAt,
      });
    }
  }

  return computeResults(test, synthetic, []);
}

/* -------------------------------------------------------------------------- */
/* Dashboard + profiles                                                        */
/* -------------------------------------------------------------------------- */

export async function listOwnedTests(
  ownerId: string,
): Promise<TestWithVariants[]> {
  if (!isSupabaseConfigured()) {
    const st = demoState();
    return [...st.tests.values()]
      .filter((t) => t.ownerId === ownerId)
      .sort((a, x) => x.createdAt.localeCompare(a.createdAt))
      .map(demoAssemble);
  }

  const sb = await supabaseServer();
  if (!sb) return [];

  const { data } = await sb
    .from("tests")
    .select(TEST_SELECT)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const counts = await voteCounts(rows.map((r) => s(r.id)));
  return rows.map((r) => assembleTest(r, counts.get(s(r.id)) ?? 0));
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    const st = demoState();
    return (
      [...st.profiles.values()].find(
        (p) => p.username.toLowerCase() === username.toLowerCase(),
      ) ?? null
    );
  }

  const sb = await supabaseServer();
  if (!sb) return null;

  const { data } = await sb
    .from("profiles")
    .select("id, username, display_name, bio, avatar_seed, credits, boops_given, is_demo, created_at")
    .eq("username", username)
    .maybeSingle();

  return data ? toProfile(data as Row) : null;
}

export async function listPublicTestsBy(
  ownerId: string,
): Promise<TestWithVariants[]> {
  const all = await listOwnedTests(ownerId);
  return all.filter((t) => t.visibility === "public" && t.status !== "draft");
}

export async function getCreditLedger(
  userId: string,
  limit = 25,
): Promise<CreditEntry[]> {
  if (!isSupabaseConfigured()) {
    return demoState()
      .credits.filter((c) => c.userId === userId)
      .sort((a, x) => x.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  const sb = await supabaseServer();
  if (!sb) return [];

  const { data } = await sb
    .from("credit_ledger")
    .select("id, user_id, amount, type, reference, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as Row[]).map((r) => ({
    id: s(r.id),
    userId: s(r.user_id),
    amount: n(r.amount),
    type: s(r.type) as CreditEntry["type"],
    reference: sn(r.reference),
    createdAt: s(r.created_at),
  }));
}

/* -------------------------------------------------------------------------- */
/* Site-wide counters used on the marketing page                               */
/* -------------------------------------------------------------------------- */

export async function getPublicCounts(): Promise<{
  tests: number;
  boops: number;
  demo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    const st = demoState();
    return {
      tests: st.tests.size,
      boops: st.votes.length + st.fiveSecond.length,
      demo: true,
    };
  }

  const sb = await supabaseServer();
  if (!sb) return { tests: 0, boops: 0, demo: false };

  const [{ count: tests }, { count: boops }] = await Promise.all([
    sb
      .from("tests")
      .select("id", { count: "exact", head: true })
      .eq("visibility", "public"),
    sb.from("votes").select("id", { count: "exact", head: true }),
  ]);

  return { tests: tests ?? 0, boops: boops ?? 0, demo: false };
}
