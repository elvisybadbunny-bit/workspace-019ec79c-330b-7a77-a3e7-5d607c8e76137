import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/core/session";
import { presignUpload } from "@/lib/services/storage.service";
import { ok, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

const schema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1),
  category: z.string().trim().max(40).optional(),
});

/** POST /api/files/presign — get a direct-upload URL (tenant-isolated key). */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json().catch(() => ({})));
    const result = await presignUpload(user.tenantId, input);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
