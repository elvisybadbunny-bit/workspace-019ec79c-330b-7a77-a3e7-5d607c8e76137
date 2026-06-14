/**
 * B.1 Bulk import — commit + history (Chunk 4).
 * GET  -> recent import history.
 * POST -> commit a previewed import (creates the students).
 * Permission: student.create.
 */
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/core/session";
import { ok, handleError } from "@/lib/api/respond";
import { importCommitSchema } from "@/lib/validations/student-import";
import { commitImport, listImports } from "@/lib/services/student-import.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requirePermission("student.create");
    return ok({ imports: await listImports(user) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("student.create");
    const body = importCommitSchema.parse(await req.json());
    const result = await commitImport(user, body);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
