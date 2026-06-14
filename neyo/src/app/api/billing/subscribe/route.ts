import { NextRequest } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/core/session";
import { subscribeToPlan } from "@/lib/services/billing.service";
import { getPlan } from "@/lib/core/plans";
import { ok, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

const schema = z.object({ planKey: z.string().min(1) });

/** POST /api/billing/subscribe — change the school's plan. Leadership only. */
export async function POST(req: NextRequest) {
  try {
    // Reuse settings-management permission for billing changes.
    const user = await requirePermission("tenant.manage_settings");
    const { planKey } = schema.parse(await req.json().catch(() => ({})));

    const result = await subscribeToPlan(
      user.tenantId,
      { id: user.id, fullName: user.fullName },
      planKey
    );

    return ok({
      planKey: result.subscription.planKey,
      status: result.subscription.status,
      paymentStatus: result.payment?.status ?? "NONE",
      planName: getPlan(result.subscription.planKey)?.name,
    });
  } catch (err) {
    return handleError(err);
  }
}
