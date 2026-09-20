import "server-only";

/**
 * Rate limiting, behind an adapter.
 *
 * The default implementation is an in-process fixed-window counter. That is
 * correct for a single Node process and good enough to stop a loop in a
 * browser tab, but it does NOT hold across serverless instances. The interface
 * is deliberately the same shape as Upstash Ratelimit's, so swapping in a
 * shared backend is a one-file change — see `createDurableLimiter` below.
 */

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the current window resets. */
  reset: number;
};

export type RateLimiter = {
  check: (key: string) => Promise<RateLimitResult>;
};

type Bucket = { count: number; reset: number };

const GLOBAL_KEY = Symbol.for("boop.ratelimit.buckets");
type GlobalWithBuckets = typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  const g = globalThis as GlobalWithBuckets;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY];
}

export function createLimiter(
  name: string,
  limit: number,
  windowMs: number,
): RateLimiter {
  return {
    async check(key: string): Promise<RateLimitResult> {
      const store = buckets();
      const id = `${name}:${key}`;
      const now = Date.now();
      const existing = store.get(id);

      if (!existing || existing.reset <= now) {
        const reset = now + windowMs;
        store.set(id, { count: 1, reset });
        pruneOccasionally(store, now);
        return { success: true, limit, remaining: limit - 1, reset };
      }

      existing.count += 1;
      return {
        success: existing.count <= limit,
        limit,
        remaining: Math.max(0, limit - existing.count),
        reset: existing.reset,
      };
    },
  };
}

// Keep the map from growing without bound in a long-lived process.
let lastPrune = 0;
function pruneOccasionally(store: Map<string, Bucket>, now: number): void {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, bucket] of store) {
    if (bucket.reset <= now) store.delete(key);
  }
}

/**
 * Drop-in replacement point for a shared store (Upstash, Redis, Postgres).
 * Wire it up here and every call site keeps working unchanged.
 */
export function createDurableLimiter(
  name: string,
  limit: number,
  windowMs: number,
): RateLimiter {
  return createLimiter(name, limit, windowMs);
}

/* --- The limits Boop actually enforces ------------------------------------ */

export const voteLimiter = createLimiter("vote", 40, 60_000);
export const createTestLimiter = createLimiter("create-test", 10, 60 * 60_000);
export const uploadLimiter = createLimiter("upload", 30, 10 * 60_000);
export const summaryLimiter = createLimiter("summary", 6, 60 * 60_000);
export const authLimiter = createLimiter("auth", 8, 15 * 60_000);
