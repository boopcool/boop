import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort caller identity for rate limiting.
 *
 * Prefers a signed-in user id, then the anonymous cookie hash, then the
 * forwarded IP. Never used for authorization — only for throttling.
 */
export async function rateLimitKey(
  userId?: string | null,
  anonHash?: string | null,
): Promise<string> {
  if (userId) return `u:${userId}`;
  if (anonHash) return `a:${anonHash.slice(0, 24)}`;

  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "unknown";
  return `ip:${ip}`;
}
