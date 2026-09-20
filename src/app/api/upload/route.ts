import { NextResponse } from "next/server";
import { isSupabaseConfigured, LIMITS, storageBucket } from "@/lib/config";
import { getViewer } from "@/lib/data/read";
import {
  isAllowedImageType,
  putDemoUpload,
  sniffImageType,
} from "@/lib/demo/uploads";
import { uploadLimiter } from "@/lib/rate-limit";
import { rateLimitKey } from "@/lib/request";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Variant image upload.
 *
 * Validation order matters: size before read, declared type before bytes,
 * and then a magic-number sniff that has the final say. The storage key is
 * always prefixed with the uploader's id, which is what the Storage RLS policy
 * checks — a client cannot write into anyone else's folder.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const viewer = await getViewer();

  const limit = await uploadLimiter.check(
    await rateLimitKey(viewer.profile?.id, viewer.anonHash),
  );
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many uploads. Wait a minute." },
      { status: 429 },
    );
  }

  if (!viewer.profile) {
    return NextResponse.json(
      { error: "Sign in to upload images." },
      { status: 401 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > LIMITS.UPLOAD_MAX_BYTES + 4096) {
    return NextResponse.json(
      { error: "Images must be 6MB or smaller." },
      { status: 413 },
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const candidate = form.get("file");
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ error: "Couldn't read that upload." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size === 0 || file.size > LIMITS.UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: "Images must be between 1 byte and 6MB." },
      { status: 413 },
    );
  }
  if (!isAllowedImageType(file.type)) {
    return NextResponse.json(
      { error: "PNG, JPEG or WEBP only." },
      { status: 415 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);

  if (!sniffed || sniffed !== file.type) {
    return NextResponse.json(
      { error: "That file isn't the image type it claims to be." },
      { status: 415 },
    );
  }

  /* --- Demo Mode ---------------------------------------------------------- */

  if (!isSupabaseConfigured()) {
    const id = putDemoUpload(bytes, sniffed);
    return NextResponse.json({ url: `/api/demo-upload/${id}`, demo: true });
  }

  /* --- Supabase Storage --------------------------------------------------- */

  const sb = await supabaseServer();
  if (!sb) {
    return NextResponse.json({ error: "Storage unavailable." }, { status: 503 });
  }

  const bucket = storageBucket();
  const ext = sniffed === "image/png" ? "png" : sniffed === "image/webp" ? "webp" : "jpg";
  const key = `${viewer.profile.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await sb.storage.from(bucket).upload(key, bytes, {
    contentType: sniffed,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[boop] storage upload failed:", error.message);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }

  const { data } = sb.storage.from(bucket).getPublicUrl(key);
  return NextResponse.json({ url: data.publicUrl, demo: false });
}
