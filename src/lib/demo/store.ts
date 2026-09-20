/**
 * In-memory store that powers Demo Mode.
 *
 * When Supabase is not configured, Boop still needs to be a complete,
 * clickable product: a seeded feed, working votes, live results, a dashboard.
 * This module provides exactly that, hydrated once per server process from
 * `seed-data.ts`.
 *
 * It is explicitly NOT a production persistence layer — a serverless deploy
 * gets a fresh copy per cold start. Configure Supabase and every read and
 * write moves to Postgres with RLS. The UI shows a Demo Mode banner whenever
 * this store is in use so nobody mistakes it for real storage.
 */

import { CREDITS } from "@/lib/config";
import { SEED_PROFILES, SEED_TESTS } from "@/lib/demo/seed-data";
import type {
  CreditEntry,
  FiveSecondResponse,
  Profile,
  Test,
  Variant,
  Vote,
} from "@/lib/types";

type DemoState = {
  profiles: Map<string, Profile>;
  tests: Map<string, Test>;
  variants: Variant[];
  votes: Vote[];
  fiveSecond: FiveSecondResponse[];
  credits: CreditEntry[];
  /** anonymous hash -> set of test ids already answered */
  anonVotes: Map<string, Set<string>>;
  seq: number;
};

const GLOBAL_KEY = Symbol.for("boop.demo.store");

type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: DemoState };

function hydrate(): DemoState {
  const state: DemoState = {
    profiles: new Map(),
    tests: new Map(),
    variants: [],
    votes: [],
    fiveSecond: [],
    credits: [],
    anonVotes: new Map(),
    seq: 0,
  };

  const now = Date.now();
  const id = () => {
    state.seq += 1;
    return `demo-${state.seq.toString(36)}-${state.seq}`;
  };

  for (const p of SEED_PROFILES) {
    state.profiles.set(p.id, {
      id: p.id,
      username: p.username,
      displayName: p.displayName,
      bio: p.bio,
      avatarSeed: p.avatarSeed,
      credits: p.credits,
      boopsGiven: p.boopsGiven,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 120).toISOString(),
      isDemo: true,
    });
  }

  const byUsername = new Map(
    [...state.profiles.values()].map((p) => [p.username, p]),
  );

  for (const t of SEED_TESTS) {
    const owner = byUsername.get(t.ownerUsername);
    if (!owner) continue;

    const testId = id();
    const createdAt = new Date(now - t.ageHours * 3600_000).toISOString();

    state.tests.set(testId, {
      id: testId,
      ownerId: owner.id,
      slug: t.slug,
      title: t.title,
      question: t.question,
      description: t.description,
      category: t.category,
      mode: t.mode,
      visibility: t.visibility,
      status: "live",
      targetVotes: t.targetVotes,
      fiveSecondPrompt: t.fiveSecondPrompt,
      isDemo: true,
      createdAt,
      closesAt: null,
    });

    const variantIdByLabel = new Map<string, string>();
    t.variants.forEach((v, i) => {
      const vid = id();
      variantIdByLabel.set(v.label, vid);
      state.variants.push({
        id: vid,
        testId,
        label: v.label,
        title: v.title,
        imageUrl: v.imageUrl,
        copyValue: v.copyValue,
        displayOrder: i,
      });
    });

    // Spread seeded votes across the window since the test was created so the
    // results timeline looks like it accumulated rather than arrived at once.
    const span = Math.max(1, t.ageHours) * 3600_000;
    t.votes.forEach((v, i) => {
      const variantId = variantIdByLabel.get(v.variantLabel);
      if (!variantId) return;
      state.votes.push({
        id: id(),
        testId,
        variantId,
        voterId: null,
        reason: v.reason,
        comment: v.comment,
        createdAt: new Date(
          now - span + (span * (i + 1)) / (t.votes.length + 1),
        ).toISOString(),
      });
    });

    (t.fiveSecondAnswers ?? []).forEach((answer, i) => {
      state.fiveSecond.push({
        id: id(),
        testId,
        voterId: null,
        answer,
        createdAt: new Date(
          now - span + (span * (i + 1)) / ((t.fiveSecondAnswers?.length ?? 1) + 1),
        ).toISOString(),
      });
    });
  }

  return state;
}

export function demoState(): DemoState {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = hydrate();
  return g[GLOBAL_KEY];
}

export function demoId(prefix: string): string {
  const s = demoState();
  s.seq += 1;
  return `${prefix}-${s.seq}-${Math.random().toString(36).slice(2, 8)}`;
}

/* -------------------------------------------------------------------------- */
/* The signed-in identity used in Demo Mode.                                   */
/* -------------------------------------------------------------------------- */

export const DEMO_VIEWER_ID = "11111111-1111-4111-8111-00000000000d";

/** Lazily creates the "you" profile so /dashboard has something to show. */
export function demoViewer(): Profile {
  const s = demoState();
  const existing = s.profiles.get(DEMO_VIEWER_ID);
  if (existing) return existing;

  const profile: Profile = {
    id: DEMO_VIEWER_ID,
    username: "you",
    displayName: "You",
    bio: "This is the local demo account. Connect Supabase for real sign-in.",
    avatarSeed: "you",
    credits: CREDITS.STARTER_GRANT,
    boopsGiven: 0,
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  s.profiles.set(DEMO_VIEWER_ID, profile);
  s.credits.push({
    id: demoId("credit"),
    userId: DEMO_VIEWER_ID,
    amount: CREDITS.STARTER_GRANT,
    type: "starter_grant",
    reference: null,
    createdAt: profile.createdAt,
  });
  return profile;
}
