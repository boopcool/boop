import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cleanEnv } from "@/lib/config";

export const ANON_COOKIE = "boop_anon";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Anonymous participation.
 *
 * A visitor gets one high-entropy random id in an httpOnly cookie. The raw id
 * never reaches the database — only an HMAC of it, keyed with a server-side
 * pepper. That means a database leak cannot be joined back to a browser, and
 * the cookie alone cannot be used to look a voter up.
 *
 * Honest limitation: this is a duplicate-vote *speed bump*, not a guarantee.
 * Clearing cookies, opening a private window or using another device produces
 * a new identity. Boop does not fingerprint, and does not pretend that
 * anonymous voting is Sybil-proof — the results UI reports sample size
 * plainly so readers can judge for themselves.
 */

function pepper(): string {
  const secret = cleanEnv(process.env.ANON_HASH_SECRET);
  if (secret) return secret;

  // Dev fallback so the app runs with an empty .env. Logged once, loudly,
  // because deploying without a real pepper makes hashes guessable.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[boop] ANON_HASH_SECRET is not set. Anonymous vote hashes are using a " +
        "non-secret development pepper. Set ANON_HASH_SECRET in production.",
    );
  }
  return "boop-development-pepper";
}

export function hashAnonId(rawId: string): string {
  return createHmac("sha256", pepper()).update(rawId).digest("hex");
}

/** Reads the anonymous id, minting one if the visitor does not have it yet. */
export async function getOrCreateAnonId(): Promise<{
  raw: string;
  hash: string;
  minted: boolean;
}> {
  const store = await cookies();
  const existing = store.get(ANON_COOKIE)?.value;

  if (existing && /^[0-9a-f]{32}$/.test(existing)) {
    return { raw: existing, hash: hashAnonId(existing), minted: false };
  }

  const raw = randomBytes(16).toString("hex");
  try {
    store.set(ANON_COOKIE, raw, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  } catch {
    // Read-only cookie context (Server Component). The caller will mint again
    // inside the server action that actually needs to persist it.
  }
  return { raw, hash: hashAnonId(raw), minted: true };
}

/** Read-only variant for Server Components — never mints or sets a cookie. */
export async function peekAnonHash(): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(ANON_COOKIE)?.value;
  if (!existing || !/^[0-9a-f]{32}$/.test(existing)) return null;
  return hashAnonId(existing);
}
