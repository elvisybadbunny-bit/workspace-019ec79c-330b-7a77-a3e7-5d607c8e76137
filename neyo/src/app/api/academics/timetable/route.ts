/**
 * B.4 timetable.
 * GET  ?classId= | ?teacherId=me      -> slots
 * POST {action:"set"|"clear"|"autofill", ...}
 * set/clear/autofill need academics.manage; GET needs academics.view.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/core/session";
import { ok, handleError, fail } from "@/lib/api/respond";
import { slotSchema, autoFillSchema } from "@/lib/validations/academics";
import { getTimetable, teacherTimetable, setSlot, clearSlot, autoFill } from "@/lib/services/academics.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("academics.view");
    const classId = req.nextUrl.searchParams.get("classId");
    const teacher = req.nextUrl.searchParams.get("teacherId");
    if (teacher === "me") return ok({ slots: await teacherTimetable(user, user.id) });
    if (!classId) return fail("MISSING", "classId or teacherId=me required.", 400);
    const res = await getTimetable(user, classId);
    return ok({ slots: res.slots, config: res.config });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("academics.manage");
    const body = await req.json();
    const action = z.enum(["set", "clear", "autofill"]).parse(body?.action);
    if (action === "set") return ok(await setSlot(user, slotSchema.parse(body)));
    if (action === "clear") {
      const { classId, dayOfWeek, period } = z.object({ classId: z.string(), dayOfWeek: z.coerce.number(), period: z.coerce.number() }).parse(body);
      return ok(await clearSlot(user, classId, dayOfWeek, period));
    }
    return ok(await autoFill(user, autoFillSchema.parse(body)));
  } catch (e) {
    return handleError(e);
  }
}
