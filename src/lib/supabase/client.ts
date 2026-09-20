"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanEnv } from "@/lib/config";

let cached: SupabaseClient | null | undefined;

/**
 * Browser Supabase client, used only for auth (magic link, OAuth) and for
 * direct-to-Storage uploads. All data mutations go through server actions so
 * that authorization is never decided in the browser.
 *
 * Returns null in Demo Mode.
 */
export function supabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  cached = url && key ? createBrowserClient(url, key) : null;
  return cached;
}
