/**
 * G.33 2.0 Platform appearance API.
 * GET  /api/platform/appearance — any signed-in user reads the COMPANY-set
 *      liquidity level (clients apply data-liquid + cache for pre-paint).
 * POST /api/platform/appearance {liquidLevel} — SUPER_ADMIN (NEYO) ONLY.
 *      Schools cannot change the system look (founder rule 2026-06-13).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser, requireRole } from "@/lib/core/session";
import { ok, handleError } from "@/lib/api/respond";
import { getLiquidLevel, setLiquidLevel } from "@/lib/services/platform-appearance.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    return ok({ liquidLevel: await getLiquidLevel() });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("SUPER_ADMIN");
    const input = z
      .object({ liquidLevel: z.enum(["1", "2", "3"]) })
      .parse(await req.json().catch(() => ({})));
    return ok({ liquidLevel: await setLiquidLevel(user, input.liquidLevel) });
  } catch (e) {
    return handleError(e);
  }
}
