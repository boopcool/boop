/**
 * Seeds a real Supabase project with Boop's demo corpus.
 *
 *   npm run seed            # insert anything missing
 *   npm run seed -- --reset # delete previously seeded demo rows first
 *
 * Everything written here is marked `is_demo = true`, which is what drives the
 * visible "Demo" badge in the UI. The script refuses to touch rows it did not
 * create, so it can never clear a real user's tests.
 *
 * In Demo Mode (no Supabase configured) this script is unnecessary — the same
 * corpus is loaded into memory automatically on boot.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SEED_PROFILES, SEED_TESTS } from "../src/lib/demo/seed-data";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `\nMissing ${name}.\n\n` +
        "Seeding writes through the service role so it can create auth users\n" +
        "and bypass RLS. Set these in .env.local first:\n" +
        "  NEXT_PUBLIC_SUPABASE_URL\n" +
        "  SUPABASE_SERVICE_ROLE_KEY\n",
    );
    process.exit(1);
  }
  return value;
}

/** Loads .env.local without pulling in a dependency. */
async function loadEnv(): Promise<void> {
  const { readFile } = await import("node:fs/promises");
  for (const file of [".env.local", ".env"]) {
    try {
      const contents = await readFile(file, "utf8");
      for (const line of contents.split("\n")) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (!key || process.env[key]) continue;
        process.env[key] = (rawValue ?? "").replace(/^["']|["']$/g, "");
      }
    } catch {
      // File absent — fine.
    }
  }
}

async function ensureProfile(
  db: SupabaseClient,
  seed: (typeof SEED_PROFILES)[number],
): Promise<string | null> {
  const email = `${seed.username}@demo.boop.cool`;

  // An auth user has to exist first: profiles.id is FK'd to auth.users.
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: seed.displayName, demo: true },
  });

  let userId = created?.user?.id ?? null;

  if (error && !/already/i.test(error.message)) {
    console.error(`  ! ${seed.username}: ${error.message}`);
    return null;
  }

  if (!userId) {
    // Already existed — find it.
    const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list?.users.find((u) => u.email === email)?.id ?? null;
  }
  if (!userId) return null;

  // The handle_new_user trigger already made a profile row; align it.
  const { error: profileError } = await db
    .from("profiles")
    .upsert(
      {
        id: userId,
        username: seed.username,
        display_name: seed.displayName,
        bio: seed.bio,
        avatar_seed: seed.avatarSeed,
        is_demo: true,
      },
      { onConflict: "id" },
    );

  if (profileError) {
    console.error(`  ! ${seed.username}: ${profileError.message}`);
    return null;
  }

  return userId;
}

async function main(): Promise<void> {
  await loadEnv();

  const db = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  if (process.argv.includes("--reset")) {
    console.log("Removing previously seeded demo tests…");
    const { error } = await db.from("tests").delete().eq("is_demo", true);
    if (error) console.error(`  ! ${error.message}`);
  }

  console.log("Seeding profiles…");
  const idByUsername = new Map<string, string>();
  for (const seed of SEED_PROFILES) {
    const id = await ensureProfile(db, seed);
    if (id) {
      idByUsername.set(seed.username, id);
      console.log(`  · @${seed.username}`);
    }
  }

  console.log("Seeding tests…");
  const now = Date.now();
  let created = 0;

  for (const seed of SEED_TESTS) {
    const ownerId = idByUsername.get(seed.ownerUsername);
    if (!ownerId) continue;

    const { data: existing } = await db
      .from("tests")
      .select("id")
      .eq("slug", seed.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  · ${seed.slug} (already there)`);
      continue;
    }

    const createdAt = new Date(now - seed.ageHours * 3_600_000).toISOString();

    const { data: test, error: testError } = await db
      .from("tests")
      .insert({
        owner_id: ownerId,
        slug: seed.slug,
        title: seed.title,
        question: seed.question,
        description: seed.description,
        category: seed.category,
        mode: seed.mode,
        visibility: seed.visibility,
        status: "live",
        target_votes: seed.targetVotes,
        five_second_prompt: seed.fiveSecondPrompt,
        is_demo: true,
        created_at: createdAt,
      })
      .select("id")
      .single();

    if (testError || !test) {
      console.error(`  ! ${seed.slug}: ${testError?.message}`);
      continue;
    }

    const testId = (test as { id: string }).id;

    const { data: variants, error: variantError } = await db
      .from("variants")
      .insert(
        seed.variants.map((v, i) => ({
          test_id: testId,
          label: v.label,
          title: v.title,
          image_url: v.imageUrl,
          copy_value: v.copyValue,
          display_order: i,
        })),
      )
      .select("id, label");

    if (variantError || !variants) {
      console.error(`  ! ${seed.slug} variants: ${variantError?.message}`);
      continue;
    }

    const variantIdByLabel = new Map(
      (variants as { id: string; label: string }[]).map((v) => [v.label, v.id]),
    );

    // Seeded votes are anonymous with a deterministic, clearly-synthetic hash
    // so they can never be confused with — or attributed to — a real person.
    const span = Math.max(1, seed.ageHours) * 3_600_000;
    const voteRows = seed.votes.flatMap((vote, i) => {
      const variantId = variantIdByLabel.get(vote.variantLabel);
      if (!variantId) return [];
      return [
        {
          test_id: testId,
          variant_id: variantId,
          anonymous_session_hash: syntheticHash(seed.slug, i),
          reason: vote.reason,
          comment: vote.comment,
          created_at: new Date(
            now - span + (span * (i + 1)) / (seed.votes.length + 1),
          ).toISOString(),
        },
      ];
    });

    if (voteRows.length > 0) {
      const { error } = await db.from("votes").insert(voteRows);
      if (error) console.error(`  ! ${seed.slug} votes: ${error.message}`);
    }

    const answers = seed.fiveSecondAnswers ?? [];
    if (answers.length > 0) {
      const { error } = await db.from("five_second_responses").insert(
        answers.map((answer, i) => ({
          test_id: testId,
          anonymous_session_hash: syntheticHash(`${seed.slug}:5s`, i),
          answer,
          created_at: new Date(
            now - span + (span * (i + 1)) / (answers.length + 1),
          ).toISOString(),
        })),
      );
      if (error) console.error(`  ! ${seed.slug} answers: ${error.message}`);
    }

    created += 1;
    console.log(
      `  · ${seed.slug} — ${seed.votes.length || answers.length} responses`,
    );
  }

  console.log(
    `\nDone. ${created} new test${created === 1 ? "" : "s"} seeded, all marked Demo.`,
  );
}

/** 64 hex chars, matching the column check, but obviously not a real HMAC. */
function syntheticHash(key: string, index: number): string {
  let h = 2166136261;
  const input = `demo-seed:${key}:${index}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const base = Math.abs(h).toString(16).padStart(8, "0");
  return `deadbeef${base}`.padEnd(64, "0").slice(0, 64);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
