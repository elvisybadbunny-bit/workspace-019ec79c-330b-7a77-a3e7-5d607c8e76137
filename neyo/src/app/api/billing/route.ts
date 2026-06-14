import { requireUser } from "@/lib/core/session";
import { ensureSubscription } from "@/lib/services/billing.service";
import { getAllLimitStatuses } from "@/lib/services/limits.service";
import { getPlan, PLANS } from "@/lib/core/plans";
import { ok, handleError } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

/** GET /api/billing — current subscription, usage, and available plans. */
export async function GET() {
  try {
    const user = await requireUser();
    const sub = await ensureSubscription(user.tenantId);
    const limits = await getAllLimitStatuses(user.tenantId);
    const plan = getPlan(sub.planKey);

    return ok({
      subscription: {
        planKey: sub.planKey,
        planName: plan?.name ?? sub.planKey,
        status: sub.status,
        price: sub.grandfatheredPrice,
        currentPeriodEnd: sub.currentPeriodEnd,
        graceEndsAt: sub.graceEndsAt,
      },
      limits,
      plans: PLANS,
    });
  } catch (err) {
    return handleError(err);
  }
}
