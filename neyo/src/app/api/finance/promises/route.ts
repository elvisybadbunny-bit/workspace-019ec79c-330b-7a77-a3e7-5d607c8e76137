/**
 * G.28 — Fee Promise-to-Pay Bursar directory (Promises Calendar list).
 * GET -> application/json. Permission: finance.view.
 */
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/core/session";
import { handleError, ok } from "@/lib/api/respond";
import { listPromises } from "@/lib/services/promise-to-pay.service";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const user = await requirePermission("finance.view");
    const result = await listPromises(user);
    return ok({ promises: result });
  } catch (e) {
    return handleError(e);
  }
}
