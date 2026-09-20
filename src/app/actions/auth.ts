"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured, siteUrl } from "@/lib/config";
import { supabaseServer } from "@/lib/supabase/server";
import { authLimiter } from "@/lib/rate-limit";
import { rateLimitKey } from "@/lib/request";
import { signInSchema } from "@/lib/validation";

export type SignInState = {
  status: "idle" | "sent" | "error" | "demo";
  message: string;
  email?: string;
};

export async function sendMagicLinkAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { status: "error", message: "That email doesn't look right." };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "demo",
      message:
        "This deployment is running in Demo Mode, so there's no mailbox to send to. You're already signed in as a local sample account — head to the feed and start booping.",
    };
  }

  const limit = await authLimiter.check(await rateLimitKey(null, null));
  if (!limit.success) {
    return {
      status: "error",
      message: "Too many sign-in attempts. Wait a few minutes and try again.",
    };
  }

  const sb = await supabaseServer();
  if (!sb) return { status: "error", message: "Auth is unavailable right now." };

  const { error } = await sb.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(parsed.data.next)}`,
    },
  });

  if (error) {
    return { status: "error", message: "Couldn't send that link. Try again." };
  }

  return {
    status: "sent",
    message: "Check your email — the link signs you straight in.",
    email: parsed.data.email,
  };
}

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/sign-in?demo=1");

  const sb = await supabaseServer();
  if (!sb) redirect("/sign-in?error=unavailable");

  const next = String(formData.get("next") ?? "/feed");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/feed";

  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error || !data.url) redirect("/sign-in?error=oauth");
  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const sb = await supabaseServer();
  if (sb) await sb.auth.signOut();
  redirect("/");
}
