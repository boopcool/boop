import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Exchanges the one-time code from a magic link or OAuth redirect for a
 * session cookie.
 *
 * `next` is validated as a same-origin path before it is used, so a crafted
 * callback URL can't bounce a freshly-authenticated user off-site.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/feed";

  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/feed";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", url.origin));
  }

  const sb = await supabaseServer();
  if (!sb) {
    return NextResponse.redirect(
      new URL("/sign-in?error=unavailable", url.origin),
    );
  }

  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/sign-in?error=oauth", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
