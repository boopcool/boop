import "server-only";

import { randomUUID } from "node:crypto";
import { LIMITS } from "@/lib/config";

/**
 * Demo Mode image store.
 *
 * With Supabase configured, uploads go to Storage and this file is never
 * touched. Without it, a visitor still needs to be able to drag two PNGs into
 * /new and see a working test, so the bytes live in memory behind a route that
 * serves them back. Capped and FIFO-evicted so a tab left open can't eat the
 * process.
 */

type StoredUpload = { bytes: Uint8Array; contentType: string; storedAt: number };

const MAX_FILES = 60;
const GLOBAL_KEY = Symbol.for("boop.demo.uploads");
type GlobalWithUploads = typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, StoredUpload>;
};

function store(): Map<string, StoredUpload> {
  const g = globalThis as GlobalWithUploads;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY];
}

export function putDemoUpload(bytes: Uint8Array, contentType: string): string {
  const s = store();
  while (s.size >= MAX_FILES) {
    const oldest = s.keys().next().value;
    if (!oldest) break;
    s.delete(oldest);
  }
  const id = randomUUID();
  s.set(id, { bytes, contentType, storedAt: Date.now() });
  return id;
}

export function getDemoUpload(id: string): StoredUpload | null {
  return store().get(id) ?? null;
}

/** Shared by both storage paths: the only image types Boop accepts. */
export function isAllowedImageType(contentType: string): boolean {
  return (LIMITS.UPLOAD_MIME as readonly string[]).includes(contentType);
}

/**
 * Magic-number check. A browser-supplied Content-Type is a claim, not a fact —
 * this reads the first bytes so a renamed file can't slip past the allow-list.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  const b = (i: number) => bytes[i] ?? -1;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47 &&
    b(4) === 0x0d && b(5) === 0x0a && b(6) === 0x1a && b(7) === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";

  // WEBP: "RIFF" .... "WEBP"
  if (
    b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
    b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50
  ) {
    return "image/webp";
  }

  return null;
}
