import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/core/session";
import { ok, handleError, fail } from "@/lib/api/respond";
import { importStaffBatch } from "@/lib/services/staff-import.service";

export const dynamic = "force-dynamic";

const importSchema = z.object({
  rows: z.array(
    z.object({
      fullName: z.string().min(1),
      role: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().optional(),
      tscNumber: z.string().optional(),
      nationalId: z.string().optional(),
    })
  ),
});

/** POST /api/hr/import — Bulk import staff members */
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("staff.manage");
    const body = importSchema.parse(await req.json());
    
    const result = await importStaffBatch(user, body.rows);
    return ok(result);
  } catch (err) {
    return handleError(err);
  }
}
