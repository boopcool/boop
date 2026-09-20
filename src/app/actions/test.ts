"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CREDITS } from "@/lib/config";
import { getViewer } from "@/lib/data/read";
import { closeTest, createTest } from "@/lib/data/write";
import { createTestLimiter } from "@/lib/rate-limit";
import { rateLimitKey } from "@/lib/request";
import { createTestSchema } from "@/lib/validation";

export type CreateTestResult =
  | { ok: true; slug: string }
  | { ok: false; error: string; code?: string };

export async function createTestAction(
  raw: unknown,
): Promise<CreateTestResult> {
  const viewer = await getViewer();
  if (!viewer.profile) {
    return {
      ok: false,
      code: "auth",
      error: "Sign in to launch a test — that's how we know where to send the results.",
    };
  }

  const limit = await createTestLimiter.check(
    await rateLimitKey(viewer.profile.id),
  );
  if (!limit.success) {
    return { ok: false, code: "rate", error: "That's a lot of tests. Try again shortly." };
  }

  const parsed = createTestSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Something in that test didn't validate." };
  }

  const result = await createTest({ input: parsed.data, owner: viewer.profile });
  if (!result.ok) return { ok: false, error: result.error, code: result.code };

  revalidatePath("/feed");
  revalidatePath("/dashboard");
  return { ok: true, slug: result.data.slug };
}

export async function closeTestAction(formData: FormData): Promise<void> {
  const viewer = await getViewer();
  if (!viewer.profile) redirect("/sign-in");

  const slug = String(formData.get("slug") ?? "");
  if (!slug) return;

  await closeTest(slug, viewer.profile.id);

  revalidatePath("/dashboard");
  revalidatePath(`/results/${slug}`);
  revalidatePath("/feed");
}

/** Cost of a test, kept on the server so the wizard can't misprice itself. */
export async function quoteAction(targetVotes: number): Promise<number> {
  const clamped = Math.min(
    CREDITS.MAX_RESPONSES,
    Math.max(CREDITS.MIN_RESPONSES, Math.floor(targetVotes)),
  );
  return clamped * CREDITS.COST_PER_RESPONSE;
}
