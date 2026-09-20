import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cleanEnv } from "@/lib/config";

/**
 * Keeps the Supabase session cookie fresh.
 *
 * Next 16 renamed this convention from `middleware` to `proxy`; the behaviour
 * is unchanged.
 *
 * Server Components can read cookies but not write them, so token refresh has
 * to happen somewhere that can — here. In Demo Mode this is a no-op and the
 * request passes straight through.
 */
export async function proxy(request: NextRequest) {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching getUser() is what triggers the refresh; the result is unused here.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image optimisation, which never
     * need a session and shouldn't pay for a refresh check.
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|generated/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
