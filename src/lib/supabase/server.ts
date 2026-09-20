import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cleanEnv, isSupabaseConfigured } from "@/lib/config";

/**
 * Request-scoped Supabase client carrying the caller's session. Every read and
 * write through this client is subject to RLS — this is the only client that
 * should ever be used to act on behalf of a signed-in user.
 *
 * Returns null in Demo Mode so callers can fall back to the in-memory store.
 */
export async function supabaseServer(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)!,
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Session refresh is handled by middleware instead.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * Only ever used for work that genuinely cannot be attributed to a session:
 * anonymous votes (where there is no auth.uid()), Stripe webhook fulfilment,
 * and the seed script. Never imported into a Client Component — the
 * `server-only` import at the top of this file makes that a build error.
 */
export function supabaseAdmin(): SupabaseClient | null {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
