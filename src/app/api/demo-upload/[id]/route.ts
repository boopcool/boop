import { NextResponse } from "next/server";
import { getDemoUpload } from "@/lib/demo/uploads";

export const runtime = "nodejs";

/** Serves images held by the Demo Mode in-memory store. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upload = getDemoUpload(id);
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(upload.bytes) as unknown as BodyInit, {
    headers: {
      "Content-Type": upload.contentType,
      "Content-Length": String(upload.bytes.byteLength),
      // Demo uploads are process-local, so nothing downstream should cache them.
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
