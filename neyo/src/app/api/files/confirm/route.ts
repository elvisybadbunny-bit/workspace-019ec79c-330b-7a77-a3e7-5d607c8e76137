import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/core/session";
import { recordFile } from "@/lib/services/storage.service";
import { ok, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

const schema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1),
  size: z.coerce.number().int().nonnegative(),
  category: z.string().max(40).optional(),
});

/** POST /api/files/confirm — record an uploaded file in the DB. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = schema.parse(await req.json().catch(() => ({})));
    const file = await recordFile(user.tenantId, user.id, input);
    return ok({ id: file.id, url: file.url, fileName: file.fileName });
  } catch (err) {
    return handleError(err);
  }
}
