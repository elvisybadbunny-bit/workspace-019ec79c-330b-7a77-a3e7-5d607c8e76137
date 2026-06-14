import { NextRequest } from "next/server";
import { requireUser } from "@/lib/core/session";
import { devPut } from "@/lib/services/storage.service";
import { ok, fail, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/**
 * PUT /api/files/dev-put?key=... — DEV ONLY. Receives the raw body the browser
 * "uploads" when using the local storage provider. Verifies the key belongs to
 * the caller's tenant before writing. In prod, R2 presigned URLs are used instead.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const key = req.nextUrl.searchParams.get("key") ?? "";
    // Enforce tenant-isolated key ownership.
    if (!key.startsWith(`tenants/${user.tenantId}/`)) {
      return fail("FORBIDDEN", "Invalid upload key.", 403);
    }
    const contentType = req.headers.get("content-type") ?? "application/octet-stream";
    const body = Buffer.from(await req.arrayBuffer());
    await devPut(key, body, contentType);
    return ok({ stored: true });
  } catch (err) {
    return handleError(err);
  }
}
