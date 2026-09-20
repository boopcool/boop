import { z } from "zod";
import {
  CATEGORY_IDS,
  CREDITS,
  LIMITS,
  REASON_IDS,
  FIVE_SECOND_PROMPTS,
} from "@/lib/config";

/**
 * Every server action and route handler validates its input here. Nothing
 * downstream trusts a shape it did not get from one of these schemas, and no
 * schema accepts a user id — the caller's identity always comes from the
 * session, never from the request body.
 */

/**
 * Strips C0 control characters and DEL, then collapses whitespace.
 *
 * Done by code point rather than a regex character class so the intent is
 * legible and so nothing outside ASCII control space is ever touched — user
 * text in any script passes through unchanged.
 */
export function cleanText(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    const isC0Control = code < 32 && code !== 9 && code !== 10 && code !== 13;
    if (isC0Control || code === 127) continue;
    out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

const text = (max: number) =>
  z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(1).max(max));

/**
 * Optional free text. Accepts a string, null or a missing field, and always
 * yields either a cleaned non-empty string or null — so nothing downstream has
 * to distinguish "" from undefined.
 */
const optionalText = (max: number) =>
  z
    .string()
    .nullish()
    .transform((v) => cleanText(v ?? ""))
    .pipe(z.string().max(max))
    .transform((v): string | null => (v.length === 0 ? null : v));

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{2,79}$/, "Invalid test address");

export const usernameSchema = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(3)
      .max(LIMITS.USERNAME_MAX)
      .regex(/^[a-z0-9_]+$/, "Letters, numbers and underscores only"),
  );

/* --- Creating a test ------------------------------------------------------ */

export const variantInputSchema = z
  .object({
    label: text(LIMITS.VARIANT_LABEL_MAX),
    title: optionalText(90),
    imageUrl: z
      .string()
      .nullish()
      .transform((v) => (v ?? "").trim())
      .pipe(
        z
          .string()
          .max(1024)
          .refine(
            (v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v),
            "Images must be uploaded through Boop",
          ),
      )
      .transform((v): string | null => (v === "" ? null : v)),
    copyValue: optionalText(LIMITS.COPY_VARIANT_MAX),
  })
  .refine((v) => Boolean(v.imageUrl) || Boolean(v.copyValue), {
    message: "Each version needs an image or some copy",
  });

export const createTestSchema = z
  .object({
    title: text(LIMITS.TITLE_MAX),
    question: text(LIMITS.QUESTION_MAX),
    description: optionalText(LIMITS.DESCRIPTION_MAX),
    category: z.enum(CATEGORY_IDS as [string, ...string[]]),
    mode: z.enum(["compare", "five_second"]),
    visibility: z.enum(["public", "unlisted", "private"]).default("public"),
    targetVotes: z.coerce
      .number()
      .int()
      .min(CREDITS.MIN_RESPONSES)
      .max(CREDITS.MAX_RESPONSES),
    fiveSecondPrompt: optionalText(140),
    // A 5 Second Test legitimately has one variant, so the floor here is 1 and
    // the real per-mode minimum is enforced in the refinement below.
    variants: z.array(variantInputSchema).min(1).max(LIMITS.MAX_VARIANTS),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "five_second") {
      if (value.variants.length !== 1 && value.variants.length !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["variants"],
          message: "A 5 Second Test shows one design",
        });
      }
      if (!value.fiveSecondPrompt) {
        ctx.addIssue({
          code: "custom",
          path: ["fiveSecondPrompt"],
          message: "Pick what you want to ask afterwards",
        });
      }
    } else if (value.variants.length < LIMITS.MIN_VARIANTS) {
      ctx.addIssue({
        code: "custom",
        path: ["variants"],
        message: "A comparison needs at least two versions",
      });
    }
  });

export type CreateTestInput = z.infer<typeof createTestSchema>;

/** The five-second wizard allows only the prompts we actually aggregate on. */
export const fiveSecondPromptSchema = z.enum(
  FIVE_SECOND_PROMPTS as unknown as [string, ...string[]],
);

/* --- Voting --------------------------------------------------------------- */

export const voteSchema = z.object({
  slug: slugSchema,
  variantId: z.string().min(1).max(64),
  reason: z
    .enum(REASON_IDS as [string, ...string[]])
    .nullable()
    .optional()
    .default(null),
  comment: optionalText(LIMITS.COMMENT_MAX),
});

export const fiveSecondAnswerSchema = z.object({
  slug: slugSchema,
  answer: text(LIMITS.FIVE_SECOND_ANSWER_MAX),
});

/* --- Profile -------------------------------------------------------------- */

export const updateProfileSchema = z.object({
  displayName: text(LIMITS.DISPLAY_NAME_MAX),
  username: usernameSchema,
  bio: optionalText(LIMITS.BIO_MAX),
});

/* --- Auth ----------------------------------------------------------------- */

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  next: z
    .string()
    .optional()
    .transform((v) =>
      // Only ever redirect within the app — never to an absolute URL.
      v && /^\/(?!\/)[A-Za-z0-9\-._~!$&'()*+,;=:@%/?]*$/.test(v) ? v : "/feed",
    ),
});

/* --- Uploads -------------------------------------------------------------- */

export const uploadSchema = z.object({
  contentType: z.enum(LIMITS.UPLOAD_MIME as unknown as [string, ...string[]]),
  size: z
    .number()
    .int()
    .positive()
    .max(LIMITS.UPLOAD_MAX_BYTES, "Images must be 6MB or smaller"),
});

/* --- Checkout ------------------------------------------------------------- */

export const checkoutSchema = z.object({
  pack: z.enum(["sprint", "launch", "studio"]),
});
